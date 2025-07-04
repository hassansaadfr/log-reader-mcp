import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createRequire } from "module";
import { z } from "zod";
import { readAndValidateLogs } from "./log-utils.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json");

const server = new McpServer({
  name: "log-reader-mcp",
  version,
  capabilities: {
    tools: {
      read_log: {
        enabled: true,
        maxLines: 1000,
      },
    },
  },
});

server.tool(
  "read_log",
  "Read the last N lines of the specified log file (each line must be a valid JSON log entry). Optionally filter by time interval.",
  {
    logPath: z.string().describe("Absolute path to the log file (.log or .txt)"),
    lines: z.number().optional().default(50).describe("Number of lines to read (default: 50)"),
    start_time: z.string().optional().describe("Start of the time interval (ISO 8601)"),
    end_time: z.string().optional().describe("End of the time interval (ISO 8601)"),
  },
  async ({ logPath, lines, start_time, end_time }) => {
    try {
      const validLogs = await readAndValidateLogs({
        logPath,
        lines,
        start_time,
        end_time,
      });
      if (validLogs.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No valid log entries found in the last ${lines} lines of ${logPath}${
                start_time || end_time ? " for the specified time interval" : ""
              }.`,
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: `Last ${validLogs.length} valid log entries of ${logPath}${
              start_time || end_time ? " for the specified time interval" : ""
            }:\n\n${validLogs.map((log) => JSON.stringify(log)).join("\n")}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  },
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("MCP Log Server started and ready to receive requests");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
