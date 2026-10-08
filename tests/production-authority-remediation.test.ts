/** Production contracts against a local HTTP authority fixture, never a live database.
 * Exercises the existing PostgREST/RPC transport, Supabase auth, Express and gateways.
 * This is not a claim that SQL migrations or a deployment have been validated.
 */
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import express from 'express';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';
process.env.SUPABASE_URL = '';
process.env.SUPABASE_SERVICE_ROLE_KEY = '';
process.env.SUPABASE_ANON_KEY = '';
process.env.CODEGUARD_API_KEYS = '';
process.env.COMPLYPRO_PASSPORT_SECRET = crypto.randomBytes(32).toString('hex');

const { DurableStore } = await import('../src/server/db/durable-store');
const { EvidenceLedger, calculateEventHash, GENESIS_PREVIOUS_HASH } = await import('../src/core/evidence-ledger');
const { AgentProvisioner } = await import('../src/core/agent-provisioner');
const { RuntimeManager } = await import('../src/core/runtime-manager');
const { ModelGateway } = await import('../src/core/model-gateway');
const { ToolGateway, CompliancePROToolProvider } = await import('../src/core/tool-gateway');
const { DataGateway } = await import('../src/core/data-gateway');
const { CapabilityRegistry } = await import('../src/core/capability-registry');
const { ApiKeyRegistry } = await import('../src/server/security/auth-middleware');
const { createServerApp } = await import('../src/server/app');
const { AgentInventoryStore } = await import('../src/web/services/agent-inventory-store');
const { PersistenceAdapter } = await import('../src/web/services/persistence-adapter');
const { installGovernanceFetch } = await import('../src/web/services/governance-fetch');
const { default: vercelHandler } = await import('../api/server');

const tables = new Map<string, any[]>();
tables.set('organization_members',[
  {user_id:'USER-A',organization_id:'ORG-A',role:'member:ENGINEER'},
  {user_id:'USER-B',organization_id:'ORG-B',role:'member:ENGINEER'},
  {user_id:'USER-VIEW',organization_id:'ORG-A',role:'member:VIEWER'}
]);
const keys: Record<string,string> = {agents:'agent_id',agent_passports:'passport_id',runtime_instances:'runtime_id',
  execution_sessions:'execution_id',hitl_requests:'gate_id',hitl_decisions:'decision_id'};
let databaseAvailable = true, writesAvailable = true, rpcAvailable = true;
let modelCalls = 0, toolCalls = 0, userChecks = 0, evidenceReads = 0;
let capturedForeignHeaders: http.IncomingHttpHeaders = {};

const authority = http.createServer(async (req,res) => {
  try {
    const url = new URL(req.url || '/', 'http://fixture.invalid');
    const reply = (status:number,body:any) => {res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(body));};
    if (url.pathname === '/auth/v1/user') {
      userChecks++;
      const users: Record<string,string> = {'Bearer jwt.a.fixture':'USER-A','Bearer jwt.b.fixture':'USER-B','Bearer jwt.view.fixture':'USER-VIEW'};
      const id = users[req.headers.authorization || ''];
      return reply(id ? 200 : 401,id ? {id} : {error:'invalid token'});
    }
    if (url.pathname === '/v1/chat/completions') {
      assert.equal(req.headers.authorization,'Bearer model-fixture-credential');
      modelCalls++;
      return reply(200,{choices:[{message:{content:'HTTP_MODEL_CONFIRMED'}}],usage:{prompt_tokens:2,completion_tokens:3,total_tokens:5}});
    }
    if (url.pathname === '/api/v1/scans/run') {
      assert.equal(req.headers.authorization,'Bearer scanner-fixture-credential');
      toolCalls++;
      return reply(200,{scanId:'HTTP_SCAN_CONFIRMED',status:'COMPLETED'});
    }
    if (url.pathname === '/api/v1/capabilities') {
      capturedForeignHeaders=req.headers;
      return reply(200,{fixture:true});
    }
    if (!databaseAvailable) return reply(503,{error:'fixture database unavailable'});
    assert.equal(req.headers.apikey,'service-fixture');
    if (url.pathname === '/rest/v1/') return reply(200,{paths:rpcAvailable ? {'/rpc/append_runtime_evidence':{}} : {}});
    let body: any = {};
    if (req.method !== 'GET') {
      const chunks: Buffer[]=[];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      body=JSON.parse(Buffer.concat(chunks).toString() || '{}');
      if (!writesAvailable) return reply(503,{error:'fixture write unavailable'});
    }
    if (url.pathname === '/rest/v1/rpc/append_runtime_evidence') {
      if (!rpcAvailable) return reply(404,{error:'rpc unavailable'});
      const tenant=body.p_tenant_id,entry=body.p_entry;
      const rows=tables.get('audit_ledger_blocks') || [];
      const chain=rows.filter(row=>row.tenant_id===tenant && row.workspace_id==='WS-RUNTIME');
      const prior=chain.find(row=>row.block_id===entry.evidenceId);
      if (prior) return reply(JSON.stringify(prior.payload_data)===JSON.stringify(entry) ? 200 : 409,{});
      const head=chain[chain.length-1];
      if (entry.sequence!==chain.length+1 || entry.previousHash!==(head?.block_hash || GENESIS_PREVIOUS_HASH)) return reply(409,{error:'chain conflict'});
      rows.push({block_id:entry.evidenceId,tenant_id:tenant,workspace_id:'WS-RUNTIME',block_height:entry.sequence,
        block_hash:entry.eventHash,previous_hash:entry.previousHash,payload_data:structuredClone(entry)});
      tables.set('audit_ledger_blocks',rows);
      return reply(200,null);
    }
    const table=url.pathname.replace('/rest/v1/','');
    const rows=tables.get(table) || [];
    const matches=(row:any)=>[...url.searchParams].every(([key,value])=>!value.startsWith('eq.') || row[key]===value.slice(3));
    if (req.method==='GET') {
      if (table==='audit_ledger_blocks') evidenceReads++;
      const offset=Number(url.searchParams.get('offset') || 0),limit=Number(url.searchParams.get('limit') || 1000);
      return reply(200,rows.filter(matches).slice(offset,offset+limit));
    }
    if (req.method==='POST') {
      const key=keys[table];assert.ok(key,`Unexpected table ${table}`);
      const index=rows.findIndex(row=>row[key]===body[key]);
      const stored=structuredClone(index>=0 ? {...rows[index],...body} : body);
      if(index>=0) rows[index]=stored; else rows.push(stored);
      tables.set(table,rows);
      return reply(201,[stored]);
    }
    if (req.method==='PATCH') {
      const updated=rows.filter(matches);
      updated.forEach(row=>Object.assign(row,structuredClone(body)));
      return reply(200,updated);
    }
    return reply(404,{error:'unknown fixture route'});
  } catch (error:any) {res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:error.message}));}
});
await new Promise<void>(resolve=>authority.listen(0,'127.0.0.1',resolve));
const authorityUrl=`http://127.0.0.1:${(authority.address() as any).port}`;
process.env.SUPABASE_URL=authorityUrl;
process.env.SUPABASE_SERVICE_ROLE_KEY='service-fixture';
process.env.SUPABASE_ANON_KEY='anon-fixture';
process.env.NODE_ENV='production';
ApiKeyRegistry.clear();

const application=createServerApp();
let capturedGovernedHeaders:http.IncomingHttpHeaders={};
const appServer=http.createServer((req,res)=>{
  if(req.url?.startsWith('/api/v1/capabilities')) capturedGovernedHeaders=req.headers;
  application(req,res);
});
await new Promise<void>(resolve=>appServer.listen(0,'127.0.0.1',resolve));
const appUrl=`http://127.0.0.1:${(appServer.address() as any).port}`;
const functionApplication=express();
functionApplication.use(express.json());
functionApplication.use((req,res)=>{
  // Simulate the SDK's pre-parsed body without Express's internal parser flag.
  delete (req as any)._body;
  void vercelHandler(req,res);
});
const functionServer=http.createServer(functionApplication);
await new Promise<void>(resolve=>functionServer.listen(0,'127.0.0.1',resolve));
const functionUrl=`http://127.0.0.1:${(functionServer.address() as any).port}`;

const nativeFetch=globalThis.fetch;
const originalWindow=(globalThis as any).window,originalStorage=(globalThis as any).localStorage;
const storage=new Map<string,string>([['cgag_auth_token','jwt.a.fixture'],['cgag_active_org_id','ORG-A']]);
(globalThis as any).localStorage={getItem:(key:string)=>storage.get(key)||null,setItem:(key:string,value:string)=>storage.set(key,value)};
(globalThis as any).window={location:{origin:appUrl},fetch:(input:any,init?:any)=>nativeFetch(
  input instanceof Request ? input : new URL(String(input),appUrl),init)};
installGovernanceFetch();
globalThis.fetch=(globalThis as any).window.fetch;
PersistenceAdapter.setContext({tenantId:'ORG-A',workspaceId:'default',environment:'production'});
let checks=0;
async function check(name:string,run:()=>Promise<void>) {await run();checks++;console.log(`[PRODUCTION CONTRACT PASS] ${name}`);}
const headers=(token='jwt.a.fixture',org='ORG-A')=>({Authorization:`Bearer ${token}`,'X-Organization-Id':org,'Content-Type':'application/json'});
async function request(path:string,init:any={}) {return nativeFetch(appUrl+path,{...init,headers:{...headers(),...init.headers}});}

try {
  await check('Anonymous and production fixture keys are rejected',async()=>{
    assert.equal((await nativeFetch(appUrl+'/api/v1/agents')).status,401);
    assert.equal((await nativeFetch(appUrl+'/api/v1/agents',{headers:{'X-API-Key':'dev-key-tenant-a'}})).status,401);
  });
  await check('Native JWT identity and actual membership drive inventory reads',async()=>{
    const response=await fetch('/api/v1/agents');assert.equal(response.status,200);
    assert.deepEqual((await response.json()).agents,[]);assert.ok(userChecks>0);
  });
  await check('Invalid JWT, foreign organization and body tenant spoofing are denied',async()=>{
    assert.equal((await request('/api/v1/agents',{headers:headers('jwt.invalid.fixture')})).status,401);
    assert.equal((await request('/api/v1/agents',{headers:headers('jwt.a.fixture','ORG-B')})).status,403);
    const spoof=await request('/api/v1/agents/import',{method:'POST',body:JSON.stringify({name:'spoof',framework:'CrewAI',tenantId:'ORG-B'})});
    assert.equal(spoof.status,403);assert.equal(tables.get('agents')?.length || 0,0);
  });
  await check('Read-only membership cannot import',async()=>{
    const response=await request('/api/v1/agents/import',{method:'POST',headers:headers('jwt.view.fixture'),body:JSON.stringify({name:'denied',framework:'CrewAI'})});
    assert.equal(response.status,403);
  });
  const scan:any={repo:{fullName:'fixture/discovery'},source:{agents:[{name:'Observed Agent',framework:'CrewAI',filePath:'agents/analyst.py',
    businessPurpose:'Declared analysis',tools:['observed.tool'],riskLevel:'high'}],aiModels:[{modelId:'gpt-4o'}]},
    owner:{label:'João Oficial',role:'Engineer',teams:['Risk']},violations:[{id:'observed-finding'}]};
  let imported:any;
  await check('Discover import commits through PostgREST before authoritative confirmation',async()=>{
    [imported]=await AgentInventoryStore.importFromScanResult(scan);
    const row=tables.get('agents')?.find(row=>row.agent_id===imported.id);
    assert.ok(row);assert.equal(row.tenant_id,'ORG-A');assert.equal(row.status,'IMPORTED');
    assert.equal(row.metadata.discovery.sourcePath,'agents/analyst.py');assert.equal(imported.owner.name,'João Oficial');
    assert.equal(imported.governance.passportStatus,'NOT_ISSUED');assert.equal(imported.governance.guardianStatus,'MONITOR_ONLY');
    assert.equal(tables.get('agent_passports')?.length || 0,0);
  });
  await check('Single/repeated scan imports retain identity without duplicate or governance promotion',async()=>{
    const [replay]=await AgentInventoryStore.importFromScanResult(scan);
    assert.equal(replay.id,imported.id);assert.equal(replay.status,'IMPORTED');assert.equal(tables.get('agents')?.length,1);
  });
  await check('Imported owner edits, detail and metrics share durable state',async()=>{
    await AgentInventoryStore.updateAgent(imported.id,{owner:{name:'Owner Verified Input',role:'Lead',department:'Risk'}});
    assert.equal(tables.get('agents')?.[0].metadata.discovery.owner.name,'Owner Verified Input');
    const detail=await request(`/api/v1/agents/${imported.id}`);assert.equal(detail.status,200);
    assert.equal((await detail.json()).owner.name,'Owner Verified Input');
    const metrics=await request('/api/v1/agents/metrics');const data=await metrics.json();
    assert.equal(data.totalAgents,1);assert.equal(data.governedAgents,0);assert.equal(data.needAttentionAgents,1);assert.equal(data.highRiskAgents,1);
  });
  await check('Foreign tenant cannot read imported identity or promote status',async()=>{
    const foreign=await request(`/api/v1/agents/${imported.id}`,{headers:headers('jwt.b.fixture','ORG-B')});
    assert.ok([403,404].includes(foreign.status));
    const promoted=await request(`/api/v1/agents/${imported.id}`,{method:'PATCH',body:JSON.stringify({status:'GOVERNED'})});
    assert.equal(promoted.status,409);assert.equal(tables.get('agents')?.[0].status,'IMPORTED');
  });
  await check('Cache resets restore imports and owners from authority',async()=>{
    DurableStore.reset();AgentProvisioner.reset();EvidenceLedger.reset('ORG-A');
    const response=await request('/api/v1/agents');const data=await response.json();
    assert.equal(data.agents[0].agentId,imported.id);assert.equal(data.agents[0].owner.name,'Owner Verified Input');
  });
  await check('A failed database write cannot confirm import or add a cached record',async()=>{
    writesAvailable=false;
    await assert.rejects(AgentInventoryStore.addAgent({name:'Failed Import',framework:'CrewAI'}),/HTTP 503/);
    writesAvailable=true;
    assert.equal(tables.get('agents')?.length,1);assert.equal(DurableStore.listAgents('ORG-A').length,1);
  });
  await check('An unavailable inventory read yields JSON 503 and clears stale frontend data',async()=>{
    databaseAvailable=false;
    await assert.rejects(AgentInventoryStore.fetchFromBackend(),/HTTP 503/);
    assert.equal(AgentInventoryStore.getAgents().length,0);
    databaseAvailable=true;
    await AgentInventoryStore.fetchFromBackend();
  });
  await check('Late responses cannot bleed inventory into a switched organization',async()=>{
    const browserFetch=globalThis.fetch;
    let release!:(response:Response)=>void;
    globalThis.fetch=((input:any,init?:any)=>String(input)==='/api/v1/agents'
      ? new Promise<Response>(resolve=>{release=resolve;}) : browserFetch(input,init)) as any;
    const pending=AgentInventoryStore.fetchFromBackend();
    storage.set('cgag_active_org_id','ORG-B');storage.set('cgag_auth_token','jwt.b.fixture');
    PersistenceAdapter.setContext({tenantId:'ORG-B'});assert.equal(AgentInventoryStore.getAgents().length,0);
    release(new Response(JSON.stringify({agents:[{agentId:'foreign-late',name:'Must not display'}]})));
    assert.deepEqual(await pending,[]);assert.equal(AgentInventoryStore.getAgents().length,0);
    globalThis.fetch=browserFetch;
    storage.set('cgag_active_org_id','ORG-A');storage.set('cgag_auth_token','jwt.a.fixture');
    PersistenceAdapter.setContext({tenantId:'ORG-A'});await AgentInventoryStore.fetchFromBackend();
  });
  await check('Governance transport preserves Request/init headers and never leaks auth to foreign origins',async()=>{
    const response=await fetch(new Request(appUrl+'/api/v1/capabilities',{headers:{'X-Request-Marker':'request'}}),{headers:{'X-Init-Marker':'init'}});
    assert.equal(response.status,200);
    assert.equal(capturedGovernedHeaders['x-request-marker'],'request');assert.equal(capturedGovernedHeaders['x-init-marker'],'init');
    await fetch(authorityUrl+'/api/v1/capabilities');assert.equal(capturedForeignHeaders.authorization,undefined);
    assert.equal(capturedForeignHeaders['x-organization-id'],undefined);
  });
  await check('Health and readiness are JSON via Express and the Vercel adapter',async()=>{
    for (const base of [appUrl,functionUrl]) {
      const suffix=base===functionUrl ? '/?route=' : '';
      const health=await nativeFetch(base+suffix+'/health');assert.equal(health.status,200);assert.match(health.headers.get('content-type') || '',/json/);
      assert.equal((await health.json()).status,'operational');
      const ready=await nativeFetch(base+suffix+'/ready');assert.equal(ready.status,200);assert.equal((await ready.json()).scope,'control-plane');
    }
    const denied=await nativeFetch(functionUrl+'/?route=/api/v1/agents');assert.equal(denied.status,401);assert.match(denied.headers.get('content-type') || '',/json/);
    const unrelated=await nativeFetch(functionUrl+'/?route=/api/v1/scan');assert.equal(unrelated.status,404);
    const importedAgain=await nativeFetch(functionUrl+'/?route=/api/v1/agents/import',{method:'POST',headers:headers(),
      body:JSON.stringify({name:'Observed Agent',framework:'CrewAI',sourceRepository:'fixture/discovery',sourcePath:'agents/analyst.py'})});
    assert.equal(importedAgain.status,201);assert.equal((await importedAgain.json()).agentId,imported.id);
  });
  await check('Missing durable RPC or signing secret makes readiness 503 while health stays live',async()=>{
    rpcAvailable=false;assert.equal((await nativeFetch(appUrl+'/ready')).status,503);rpcAvailable=true;
    const secret=process.env.COMPLYPRO_PASSPORT_SECRET;process.env.COMPLYPRO_PASSPORT_SECRET='';
    const legacy=[process.env.CODEGUARD_PASSPORT_SECRET,process.env.COMPLIANCE_SERVER_SECRET];
    process.env.CODEGUARD_PASSPORT_SECRET='';process.env.COMPLIANCE_SERVER_SECRET='';
    assert.equal((await nativeFetch(functionUrl+'/?route=/ready')).status,503);
    assert.equal((await nativeFetch(functionUrl+'/?route=/health')).status,200);
    process.env.COMPLYPRO_PASSPORT_SECRET=secret;
    process.env.CODEGUARD_PASSPORT_SECRET=legacy[0] || '';process.env.COMPLIANCE_SERVER_SECRET=legacy[1] || '';
  });
  let governed:any;
  await check('Provisioning persists Passport/runtime/evidence before production response',async()=>{
    CapabilityRegistry.register({...CapabilityRegistry.get('customer.read')!,provider:'supabase-postgresql'});
    const response=await request('/api/v1/agents/provision',{method:'POST',body:JSON.stringify({name:'HTTP governed agent',framework:{name:'crewai',version:'0.102.0'},
      complianceProfile:'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',capabilities:['gpt-4o','compliance.scan','customer.read'],declaredDataScopes:['customers'],budget:{maxCostPerRunEur:1}})});
    assert.equal(response.status,201);governed=await response.json();
    assert.ok(tables.get('agent_passports')?.some(row=>row.passport_id===governed.passportId));
    assert.ok(tables.get('runtime_instances')?.some(row=>row.runtime_id===governed.runtimeId));
    assert.ok(tables.get('audit_ledger_blocks')?.some(row=>row.payload_data.agentId===governed.agentId));
    const detail=await request(`/api/v1/agents/${governed.agentId}`);assert.equal((await detail.json()).passportVerified,true);
    const started=await request('/api/v1/runtimes/start',{method:'POST',body:JSON.stringify({runtimeId:governed.runtimeId})});
    assert.equal(started.status,200);assert.equal(tables.get('runtime_instances')?.find(row=>row.runtime_id===governed.runtimeId)?.status,'RUNNING');
  });
  await check('Production default model transport performs one HTTP call and persists its receipt',async()=>{
    ModelGateway.setProviderCredentials('openai',{apiKey:'model-fixture-credential',endpoint:authorityUrl+'/v1'});ModelGateway.resetDispatcher();
    const result=await ModelGateway.invokeModel({agentId:governed.agentId,passportId:governed.passportId,runtimeId:governed.runtimeId,
      passport:governed.passport,tenantId:'ORG-A',executionId:'production-http-model',provider:'openai',model:'gpt-4o',messages:[{role:'user',content:'verify'}]});
    assert.equal(result.status,'COMPLETED');assert.equal(modelCalls,1);assert.equal(result.providerCallCount,1);assert.equal(result.responseMessage?.content,'HTTP_MODEL_CONFIRMED');
    assert.ok(tables.get('audit_ledger_blocks')?.some(row=>row.payload_data.executionId==='production-http-model' && row.payload_data.eventType==='MODEL_RESPONSE'));
  });
  await check('Production tool provider performs one authenticated HTTP call, without deterministic fallback',async()=>{
    ToolGateway.registerProvider(new CompliancePROToolProvider());
    ToolGateway.setProviderCredentials('compliancepro-api',{token:'scanner-fixture-credential',endpoint:authorityUrl});
    const result=await ToolGateway.invokeTool({agentId:governed.agentId,passportId:governed.passportId,runtimeId:governed.runtimeId,
      passport:governed.passport,tenantId:'ORG-A',executionId:'production-http-tool',capability:'compliance.scan',action:'EXECUTE',payload:{targetRepo:'fixture/repo'}});
    assert.equal(result.status,'COMPLETED');assert.equal(toolCalls,1);assert.equal(result.result.scanId,'HTTP_SCAN_CONFIRMED');
  });
  await check('Production DATA uses the real HTTP driver and cannot return another tenant row',async()=>{
    tables.set('customers',[{id:'own',organization_id:'ORG-A',full_name:'Own confidential name'},
      {id:'foreign',organization_id:'ORG-B',full_name:'Foreign confidential name'}]);
    DataGateway.setProviderCredentials('supabase-postgresql',{supabaseUrl:authorityUrl,serviceRoleKey:'service-fixture'});
    const result=await DataGateway.invokeData({agentId:governed.agentId,passportId:governed.passportId,runtimeId:governed.runtimeId,
      passport:governed.passport,tenantId:'ORG-A',executionId:'production-http-data',capability:'customer.read',action:'READ',targetResource:'customers'});
    assert.equal(result.status,'COMPLETED');assert.equal(result.providerCallCount,1);assert.equal(result.recordsCount,1);
    assert.equal(result.data?.[0].id,'own');assert.equal(result.data?.[0].full_name,'[REDACTED]');
    const denied=await DataGateway.invokeData({agentId:governed.agentId,passportId:governed.passportId,runtimeId:governed.runtimeId,
      passport:governed.passport,tenantId:'ORG-A',executionId:'undeclared-http-data',capability:'customer.read',action:'READ',targetResource:'organization_members'});
    assert.equal(denied.status,'BLOCKED');assert.equal(denied.providerCallCount,0);
  });
  await check('Current durable revocation overrides a stale, still-valid Passport in process memory',async()=>{
    const row=tables.get('runtime_instances')!.find(row=>row.runtime_id===governed.runtimeId);
    row.status='REVOKED';const before=toolCalls;
    const result=await ToolGateway.invokeTool({agentId:governed.agentId,passportId:governed.passportId,runtimeId:governed.runtimeId,
      passport:governed.passport,tenantId:'ORG-A',executionId:'stale-runtime',capability:'compliance.scan',action:'EXECUTE'});
    assert.equal(result.status,'BLOCKED');assert.equal(result.providerCallCount,0);assert.equal(toolCalls,before);row.status='RUNNING';
    const passport=tables.get('agent_passports')!.find(row=>row.passport_id===governed.passportId);
    passport.status='REVOKED';
    const denied=await ModelGateway.invokeModel({agentId:governed.agentId,passportId:governed.passportId,runtimeId:governed.runtimeId,
      passport:governed.passport,tenantId:'ORG-A',executionId:'stale-passport',provider:'openai',model:'gpt-4o',messages:[{role:'user',content:'deny'}]});
    assert.equal(denied.status,'BLOCKED');assert.equal(denied.providerCallCount,0);assert.equal(modelCalls,1);passport.status='GOVERNED';
  });
  await check('An independent process restores inventory and execution evidence over the existing DB transport',async()=>{
    const expected=EvidenceLedger.getEntries(undefined,'ORG-A').length;
    const script=`const {DurableStore}=await import('./src/server/db/durable-store.ts');
      const {EvidenceLedger}=await import('./src/core/evidence-ledger.ts');
      await DurableStore.hydrateTenantCache('ORG-A');await EvidenceLedger.prepareTenant('ORG-A');
      if(DurableStore.listAgents('ORG-A').length!==2 || EvidenceLedger.getEntries(undefined,'ORG-A').length!==${expected} || !EvidenceLedger.verifyChain('ORG-A').valid) process.exit(1);
      if(!EvidenceLedger.getEntries(undefined,'ORG-A').some(entry=>entry.executionId==='production-http-model' && entry.eventType==='MODEL_RESPONSE')) process.exit(2);
      console.log('Independent authority recovery PASS');`;
    const child=spawn(process.execPath,['--import','tsx','--input-type=module','-e',script],{cwd:process.cwd(),env:{...process.env,VERCEL:'1'}});
    let output='';child.stdout.on('data',data=>{output+=data;});child.stderr.on('data',data=>{output+=data;});
    const code=await new Promise<number|null>((resolve,reject)=>{
      const timer=setTimeout(()=>{child.kill();reject(new Error('Recovery child timed out'));},20000);
      child.on('error',error=>{clearTimeout(timer);reject(error);});child.on('exit',code=>{clearTimeout(timer);resolve(code);});
    });
    assert.equal(code,0,output);assert.match(output,/Independent authority recovery PASS/);
  });
  await check('Durable chain pagination restores more than one PostgREST page and detects tampering',async()=>{
    let previousHash=GENESIS_PREVIOUS_HASH;
    const rows=tables.get('audit_ledger_blocks') || [];
    for(let sequence=1;sequence<=1005;sequence++) {
      const draft={evidenceId:`page-${sequence}`,sequence,timestamp:'2026-10-06T00:00:00.000Z',eventType:'POLICY_EVALUATED' as const,
        agentId:'PAGINATION-FIXTURE',passportFingerprint:'fixture',complianceProfileId:'fixture',complianceProfileChecksum:'0'.repeat(64),previousHash};
      const entry={...draft,eventHash:calculateEventHash(draft)};previousHash=entry.eventHash;
      rows.push({block_id:entry.evidenceId,tenant_id:'ORG-PAGE',workspace_id:'WS-RUNTIME',block_height:sequence,block_hash:entry.eventHash,
        previous_hash:entry.previousHash,payload_data:entry});
    }
    tables.set('audit_ledger_blocks',rows);
    const before=evidenceReads;await Promise.all([EvidenceLedger.prepareTenant('ORG-PAGE'),EvidenceLedger.prepareTenant('ORG-PAGE')]);
    assert.equal(evidenceReads-before,2);assert.equal(EvidenceLedger.getEntries(undefined,'ORG-PAGE').length,1005);
    rows.find(row=>row.tenant_id==='ORG-PAGE')!.payload_data.agentId='TAMPERED';
    EvidenceLedger.reset('ORG-PAGE');await assert.rejects(EvidenceLedger.prepareTenant('ORG-PAGE'),/INTEGRITY_FAILED/);
  });
  await check('Persistence failure blocks provider dispatch and prevents a positive readiness claim',async()=>{
    writesAvailable=false;const before=toolCalls;
    await assert.rejects(ToolGateway.invokeTool({agentId:governed.agentId,passportId:governed.passportId,runtimeId:governed.runtimeId,
      passport:governed.passport,tenantId:'ORG-A',executionId:'must-not-execute',capability:'compliance.scan',action:'EXECUTE',payload:{targetRepo:'fixture/repo'}}),/DURABLE_EVIDENCE_WRITE_FAILED/);
    assert.equal(toolCalls,before);assert.equal((await nativeFetch(appUrl+'/ready')).status,503);
    assert.equal((await nativeFetch(appUrl+'/health')).status,200);
  });
} finally {
  globalThis.fetch=nativeFetch;(globalThis as any).window=originalWindow;(globalThis as any).localStorage=originalStorage;
  process.env.NODE_ENV='test';RuntimeManager.reset();
  await Promise.all([appServer,functionServer,authority].map(server=>new Promise<void>(resolve=>server.close(()=>resolve()))));
}
console.log(`Production authority remediation: ${checks} checks PASS (local transport fixture; no live DB writes)`);
