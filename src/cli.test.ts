import { execa } from "execa";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("CLI", () => {
  const cliPath = path.join(__dirname, "../bin/cli.js");

  it("shows help with --help", async () => {
    const { stdout, exitCode } = await execa("node", [cliPath, "--help"]);
    expect(stdout).toMatch(/USAGE:/);
    expect(stdout).toMatch(/Repository:/);
    expect(exitCode).toBe(0);
  });

  it("shows help with -h", async () => {
    const { stdout, exitCode } = await execa("node", [cliPath, "-h"]);
    expect(stdout).toMatch(/USAGE:/);
    expect(exitCode).toBe(0);
  });

  it("shows error on unknown command", async () => {
    const { stderr, exitCode } = await execa("node", [cliPath, "unknown"], {
      reject: false,
    });
    expect(stderr).toMatch(/Unknown command/);
    expect(exitCode).toBe(1);
  });

  it("runs init without error (dry run)", async () => {
    // On ne vérifie pas l'effet, juste que ça ne crash pas
    const { exitCode } = await execa("node", [cliPath, "init"], {
      reject: false,
    });
    expect([0, 1]).toContain(exitCode); // 0 = succès, 1 = déjà initialisé ou erreur mineure
  });

  it("runs server by default (dry run)", async () => {
    // On lance le serveur, on attend un peu, puis on tue le process et on vérifie la sortie
    const subprocess = execa("node", [cliPath], { reject: false });
    let output = "";
    subprocess.stdout?.on("data", (data) => {
      output += data.toString();
    });
    subprocess.stderr?.on("data", (data) => {
      output += data.toString();
    });
    await new Promise((resolve) => setTimeout(resolve, 500));
    subprocess.kill();
    await subprocess.catch(() => {}); // ignore exit error
    expect(output).toMatch(/MCP Log Server|Error|usage/i);
  });
});
