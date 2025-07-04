import { promises as fs } from "fs";
import path from "path";
import { LogEntrySchema, readAndValidateLogs } from "./log-utils";

describe("LogEntrySchema", () => {
  it("validates a correct log entry", () => {
    const valid = {
      level: "INFO",
      timestamp: new Date().toISOString(),
      message: "Test",
    };
    expect(() => LogEntrySchema.parse(valid)).not.toThrow();
  });
  it("throws on missing required fields", () => {
    expect(() => LogEntrySchema.parse({})).toThrow();
  });
});

describe("readAndValidateLogs", () => {
  const tmpLog = path.join(__dirname, "test.log");
  const now = new Date();
  const logs = [
    { level: "INFO", timestamp: now.toISOString(), message: "A" },
    { level: "ERROR", timestamp: now.toISOString(), message: "B" },
    { level: "DEBUG", timestamp: now.toISOString(), message: "C" },
  ];
  beforeAll(async () => {
    await fs.writeFile(tmpLog, logs.map((l) => JSON.stringify(l)).join("\n"));
  });
  afterAll(async () => {
    await fs.unlink(tmpLog);
  });
  it("reads and validates logs", async () => {
    const result = await readAndValidateLogs({ logPath: tmpLog, lines: 2 });
    expect(result.length).toBe(2);
    expect(result[0].message).toBe("B");
    expect(result[1].message).toBe("C");
  });
  it("filters by time interval", async () => {
    const start = new Date(now.getTime() + 1000).toISOString();
    const result = await readAndValidateLogs({
      logPath: tmpLog,
      start_time: start,
    });
    expect(result.length).toBe(0);
  });
  it("throws on invalid file", async () => {
    await expect(
      readAndValidateLogs({ logPath: "notfound.log" })
    ).rejects.toThrow();
  });
  it("throws on invalid extension", async () => {
    await expect(
      readAndValidateLogs({ logPath: "test.invalid" })
    ).rejects.toThrow();
  });
});
