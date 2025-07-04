#!/usr/bin/env node
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const [, , cmd, ...args] = process.argv;

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
  case "init":
    runInit();
    break;
  case undefined:
    runServer();
    break;
  default:
    runServer();
    break;
}
