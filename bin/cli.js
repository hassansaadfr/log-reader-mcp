#!/usr/bin/env node
import { spawn } from "child_process";
import path from "path";

const [, , cmd, ...args] = process.argv;

function runInit() {
  const script = path.resolve("scripts/init-mcp-log-server.js");
  const child = spawn("node", [script, ...args], { stdio: "inherit" });
  child.on("exit", (code) => process.exit(code));
}

switch (cmd) {
  case "init":
    runInit();
    break;
  default:
    console.error("Usage: mcp-log-reader init");
    process.exit(1);
}
