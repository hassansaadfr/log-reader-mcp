#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CURSOR_DIR = path.resolve(process.cwd(), '.cursor');
const CURSOR_MCP_JSON = path.join(CURSOR_DIR, 'mcp.json');
const TEMPLATE_MCP_JSON = path.join(__dirname, '../templates/mcp.json');
const TEMPLATE_RULES = path.join(__dirname, '../templates/mcp-log-server/workflow.mdc');
const CURSOR_RULES = path.join(CURSOR_DIR, 'log-reader-mcp', 'workflow.mdc');

async function ensureCursorDir() {
  try {
    await fs.mkdir(CURSOR_DIR, { recursive: true });
  } catch {
    // Directory might already exist, ignore error
  }
}

async function mergeMcpJson() {
  let template;
  try {
    template = JSON.parse(await fs.readFile(TEMPLATE_MCP_JSON, 'utf-8'));
  } catch {
    console.error('Template mcp.json not found');
    process.exit(1);
  }
  let userJson = {};
  try {
    userJson = JSON.parse(await fs.readFile(CURSOR_MCP_JSON, 'utf-8'));
  } catch {
    // File doesn't exist, start with empty config
  }
  userJson.mcpServers = userJson.mcpServers || {};
  userJson.mcpServers['log-reader-mcp'] = {
    command: 'npx',
    args: ['-y', 'log-reader-mcp'],
  };
  // Merge other top-level keys if not present
  for (const key of Object.keys(template)) {
    if (key !== 'mcpServers' && !(key in userJson)) {
      userJson[key] = template[key];
    }
  }
  await fs.writeFile(CURSOR_MCP_JSON, JSON.stringify(userJson, null, 2));
  console.log('Updated', CURSOR_MCP_JSON);
}

async function copyRules() {
  const rulesDir = path.dirname(CURSOR_RULES);
  await fs.mkdir(rulesDir, { recursive: true });
  await fs.copyFile(TEMPLATE_RULES, CURSOR_RULES);
  console.log('Copied rules to', CURSOR_RULES);
}

async function ensureLogsDir() {
  const logsDir = path.resolve(process.cwd(), 'logs');
  const logsFile = path.join(logsDir, 'logs.log');
  await fs.mkdir(logsDir, { recursive: true });
  try {
    await fs.access(logsFile);
  } catch {
    await fs.writeFile(logsFile, '');
  }
  // Ajout à .gitignore
  const gitignorePath = path.resolve(process.cwd(), '.gitignore');
  let gitignore = '';
  try {
    gitignore = await fs.readFile(gitignorePath, 'utf-8');
  } catch {
    // .gitignore doesn't exist, start with empty content
  }
  if (!gitignore.includes('logs/logs.log')) {
    gitignore += (gitignore.endsWith('\n') || gitignore === '' ? '' : '\n') + 'logs/logs.log\n';
    await fs.writeFile(gitignorePath, gitignore);
    console.log('Added logs/logs.log to .gitignore');
  }
}

async function main() {
  await ensureCursorDir();
  await mergeMcpJson();
  await copyRules();
  await ensureLogsDir();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
