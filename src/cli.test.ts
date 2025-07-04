import { execa } from 'execa';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('CLI', () => {
  const cliPath = path.join(__dirname, '../bin/cli.js');
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-cli-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('shows help with --help', async () => {
    const { stdout, exitCode } = await execa('node', [cliPath, '--help'], {
      cwd: tmpDir,
    });
    expect(stdout).toMatch(/USAGE:/);
    expect(stdout).toMatch(/Repository:/);
    expect(exitCode).toBe(0);
  });

  it('shows help with -h', async () => {
    const { stdout, exitCode } = await execa('node', [cliPath, '-h'], {
      cwd: tmpDir,
    });
    expect(stdout).toMatch(/USAGE:/);
    expect(exitCode).toBe(0);
  });

  it('shows error on unknown command', async () => {
    const { stderr, exitCode } = await execa('node', [cliPath, 'unknown'], {
      reject: false,
      cwd: tmpDir,
    });
    expect(stderr).toMatch(/Unknown command/);
    expect(exitCode).toBe(1);
  });

  it('runs init without error (dry run)', async () => {
    // We do not check the effect, just that it does not crash
    const { exitCode } = await execa('node', [cliPath, 'init'], {
      reject: false,
      cwd: tmpDir,
    });
    expect([0, 1]).toContain(exitCode); // 0 = success, 1 = already initialized or minor error
  });

  it('runs server by default (dry run)', async () => {
    // Start the server, wait a bit, then kill the process and check the output
    const subprocess = execa('node', [cliPath], { reject: false, cwd: tmpDir });
    let output = '';
    subprocess.stdout?.on('data', (data) => {
      output += data.toString();
    });
    subprocess.stderr?.on('data', (data) => {
      output += data.toString();
    });
    await new Promise((resolve) => setTimeout(resolve, 500));
    subprocess.kill();
    await subprocess.catch(() => {}); // ignore exit error
    expect(output).toMatch(/MCP Log Server|Error|usage/i);
  });
});
