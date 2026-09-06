# ComplyPRO Universal MCP Server Configuration & Integration Guide

ComplyPRO exposes a native **Model Context Protocol (MCP)** interface for AI Agents, IDEs (**Claude Desktop**, **Cursor**, **Antigravity**, **VS Code**) and remote SaaS environments.

---

## 1. Architecture & Supported Transports

The Universal MCP Server supports dual transports:

1. **Local Stdio (`stdio`)**: Standard input/output transport for local IDEs running directly on developer workstations.
2. **Remote Streamable HTTP (`streamable-http` / `http`)**: Modern MCP 2025/2026 specification transport on endpoint `/mcp` supporting JSON-RPC 2.0 and SSE response streaming with Bearer token authentication.
3. **Classic SSE (`sse`)**: Server-Sent Events transport on `/sse` and `/message` for backwards compatibility.

---

## 2. Local IDE Configuration (Stdio)

### Claude Desktop (`claude_desktop_config.json`) or Cursor / Antigravity

```json
{
  "mcpServers": {
    "complypro-governance": {
      "command": "npx",
      "args": ["-y", "tsx", "src/mcp/server.ts"],
      "env": {
        "TRANSPORT_MODE": "stdio",
        "CGAG_MCP_AUTH_TOKEN": "sk-your-enterprise-token"
      }
    }
  }
}
```

---

## 3. Remote HTTP Configuration (Streamable HTTP / SSE)

### Starting the Remote Server

```bash
# Start Streamable HTTP server on default port 3001
TRANSPORT_MODE=http npx tsx src/mcp/server.ts

# Or via npm script
npm run mcp:remote
```

### Remote MCP Client Configuration

In MCP clients that connect to remote servers over HTTP:

```json
{
  "mcpServers": {
    "complypro-remote": {
      "url": "https://<your-mcp-host>/mcp",
      "headers": {
        "Authorization": "Bearer sk-your-enterprise-token",
        "Accept": "application/json, text/event-stream"
      }
    }
  }
}
```

---

## 4. Canonical Inventory

### 14 Tools
- **Discovery**: `scan_repository`, `get_scan_summary`, `discover_agents`, `discover_capabilities`, `detect_shadow_apis`
- **Governance**: `get_agent_passport`, `get_business_xray`, `get_governance_controls`, `get_governance_snapshot`
- **Evidence & Audit**: `get_audit_ledger`, `verify_audit_ledger`, `get_evidence_records`
- **Security & Ops**: `get_tenant_context`, `get_mcp_server_info`

### 7 Resources
- `cgag://controls`: The 12 canonical CG-AG controls
- `cgag://policies`: Active governance baseline policies
- `cgag://ledger`: Cryptographic audit ledger
- `cgag://ledger/{blockHeight}`: Specific block by height
- `cgag://evidence`: Sealed evidence records
- `cgag://evidence/{id}`: Specific evidence by record ID
- `cgag://tenant`: Authenticated tenant context

### 4 Guided Prompts
- `executive_governance_review`: Board-level AI governance memo
- `ciso_security_review`: Deep AppSec, shadow AI and destructive action audit
- `dpo_privacy_review`: Sensitive data lineage and LGPD/EU AI Act compliance
- `vendor_risk_assessment`: Third-party vendor AI risk scorecard

---

## 5. Security Invariants
- **Fail-Closed**: In production mode (`NODE_ENV=production`), unauthenticated requests are rejected with HTTP 401 / JSON-RPC code `-32001`.
- **RBAC**: Operations enforce role boundaries (CISO, DPO, Engineer, Auditor, Viewer).
- **Tenant Isolation**: Caller tenant is strictly derived from authenticated session.
- **Path Security**: All file operations are contained by `SecurityGuard.resolveSafePath`.
- **Zero Secret Leakage**: Credentials and tokens are scrubbed from outputs.
