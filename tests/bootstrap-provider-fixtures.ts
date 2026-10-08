// Explicit test-only providers. Application gateways never manufacture provider successes.
import { loadTestEnvironment } from './test-supabase-environment.mjs';
if (process.env.NODE_ENV !== 'test') throw new Error('TEST_FIXTURES_FORBIDDEN_OUTSIDE_TEST');
loadTestEnvironment();
const { ToolGateway, CompliancePROToolProvider } = await import('../src/core/tool-gateway');
for (const providerId of ['salesforce-mcp-server', 'schufa-experian-gateway', 'core-banking-system', 'swift-sepa-gateway', 'REST']) {
  ToolGateway.registerProvider({ providerId, execute: async (capability, action, payload) => ({
    fixture: true, capability, action, payload, executedVia: 'COMPLYPRO_GATEWAY'
  }) });
}
class ScannerFixture extends CompliancePROToolProvider {
  private invocations = 0;
  public getCallCount() { return this.invocations; }
  public resetCallCount() { this.invocations = 0; }
  public async execute(_capability: any, _action: any, payload: any): Promise<any> {
    this.invocations++;
    return { fixture: true, scanId: `scan_fixture_${this.invocations}`, complianceScore: 94.5,
      targetRepository: payload?.targetRepo, executedBy: 'COMPLYPRO_TOOL_GATEWAY' };
  }
}
ToolGateway.registerProvider(new ScannerFixture());
