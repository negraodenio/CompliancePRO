/**
 * ComplyPRO.pt — Sprint 6: Metadata Router for Agent Studio Client
 * 
 * Exposes read-only projections directly from existing registries:
 * - GET /api/v1/compliance-profiles: Read-only projection from ComplianceProfileRegistry
 * - GET /api/v1/capabilities: Read-only projection from CapabilityRegistry
 * - GET /api/v1/evidence/:agentId: Read-only evidence chain (Scoped to owner tenant)
 * - POST /api/v1/evidence/verify: Verifies evidence integrity
 */

import { Router, Request, Response } from 'express';
import { ComplianceProfileRegistry } from '../../core/compliance-compiler';
import { CapabilityRegistry } from '../../core/capability-registry';
import { requireRoles } from '../security/auth-middleware';

export const metadataRouter = Router();

/**
 * GET /api/v1/compliance-profiles
 */
metadataRouter.get('/compliance-profiles', requireRoles('developer', 'compliance_officer', 'auditor'), (req: Request, res: Response) => {
  try {
    const profiles = ComplianceProfileRegistry.getAllProfiles();
    
    const projection = profiles.map(p => ({
      profileId: p.profileId,
      name: p.name,
      description: p.description,
      version: p.version,
      checksum: p.checksum,
      applicableRegulations: p.applicableRegulations,
      mandatoryControls: p.mandatoryControls,
      forbiddenActions: p.forbiddenActions,
      requireHumanApproval: p.requireHumanApproval,
      status: 'COMPILED_AND_VERIFIED'
    }));

    res.status(200).json({
      total: projection.length,
      profiles: projection
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to retrieve compliance profiles',
      message: err.message
    });
  }
});

/**
 * GET /api/v1/capabilities
 */
metadataRouter.get('/capabilities', requireRoles('developer', 'compliance_officer', 'auditor'), (req: Request, res: Response) => {
  try {
    const capabilities = CapabilityRegistry.getAll();

    const projection = capabilities.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      channel: c.channel,
      riskLevel: c.riskLevel,
      allowedActions: c.allowedActions,
      dataClassification: c.dataClassification,
      provider: c.provider,
      rateLimit: c.rateLimit,
      budget: c.budget,
      hitl: c.hitl
    }));

    res.status(200).json({
      total: projection.length,
      capabilities: projection
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to retrieve governed capabilities',
      message: err.message
    });
  }
});

/**
 * GET /api/v1/evidence/:agentId
 * Returns the authoritative event chain for an agent (Owner tenant only).
 */
metadataRouter.get('/evidence/:agentId', requireRoles('developer', 'compliance_officer', 'auditor'), async (req: Request, res: Response) => {
  try {
    const { EvidenceLedger } = await import('../../core/evidence-ledger');
    const { AgentProvisioner } = await import('../../core/agent-provisioner');
    const { agentId } = req.params;

    // Cross-tenant boundary check
    const callerTenant = req.tenantId || req.principal?.tenantId;
    if (callerTenant) await EvidenceLedger.reloadTenant(callerTenant);
    const agent = AgentProvisioner.getAgent(agentId);
    if (callerTenant && agent) {
      const agentTenant = agent.tenantId || agent.passport?.tenantId;
      if (agentTenant && agentTenant !== callerTenant) {
        return res.status(403).json({
          ok: false,
          error: 'CROSS_TENANT_ACCESS_DENIED',
          message: `Tenant [${callerTenant}] cannot access evidence belonging to agent of tenant [${agentTenant}].`
        });
      }
    }

    const entries = EvidenceLedger.getEntries(agentId, callerTenant);
    const verification = EvidenceLedger.verifyChain(undefined, callerTenant);

    res.status(200).json({
      ok: true,
      agentId,
      totalEntries: entries.length,
      chainValid: verification.valid,
      entries
    });
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      error: err.message || 'Failed to fetch agent evidence'
    });
  }
});

/**
 * POST /api/v1/evidence/verify
 */
metadataRouter.post('/evidence/verify', requireRoles('developer', 'compliance_officer', 'auditor'), async (req: Request, res: Response) => {
  try {
    const { EvidenceLedger } = await import('../../core/evidence-ledger');
    const { EvidenceVerifier } = await import('../../core/evidence-verifier');
    const { AgentProvisioner } = await import('../../core/agent-provisioner');
    const { agentId } = req.body;

    // Cross-tenant boundary check
    const callerTenant = req.tenantId || req.principal?.tenantId;
    if (callerTenant) await EvidenceLedger.reloadTenant(callerTenant);
    if (callerTenant && agentId) {
      const agent = AgentProvisioner.getAgent(agentId);
      if (agent) {
        const agentTenant = agent.tenantId || agent.passport?.tenantId;
        if (agentTenant && agentTenant !== callerTenant) {
          return res.status(403).json({
            ok: false,
            error: 'CROSS_TENANT_ACCESS_DENIED',
            message: `Tenant [${callerTenant}] cannot verify evidence belonging to agent of tenant [${agentTenant}].`
          });
        }
      }
    }

    const entries = EvidenceLedger.getEntries(agentId, callerTenant);
    const chainCheck = EvidenceVerifier.verifyChain(EvidenceLedger.getEntries(undefined, callerTenant));

    let auditPackReport: any = null;
    let auditPack: any = null;
    if (entries.length > 0) {
      const latest = entries[entries.length - 1];
      auditPack = EvidenceLedger.buildAuditPack(latest.evidenceId, callerTenant);
      auditPackReport = EvidenceVerifier.verifyAuditPack(auditPack);
    }

    res.status(200).json({
      ok: true,
      verifiedAt: new Date().toISOString(),
      chain: {
        valid: chainCheck.valid,
        totalEntries: entries.length,
        error: chainCheck.error
      },
      auditPack: auditPack ? {
        packId: auditPack.packId,
        merkleRoot: auditPack.merkleRoot,
        report: auditPackReport
      } : null
    });
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      error: err.message || 'Evidence verification failed'
    });
  }
});
