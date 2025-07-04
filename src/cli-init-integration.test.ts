import { jest } from '@jest/globals';
import { execa } from 'execa';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

jest.setTimeout(20000);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Recursive copy of a folder (src -> dest)
async function copyDir(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

describe('CLI integration: init in test project dir', () => {
  let testProjectDir: string;
  let tmpDir: string;
  let tgzPath: string;

  beforeEach(async () => {
    // Create a temporary folder for the test project
    testProjectDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-test-proj-'));
    // Copy the entire current project into this folder
    await copyDir(path.join(__dirname, '..'), testProjectDir);
    // Generate the package tgz in this test folder
    const { stdout } = await execa('npm', ['pack'], { cwd: testProjectDir });
    tgzPath = path.join(testProjectDir, stdout.trim());
    // Create a subfolder to simulate the user
    tmpDir = path.join(testProjectDir, 'user-proj');
    await fs.mkdir(tmpDir);
    // Install the package locally in the subfolder
    await execa('npm', ['install', tgzPath], { cwd: tmpDir });
  });

  afterEach(async () => {
    // Recursively delete the test folder
    await fs.rm(testProjectDir, { recursive: true, force: true });
  });

  it('runs init and generates expected files in user project', async () => {
    // Run the command in the user subfolder
    await execa('npx', ['log-reader-mcp', 'init'], { cwd: tmpDir });
    // Check for the presence of generated files
    const cursorDir = path.join(tmpDir, '.cursor');
    const mcpJson = path.join(cursorDir, 'mcp.json');
    const rules = path.join(cursorDir, 'log-reader-mcp', 'workflow.mdc');
    const logsDir = path.join(tmpDir, 'logs');
    const logsFile = path.join(logsDir, 'logs.log');
    const gitignore = path.join(tmpDir, '.gitignore');
    // All files/folders must exist
    await expect(fs.stat(mcpJson)).resolves.toBeDefined();
    await expect(fs.stat(rules)).resolves.toBeDefined();
    await expect(fs.stat(logsDir)).resolves.toBeDefined();
    await expect(fs.stat(logsFile)).resolves.toBeDefined();
    // .gitignore must contain logs/logs.log
    const gitignoreContent = await fs.readFile(gitignore, 'utf-8');
    expect(gitignoreContent).toMatch(/logs\/logs\.log/);
  });
});
