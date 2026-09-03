#!/usr/bin/env node
/**
 * Lab-only STDIO launcher for the real CG-AG Universal MCP server.
 *
 * This file does not implement an MCP server. It creates an ephemeral local
 * baseline CISO session, injects it into the existing auth path, then starts
 * src/mcp/server.ts through its exported runStdio() entrypoint.
 */

import { IdentityProvider } from '../../src/server/security/identity-provider';

process.env.VITEST = 'true';
process.env.CGAG_MCP_DEV_MODE = 'false';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const { runStdio } = await import('../../src/mcp/server.ts');

IdentityProvider.initializeBaselineUsers();
const session = IdentityProvider.createSession('USR-CISO-01', 'TENANT-DEFAULT', 'WS-DEFAULT');
process.env.CGAG_MCP_AUTH_TOKEN = session.sessionId;

await runStdio();
