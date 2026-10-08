import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';
process.env.NODE_ENV='test';
process.env.DATABASE_URL='';process.env.SUPABASE_URL='';process.env.SUPABASE_SERVICE_ROLE_KEY='';process.env.SUPABASE_ANON_KEY='';
process.env.COMPLYPRO_PASSPORT_SECRET=crypto.randomBytes(32).toString('hex');
const {AgentProvisioner}=await import('../src/core/agent-provisioner');
const {RuntimeManager}=await import('../src/core/runtime-manager');
const {ToolGateway}=await import('../src/core/tool-gateway');
const {ModelGateway}=await import('../src/core/model-gateway');
const {EvidenceLedger}=await import('../src/core/evidence-ledger');
const {DurableStore}=await import('../src/server/db/durable-store');
const {CrewAiRuntimeAdapter}=await import('../src/core/adapters/crewai-runtime-adapter');
const {NatRuntimeAdapter}=await import('../src/core/adapters/nat-runtime-adapter');
const {createServerApp}=await import('../src/server/app');
const {AgentInventoryStore}=await import('../src/web/services/agent-inventory-store');
const {readinessResponse}=await import('../src/server/health');
const {SandboxManager}=await import('../src/core/sandbox/sandbox-manager');
let checks=0;
for(const [framework,Adapter] of [['crewai',CrewAiRuntimeAdapter],['nvidia-nat',NatRuntimeAdapter]] as const){
  const agent=AgentProvisioner.provision({name:`real-${framework}`,framework:{name:framework,version:framework==='crewai'?'0.102.0':'1.9.0'},
    tenantId:'TENANT-A',complianceProfile:'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',capabilities:['crm.read_customer','credit.approve','gpt-4o'],budget:{maxCostPerRunEur:1}});
  RuntimeManager.createRuntime(agent.runtimeSpec,agent.passport);RuntimeManager.startRuntime(agent.runtimeId);
  const adapter=new Adapter(RuntimeManager.getWorker(agent.runtimeId)!);
  ToolGateway.unregisterProvider('salesforce-mcp-server');
  const missing=await adapter.start();
  const failed=await adapter.execute(missing,{taskId:'missing',description:'No provider',targetCapability:'crm.read_customer',actionType:'READ'});
  assert.equal(failed.status,'FAILED');assert.equal(failed.toolExecutionCount,0);checks++;
  let calls=0;
  ToolGateway.registerProvider({providerId:'salesforce-mcp-server',execute:async()=>{calls++;return {executed:true};}});
  const real=await adapter.start();const result=await adapter.execute(real,{taskId:'real',description:'Count actual calls',targetCapability:'crm.read_customer',actionType:'READ'});
  assert.equal(result.status,'COMPLETED');assert.equal(calls,1);assert.equal(result.toolExecutionCount,1);checks++;
  process.env.NODE_ENV='development';
  try {
    const worker=RuntimeManager.getWorker(agent.runtimeId)!;
    assert.equal(worker.requestCapability('crm.read_customer','READ').status,'FAILED');
    assert.equal(SandboxManager.executeInSandbox(worker.getSandboxId(),{capabilityId:'crm.read_customer',action:'READ'}).success,false);
    assert.equal(calls,1);checks++;
  } finally {process.env.NODE_ENV='test';}
  ToolGateway.registerProvider({providerId:'salesforce-mcp-server',execute:async()=>{throw new Error('provider failure');}});
  const rejected=await adapter.start();
  ModelGateway.setDispatcher(async()=>({content:'Prior model fixture',usage:{promptTokens:1,completionTokens:1,totalTokens:2}}));
  const priorModel=await RuntimeManager.getWorker(agent.runtimeId)!.requestModel({provider:'openai',model:'gpt-4o',executionId:rejected.executionId,messages:[{role:'user',content:'fixture'}]});
  assert.equal(priorModel.status,'COMPLETED');ModelGateway.resetDispatcher();
  const rejectedResult=await adapter.execute(rejected,{taskId:'failure',description:'Failure',targetCapability:'crm.read_customer',actionType:'READ'});
  assert.equal(rejectedResult.status,'FAILED');assert.equal(rejectedResult.toolExecuted,false);checks++;
  await adapter.stop(rejected);assert.equal(rejected.status,'FAILED');assert.equal(rejected.toolExecutionCount,0);checks++;
  let approvals=0;
  ToolGateway.registerProvider({providerId:'core-banking-system',execute:async()=>{approvals++;return {approved:true};}});
  const paused=await adapter.start();await adapter.execute(paused,{taskId:'hitl',description:'Approval',targetCapability:'credit.approve',actionType:'WRITE',payload:{amount:25000}});
  assert.equal(approvals,0);
  const race=await Promise.allSettled([adapter.resume(paused,'APPROVED','officer-a'),adapter.resume(paused,'APPROVED','officer-b')]);
  assert.equal(approvals,1);assert.equal(race.filter(outcome=>outcome.status==='fulfilled').length,1);checks++;
}

// Durable contract: instrument the existing DurableStore, not a replacement ledger.
const originalLoad=DurableStore.loadRuntimeEvidence,originalAppend=DurableStore.appendRuntimeEvidence;
const persisted=new Map<string,any[]>();let unavailable=false;
DurableStore.loadRuntimeEvidence=async tenant=>{
  if(unavailable) throw new Error('database read unavailable');
  return structuredClone(persisted.get(tenant)||[]);
};
DurableStore.appendRuntimeEvidence=async(tenant,entry)=>{
  if(unavailable) throw new Error('database write unavailable');
  const chain=persisted.get(tenant)||[];assert.equal(entry.sequence,chain.length+1);chain.push(structuredClone(entry));persisted.set(tenant,chain);
};
process.env.NODE_ENV='production';
try{
  const tenant='DURABLE-TEST';await EvidenceLedger.prepareTenant(tenant);
  EvidenceLedger.append({evidenceId:'durable-event',timestamp:new Date().toISOString(),eventType:'TOOL_RESPONSE',agentId:'agent',passportFingerprint:'fingerprint',
    complianceProfileId:'profile',complianceProfileChecksum:'0'.repeat(64),executionResult:'SUCCESS'},tenant);
  await EvidenceLedger.flushPendingWrites(tenant);assert.equal(persisted.get(tenant)?.length,1);checks++;
  EvidenceLedger.reset(tenant);await EvidenceLedger.prepareTenant(tenant);assert.equal(EvidenceLedger.getEntries(undefined,tenant).length,1);checks++;
  unavailable=true;
  EvidenceLedger.append({evidenceId:'fail-event',timestamp:new Date().toISOString(),eventType:'TOOL_REQUEST',agentId:'agent',passportFingerprint:'fingerprint',
    complianceProfileId:'profile',complianceProfileChecksum:'0'.repeat(64)},tenant);
  await assert.rejects(EvidenceLedger.flushPendingWrites(tenant),/unavailable/);checks++;
  const ready=await readinessResponse();assert.equal(ready.statusCode,503);assert.equal(ready.body.status,'not_ready');checks++;
} finally {process.env.NODE_ENV='test';DurableStore.loadRuntimeEvidence=originalLoad;DurableStore.appendRuntimeEvidence=originalAppend;}

const server=http.createServer(createServerApp());await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${(server.address() as any).port}`;
const nativeFetch=globalThis.fetch;
try{
  globalThis.fetch=((input:any,init:any={})=>nativeFetch(String(input).startsWith('/')?base+input:input,
    {...init,headers:{...init.headers,'X-API-Key':'dev-key-tenant-a'}})) as any;
  const imported=await AgentInventoryStore.addAgent({name:'durable-import',framework:'CrewAI',owner:{name:'Owner',role:'Lead',department:'Risk'}});
  assert.equal(imported.status,'IMPORTED');assert.equal(imported.governance.passportStatus,'NOT_ISSUED');
  assert.ok(DurableStore.getAgent(imported.id,'TENANT-A'));assert.equal(DurableStore.getAgent(imported.id,'TENANT-B'),null);checks++;
  const cross=await nativeFetch(`${base}/api/v1/agents/${imported.id}`,{headers:{'X-API-Key':'dev-key-tenant-b'}});
  assert.ok([403,404].includes(cross.status));checks++;
  const promoted=await nativeFetch(`${base}/api/v1/agents/${imported.id}`,{method:'PATCH',headers:{'X-API-Key':'dev-key-tenant-a','Content-Type':'application/json'},body:JSON.stringify({status:'GOVERNED'})});
  assert.equal(promoted.status,409);checks++;
  const health=await nativeFetch(`${base}/health`);assert.match(health.headers.get('content-type')||'',/json/);assert.equal((await health.json()).status,'operational');checks++;
}finally{globalThis.fetch=nativeFetch;await new Promise<void>(resolve=>server.close(()=>resolve()));RuntimeManager.reset();}
console.log(`Blocker remediation: ${checks} checks PASS`);
