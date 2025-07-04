#!/usr/bin/env node
import { spawn } from "child_process";
import path from "path";

const [, , cmd, ...args] = process.argv;

function runInit() {
  const script = path.resolve("scripts/init-mcp-log-server.js");
  const child = spawn("node", [script, ...args], { stdio: "inherit" });
  child.on("exit", (code) => process.exit(code));
}

function runServer() {
  // Par défaut, lance le serveur MCP compilé (dist) si présent, sinon src
  const dist = path.resolve("dist/mcp-server.js");
  const src = path.resolve("src/mcp-server.ts");
  const entry = require("fs").existsSync(dist) ? dist : src;
  const child = spawn("node", [entry, ...args], { stdio: "inherit" });
  child.on("exit", (code) => process.exit(code));
}

function showHelp() {
  console.log(
    `Usage: mcp-log-server <command>\n\nCommands:\n  init     Initialise la configuration MCP dans .cursor\n  start    Démarre le serveur MCP\n  help     Affiche cette aide\n`
  );
}

switch (cmd) {
  case "init":
    runInit();
    break;
  case "start":
    runServer();
    break;
  case "help":
  case undefined:
    showHelp();
    break;
  default:
    console.error("Commande inconnue:", cmd);
    showHelp();
    process.exit(1);
}
