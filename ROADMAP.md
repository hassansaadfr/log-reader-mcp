# 🗺️ Roadmap – MCP Log Reader

## 🚀 Upcoming Features

- **Pluggable log transports**
  - Support for fetching logs from external platforms, not just local files
  - Unified interface for querying logs from any source

- **Integrations with major logging platforms**
  - [ ] ELK Stack (Elasticsearch, Logstash, Kibana)
  - [ ] Datadog Logs
  - [ ] AWS CloudWatch Logs
  - [ ] Grafana Loki
  - [ ] Google Cloud Logging
  - [ ] Azure Monitor Logs
  - [ ] Papertrail
  - [ ] Sentry (log events)
  - [ ] Syslog (remote)
  - [ ] Custom HTTP/REST log APIs

- **Transport selection in config**
  - Allow users to specify and combine multiple log sources (local + remote)
  - Example: query both local logs and CloudWatch in a single prompt

- **Authentication & security**
  - Secure storage of API keys/tokens for cloud log platforms
  - User prompts for missing credentials

- **Advanced filtering & search**
  - Regex, full-text, and structured queries across all transports
  - Time range, severity, and context-based filtering

- **Streaming & real-time updates**
  - (Optional) Live tailing of remote logs in the editor

- **Extensible transport API**
  - Community can add new log backends via plugins

## 💡 Ideas & Community Suggestions

- Support for log enrichment (add context from other sources)
- Alerting/notification integration (Slack, email, etc.)
- Visual log timeline in the editor
- Export logs to CSV/JSON from the AI interface

---

**Want to suggest a feature or integration?**
Open an [issue](https://github.com/hassansaadfr/mcp-log-reader/issues) or start a [discussion](https://github.com/hassansaadfr/mcp-log-reader/discussions)!
