with open('../src/web/services/agent-sipoc-mapper.ts', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

target = """  // 3. REPRESENTATIVE AI ASSET SELECTION FOR PASSPORT PREVIEW
  // Priority: production -> infrastructure -> example -> benchmark -> test -> fixture -> unknown
  let selectedAgent: DetectedAgent | undefined;
  let selectedAgentScope: CapabilityScope = 'unknown';

  if (agents.length > 0) {
    const scoredAgents = agents.map(agent => {
      const scope = agent.filePath ? classifyScopeFromPath(agent.filePath) : classifyScopeFromPath(agent.name);
      return { agent, scope, rank: getScopeRank(scope) };
    });

    scoredAgents.sort((a, b) => a.rank - b.rank);
    selectedAgent = scoredAgents[0].agent;
    selectedAgentScope = scoredAgents[0].scope;
  }"""

replacement = """  // 3. REPRESENTATIVE AI ASSET SELECTION FOR PASSPORT PREVIEW
  // Priority: production -> infrastructure -> example -> benchmark -> test -> fixture -> unknown
  // Secondary: Core operational persona / backend service > UI widget / modal / detail view
  let selectedAgent: DetectedAgent | undefined;
  let selectedAgentScope: CapabilityScope = 'unknown';

  if (agents.length > 0) {
    const scoredAgents = agents.map(agent => {
      const scope = agent.filePath ? classifyScopeFromPath(agent.filePath) : classifyScopeFromPath(agent.name);
      let preferenceScore = 0;

      // Bonus for operational attributes
      if (agent.tools && agent.tools.length > 0) preferenceScore += 20;
      if (agent.models && agent.models.length > 0) preferenceScore += 10;
      if (agent.critical) preferenceScore += 15;

      const name = agent.name.toLowerCase();
      // Bonus for core/service/engine keywords
      if (/core|engine|orchestrat|service|worker|pipeline|remediat|underwrit|process|assistant|backend|agent/i.test(name)) {
        preferenceScore += 10;
      }

      // Penalty for pure UI screens, dialogs, widgets, buttons
      if (/detail|submit|button|modal|dialog|view|screen|window|form|css|style|widget|effect/i.test(name)) {
        preferenceScore -= 30;
      }

      return { agent, scope, rank: getScopeRank(scope), preferenceScore };
    });

    // Sort by primary scope rank, then by operational preference score
    scoredAgents.sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return b.preferenceScore - a.preferenceScore;
    });

    selectedAgent = scoredAgents[0].agent;
    selectedAgentScope = scoredAgents[0].scope;
  }"""

if target in text:
    text = text.replace(target, replacement)
    with open('../src/web/services/agent-sipoc-mapper.ts', 'w', encoding='utf-8') as f:
        f.write(text)
    print('Updated agent-sipoc-mapper.ts with conservative asset scoring')
else:
    print('Target not found in agent-sipoc-mapper.ts')
