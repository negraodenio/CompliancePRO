import assert from 'node:assert/strict';
import { runLocalScan } from '../src/web/services/scanner-bridge';

// Isolated repository fixture: exercises the current AST/config discovery engines.
const files = new Map([
  ['agent.py', 'from crewai import Agent\ncredit_agent = Agent(role="Credit Analyst", goal="Review applications", backstory="Risk team")'],
  ['.mcp.json', JSON.stringify({ mcpServers: { audit: { command: 'node', args: ['agent.js'] } } })]
]);
const result = await runLocalScan(files, { repoName: 'forensic-scanner-fixture' });
assert.equal(result.repo.fileCount, 2);
assert.ok(result.source.agents.length > 0, 'Discovery must detect agents from the fixture');
assert.ok(result.compliance.applicableRegulations.length > 0, 'Regulatory analysis must remain active');
console.log(JSON.stringify({ fileCount: result.repo.fileCount, agents: result.source.agents.map(a => a.name),
  riskCount: result.risks.length, regulationCount: result.compliance.applicableRegulations.length }));
