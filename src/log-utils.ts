import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { z } from "zod";

export const LogEntrySchema = z.object({
  level: z.enum(["INFO", "WARN", "ERROR", "DEBUG", "CRITICAL"]),
  timestamp: z.string(), // ISO string
  message: z.string(),
  service_name: z.string().optional(),
  user_id: z.string().optional(),
  context: z.record(z.any()).optional(),
  event: z.record(z.any()).optional(),
});

export type LogEntry = z.infer<typeof LogEntrySchema>;

export async function readAndValidateLogs({
  logPath,
  lines = 50,
  start_time,
  end_time,
}: {
  logPath: string;
  lines?: number;
  start_time?: string;
  end_time?: string;
}): Promise<LogEntry[]> {
  if (!logPath) {
    throw new Error("No log file path provided.");
  }
  if (
    logPath.includes("..") ||
    /\\/.test(logPath) ||
    (!logPath.endsWith(".log") && !logPath.endsWith(".txt"))
  ) {
    throw new Error("Invalid logPath. Only .log and .txt files are allowed.");
  }
  if (!existsSync(logPath)) {
    throw new Error(`File ${logPath} does not exist.`);
  }
  const content = await readFile(logPath, "utf-8");
  const linesArray = content.split("\n").filter((line) => line.trim());
  let validLogs: LogEntry[] = [];
  for (const line of linesArray.slice(-lines)) {
    try {
      const parsed = JSON.parse(line);
      const validated = LogEntrySchema.parse(parsed);
      validLogs.push(validated);
    } catch {
      // skip invalid lines
    }
  }
  if (start_time || end_time) {
    const start = start_time ? new Date(start_time) : null;
    const end = end_time ? new Date(end_time) : new Date();
    validLogs = validLogs.filter((log) => {
      const ts = new Date(log.timestamp);
      if (start && ts < start) return false;
      if (end && ts > end) return false;
      return true;
    });
  }
  return validLogs;
}
