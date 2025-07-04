#!/usr/bin/env node
import chalk from "chalk";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const [, , cmd, ...args] = process.argv;

function showHelp() {
  console.log(chalk.bold.blue("\nMCP Log Server - Complete Setup Guide\n"));

  console.log(chalk.bold("USAGE:"));
  console.log("  " + chalk.cyan("npx mcp-log-reader [COMMAND] [OPTIONS]"));

  console.log(chalk.bold("\nCOMMANDS:"));
  console.log(
    "  " +
      chalk.cyan("init") +
      "\tInitializes MCP configuration and rules in your project."
  );
  console.log(
    "      - Creates or updates " +
      chalk.yellow(".cursor/mcp.json") +
      " with the MCP server entry."
  );
  console.log(
    "      - Copies the logging workflow rules to " +
      chalk.yellow(".cursor/mcp-log-reader/workflow.mdc") +
      "."
  );
  console.log(
    "      - Does not overwrite existing user data except for the mcp-log-server entry and rules."
  );
  console.log(
    "      - Creates the " +
      chalk.yellow("logs/") +
      " directory and an empty " +
      chalk.yellow("logs/logs.log") +
      " file if missing."
  );
  console.log(
    "      - Adds " +
      chalk.yellow("logs/logs.log") +
      " to your .gitignore if not present."
  );
  console.log(
    "\n  " + chalk.cyan("-h, --help") + "\tShow this help message and exit."
  );
  console.log("  (no command)\tStart the MCP log server.");

  console.log(chalk.bold("\nDESCRIPTION:"));
  console.log(
    "  This CLI helps you set up and run an MCP-compatible log server for your project."
  );
  console.log(
    "  It ensures your configuration and logging rules are in place for seamless integration with Cursor, VSCode, etc."
  );

  console.log(chalk.green("1. Initialize MCP configuration in your project:"));
  console.log("   " + chalk.cyan("npx mcp-log-reader init"));
  console.log("   This command will:");
  console.log(
    "   - Create or update " +
      chalk.yellow(".cursor/mcp.json") +
      " with the correct MCP server entry"
  );
  console.log(
    "   - Copy the logging workflow rules to " +
      chalk.yellow(".cursor/mcp-log-reader/workflow.mdc")
  );

  console.log(
    chalk.green("\n2. Configure your MCP server in .cursor/mcp.json:")
  );
  console.log("   Make sure your file contains at least:");
  console.log(
    chalk.gray(`{
  "mcpServers": {
    "mcp-log-server": {
      "command": "npx",
      "args": ["-y", "mcp-log-server"]
    }
  },
  "mcp.enabled": true,
  "mcp.autoStart": true,
  "mcp.showStatusBar": true,
  "mcp.logLevel": "info"
}`)
  );
  console.log(
    "   This allows your editor (Cursor, VSCode, etc.) to detect and launch the MCP log server automatically."
  );

  console.log(chalk.green("\n3. Logging rules template:"));
  console.log(
    "   The file " +
      chalk.yellow(".cursor/mcp-log-reader/workflow.mdc") +
      " defines the logging standards and usage examples."
  );
  console.log(
    "   It is used by the AI agent and developers to ensure log compliance."
  );

  console.log(chalk.green("\n4. Log directory and file:"));
  console.log(
    "   You must create a directory " +
      chalk.yellow("logs/") +
      " at the root of your project."
  );
  console.log(
    "   The main log file must be named " +
      chalk.yellow("logs.log") +
      " and placed inside this directory:"
  );
  console.log("   " + chalk.cyan("logs/logs.log"));

  console.log(chalk.green("\n5. Log format (one JSON object per line):"));
  console.log(
    "   Each line in " +
      chalk.yellow("logs/logs.log") +
      " must be a valid JSON object with the following structure:"
  );
  console.log(
    chalk.gray(`{
  "level": "INFO|WARN|ERROR|DEBUG|CRITICAL",
  "timestamp": "YYYY-MM-DDTHH:MM:SS.sssZ",
  "message": "string",
  "service_name": "string (optional)",
  "user_id": "string (optional)",
  "context": { "...": "..." } (optional),
  "event": { "...": "..." } (optional)
}`)
  );
  console.log("   Example:");
  console.log(
    chalk.gray(`{
  "level": "INFO",
  "timestamp": "2024-06-01T12:34:56.789Z",
  "message": "User login succeeded",
  "service_name": "auth",
  "user_id": "12345",
  "context": { "ip": "192.168.1.10" },
  "event": { "action": "login" }
}`)
  );

  console.log(chalk.green("\n6. Typical usage:"));
  console.log(
    "   - To initialize your project: " + chalk.cyan("npx mcp-log-reader init")
  );
  console.log(
    "   - To start the MCP log server: " + chalk.cyan("npx mcp-log-server")
  );
  console.log(
    "   - Your editor will use the MCP server as soon as the config is detected."
  );

  console.log(
    "\n" +
      chalk.yellow(
        "For more details, see the README.md or the workflow.mdc template."
      )
  );

  console.log(
    "\n" +
      chalk.gray("Repository: https://github.com/hassansaadfr/mcp-log-server")
  );
}

function runInit() {
  const script = path.join(__dirname, "../scripts/init-mcp-log-server.js");
  const child = spawn("node", [script, ...args], { stdio: "inherit" });
  child.on("exit", (code) => process.exit(code));
}

function runServer() {
  // Par défaut, lance le serveur MCP compilé (dist) si présent, sinon src
  const dist = path.join(__dirname, "../dist/mcp-server.js");
  const src = path.join(__dirname, "../src/mcp-server.ts");
  const entry = fs.existsSync(dist) ? dist : src;
  const child = spawn("node", [entry, ...args], { stdio: "inherit" });
  child.on("exit", (code) => process.exit(code));
}

switch (cmd) {
  case undefined:
    runServer();
    break;
  case "--help":
  case "-h":
    showHelp();
    break;
  case "init":
    runInit();
    break;
  default:
    console.error(
      chalk.red(
        `Unknown command: '${cmd}'.\nUse --help to see usage instructions.`
      )
    );
    process.exit(1);
}
