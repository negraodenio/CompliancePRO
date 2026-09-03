import { runLocalScan } from '../src/web/services/scanner-bridge';
import { DEMO_PROJECTS } from '../src/web/services/demo-projects';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log("==================================================================");
  console.log(">>> 4-REPOSITORY CAPABILITY DISCOVERY & COMPARATIVE AUDIT <<<");
  console.log("==================================================================\n");

  // 1. CompliancePRO (Local workspace)
  const localFileMap = new Map<string, string>();
  const scanExtensions = ['.ts', '.tsx', '.py', '.json', '.yaml', '.yml', '.sql'];
  
  function walkDir(dir: string, baseDir: string) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      if (entry.isDirectory()) {
        if (!['node_modules', 'dist', '.git', 'coverage', '__pycache__'].includes(entry.name)) {
          walkDir(fullPath, baseDir);
        }
      } else if (entry.isFile()) {
        if (scanExtensions.some(ext => entry.name.endsWith(ext))) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            localFileMap.set(relPath, content);
          } catch {}
        }
      }
    }
  }

  const rootDir = process.cwd();
  walkDir(path.join(rootDir, 'src'), rootDir);
  walkDir(path.join(rootDir, 'course'), rootDir);

  const resCompliancePro = await runLocalScan(localFileMap, { repoName: 'negradenio/CompliancePRO' });

  // 2. FinTech Credit CrewAI
  const fintechDemo = DEMO_PROJECTS.find(d => d.id === 'crewai-finance') || DEMO_PROJECTS[0];
  const fintechFileMap = new Map(Object.entries(fintechDemo.files));
  const resFintech = await runLocalScan(fintechFileMap, { repoName: fintechDemo.name });

  // 3. langchain-ai/langgraph sample
  const langgraphFileMap = new Map<string, string>([
    ['langgraph/graph.py', `
from langgraph.graph import StateGraph, END
from langchain_core.tools import tool

@tool("web_search_engine")
def search_web(query: str):
    \"\"\"Search web\"\"\"
    return "Search results"

@tool("database_extractor")
def query_database(sql: str):
    \"\"\"Run query\"\"\"
    return "DB rows"

workflow = StateGraph(dict)
workflow.add_node("agent", lambda state: state)
workflow.set_entry_point("agent")
app = workflow.compile()
`]
  ]);
  const resLangGraph = await runLocalScan(langgraphFileMap, { repoName: 'langchain-ai/langgraph' });

  // 4. thomascherickal/ai-agents-examples (Multi-Framework)
  const thomasFileMap = new Map<string, string>([
    ['07_openai_scheduling_assistant.py', `
import os
from openai import OpenAI
client = OpenAI()
assistant = client.beta.assistants.create(
    name="MeetingScheduler",
    model="gpt-4-turbo-preview",
    tools=[
        {
            "type": "function",
            "function": {
                "name": "check_calendar_availability",
                "description": "Check calendar for available time slots",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "date": {"type": "string"},
                        "duration_minutes": {"type": "integer"}
                    },
                    "required": ["date", "duration_minutes"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "send_calendar_invite",
                "description": "Send calendar invitation",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "attendee_emails": {"type": "array"},
                        "meeting_title": {"type": "string"}
                    },
                    "required": ["attendee_emails", "meeting_title"]
                }
            }
        }
    ]
)
`],
    ['02_autogpt_researcher.py', `
from auto_gpt_agent import AutoGPT
from auto_gpt_tools import SearchTool, FileTool, AnalysisTool
agent = AutoGPT(name="MarketResearchAgent", tools=[SearchTool(), FileTool(directory="./output"), AnalysisTool()])
`],
    ['05_llamaindex_hr_assistant.py', `
from llama_index.tools import QueryEngineTool
from llama_index.agent import OpenAIAgent
hr_tool = QueryEngineTool(name="hr_knowledge_base")
agent = OpenAIAgent.from_tools([hr_tool])
`],
    ['06_phidata_financial_assistant.py', `
from phidata.tools import FunctionTool
tools = [
    FunctionTool.from_function(get_stock_info),
    FunctionTool.from_function(compare_stocks),
    FunctionTool.from_function(generate_analysis_report)
]
`]
  ]);
  const resThomas = await runLocalScan(thomasFileMap, { repoName: 'thomascherickal/ai-agents-examples' });

  const repos = [
    { name: 'CompliancePRO (Local Core)', res: resCompliancePro },
    { name: 'FinTech Credit CrewAI (Demo)', res: resFintech },
    { name: 'langchain-ai/langgraph (Graph Agent)', res: resLangGraph },
    { name: 'thomascherickal/ai-agents-examples (Multi-Framework)', res: resThomas }
  ];

  for (const r of repos) {
    const s = r.res;
    const caps = s.agentCapabilities || [];
    const idents = s.agentIdentities || [];
    const highRisks = (s.violations || []).filter((v: any) => v.severity === 'critical' || v.severity === 'high');
    const totalUnknown = s.capabilitiesSummary?.unknownAuthorizationCount ?? caps.filter(c => c.state === 'UNKNOWN_AUTHORIZATION' || !c.authorizationEvidence).length;

    console.log(`\n------------------------------------------------------------------`);
    console.log(`REPOSITORY: ${r.name}`);
    console.log(`------------------------------------------------------------------`);
    console.log(`- Total Agents:            ${s.source?.agents?.length || 0}`);
    console.log(`- Total Models:            ${s.source?.aiModels?.length || 0}`);
    console.log(`- Total Capabilities:      ${caps.length}`);
    console.log(`- Unverified Auth (KPI):   ${totalUnknown}`);
    console.log(`- High-Priority Findings:  ${highRisks.length}`);
    console.log(`- Identities Detected:     ${idents.length}`);
    console.log(`- Total Anomalies:         ${s.capabilitiesSummary?.anomaliesCount || 0}`);
    console.log(`- Capabilities Discovered:`);
    caps.slice(0, 10).forEach((c, idx) => {
      console.log(`    ${idx+1}. [${c.systemType}] ${c.resourceTarget} (${c.action}) -> ${c.state}`);
    });
    if (caps.length > 10) console.log(`    ... and ${caps.length - 10} more`);
  }

  console.log("\n==================================================================");
  console.log("🟢 4-REPOSITORY AUDIT COMPLETED SUCCESSFULLY!");
  console.log("==================================================================\n");
}

main().catch(console.error);
