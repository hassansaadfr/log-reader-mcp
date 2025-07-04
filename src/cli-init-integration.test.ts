import { jest } from "@jest/globals";
import { execa } from "execa";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

jest.setTimeout(20000);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Copie récursive d'un dossier (src -> dest)
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

describe("CLI integration: init in test project dir", () => {
  let testProjectDir: string;
  let tmpDir: string;
  let tgzPath: string;

  beforeEach(async () => {
    // Crée un dossier temporaire pour le projet de test
    testProjectDir = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-test-proj-"));
    // Copie tout le projet courant dans ce dossier
    await copyDir(path.join(__dirname, ".."), testProjectDir);
    // Génère le package tgz dans ce dossier de test
    const { stdout } = await execa("npm", ["pack"], { cwd: testProjectDir });
    tgzPath = path.join(testProjectDir, stdout.trim());
    // Crée un sous-dossier pour simuler l'utilisateur
    tmpDir = path.join(testProjectDir, "user-proj");
    await fs.mkdir(tmpDir);
    // Installe le package localement dans le sous-dossier
    await execa("npm", ["install", tgzPath], { cwd: tmpDir });
  });

  afterEach(async () => {
    // Supprime récursivement le dossier de test
    await fs.rm(testProjectDir, { recursive: true, force: true });
  });

  it("runs init and generates expected files in user project", async () => {
    // Exécute la commande dans le sous-dossier utilisateur
    await execa("npx", ["log-reader-mcp", "init"], { cwd: tmpDir });
    // Vérifie la présence des fichiers générés
    const cursorDir = path.join(tmpDir, ".cursor");
    const mcpJson = path.join(cursorDir, "mcp.json");
    const rules = path.join(cursorDir, "log-reader-mcp", "workflow.mdc");
    const logsDir = path.join(tmpDir, "logs");
    const logsFile = path.join(logsDir, "logs.log");
    const gitignore = path.join(tmpDir, ".gitignore");
    // Tous les fichiers/dossiers doivent exister
    await expect(fs.stat(mcpJson)).resolves.toBeDefined();
    await expect(fs.stat(rules)).resolves.toBeDefined();
    await expect(fs.stat(logsDir)).resolves.toBeDefined();
    await expect(fs.stat(logsFile)).resolves.toBeDefined();
    // .gitignore doit contenir logs/logs.log
    const gitignoreContent = await fs.readFile(gitignore, "utf-8");
    expect(gitignoreContent).toMatch(/logs\/logs\.log/);
  });
});
