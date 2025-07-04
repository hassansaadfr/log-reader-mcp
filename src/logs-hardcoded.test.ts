import { existsSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { readAndValidateLogs } from './log-utils';

describe('Hardcoded logs/logs.log usage', () => {
  const logsDir = path.join(process.cwd(), 'logs');
  const logsFile = path.join(logsDir, 'logs.log');

  beforeAll(async () => {
    if (existsSync(logsDir)) {
      await fs.rm(logsDir, { recursive: true, force: true });
    }
    await fs.mkdir(logsDir, { recursive: true });
  });

  afterAll(async () => {
    if (existsSync(logsDir)) {
      await fs.rm(logsDir, { recursive: true, force: true });
    }
  });

  it('writes and reads logs only from logs/logs.log', async () => {
    const now = new Date();
    const logs = [
      {
        level: 'INFO',
        timestamp: now.toISOString(),
        message: 'Server started',
        service_name: 'main',
      },
      {
        level: 'DEBUG',
        timestamp: now.toISOString(),
        message: 'Config loaded',
        service_name: 'config',
      },
      {
        level: 'ERROR',
        timestamp: now.toISOString(),
        message: 'Something failed',
        service_name: 'main',
      },
    ];
    await fs.writeFile(logsFile, logs.map((l) => JSON.stringify(l)).join('\n'));

    // Read logs using the utility (simulate MCP behavior)
    const result = await readAndValidateLogs({
      logPath: logsFile,
      lines: 10,
    });
    expect(result.length).toBe(3);
    expect(result[0].message).toBe('Server started');
    expect(result[1].level).toBe('DEBUG');
    expect(result[2].level).toBe('ERROR');
    expect(logsFile.endsWith('logs/logs.log')).toBe(true);
  });
});
