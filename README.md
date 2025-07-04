# Mcp-log-server

## Overview

`mcp-log-server` is an MCP-compatible log server for structured JSON logging and log analysis, designed to work seamlessly with editors like Cursor, VSCode, and others supporting the Model Control Protocol (MCP).

---

## User Guide

### Installation

You can use `mcp-log-server` directly with npx (no global install required):

```sh
npx mcp-log-server init   # Initialize MCP config and rules in your project
npx mcp-log-server start  # Start the MCP log server
```

Or add it as a dev dependency:

```sh
npm install --save-dev mcp-log-server
```

### Initialization

Run the following command in your project root:

```sh
npx mcp-log-server init
```

- This will create or update `.cursor/mcp.json` with the correct server entry.
- It will also copy the logging workflow rules to `.cursor/workflow.mdc`.

### Starting the Server

```sh
npx mcp-log-server start
```

- The server will be available for your editor's MCP integration.

### Configuration

- The MCP server configuration is stored in `.cursor/mcp.json`.
- You can customize the log file path and other options as needed.

### Example MCP config

```json
{
  "mcpServers": {
    "mcp-log-server": {
      "command": "npx",
      "args": ["-y", "mcp-log-server"]
    }
  },
  "mcp.enabled": true,
  "mcp.autoStart": true,
  "mcp.showStatusBar": true,
  "mcp.logLevel": "info"
}
```

---

## Developer Guide

### Release & Versioning

- This project uses [semantic-release](https://semantic-release.gitbook.io/semantic-release/) for automated versioning, changelog generation, and npm publishing.
- Releases are triggered by pushing to the `main` branch with a conventional commit message.
- The server version is automatically synced with the latest git tag.

### GitHub Actions

- The workflow `.github/workflows/release.yml` handles build, test, and release steps.
- Ensure you have set the `NPM_TOKEN` secret in your repository for npm publishing.

### Contributing

- Fork the repository and create a feature branch.
- Use conventional commits for all changes.
- Run `npm run build` to compile TypeScript sources.
- Test your changes locally with `npx mcp-log-server start`.
- Open a pull request with a clear description of your changes.

### Project Structure

- `src/` — TypeScript source code
- `bin/cli.js` — CLI entry point (init/start)
- `init-mcp-log-server.js` — Initialization script
- `templates/` — MCP config and workflow templates
- `.github/workflows/` — CI/CD workflows

---

## License

MIT
