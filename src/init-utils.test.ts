import fs from "fs/promises";
import os from "os";
import path from "path";
import { ensureLogsDir, updateOrCreateMcpJson } from "./init-utils";

describe("init-utils", () => {
  let tmpDir: string;
  let cursorDir: string;
  let templatePath: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-init-test-"));
    cursorDir = path.join(tmpDir, ".cursor");
    await fs.mkdir(cursorDir, { recursive: true });
    // Crée un template mcp.json minimal
    templatePath = path.join(tmpDir, "template.json");
    await fs.writeFile(
      templatePath,
      JSON.stringify({
        mcpServers: {
          "mcp-log-reader": { foo: "bar" },
        },
        "mcp.enabled": true,
        "mcp.autoStart": true,
      })
    );
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("creates logs dir and logs.log", async () => {
    await ensureLogsDir(tmpDir);
    const logsDir = path.join(tmpDir, "logs");
    const logsFile = path.join(logsDir, "logs.log");
    await expect(fs.stat(logsDir)).resolves.toBeDefined();
    await expect(fs.stat(logsFile)).resolves.toBeDefined();
  });

  it("creates mcp.json from template if not exists", async () => {
    await updateOrCreateMcpJson(cursorDir, templatePath, "mcp-log-reader");
    const mcpJson = JSON.parse(
      await fs.readFile(path.join(cursorDir, "mcp.json"), "utf-8")
    );
    expect(mcpJson.mcpServers["mcp-log-reader"]).toEqual({ foo: "bar" });
    expect(mcpJson["mcp.enabled"]).toBe(true);
    expect(mcpJson["mcp.autoStart"]).toBe(true);
  });

  it("adds mcp-log-reader key if not present in existing mcp.json", async () => {
    const mcpJsonPath = path.join(cursorDir, "mcp.json");
    await fs.writeFile(
      mcpJsonPath,
      JSON.stringify({ mcpServers: { other: { a: 1 } }, "mcp.enabled": false })
    );
    await updateOrCreateMcpJson(cursorDir, templatePath, "mcp-log-reader");
    const mcpJson = JSON.parse(await fs.readFile(mcpJsonPath, "utf-8"));
    expect(mcpJson.mcpServers["mcp-log-reader"]).toEqual({ foo: "bar" });
    expect(mcpJson.mcpServers["other"]).toEqual({ a: 1 });
    expect(mcpJson["mcp.enabled"]).toBe(false); // ne doit pas écraser
  });

  it("does not overwrite mcp-log-reader if already present", async () => {
    const mcpJsonPath = path.join(cursorDir, "mcp.json");
    await fs.writeFile(
      mcpJsonPath,
      JSON.stringify({ mcpServers: { "mcp-log-reader": { baz: 42 } } })
    );
    await updateOrCreateMcpJson(cursorDir, templatePath, "mcp-log-reader");
    const mcpJson = JSON.parse(await fs.readFile(mcpJsonPath, "utf-8"));
    expect(mcpJson.mcpServers["mcp-log-reader"]).toEqual({ baz: 42 });
  });
});
