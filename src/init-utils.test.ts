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
    // Crée un template mcp.json minimal
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
    expect(mcpJson['mcp.enabled']).toBe(false); // ne doit pas écraser
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

  it('should create new mcp.json with log-reader-mcp when file does not exist', async () => {
    // Mock template file
    const readFileSpy = jest
      .spyOn(fs, 'readFile')
      .mockResolvedValueOnce(
        JSON.stringify({
          mcpServers: {
            'mcp-log-server': {
              command: 'npx',
              args: ['-y', 'mcp-log-server'],
            },
          },
        }),
      )
      .mockRejectedValueOnce(new Error('File not found'));

    // Mock write file
    const writeFileSpy = jest.spyOn(fs, 'writeFile').mockResolvedValueOnce(undefined);

    await mergeMcpJson(mockMcpJsonPath, mockTemplatePath);

    // Verify writeFile was called with correct content
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
        },
        null,
        2,
      ),
    );

    readFileSpy.mockRestore();
    writeFileSpy.mockRestore();
  });

  it('should add log-reader-mcp to existing mcp.json without overwriting other servers', async () => {
    // Mock template file
    const readFileSpy = jest.spyOn(fs, 'readFile').mockResolvedValueOnce(
      JSON.stringify({
        mcpServers: {
          'mcp-log-server': {
            command: 'npx',
            args: ['-y', 'mcp-log-server'],
          },
        },
      }),
    );

    // Mock existing user file with other servers
    const existingConfig = {
      mcpServers: {
        'task-master-ai': {
          command: 'npx',
          args: ['-y', '--package=task-master-ai', 'task-master-ai'],
          env: {
            ANTHROPIC_API_KEY: 'test-key',
          },
        },
      },
    };
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
            'task-master-ai': {
              command: 'npx',
              args: ['-y', '--package=task-master-ai', 'task-master-ai'],
              env: {
                ANTHROPIC_API_KEY: 'test-key',
              },
            },
            'log-reader-mcp': {
              command: 'npx',
              args: ['-y', 'log-reader-mcp'],
            },
          },
        },
        null,
        2,
      ),
    );

    readFileSpy.mockRestore();
    writeFileSpy.mockRestore();
  });

  it('should update existing log-reader-mcp entry if it exists', async () => {
    // Mock template file
    const readFileSpy = jest.spyOn(fs, 'readFile').mockResolvedValueOnce(
      JSON.stringify({
        mcpServers: {
          'mcp-log-server': {
            command: 'npx',
            args: ['-y', 'mcp-log-server'],
          },
        },
      }),
    );

    // Mock existing user file with old log-reader-mcp config
    const existingConfig = {
      mcpServers: {
        'log-reader-mcp': {
          command: 'node',
          args: ['dist/mcp-server.js'],
        },
        'task-master-ai': {
          command: 'npx',
          args: ['-y', 'task-master-ai'],
        },
      },
    };
    readFileSpy.mockResolvedValueOnce(JSON.stringify(existingConfig));

    // Mock write file
    const writeFileSpy = jest.spyOn(fs, 'writeFile').mockResolvedValueOnce(undefined);

    await mergeMcpJson(mockMcpJsonPath, mockTemplatePath);

    // Verify writeFile was called with updated log-reader-mcp config
    expect(writeFileSpy).toHaveBeenCalledWith(
      mockMcpJsonPath,
      JSON.stringify(
        {
          mcpServers: {
            'log-reader-mcp': {
              command: 'npx',
              args: ['-y', 'log-reader-mcp'],
            },
            'task-master-ai': {
              command: 'npx',
              args: ['-y', 'task-master-ai'],
            },
          },
        },
        null,
        2,
      ),
    );

    readFileSpy.mockRestore();
    writeFileSpy.mockRestore();
  });

  it('should handle empty mcpServers object in existing file', async () => {
    // Mock template file
    const readFileSpy = jest.spyOn(fs, 'readFile').mockResolvedValueOnce(
      JSON.stringify({
        mcpServers: {
          'mcp-log-server': {
            command: 'npx',
            args: ['-y', 'mcp-log-server'],
          },
        },
      }),
    );

    // Mock existing user file with empty mcpServers
    const existingConfig = {
      mcpServers: {},
    };
    readFileSpy.mockResolvedValueOnce(JSON.stringify(existingConfig));

    // Mock write file
    const writeFileSpy = jest.spyOn(fs, 'writeFile').mockResolvedValueOnce(undefined);

    await mergeMcpJson(mockMcpJsonPath, mockTemplatePath);

    // Verify writeFile was called with log-reader-mcp added
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
        },
        null,
        2,
      ),
    );

    readFileSpy.mockRestore();
    writeFileSpy.mockRestore();
  });

  it('should handle file without mcpServers property', async () => {
    // Mock template file
    const readFileSpy = jest.spyOn(fs, 'readFile').mockResolvedValueOnce(
      JSON.stringify({
        mcpServers: {
          'mcp-log-server': {
            command: 'npx',
            args: ['-y', 'mcp-log-server'],
          },
        },
      }),
    );

    // Mock existing user file without mcpServers
    const existingConfig = {
      someOtherProperty: 'value',
    };
    readFileSpy.mockResolvedValueOnce(JSON.stringify(existingConfig));

    // Mock write file
    const writeFileSpy = jest.spyOn(fs, 'writeFile').mockResolvedValueOnce(undefined);

    await mergeMcpJson(mockMcpJsonPath, mockTemplatePath);

    // Verify writeFile was called with mcpServers added
    expect(writeFileSpy).toHaveBeenCalledWith(
      mockMcpJsonPath,
      JSON.stringify(
        {
          someOtherProperty: 'value',
          mcpServers: {
            'log-reader-mcp': {
              command: 'npx',
              args: ['-y', 'log-reader-mcp'],
            },
          },
        },
        null,
        2,
      ),
    );

    readFileSpy.mockRestore();
    writeFileSpy.mockRestore();
  });

  it('should throw error when template file is not found', async () => {
    // Mock template file not found
    const readFileSpy = jest
      .spyOn(fs, 'readFile')
      .mockRejectedValueOnce(new Error('Template not found'));

    await expect(mergeMcpJson(mockMcpJsonPath, mockTemplatePath)).rejects.toThrow(
      'Template mcp.json not found',
    );

    readFileSpy.mockRestore();
  });

  it('should handle malformed JSON in existing file', async () => {
    // Mock template file
    const readFileSpy = jest.spyOn(fs, 'readFile').mockResolvedValueOnce(
      JSON.stringify({
        mcpServers: {
          'mcp-log-server': {
            command: 'npx',
            args: ['-y', 'mcp-log-server'],
          },
        },
      }),
    );

    // Mock malformed JSON in existing file
    readFileSpy.mockResolvedValueOnce('invalid json');

    // Mock write file
    const writeFileSpy = jest.spyOn(fs, 'writeFile').mockResolvedValueOnce(undefined);

    await mergeMcpJson(mockMcpJsonPath, mockTemplatePath);

    // Should create new file with log-reader-mcp
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
        },
        null,
        2,
      ),
    );

    readFileSpy.mockRestore();
    writeFileSpy.mockRestore();
  });
});
