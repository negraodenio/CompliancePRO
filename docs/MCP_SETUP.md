# ComplyPRO MCP Server Configuration Guide

Use ComplyPRO as a native Model Context Protocol (MCP) tool provider in **Claude Desktop**, **Cursor**, **Windsurf**, or **Antigravity**.

---

### 1. Claude Desktop Configuration (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "complypro-governance": {
      "command": "node",
      "args": ["--loader", "ts-node/esm", "path/to/standalone-compliance-scanner/src/mcp/server.ts"],
      "env": {
        "TRANSPORT_MODE": "stdio",
        "CODEGUARD_SAFE_ROOT": "path/to/your/project"
      }
    }
  }
}
```

---

### 2. Available MCP Tools

1. `codeguard_audit`: Performs regulatory compliance scan (LGPD, EU AI Act, OWASP).
2. `governance_graph`: Maps in-memory data lineage and agent relationships.
3. `detect_shadow_apis`: Detects undocumented LLM direct calls.
4. `risk_register`: Lists prioritized risks and remediation actions.
5. `scanner_status`: Verifies engine operational state and air-gapped readiness.
