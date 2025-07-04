#!/usr/bin/env node
import { promises as fs } from "fs";
import path from "path";

const CURSOR_DIR = path.resolve(process.cwd(), ".cursor");
const CURSOR_MCP_JSON = path.join(CURSOR_DIR, "mcp.json");
const TEMPLATE_MCP_JSON = path.resolve("templates/mcp.json");
const TEMPLATE_RULES = path.resolve("templates/mcp-log-reader/workflow.mdc");
const CURSOR_RULES = path.join(CURSOR_DIR, "workflow.mdc");

async function ensureCursorDir() {
  try {
    await fs.mkdir(CURSOR_DIR, { recursive: true });
  } catch {}
}

async function mergeMcpJson() {
  let template;
  let user;
  try {
    template = JSON.parse(await fs.readFile(TEMPLATE_MCP_JSON, "utf-8"));
  } catch {
    console.error("Template mcp.json not found");
    process.exit(1);
  }
  let userJson = {};
  try {
    userJson = JSON.parse(await fs.readFile(CURSOR_MCP_JSON, "utf-8"));
  } catch {}
  userJson.mcpServers = userJson.mcpServers || {};
  userJson.mcpServers["mcp-log-reader"] = template.mcpServers["mcp-log-reader"];
  // Merge other top-level keys if not present
  for (const key of Object.keys(template)) {
    if (key !== "mcpServers" && !(key in userJson)) {
      userJson[key] = template[key];
    }
  }
  await fs.writeFile(CURSOR_MCP_JSON, JSON.stringify(userJson, null, 2));
  console.log("Updated", CURSOR_MCP_JSON);
}

async function copyRules() {
  await fs.copyFile(TEMPLATE_RULES, CURSOR_RULES);
  console.log("Copied rules to", CURSOR_RULES);
}

async function main() {
  await ensureCursorDir();
  await mergeMcpJson();
  await copyRules();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
