import { promises as fs } from 'fs';
import path from 'path';

export async function ensureLogsDir(baseDir: string): Promise<void> {
  const logsDir = path.join(baseDir, 'logs');
  const logsFile = path.join(logsDir, 'logs.log');
  await fs.mkdir(logsDir, { recursive: true });
  try {
    await fs.access(logsFile);
  } catch {
    await fs.writeFile(logsFile, '');
  }
}

export async function updateOrCreateMcpJson(
  cursorDir: string,
  templatePath: string,
  serverKey: string,
): Promise<void> {
  const mcpJsonPath = path.join(cursorDir, 'mcp.json');
  let template: Record<string, unknown>;
  try {
    template = JSON.parse(await fs.readFile(templatePath, 'utf-8'));
  } catch {
    throw new Error('Template mcp.json not found');
  }
  let userJson: Record<string, unknown> = {};
  let exists = false;
  try {
    userJson = JSON.parse(await fs.readFile(mcpJsonPath, 'utf-8'));
    exists = true;
  } catch {
    // File doesn't exist, start with empty config
  }
  userJson.mcpServers = userJson.mcpServers || {};
  if (!(serverKey in (userJson.mcpServers as Record<string, unknown>))) {
    (userJson.mcpServers as Record<string, unknown>)[serverKey] = (
      template.mcpServers as Record<string, unknown>
    )[serverKey];
  }
  // Merge autres clés du template si création
  if (!exists) {
    for (const key of Object.keys(template)) {
      if (key !== 'mcpServers' && !(key in userJson)) {
        userJson[key] = template[key];
      }
    }
  }
  await fs.mkdir(cursorDir, { recursive: true });
  await fs.writeFile(mcpJsonPath, JSON.stringify(userJson, null, 2));
}

export async function mergeMcpJson(mcpJsonPath: string, templatePath: string): Promise<void> {
  let template: Record<string, unknown>;
  try {
    template = JSON.parse(await fs.readFile(templatePath, 'utf-8'));
  } catch {
    throw new Error('Template mcp.json not found');
  }
  let userJson: Record<string, unknown> = {};
  try {
    userJson = JSON.parse(await fs.readFile(mcpJsonPath, 'utf-8'));
  } catch {
    // File doesn't exist, start with empty config
  }
  userJson.mcpServers = userJson.mcpServers || {};
  (userJson.mcpServers as Record<string, unknown>)['log-reader-mcp'] = (
    template.mcpServers as Record<string, unknown>
  )['log-reader-mcp'];
  // Merge autres clés du template si pas présentes
  for (const key of Object.keys(template)) {
    if (key !== 'mcpServers' && !(key in userJson)) {
      userJson[key] = template[key];
    }
  }
  await fs.writeFile(mcpJsonPath, JSON.stringify(userJson, null, 2));
}
