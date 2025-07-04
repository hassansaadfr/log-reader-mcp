import { jest } from '@jest/globals';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureLogsDir, mergeMcpJson, updateOrCreateMcpJson } from './init-utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('init-utils', () => {
  let tmpDir: string;
  let cursorDir: string;
  let templatePath: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-init-test-'));
    cursorDir = path.join(tmpDir, '.cursor');
    await fs.mkdir(cursorDir, { recursive: true });
    // Create a minimal mcp.json template
    templatePath = path.join(tmpDir, 'template.json');
    await fs.writeFile(
      templatePath,
      JSON.stringify({
        mcpServers: {
          'log-reader-mcp': { foo: 'bar' },
        },
        'mcp.enabled': true,
        'mcp.autoStart': true,
      }),
    );
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('creates logs dir and logs.log', async () => {
    await ensureLogsDir(tmpDir);
    const logsDir = path.join(tmpDir, 'logs');
    const logsFile = path.join(logsDir, 'logs.log');
    await expect(fs.stat(logsDir)).resolves.toBeDefined();
    await expect(fs.stat(logsFile)).resolves.toBeDefined();
  });

  it('creates mcp.json from template if not exists', async () => {
    await updateOrCreateMcpJson(cursorDir, templatePath, 'log-reader-mcp');
    const mcpJson = JSON.parse(await fs.readFile(path.join(cursorDir, 'mcp.json'), 'utf-8'));
    expect(mcpJson.mcpServers['log-reader-mcp']).toEqual({ foo: 'bar' });
    expect(mcpJson['mcp.enabled']).toBe(true);
    expect(mcpJson['mcp.autoStart']).toBe(true);
  });

  it('adds log-reader-mcp key if not present in existing mcp.json', async () => {
    const mcpJsonPath = path.join(cursorDir, 'mcp.json');
    await fs.writeFile(
      mcpJsonPath,
      JSON.stringify({ mcpServers: { other: { a: 1 } }, 'mcp.enabled': false }),
    );
    await updateOrCreateMcpJson(cursorDir, templatePath, 'log-reader-mcp');
    const mcpJson = JSON.parse(await fs.readFile(mcpJsonPath, 'utf-8'));
    expect(mcpJson.mcpServers['log-reader-mcp']).toEqual({ foo: 'bar' });
    expect(mcpJson.mcpServers['other']).toEqual({ a: 1 });
    expect(mcpJson['mcp.enabled']).toBe(false); // should not overwrite
  });

  it('does not overwrite log-reader-mcp if already present', async () => {
    const mcpJsonPath = path.join(cursorDir, 'mcp.json');
    await fs.writeFile(
      mcpJsonPath,
      JSON.stringify({ mcpServers: { 'log-reader-mcp': { baz: 42 } } }),
    );
    await updateOrCreateMcpJson(cursorDir, templatePath, 'log-reader-mcp');
    const mcpJson = JSON.parse(await fs.readFile(mcpJsonPath, 'utf-8'));
    expect(mcpJson.mcpServers['log-reader-mcp']).toEqual({ baz: 42 });
  });
});

describe('mergeMcpJson', () => {
  const mockCursorDir = '/test/project/.cursor';
  const mockMcpJsonPath = path.join(mockCursorDir, 'mcp.json');
  const mockTemplatePath = path.join(__dirname, '../../templates/mcp.json');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create new mcp.json when file does not exist', async () => {
    // Mock template file with real template content
    const readFileSpy = jest
      .spyOn(fs, 'readFile')
      .mockResolvedValueOnce(
        JSON.stringify({
          mcpServers: {
            'log-reader-mcp': {
              command: 'npx',
              args: ['-y', 'log-reader-mcp'],
            },
          },
          'mcp.enabled': true,
          'mcp.autoStart': true,
          'mcp.showStatusBar': true,
          'mcp.logLevel': 'info',
        }),
      )
      .mockRejectedValueOnce(new Error('File not found'));

    // Mock write file
    const writeFileSpy = jest.spyOn(fs, 'writeFile').mockResolvedValueOnce(undefined);

    await mergeMcpJson(mockMcpJsonPath, mockTemplatePath);

    // Verify writeFile was called with correct content from template
    expect(writeFileSpy).toHaveBeenCalledWith(
      mockMcpJsonPath,
      JSON.stringify(
        {
          mcpServers: {
            'log-reader-mcp': {
              command: 'npx',
              args: ['-y', 'log-reader-mcp'],
            },
          },
          'mcp.enabled': true,
          'mcp.autoStart': true,
          'mcp.showStatusBar': true,
          'mcp.logLevel': 'info',
        },
        null,
        2,
      ),
    );

    readFileSpy.mockRestore();
    writeFileSpy.mockRestore();
  });

  it('should merge with existing empty mcp.json file', async () => {
    // Mock template file
    const readFileSpy = jest.spyOn(fs, 'readFile').mockResolvedValueOnce(
      JSON.stringify({
        mcpServers: {
          'log-reader-mcp': {
            command: 'npx',
            args: ['-y', 'log-reader-mcp'],
          },
        },
        'mcp.enabled': true,
        'mcp.autoStart': true,
        'mcp.showStatusBar': true,
        'mcp.logLevel': 'info',
      }),
    );

    // Mock existing user file with empty object
    const existingConfig = {};
    readFileSpy.mockResolvedValueOnce(JSON.stringify(existingConfig));

    // Mock write file
    const writeFileSpy = jest.spyOn(fs, 'writeFile').mockResolvedValueOnce(undefined);

    await mergeMcpJson(mockMcpJsonPath, mockTemplatePath);

    // Verify writeFile was called with merged content
    expect(writeFileSpy).toHaveBeenCalledWith(
      mockMcpJsonPath,
      JSON.stringify(
        {
          mcpServers: {
            'log-reader-mcp': {
              command: 'npx',
              args: ['-y', 'log-reader-mcp'],
            },
          },
          'mcp.enabled': true,
          'mcp.autoStart': true,
          'mcp.showStatusBar': true,
          'mcp.logLevel': 'info',
        },
        null,
        2,
      ),
    );

    readFileSpy.mockRestore();
    writeFileSpy.mockRestore();
  });

  it('should merge with existing mcp.json that contains other MCP servers', async () => {
    // Mock template file
    const readFileSpy = jest.spyOn(fs, 'readFile').mockResolvedValueOnce(
      JSON.stringify({
        mcpServers: {
          'log-reader-mcp': {
            command: 'npx',
            args: ['-y', 'log-reader-mcp'],
          },
        },
        'mcp.enabled': true,
        'mcp.autoStart': true,
        'mcp.showStatusBar': true,
        'mcp.logLevel': 'info',
      }),
    );

    // Mock existing user file with other MCP servers
    const existingConfig = {
      mcpServers: {
        'mcp-service': {
          command: 'npx',
          args: ['-y', '--package=mcp-service', 'mcp-service'],
          env: {
            dummy: 'test-key',
          },
        },
        dummy: {
          command: 'npx',
          args: ['-y', 'dummy'],
        },
      },
      'mcp.enabled': false,
      'custom.setting': 'value',
    };
    readFileSpy.mockResolvedValueOnce(JSON.stringify(existingConfig));

    // Mock write file
    const writeFileSpy = jest.spyOn(fs, 'writeFile').mockResolvedValueOnce(undefined);

    await mergeMcpJson(mockMcpJsonPath, mockTemplatePath);

    // Verify writeFile was called with merged content preserving existing servers
    expect(writeFileSpy).toHaveBeenCalledWith(
      mockMcpJsonPath,
      JSON.stringify(
        {
          mcpServers: {
            'mcp-service': {
              command: 'npx',
              args: ['-y', '--package=mcp-service', 'mcp-service'],
              env: {
                dummy: 'test-key',
              },
            },
            dummy: {
              command: 'npx',
              args: ['-y', 'dummy'],
            },
            'log-reader-mcp': {
              command: 'npx',
              args: ['-y', 'log-reader-mcp'],
            },
          },
          'mcp.enabled': false, // preserved from existing
          'custom.setting': 'value', // preserved from existing
          'mcp.autoStart': true, // added from template
          'mcp.showStatusBar': true, // added from template
          'mcp.logLevel': 'info', // added from template
        },
        null,
        2,
      ),
    );

    readFileSpy.mockRestore();
    writeFileSpy.mockRestore();
  });

  it('should preserve existing code-assistant server when merging', async () => {
    // Mock template file
    const readFileSpy = jest.spyOn(fs, 'readFile').mockResolvedValueOnce(
      JSON.stringify({
        mcpServers: {
          'log-reader-mcp': {
            command: 'npx',
            args: ['-y', 'log-reader-mcp'],
          },
        },
        'mcp.enabled': true,
        'mcp.autoStart': true,
        'mcp.showStatusBar': true,
        'mcp.logLevel': 'info',
      }),
    );

    // Mock existing user file with code-assistant server
    const existingConfig = {
      mcpServers: {
        'code-assistant': {
          command: 'npx',
          args: ['-y', '--package=code-assistant', 'code-assistant'],
          env: {
            CODE_ASSISTANT_TOKEN: 'token-demo',
            CODE_ASSISTANT_REGION: 'eu-west-1',
          },
        },
      },
    };
    readFileSpy.mockResolvedValueOnce(JSON.stringify(existingConfig));

    // Mock write file
    const writeFileSpy = jest.spyOn(fs, 'writeFile').mockResolvedValueOnce(undefined);

    await mergeMcpJson(mockMcpJsonPath, mockTemplatePath);

    // Verify writeFile was called with merged content preserving code-assistant
    expect(writeFileSpy).toHaveBeenCalledWith(
      mockMcpJsonPath,
      JSON.stringify(
        {
          mcpServers: {
            'code-assistant': {
              command: 'npx',
              args: ['-y', '--package=code-assistant', 'code-assistant'],
              env: {
                CODE_ASSISTANT_TOKEN: 'token-demo',
                CODE_ASSISTANT_REGION: 'eu-west-1',
              },
            },
            'log-reader-mcp': {
              command: 'npx',
              args: ['-y', 'log-reader-mcp'],
            },
          },
          'mcp.enabled': true, // added from template
          'mcp.autoStart': true, // added from template
          'mcp.showStatusBar': true, // added from template
          'mcp.logLevel': 'info', // added from template
        },
        null,
        2,
      ),
    );

    readFileSpy.mockRestore();
    writeFileSpy.mockRestore();
  });
});
