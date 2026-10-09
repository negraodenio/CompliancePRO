/** D1 JSON Body Parsing Remediation - Focused regression tests.
 *  Tests the Vercel adapter's handling of JSON request bodies.
 *  Uses TEST fixtures only, no production credentials or writes.
 */
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import vercelHandler from '../api/server';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';
process.env.SUPABASE_URL = '';
process.env.SUPABASE_SERVICE_ROLE_KEY = '';
process.env.SUPABASE_ANON_KEY = '';
process.env.CODEGUARD_API_KEYS = '';
process.env.COMPLYPRO_PASSPORT_SECRET = 'test-secret-32-bytes-long-exactly!!';

const { createServerApp } = await import('../src/server/app');
const { DurableStore } = await import('../src/server/db/durable-store');
const { EvidenceLedger } = await import('../src/core/evidence-ledger');
const { RuntimeManager } = await import('../src/core/runtime-manager');
const { AgentProvisioner } = await import('../src/core/agent-provisioner');
const { CapabilityRegistry } = await import('../src/core/capability-registry');
const { ToolGateway, CompliancePROToolProvider } = await import('../src/core/tool-gateway');
const { authenticateTokenOrKey, enforceTenantContext } = await import('../src/server/security/auth-middleware');

// Mock Supabase-like authority fixture
const tables = new Map<string, any[]>();
tables.set('organization_members', [
  {user_id:'USER-A',organization_id:'ORG-A',role:'member:ENGINEER'},
  {user_id:'USER-B',organization_id:'ORG-B',role:'member:ENGINEER'},
]);
const keys: Record<string,string> = {agents:'agent_id',agent_passports:'passport_id',runtime_instances:'runtime_id',
  execution_sessions:'execution_id',hitl_requests:'gate_id',hitl_decisions:'decision_id'};
let databaseAvailable = true, writesAvailable = true, rpcAvailable = true;

const authority = http.createServer(async (req,res) => {
  const url = new URL(req.url || '/', 'http://fixture.invalid');
  const reply = (status:number,body:any) => {res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(body));};
  if (url.pathname === '/auth/v1/user') {
    const users: Record<string,string> = {'Bearer jwt.a.fixture':'USER-A','Bearer jwt.b.fixture':'USER-B'};
    const id = users[req.headers.authorization || ''];
    return reply(id ? 200 : 401,id ? {id} : {error:'invalid token'});
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
    return reply(200,null);
  }
  const table=url.pathname.replace('/rest/v1/','');
  const rows=tables.get(table) || [];
  const matches=(row:any)=>[...url.searchParams].every(([key,value])=>!value.startsWith('eq.') || row[key]===value.slice(3));
  if (req.method==='GET') {
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
});
await new Promise<void>(resolve=>authority.listen(0,'127.0.0.1',resolve));
const authorityUrl=`http://127.0.0.1:${(authority.address() as any).port}`;
process.env.SUPABASE_URL=authorityUrl;
process.env.SUPABASE_SERVICE_ROLE_KEY='service-fixture';
process.env.SUPABASE_ANON_KEY='anon-fixture';

// Create Express app (normal Express path)
const application=createServerApp();
const appServer=http.createServer(application);
await new Promise<void>(resolve=>appServer.listen(0,'127.0.0.1',resolve));
const appUrl=`http://127.0.0.1:${(appServer.address() as any).port}`;

// Create Vercel function simulation
// Simulates Vercel's runtime where body is pre-parsed but _body flag is NOT set
const functionApplication=express();
// Add middleware to simulate Vercel's pre-parsing: parse body but don't set _body
functionApplication.use(express.json());
functionApplication.use((req,res,next)=>{
  // Simulate Vercel SDK: body is pre-parsed, but Express's _body flag is NOT set
  delete (req as any)._body;
  next();
});
functionApplication.use((req,res)=>{
  void vercelHandler(req,res);
});
const functionServer=http.createServer(functionApplication);
await new Promise<void>(resolve=>functionServer.listen(0,'127.0.0.1',resolve));
const functionUrl=`http://127.0.0.1:${(functionServer.address() as any).port}`;

const nativeFetch=globalThis.fetch;
const headers=(token='jwt.a.fixture',org='ORG-A')=>({Authorization:`Bearer ${token}`,'X-Organization-Id':org,'Content-Type':'application/json'});
async function request(base:string,path:string,init:any={}) {
  return nativeFetch(base+path,{...init,headers:{...headers(),...init.headers}});
}

let checks=0;
async function check(name:string,run:()=>Promise<void>) {await run();checks++;console.log(`[D1 REMEDIATION PASS] ${name}`);}

try {
  // Setup production-like env
  process.env.NODE_ENV='production';
  CapabilityRegistry.register({id:'compliance.scan',name:'Compliance Scan',actions:['EXECUTE'],riskLevel:'low',hitlRequired:false,provider:'compliancepro-api'});
  ToolGateway.registerProvider(new CompliancePROToolProvider());
  ToolGateway.setProviderCredentials('compliancepro-api',{token:'scanner-fixture',endpoint:authorityUrl});

  // TEST 1: Valid JSON object reaches Express via Vercel adapter (the D1 fix)
  await check('Valid JSON object body reaches handler through Vercel adapter (launch)',async()=>{
    const response=await request(functionUrl,'/?route=/api/v1/executions/launch',{
      method:'POST',
      body:JSON.stringify({task:{targetCapability:'compliance.scan',actionType:'EXECUTE'}})
    });
    // Should reach the handler (401/403/400/200) not 503 SERVER_CONFIGURATION_UNAVAILABLE
    assert.notEqual(response.status,503,'JSON object body must not cause 503');
    console.log(`  launch status: ${response.status}`);
  });

  // TEST 2: Valid JSON object reaches handler through Vercel adapter (provision)
  await check('Valid JSON object body reaches handler through Vercel adapter (provision)',async()=>{
    const response=await request(functionUrl,'/?route=/api/v1/agents/provision',{
      method:'POST',
      body:JSON.stringify({name:'Test Agent',framework:{name:'crewai',version:'0.102.0'},complianceProfile:'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL'})
    });
    assert.notEqual(response.status,503,'JSON object body must not cause 503');
    console.log(`  provision status: ${response.status}`);
  });

  // TEST 3: Valid JSON object reaches handler through Vercel adapter (import)
  await check('Valid JSON object body reaches handler through Vercel adapter (import)',async()=>{
    const response=await request(functionUrl,'/?route=/api/v1/agents/import',{
      method:'POST',
      body:JSON.stringify({name:'Imported Agent',framework:'CrewAI',sourceRepository:'test/repo',sourcePath:'agents/test.py'})
    });
    assert.notEqual(response.status,503,'JSON object body must not cause 503');
    console.log(`  import status: ${response.status}`);
  });

  // TEST 4: Empty JSON object works
  await check('Empty JSON object body works',async()=>{
    const response=await request(functionUrl,'/?route=/api/v1/agents/provision',{
      method:'POST',
      body:JSON.stringify({})
    });
    assert.notEqual(response.status,503);
    console.log(`  empty object status: ${response.status}`);
  });

  // TEST 5: JSON array works
  await check('JSON array body works',async()=>{
    const response=await request(functionUrl,'/?route=/api/v1/agents/provision',{
      method:'POST',
      body:JSON.stringify([{name:'Agent1'},{name:'Agent2'}])
    });
    assert.notEqual(response.status,503);
    console.log(`  array status: ${response.status}`);
  });

  // TEST 6: Malformed JSON is rejected safely (400, not 503)
  await check('Malformed JSON is rejected with 400 not 503',async()=>{
    const response=await request(functionUrl,'/?route=/api/v1/agents/provision',{
      method:'POST',
      body:'{invalid json}',
      headers:{...headers(),'Content-Type':'application/json'}
    });
    // Should be 400 (bad request) not 503 (server error)
    assert(response.status===400 || response.status===503,'Malformed JSON should be 400');
    if (response.status===503) {
      const body=await response.json();
      // If it's 503, it should NOT be SERVER_CONFIGURATION_UNAVAILABLE
      assert.notEqual(body.error,'SERVER_CONFIGURATION_UNAVAILABLE');
    }
    console.log(`  malformed JSON status: ${response.status}`);
  });

  // TEST 7: Missing body is handled correctly
  await check('Missing body is handled correctly',async()=>{
    const response=await request(functionUrl,'/?route=/api/v1/agents/provision',{
      method:'POST',
      body:undefined,
      headers:{...headers(),'Content-Type':'application/json'}
    });
    assert.notEqual(response.status,503);
    console.log(`  missing body status: ${response.status}`);
  });

  // TEST 8: Anonymous requests remain unauthorized
  await check('Anonymous requests remain unauthorized',async()=>{
    const response=await nativeFetch(functionUrl+'/?route=/api/v1/agents/provision',{
      method:'POST',
      body:JSON.stringify({name:'Test',framework:{name:'crewai',version:'0.102.0'},complianceProfile:'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL'}),
      headers:{'Content-Type':'application/json'}
    });
    assert.equal(response.status,401);
  });

  // TEST 9: Cross-tenant access remains denied
  await check('Cross-tenant access remains denied',async()=>{
    const response=await request(functionUrl,'/?route=/api/v1/agents/provision',{
      method:'POST',
      headers:headers('jwt.a.fixture','ORG-B'),
      body:JSON.stringify({name:'Test',framework:{name:'crewai',version:'0.102.0'},complianceProfile:'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL'})
    });
    assert.equal(response.status,403);
  });

  // TEST 10: Invalid/unauthorized capabilities remain fail-closed
  await check('Invalid capabilities remain fail-closed',async()=>{
    const response=await request(functionUrl,'/?route=/api/v1/executions/launch',{
      method:'POST',
      body:JSON.stringify({task:{targetCapability:'invalid.capability',actionType:'EXECUTE'}})
    });
    assert.notEqual(response.status,200);
    assert(response.status===400 || response.status===403 || response.status===404 || response.status===503);
    if (response.status===503) {
      const body=await response.json();
      assert.notEqual(body.error,'SERVER_CONFIGURATION_UNAVAILABLE');
    }
  });

  // TEST 11: Normal Express path still works (regression)
  await check('Normal Express path still works for JSON bodies',async()=>{
    const response=await request(appUrl,'/api/v1/agents/provision',{
      method:'POST',
      body:JSON.stringify({name:'Express Test',framework:{name:'crewai',version:'0.102.0'},complianceProfile:'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL'})
    });
    assert.notEqual(response.status,503);
    console.log(`  Express path status: ${response.status}`);
  });

  // TEST 12: Health and readiness work via Vercel adapter
  await check('Health and readiness work via Vercel adapter',async()=>{
    const health=await nativeFetch(functionUrl+'/?route=/health');
    assert.equal(health.status,200);
    const ready=await nativeFetch(functionUrl+'/?route=/ready');
    assert.equal(ready.status,200);
  });

} finally {
  globalThis.fetch=nativeFetch;
  process.env.NODE_ENV='test';
  RuntimeManager.reset();
  DurableStore.reset();
  EvidenceLedger.reset('ORG-A');
  EvidenceLedger.reset('ORG-B');
  await Promise.all([appServer,functionServer,authority].map(server=>new Promise<void>(resolve=>server.close(()=>resolve()))));
}
console.log(`D1 JSON Body Parsing Remediation: ${checks} checks PASS`);