# 🚀 Log Reader Mcp

![npm](https://img.shields.io/npm/v/log-reader-mcp)
![build](https://github.com/hassansaadfr/log-reader-mcp/actions/workflows/release.yml/badge.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> 🚀 **Stop wasting time copy-pasting logs!**<br>
> 🧠 **Let Cursor's AI instantly access, search, and explain your logs — no more manual work, just answers.**

## 📚 Table of Contents

- [Why Log Reader Mcp?](#-why-log-reader-mcp)
- [Installation](#-installation)
  - [Automatic (recommended)](#-automatic-recommended)
  - [Manual](#-manual)
- [Who is it for?](#-who-is-it-for)
- [MCP Configuration](#-mcp-configuration)
- [Example Prompts for Cursor](#-example-prompts-for-cursor)
- [CLI Usage](#-cli-usage)
- [Log Format (JSON per line)](#-log-format-json-per-line)
- [Developer Guide](#-developer-guide)
- [Key Advantages](#-key-advantages)
- [FAQ](#-faq)
- [Getting Help](#-getting-help)
- [Contributing](#-contributing)
- [License](#-license)
- [Cursor Rule (Workflow)](#-cursor-rule-workflow)

---

## ✨ Why Log Reader Mcp?

- 🤖 **AI-powered log access**: Give your AI assistant (Cursor, etc.) direct, on-demand access to your app logs.
- 🧠 **Smarter debugging**: Let the AI analyze, summarize, and explain logs as you code.
- ⏱️ **Save hours**: No more switching terminals, tailing files, or hunting for errors—get instant feedback and context.
- 🛡️ **Safe & isolated**: Never pollutes your project, robust CLI and test coverage.
- ⚡ **Plug & Play**: One command, zero config, works everywhere.

---

## 👤 Who is it for?

- Backend & frontend developers
- DevOps & SREs
- Teams using AI-powered editors (Cursor, etc.)
- Anyone who wants faster, smarter log analysis!

---

## 📦 Installation

### 🚀 Automatic (recommended)

```sh
npx log-reader-mcp init
```

- Installs everything, creates `.cursor/mcp.json` and workflow rules, and sets up your logs folder automatically.

### 🛠️ Manual

1. **Install the package**
   ```sh
   npm install --save-dev log-reader-mcp
   ```
2. **Create the config file**
   - At the root of your project, create a folder named `.cursor` (if it doesn't exist).
   - Inside `.cursor/`, create a file named `mcp.json` with:

   ```json
   {
     "mcpServers": {
       "log-reader-mcp": {
         "command": "npx",
         "args": ["-y", "log-reader-mcp"]
       }
     },
     "mcp.enabled": true,
     "mcp.autoStart": true,
     "mcp.showStatusBar": true,
     "mcp.logLevel": "info"
   }
   ```

   - This tells your editor (Cursor, VSCode, etc.) how to launch and connect to the log reader mcp server for your project.

---

## 🖼️ What does it do?

**Log Reader Mcp** exposes your application's logs to your AI assistant/editor (like Cursor) via the Model Control Protocol (MCP). This means:

- The AI can read, filter, and analyze your logs on demand (not streaming)
- You can ask the AI to fetch logs for a specific period, number of lines, error level, etc.
- Makes onboarding, debugging, and incident response dramatically faster

---

## 💡 Example Prompts for Cursor

Here are some real-world prompts you can use in Cursor (or any MCP-enabled AI) to interact with your logs:

| Use Case           | Example Prompt to Cursor AI                                 |
| ------------------ | ----------------------------------------------------------- |
| 🔢 Last N logs     | `Show me the last 100 log entries`                          |
| 🕒 Logs by time    | `Get all logs between 2024-06-01 and 2024-06-02`            |
| ⏩ Logs since date | `Show all logs since 2024-06-01`                            |
| 🚨 Errors only     | `Show only ERROR or CRITICAL logs from the last 50 entries` |
| 🔍 Search message  | `Find all logs containing "database connection failed"`     |
| 🧑‍💻 User-specific   | `Show all logs for user_id 12345 in the last 24 hours`      |
| 📊 Summary         | `Summarize the main issues found in today's logs`           |
| 🧹 Clear context   | `Clear the log context and start a new analysis`            |

> **Tip:** You can combine filters, time ranges, and keywords in your prompts. The AI will use Log Reader Mcp to fetch and analyze the relevant log data for you!

---

## 💡 Use Cases

| Use Case               | How Log Reader Mcp Helps                                    | Time Saved         |
| ---------------------- | ----------------------------------------------------------- | ------------------ |
| 🐞 Real-time debugging | See errors & warnings instantly in Cursor, with AI context  | Minutes per bug    |
| 🔍 AI log analysis     | Let the AI summarize, filter, and explain log events        | Hours per incident |
| 🚦 Incident response   | Quickly surface critical issues to the whole team           | Days per outage    |
| 👩‍💻 Onboarding          | New devs get instant, readable log feedback in their editor | Weeks per new hire |
| 📊 Audit & compliance  | Structured logs, easy to export and review                  | Countless hours    |

---

## ⚙️ MCP Configuration Example

```json
{
  "mcpServers": {
    "log-reader-mcp": {
      "command": "npx",
      "args": ["-y", "log-reader-mcp"]
    }
  },
  "mcp.enabled": true,
  "mcp.autoStart": true,
  "mcp.showStatusBar": true,
  "mcp.logLevel": "info"
}
```

- 📁 Place this in `.cursor/mcp.json`
- Your editor will auto-detect and use the log server

---

## 🖥️ CLI Usage

| Command                           | Effect                                  |
| --------------------------------- | --------------------------------------- |
| `npx log-reader-mcp init`         | Initialize MCP config and log workflow  |
| `npx log-reader-mcp -h/--help`    | Show help and CLI options               |
| `npx log-reader-mcp -v/--version` | Show the current package version        |
| `npx log-reader-mcp`              | Start the MCP log server (default mode) |

---

## 📝 Log Format (JSON per line)

Each line in `logs/logs.log` should be a JSON object:

```json
{
  "level": "INFO|WARN|ERROR|DEBUG|CRITICAL",
  "timestamp": "2024-06-01T12:34:56.789Z",
  "message": "User login succeeded",
  "service_name": "auth",
  "user_id": "12345",
  "context": { "ip": "192.168.1.10" },
  "event": { "action": "login" }
}
```

---

## 🧑‍💻 Developer Guide

- **Release & Versioning**: Automated with semantic-release, changelog, and version auto-sync
- **CI/CD**: GitHub Actions (`.github/workflows/`)
- **Testing**: 100% coverage, CLI test isolation, robust integration
- **Project Structure**:
  - `src/` — TypeScript sources
  - `bin/cli.js` — CLI entry point
  - `templates/` — MCP config & workflow templates
  - `.github/workflows/` — CI/CD

---

## 🏆 Key Advantages

- 🔒 **Zero config, zero risk**: Never pollutes your project
- 🧪 **100% tested**: Full test isolation, robust CI
- 🏗️ **AI-ready**: Structured logs, perfect for automated analysis
- 🚀 **Plug & Play**: Works with all MCP editors, no setup required
- ⏳ **Massive time savings**: Focus on code, not on chasing logs

---

## 🤝 Contributing

1. Fork & create a branch
2. Use conventional commits
3. `npm run build` to compile
4. `npm test` to verify
5. Open a clear, detailed PR

---

## 📄 License

MIT

---

## 📝 Cursor Rule (Workflow)

To help Cursor (or any MCP-compatible AI) understand your log structure and best practices, you can add a workflow rule file:

### How to add the Cursor rule

1. **Copy the template**
   - Use the command: `npx log-reader-mcp init` (recommended)
   - Or manually copy `templates/mcp-log-server/workflow.mdc` to `.cursor/log-reader-mcp/workflow.mdc` at the root of your project.

2. **What does this rule do?**
   - It describes the log file location, format, and usage standards for your project.
   - It helps the AI agent (Cursor, etc.) understand how to read, filter, and analyze your logs.
   - It documents best practices for logging, security, and debugging for your team.

### Example (excerpt)

```yaml
---
description: Guide for using log-reader-mcp
globs: **/*
alwaysApply: true
---

# MCP Logging Workflow

- Log folder: `logs/`
- Log file: `logs.log` (one JSON object per line)
- Example log entry:

  {
    "level": "INFO",
    "timestamp": "2024-06-01T12:34:56.789Z",
    "message": "User login succeeded",
    ...
  }

- Use the `read_log` tool to fetch logs by line count or time range
- Never include sensitive data in logs
- Always validate log format before writing
```

### Why add this rule?

- 🧠 **For the AI**: It enables Cursor to provide smarter, context-aware log analysis and suggestions.
- 👩‍💻 **For developers**: It ensures everyone follows the same standards and makes onboarding easier.
- 🔒 **For security**: It reminds everyone not to log sensitive data and to validate log structure.

> **Tip:** Keeping this rule up to date helps both humans and AI work better with your logs!

---

## ❓ FAQ

**Q: Is it compatible with VSCode or only Cursor?**  
A: Any editor supporting MCP can use it, including Cursor and future tools.

**Q: Can I use multiple MCP servers?**  
A: Yes, just add more entries in `.cursor/mcp.json`.

**Q: What log formats are supported?**  
A: Only structured JSON logs (one object per line) are supported for full AI analysis.

**Q: Is it safe for production?**  
A: Yes! The tool never modifies your logs, only reads them, and is fully tested.

---

## 💬 Getting Help

- Open an [issue](https://github.com/hassansaadfr/log-reader-mcp/issues) for bugs or questions
- Join the discussion on [GitHub Discussions](https://github.com/hassansaadfr/log-reader-mcp/discussions)
- See the [Cursor Rule Template](./templates/mcp-log-server/workflow.mdc) for advanced configuration

---
