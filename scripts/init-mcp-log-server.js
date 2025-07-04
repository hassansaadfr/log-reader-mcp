#!/usr/bin/env node
import chalk from 'chalk';
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

// Icônes et couleurs
const ICONS = {
  SUCCESS: '✅',
  ERROR: '❌',
  INFO: 'ℹ️',
  WARNING: '⚠️',
  FOLDER: '📁',
  FILE: '📄',
  CONFIG: '⚙️',
  RULES: '📋',
  LOGS: '📝',
  GIT: '🔧',
};

async function ensureCursorDir() {
  try {
    await fs.mkdir(CURSOR_DIR, { recursive: true });
    console.log(chalk.green(`${ICONS.SUCCESS} ${ICONS.FOLDER} Directory .cursor/ ready`));
  } catch {
    // Directory might already exist, ignore error
    console.log(chalk.blue(`${ICONS.INFO} ${ICONS.FOLDER} Directory .cursor/ already exists`));
  }
}

async function mergeMcpJson() {
  let template;
  try {
    template = JSON.parse(await fs.readFile(TEMPLATE_MCP_JSON, 'utf-8'));
  } catch {
    console.error(chalk.red(`${ICONS.ERROR} Template mcp.json not found`));
    process.exit(1);
  }
  let userJson = {};
  try {
    userJson = JSON.parse(await fs.readFile(CURSOR_MCP_JSON, 'utf-8'));
    console.log(chalk.blue(`${ICONS.INFO} ${ICONS.CONFIG} Found existing .cursor/mcp.json`));
  } catch {
    // File doesn't exist, start with empty config
    console.log(chalk.blue(`${ICONS.INFO} ${ICONS.CONFIG} Creating new .cursor/mcp.json`));
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
  console.log(
    chalk.green(`${ICONS.SUCCESS} ${ICONS.CONFIG} Updated ${chalk.cyan(CURSOR_MCP_JSON)}`),
  );
}

async function copyRules() {
  const rulesDir = path.dirname(CURSOR_RULES);
  await fs.mkdir(rulesDir, { recursive: true });
  await fs.copyFile(TEMPLATE_RULES, CURSOR_RULES);
  console.log(
    chalk.green(
      `${ICONS.SUCCESS} ${ICONS.RULES} Copied workflow rules to ${chalk.cyan(CURSOR_RULES)}`,
    ),
  );
}

async function ensureLogsDir() {
  const logsDir = path.resolve(process.cwd(), 'logs');
  const logsFile = path.join(logsDir, 'logs.log');
  await fs.mkdir(logsDir, { recursive: true });
  console.log(chalk.green(`${ICONS.SUCCESS} ${ICONS.FOLDER} Created logs/ directory`));

  try {
    await fs.access(logsFile);
    console.log(chalk.blue(`${ICONS.INFO} ${ICONS.LOGS} Log file already exists`));
  } catch {
    await fs.writeFile(logsFile, '');
    console.log(chalk.green(`${ICONS.SUCCESS} ${ICONS.LOGS} Created empty logs/logs.log`));
  }

  // Add to .gitignore
  const gitignorePath = path.resolve(process.cwd(), '.gitignore');
  let gitignore = '';
  try {
    gitignore = await fs.readFile(gitignorePath, 'utf-8');
    console.log(chalk.blue(`${ICONS.INFO} ${ICONS.GIT} Found existing .gitignore`));
  } catch {
    // .gitignore doesn't exist, start with empty content
    console.log(chalk.blue(`${ICONS.INFO} ${ICONS.GIT} Creating new .gitignore`));
  }
  if (!gitignore.includes('logs/logs.log')) {
    gitignore += (gitignore.endsWith('\n') || gitignore === '' ? '' : '\n') + 'logs/logs.log\n';
    await fs.writeFile(gitignorePath, gitignore);
    console.log(chalk.green(`${ICONS.SUCCESS} ${ICONS.GIT} Added logs/logs.log to .gitignore`));
  } else {
    console.log(chalk.blue(`${ICONS.INFO} ${ICONS.GIT} logs/logs.log already in .gitignore`));
  }
}

async function main() {
  console.log(chalk.bold.blue(`\n${ICONS.CONFIG} MCP Log Server - Initialization\n`));

  await ensureCursorDir();
  await mergeMcpJson();
  await copyRules();
  await ensureLogsDir();

  console.log(chalk.bold.green(`\n${ICONS.SUCCESS} Setup completed successfully!`));
  console.log(chalk.cyan(`\n${ICONS.INFO} Next steps:`));
  console.log(chalk.white(`  1. Restart your editor (Cursor, VSCode, etc.)`));
  console.log(chalk.white(`  2. The MCP server will be automatically detected`));
  console.log(chalk.white(`  3. Start logging to logs/logs.log in JSON format`));
  console.log(chalk.white(`  4. Use the MCP tools to read and analyze your logs`));
  console.log(
    chalk.gray(
      `\nFor more information, see the workflow rules in .cursor/log-reader-mcp/workflow.mdc\n`,
    ),
  );
}

main().catch((err) => {
  console.error(chalk.red(`${ICONS.ERROR} Fatal error: ${err.message}`));
  process.exit(1);
});
