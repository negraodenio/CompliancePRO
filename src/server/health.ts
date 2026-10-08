import { DurableStore } from './db/durable-store';
import { PassportSigner } from '../core/passport-signer';
import { EvidenceLedger } from '../core/evidence-ledger';

export function healthResponse() {
  return { status:'operational',engine:'ComplyPRO Governance Engine',timestamp:new Date().toISOString() };
}
export async function readinessResponse(): Promise<{statusCode:number; body:any}> {
  try {
    if (process.env.NODE_ENV === 'production') {
      PassportSigner.validateProductionConfig();
      await EvidenceLedger.assertDurableWritesHealthy();
      await DurableStore.loadRuntimeEvidence('__READINESS_ONLY__');
      await DurableStore.verifyRuntimeEvidenceSchema();
    }
    return {statusCode:200,body:{status:'ready',scope:'control-plane',timestamp:new Date().toISOString(),services:{guardian:'ready',gateways:'provider_specific',persistence:process.env.NODE_ENV==='production'?'verified':'test/development'}}};
  } catch {
    return {statusCode:503,body:{status:'not_ready',timestamp:new Date().toISOString(),services:{persistence:'unavailable_or_unverified'}}};
  }
}
