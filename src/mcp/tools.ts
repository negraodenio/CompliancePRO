import { CodebaseAnalyzer } from '../core/analyzer';
import { SecurityGuard } from '../core/security';
import { GraphOSMapper } from '../core/graphos-mapper';
import { AgenticLightAssessment } from '../core/agentic-light';
import { AgentPassportGenerator } from '../core/agent-passport';
import * as fs from 'fs';
import * as path from 'path';

function loadFilesFromDir(dirPath: string): Record<string, string> {
  const safeDir = SecurityGuard.resolveSafePath(dirPath);
  const fileMap: Record<string, string> = {};

  function walk(current: string) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const e of entries) {
      if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === '__pycache__') continue;
      const full = path.join(current, e.name);
      const rel = path.relative(safeDir, full).replace(/\\/g, '/');
      if (e.isDirectory()) {
        walk(full);
      } else if (e.isFile() && /\.(py|js|ts|tsx|jsx|ipynb|json|ya?ml)$/i.test(e.name)) {
        try {
          fileMap[rel] = fs.readFileSync(full, 'utf-8');
        } catch { /* skip */ }
      }
    }
  }

  walk(safeDir);
  return fileMap;
}

export async function executeMcpTool(toolName: string, args: any): Promise<any> {
  const analyzer = new CodebaseAnalyzer();

  switch (toolName) {
    case 'agentic_light_assessment': {
      const dir = args.filePath || args.targetDir || process.cwd();
      const files = loadFilesFromDir(dir);
      const result = await analyzer.analyze(files, path.basename(dir));
      return AgenticLightAssessment.assess(result);
    }

    case 'get_agent_passports': {
      const dir = args.filePath || args.targetDir || process.cwd();
      const files = loadFilesFromDir(dir);
      const result = await analyzer.analyze(files, path.basename(dir));
      const agents = result.source?.agents || [];
      return agents.map(a => AgentPassportGenerator.generatePassport(a, path.basename(dir), result.violations));
    }

    case 'codeguard_audit':
    case 'compliance_summary': {
      const dir = args.filePath || args.targetDir || process.cwd();
      const files = loadFilesFromDir(dir);
      const result = await analyzer.analyze(files, path.basename(dir));
      return {
        overallScore: result.compliance?.overallScore ?? 0,
        status: typeof result.compliance?.summary === 'string' ? result.compliance.summary : 'Evaluated',
        certification: result.certification?.overall || 'Silver',
        totalAgents: result.source?.agents?.length || 0,
        violationsCount: result.violations?.length || 0,
        summary: result.compliance?.summary
      };
    }

    case 'codeguard_graph':
    case 'governance_graph': {
      const dir = args.filePath || args.targetDir || process.cwd();
      const files = loadFilesFromDir(dir);
      const result = await analyzer.analyze(files, path.basename(dir));
      const mapper = new GraphOSMapper();
      return mapper.mapScanResult(result);
    }

    case 'detect_shadow_apis': {
      const dir = args.filePath || args.targetDir || process.cwd();
      const files = loadFilesFromDir(dir);
      const result = await analyzer.analyze(files, path.basename(dir));
      const shadowViolations = (result.violations || []).filter(v => (v.rule || '').includes('SHADOW') || (v.rule || '').includes('DIRECT_API'));
      return {
        shadowAIsDetected: shadowViolations.length,
        findings: shadowViolations
      };
    }

    case 'risk_register': {
      const dir = args.filePath || args.targetDir || process.cwd();
      const files = loadFilesFromDir(dir);
      const result = await analyzer.analyze(files, path.basename(dir));
      return {
        totalRisks: result.violations?.length || 0,
        violations: (result.violations || []).map(v => ({
          rule: v.rule,
          severity: v.severity,
          file: v.file,
          line: v.line,
          recommendation: v.recommendation
        }))
      };
    }

    case 'scanner_status': {
      return {
        status: 'operational',
        version: '1.1.0-light',
        airGapped: true,
        principle: 'Every Agent Action Must Be Governable and Evidenced.',
        capabilities: {
          agentDetection: true,
          agenticLightAssessment: '10-dimensions-active',
          agentGovernancePassport: 'version-1.0.0',
          cgagFramework: '12-controls-active',
          supportedRegulations: ['LGPD', 'EU AI Act', 'OWASP Top 10 LLM', 'NIST AI RMF', 'ISO 42001', 'DORA'],
          securitySandboxing: true
        }
      };
    }

    default:
      throw new Error(`Unknown MCP tool: ${toolName}`);
  }
}
