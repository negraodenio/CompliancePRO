# CG-AG MCP Local Testing

This document describes the local-only CG-AG MCP Test Lab for connecting real MCP clients to the existing Universal MCP server over STDIO.

The lab does not create a new MCP server and does not change the production MCP contract. The lab launcher imports `src/mcp/server.ts`, creates an ephemeral baseline CISO session for local testing, and starts the real `runStdio()` entrypoint.

## Prerequisites

- Node.js and npm installed.
- Project dependencies installed with `npm install`.
- No production credentials in `.env` or client config.
- Run commands from the repository root.

## Existing MCP Entry

The existing project command is:

```bash
npm --silent run mcp
```

That command runs:

```bash
tsx src/mcp/server.ts
```

The default transport is STDIO. The existing server also supports SSE when `TRANSPORT_MODE=sse`.

For unauthenticated production-like checks, the lab uses the existing `mcp` command with `CGAG_MCP_DEV_MODE=false`.

## Lab Commands

Run the full protocol harness:

```bash
npm --silent run mcp:lab
```

Start the authenticated local lab STDIO server directly:

```bash
npm --silent run mcp:lab:server
```

The lab server uses an ephemeral local baseline session created in memory. It is intended only for manual client testing and must not be used as a production entrypoint.

## Claude Desktop STDIO Configuration

Claude Desktop local MCP servers are configured in `claude_desktop_config.json`. Current MCP documentation lists the Windows path as `%APPDATA%\Claude\claude_desktop_config.json` and the macOS path as `~/Library/Application Support/Claude/claude_desktop_config.json`.

Use this local lab config on Windows:

```json
{
  "mcpServers": {
    "cgag": {
      "command": "npm.cmd",
      "args": ["--silent", "run", "mcp:lab:server"],
      "cwd": "C:\\Users\\denio\\Documents\\Denio\\PluginVIbeCOde\\standalone-compliance-scanner",
      "env": {
        "CODEGUARD_SAFE_ROOT": "C:\\Users\\denio\\Documents\\Denio\\PluginVIbeCOde\\standalone-compliance-scanner"
      }
    }
  }
}
```

Use this local lab config on macOS or Linux after adjusting the repository path:

```json
{
  "mcpServers": {
    "cgag": {
      "command": "npm",
      "args": ["--silent", "run", "mcp:lab:server"],
      "cwd": "/absolute/path/to/standalone-compliance-scanner",
      "env": {
        "CODEGUARD_SAFE_ROOT": "/absolute/path/to/standalone-compliance-scanner"
      }
    }
  }
}
```

Restart Claude Desktop after editing the config.

## First Claude Test Script

Use these prompts after Claude discovers the `cgag` server:

1. "Use o CG-AG Universal MCP para listar as capacidades e ferramentas de governanca disponiveis."
2. "Execute discover_capabilities."
3. "Execute get_governance_controls."
4. "Execute verify_audit_ledger."

Expected result:

- Claude sees the CG-AG MCP server.
- Claude can list 14 tools.
- `discover_capabilities` returns an MCP tool result from the real CG-AG engine.
- `get_governance_controls` returns the canonical CG-AG controls.
- `verify_audit_ledger` returns a real ledger verification envelope.

The lab does not claim Claude has been tested until a human runs this real Claude Desktop session.

## Protocol Harness Coverage

The harness validates:

- MCP initialize over STDIO.
- Tool discovery: 14 expected tools.
- Resource discovery: 5 static resources and 2 resource templates.
- Prompt discovery: 4 expected prompts.
- Real tool calls against the existing MCP server.
- Real resource reads, including `cgag://ledger/0` and a discovered `cgag://evidence/{id}`.
- Prompt retrieval.
- Valid session, missing session, invalid request, nonexistent tool, and nonexistent resource behavior.
- Sanitized reporting with no stack traces or secrets.

The latest harness report is written to:

```text
tests/mcp-lab/results/latest-report.json
```

## Client Compatibility Matrix

| Client | Supported by protocol | Tested locally by harness | Tested with real client |
| --- | --- | --- | --- |
| Claude Desktop | Yes, STDIO | Yes | No |
| Gemini | Potential, if the client supports local MCP STDIO | No | No |
| OpenCode | Potential, if the client supports local MCP STDIO | No | No |
| VS Code | Potential, if the configured extension/client supports MCP STDIO | No | No |

Only the local SDK harness has been executed automatically. Do not mark Claude, Gemini, OpenCode, or VS Code as tested until each client has been connected manually.

## Troubleshooting

- If Claude does not show the server, restart Claude Desktop and validate the JSON syntax.
- Use absolute paths in `cwd` and `CODEGUARD_SAFE_ROOT`.
- On Windows, use `npm.cmd` as the command.
- Check Claude MCP logs. MCP documentation lists Windows logs under `%APPDATA%\Claude\logs`.
- Run `npm --silent run mcp:lab` first; if the harness fails, fix the local environment before testing an external client.
- If `verify_audit_ledger` is denied, confirm the client uses `mcp:lab:server`, not the unauthenticated `mcp` command.

Reference: Model Context Protocol local server documentation, https://modelcontextprotocol.io/docs/2026-07-28/develop/connect-local-servers.
