import { existsSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { LogEntry, readAndValidateLogs } from './log-utils';

describe('Log use cases (MCP workflow)', () => {
  const logsDir = path.join(process.cwd(), 'logs');
  const logsFile = path.join(logsDir, 'logs.log');
  const baseTime = new Date(Date.now() - 200 * 1000);

  beforeEach(async () => {
    if (existsSync(logsDir)) {
      await fs.rm(logsDir, { recursive: true, force: true });
    }
    await fs.mkdir(logsDir, { recursive: true });
  });

  afterEach(async () => {
    if (existsSync(logsDir)) {
      await fs.rm(logsDir, { recursive: true, force: true });
    }
  });

  it('Debugging a production error: reads last N lines and filters by time range', async () => {
    const logs: LogEntry[] = [];
    for (let i = 0; i < 100; i++) {
      logs.push({
        level: i === 99 ? 'ERROR' : 'INFO',
        timestamp: new Date(baseTime.getTime() + i * 1000).toISOString(),
        message: i === 99 ? 'Critical failure' : `Event ${i}`,
        service_name: 'main',
      });
    }
    await fs.writeFile(logsFile, logs.map((l) => JSON.stringify(l)).join('\n'));
    // Read last 10 lines
    const lastLogs = await readAndValidateLogs({ logPath: logsFile, lines: 10 });
    expect(lastLogs.length).toBe(10);
    expect(lastLogs[lastLogs.length - 1].message).toBe('Critical failure');
    // Filter by time range (only last 5 seconds)
    const start = new Date(baseTime.getTime() + 95 * 1000).toISOString();
    const filtered = await readAndValidateLogs({ logPath: logsFile, start_time: start });
    expect(filtered.length).toBe(5);
    expect(filtered.some((l) => l.message === 'Critical failure')).toBe(true);
  });

  it('Verifying a new feature implementation: checks for specific log events', async () => {
    const logs: LogEntry[] = [
      {
        level: 'INFO',
        timestamp: baseTime.toISOString(),
        message: 'User created',
        service_name: 'user',
      },
      {
        level: 'INFO',
        timestamp: baseTime.toISOString(),
        message: 'Payment validated',
        service_name: 'payment',
      },
      {
        level: 'INFO',
        timestamp: baseTime.toISOString(),
        message: 'Feature X triggered',
        service_name: 'feature',
      },
    ];
    await fs.writeFile(logsFile, logs.map((l) => JSON.stringify(l)).join('\n'));
    const result = await readAndValidateLogs({ logPath: logsFile, lines: 10 });
    expect(result.some((l) => l.message === 'User created')).toBe(true);
    expect(result.some((l) => l.message === 'Payment validated')).toBe(true);
    expect(result.some((l) => l.message === 'Feature X triggered')).toBe(true);
  });

  it('Security audit: searches for failed login attempts or suspicious access', async () => {
    const logs: LogEntry[] = [
      {
        level: 'INFO',
        timestamp: baseTime.toISOString(),
        message: 'User login succeeded',
        service_name: 'auth',
        user_id: 'u1',
      },
      {
        level: 'WARN',
        timestamp: baseTime.toISOString(),
        message: 'Failed login attempt',
        service_name: 'auth',
        user_id: 'u2',
      },
      {
        level: 'WARN',
        timestamp: baseTime.toISOString(),
        message: 'Suspicious access detected',
        service_name: 'auth',
        user_id: 'u3',
      },
    ];
    await fs.writeFile(logsFile, logs.map((l) => JSON.stringify(l)).join('\n'));
    const result = await readAndValidateLogs({ logPath: logsFile, lines: 10 });
    expect(result.filter((l) => l.message.includes('Failed login')).length).toBe(1);
    expect(result.filter((l) => l.message.includes('Suspicious access')).length).toBe(1);
  });

  it('Performance analysis: extracts DEBUG logs and checks for slow endpoints', async () => {
    const logs: LogEntry[] = [
      {
        level: 'DEBUG',
        timestamp: baseTime.toISOString(),
        message: 'Endpoint /api/data took 1200ms',
        service_name: 'api',
      },
      {
        level: 'DEBUG',
        timestamp: baseTime.toISOString(),
        message: 'Endpoint /api/data took 80ms',
        service_name: 'api',
      },
      {
        level: 'INFO',
        timestamp: baseTime.toISOString(),
        message: 'Request completed',
        service_name: 'api',
      },
    ];
    await fs.writeFile(logsFile, logs.map((l) => JSON.stringify(l)).join('\n'));
    const result = await readAndValidateLogs({ logPath: logsFile, lines: 10 });
    const debugLogs = result.filter((l) => l.level === 'DEBUG');
    expect(debugLogs.length).toBe(2);
    expect(debugLogs.some((l) => l.message.includes('1200ms'))).toBe(true);
    expect(debugLogs.some((l) => l.message.includes('80ms'))).toBe(true);
  });

  it('User support: retrieves logs for a specific user_id', async () => {
    const logs: LogEntry[] = [
      {
        level: 'INFO',
        timestamp: baseTime.toISOString(),
        message: 'User login',
        service_name: 'auth',
        user_id: 'u1',
      },
      {
        level: 'INFO',
        timestamp: baseTime.toISOString(),
        message: 'User logout',
        service_name: 'auth',
        user_id: 'u2',
      },
      {
        level: 'INFO',
        timestamp: baseTime.toISOString(),
        message: 'User updated profile',
        service_name: 'profile',
        user_id: 'u1',
      },
    ];
    await fs.writeFile(logsFile, logs.map((l) => JSON.stringify(l)).join('\n'));
    const result = await readAndValidateLogs({ logPath: logsFile, lines: 10 });
    const user1Logs = result.filter((l) => l.user_id === 'u1');
    expect(user1Logs.length).toBe(2);
    expect(user1Logs[0].message).toBe('User login');
    expect(user1Logs[1].message).toBe('User updated profile');
  });

  it('Automated monitoring: simulates alert on anomaly', async () => {
    const logs: LogEntry[] = [
      {
        level: 'INFO',
        timestamp: baseTime.toISOString(),
        message: 'Heartbeat',
        service_name: 'monitor',
      },
      {
        level: 'ERROR',
        timestamp: baseTime.toISOString(),
        message: 'Disk space low',
        service_name: 'monitor',
      },
      {
        level: 'ERROR',
        timestamp: baseTime.toISOString(),
        message: 'Disk space critical',
        service_name: 'monitor',
      },
    ];
    await fs.writeFile(logsFile, logs.map((l) => JSON.stringify(l)).join('\n'));
    const result = await readAndValidateLogs({ logPath: logsFile, lines: 10 });
    const errorLogs = result.filter((l) => l.level === 'ERROR');
    expect(errorLogs.length).toBe(2);
    expect(errorLogs.some((l) => l.message.includes('critical'))).toBe(true);
  });

  it('Migration/refactoring validation: compares logs before/after', async () => {
    // Before migration
    const beforeLogs: LogEntry[] = [
      {
        level: 'INFO',
        timestamp: baseTime.toISOString(),
        message: 'Old event',
        service_name: 'legacy',
      },
    ];
    await fs.writeFile(logsFile, beforeLogs.map((l) => JSON.stringify(l)).join('\n'));
    const before = await readAndValidateLogs({ logPath: logsFile, lines: 10 });
    expect(before.some((l) => l.message === 'Old event')).toBe(true);
    // After migration
    const afterLogs: LogEntry[] = [
      {
        level: 'INFO',
        timestamp: baseTime.toISOString(),
        message: 'Old event',
        service_name: 'legacy',
      },
      {
        level: 'INFO',
        timestamp: baseTime.toISOString(),
        message: 'New event',
        service_name: 'new',
      },
    ];
    await fs.writeFile(logsFile, afterLogs.map((l) => JSON.stringify(l)).join('\n'));
    const after = await readAndValidateLogs({ logPath: logsFile, lines: 10 });
    expect(after.some((l) => l.message === 'Old event')).toBe(true);
    expect(after.some((l) => l.message === 'New event')).toBe(true);
  });
});
