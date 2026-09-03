import os

# ==============================================================================
# 1. REFINING CommercialLandingView.tsx
# ==============================================================================
with open('../src/web/views/CommercialLandingView.tsx', 'r', encoding='utf-8') as f:
    cl_text = f.read()

# 1.1 Update Hero Section
old_hero_text = """          {/* Main Headline */}
          <div className="max-w-4xl mx-auto space-y-3">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
              Discover What Your AI <br />
              <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                Can Actually Do.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
              Real static & capability code inspection extracting autonomous agents, LLM models, database queries, S3 buckets, tool permissions, and regulatory compliance exposure.
            </p>
          </div>"""

new_hero_text = """          {/* Main Headline */}
          <div className="max-w-4xl mx-auto space-y-4">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
              Discover What Your AI <br />
              <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                Can Actually Do.
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl font-semibold text-sky-300 max-w-2xl mx-auto tracking-wide">
              Static AI capability discovery for agents, LLM applications and AI-enabled systems.
            </p>

            <p className="text-sm sm:text-base text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
              Analyze your repository and discover agents, models, data access, tools, APIs, cloud resources and execution capabilities — extracting technical AI capabilities, authorization boundaries, security risks and governance/compliance exposure.
            </p>

            {/* Central Thesis Box */}
            <div className="pt-2 max-w-2xl mx-auto">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/60 via-indigo-950/40 to-slate-950/80 border border-sky-500/30 text-center space-y-1 backdrop-blur-sm">
                <p className="text-xs sm:text-sm text-slate-200 font-medium italic">
                  "Your code tells us what the AI can do. Your governance must prove what it is allowed to do."
                </p>
                <div className="font-mono text-xs font-bold text-sky-400 tracking-wider pt-0.5">
                  CODED CAPABILITY ≠ AUTHORIZED CAPABILITY
                </div>
              </div>
            </div>
          </div>"""

cl_text = cl_text.replace(old_hero_text, new_hero_text)

# 1.2 Hero CTAs
old_hero_ctas = """          {/* Dual CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={scrollToScanner}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-600 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white font-extrabold text-sm shadow-xl shadow-sky-500/25 flex items-center justify-center gap-2 transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-sky-200" />
              <span>TEST YOUR OWN REPO / CODE</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onEnterApp}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>ENTER GOVERNANCE OS</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>"""

new_hero_ctas = """          {/* Dual CTAs & Funnel Preview */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={scrollToScanner}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-600 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white font-extrabold text-sm shadow-xl shadow-sky-500/25 flex items-center justify-center gap-2 transition transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-sky-200" />
                <span>Run Free AI Capability Scan</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onEnterApp}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Enter Governance OS</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Discover what your AI code exposes before you deploy, govern or audit it.
            </p>
          </div>"""

cl_text = cl_text.replace(old_hero_ctas, new_hero_ctas)

# 1.3 Add 5-Step Governance Funnel Section right above the problem section
old_problem_section = """        {/* ========================================================================= */}
        {/* 3. THE AUTONOMOUS AI REALITY CRISIS (THE CORE MESSAGE) */}
        {/* ========================================================================= */}"""

funnel_and_problem = """        {/* ========================================================================= */}
        {/* 2.5 THE 5-STEP GOVERNANCE PROGRESSION FUNNEL */}
        {/* ========================================================================= */}
        <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-6">
            <div className="text-center space-y-1">
              <span className="text-xs font-mono font-bold tracking-widest text-sky-400 uppercase">
                THE GOVERNANCE PROGRESSION
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                From Technical Ground Truth to Auditable AI Assets
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    STEP 1
                  </span>
                  <Radio className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">DISCOVER</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Discover what the AI code actually exposes: agents, models, tools, and databases.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    STEP 2
                  </span>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">ASSESS</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Identify security risks, governance gaps, and unverified authorization evidence.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    STEP 3
                  </span>
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">GOVERN</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Apply ownership, tool permissions, guardrails, human approval (HITL), and autonomy controls.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    STEP 4
                  </span>
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">PRESERVE</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Capture canonical technical evidence in tamper-evident storage with legal retention rules.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    STEP 5
                  </span>
                  <FileBadge className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">PROVE</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Generate auditable evidence packages, governance records and cryptographically verifiable proofs.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. THE AUTONOMOUS AI REALITY CRISIS (THE CORE MESSAGE) */}
        {/* ========================================================================= */}"""

cl_text = cl_text.replace(old_problem_section, funnel_and_problem)

# 1.4 Refine Enterprise Assurance copy
old_assurance = """              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Generate auditable regulatory dossiers, automated RIPD (DPIA) compliance reports, and cryptographically verified evidence packages ready for external inspection.
              </p>"""

new_assurance = """              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Generate cryptographically verifiable technical conformity dossiers, automated RIPD (DPIA) assessments, and auditable evidence packages for governance, risk, privacy and regulatory workflows.
              </p>"""

cl_text = cl_text.replace(old_assurance, new_assurance)

# 1.5 Refine Final Conversion Banner
old_conv_text = """              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                Ready to Govern Your Enterprise AI Fleet?
              </h2>
              <p className="text-sm text-slate-300">
                Run a free scan now or create an organization to unlock immutable ledger auditability, role-based lenses, and automatic RIPD dossiers.
              </p>"""

new_conv_text = """              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                Turn Discovered Capabilities Into Governed AI Assets
              </h2>
              <p className="text-sm text-slate-300 max-w-2xl mx-auto">
                Run a free scan now or create an organization to unlock immutable ledger auditability, role-based lenses, and cryptographically verified conformity evidence.
              </p>"""

cl_text = cl_text.replace(old_conv_text, new_conv_text)

with open('../src/web/views/CommercialLandingView.tsx', 'w', encoding='utf-8') as f:
    f.write(cl_text)

print('Updated CommercialLandingView.tsx with refined copy')


# ==============================================================================
# 2. REFINING FreeScanSnapshotView.tsx
# ==============================================================================
with open('../src/web/components/FreeScanSnapshotView.tsx', 'r', encoding='utf-8') as f:
    fs_text = f.read()

# 2.1 Snapshot Header Text
old_snap_desc = """            <p className="text-sm text-slate-300">
              Technical ground truth extracted from <span className="text-sky-300 font-semibold font-mono">{result.repo?.name || 'Scanned AI Project'}</span>. Below are the discovered autonomous agents, technical capabilities, authorization boundaries, and regulatory risks.
            </p>"""

new_snap_desc = """            <p className="text-sm text-slate-300">
              Technical ground truth extracted from <span className="text-sky-300 font-semibold font-mono">{result.repo?.name || 'Scanned AI Project'}</span>. Discovered autonomous agents, execution capabilities, authorization boundaries, and governance/compliance exposure.
            </p>"""

fs_text = fs_text.replace(old_snap_desc, new_snap_desc)

# 2.2 KPI Card 4: Unverified Auth
old_kpi_auth = """          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Unverified Auth</span>
            <Lock className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-400 font-mono">
            {totalUnknownAuth}
          </p>
          <p className="text-[10px] text-rose-400/80">Missing explicit grants</p>"""

new_kpi_auth = """          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Unverified Auth</span>
            <Lock className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-400 font-mono">
            {totalUnknownAuth}
          </p>
          <p className="text-[10px] text-rose-400/80">No verified auth evidence</p>"""

fs_text = fs_text.replace(old_kpi_auth, new_kpi_auth)

# 2.3 Core Invariant Banner
old_invariant = """      {/* Canonical Invariant Banner */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-sky-500/30">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 shrink-0 mt-0.5">
            <Shield className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-sky-400 uppercase tracking-wider">
                SECURITY INVARIANT: CAPABILITY != AUTHORIZATION
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your code exposes physical execution capabilities (e.g. database queries, cloud storage modifications, shell commands). <strong>A code import or function call NEVER constitutes legal or technical authorization.</strong> Unless supported by explicit IAM policies, database grants, or OAuth scopes, capabilities remain in state <span className="font-mono text-rose-400 font-bold">UNKNOWN_AUTHORIZATION</span>.
            </p>
          </div>
        </div>
      </div>"""

new_invariant = """      {/* Canonical Invariant Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-sky-500/40 shadow-lg">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 shrink-0 mt-0.5">
            <Shield className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold text-sky-400 uppercase tracking-wider">
                CORE INVARIANT: CODED CAPABILITY ≠ AUTHORIZED CAPABILITY
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                CG-AG AXIOM
              </span>
            </div>
            <p className="text-xs text-sky-200 font-medium italic">
              "Your code tells us what the AI can do. Your governance must prove what it is allowed to do."
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              A function call, imported library or exposed endpoint demonstrates that a capability may exist. It does not, by itself, prove that the agent is authorized to execute that action against the underlying resource. Unless supported by explicit verified grants, capabilities remain classified as <span className="font-mono text-rose-400 font-bold">UNKNOWN_AUTHORIZATION</span> (observed capability with no verified authorization evidence).
            </p>
          </div>
        </div>
      </div>"""

fs_text = fs_text.replace(old_invariant, new_invariant)

# 2.4 Table No Grant text
old_table_grant = """                        <span className="text-rose-400/80 italic text-[10px]">
                          No explicit grant found
                        </span>"""

new_table_grant = """                        <span className="text-rose-400/80 italic text-[10px]">
                          No verified authorization evidence
                        </span>"""

fs_text = fs_text.replace(old_table_grant, new_table_grant)

# 2.5 Privacy Text
old_privacy_text = """          <p className="text-xs text-slate-300 leading-relaxed">
            All API keys, JWT bearer tokens, connection strings, and database passwords were <strong>redacted in memory</strong>. Source code is analyzed in-memory and is not persisted by CG-AG. All AST inspection executes client-side directly in your browser.
          </p>"""

new_privacy_text = """          <p className="text-xs text-slate-300 leading-relaxed">
            Designed for privacy-preserving analysis: source code is analyzed in-memory in the browser and sensitive credential patterns are redacted before processing. All API keys, JWT bearer tokens, connection strings, and database passwords are <strong>redacted in memory</strong>.
          </p>"""

fs_text = fs_text.replace(old_privacy_text, new_privacy_text)

# 2.6 Conversion Call to Action
old_conv_box = """          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Preserve, Govern & Prove These AI Systems
          </h3>
          <p className="text-sm text-slate-300">
            Create your enterprise organization now to ingest these discovered findings into your immutable Cryptographic Ledger, issue AI Passports, enforce HITL approval gates, and export audited RIPD dossiers.
          </p>"""

new_conv_box = """          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Turn Discovered Capabilities Into Governed AI Assets
          </h3>
          <p className="text-sm text-slate-300">
            Create your enterprise organization now to ingest these discovered findings into your immutable Cryptographic Ledger, issue AI Passports, enforce HITL approval gates, and generate cryptographically verifiable conformity dossiers.
          </p>"""

fs_text = fs_text.replace(old_conv_box, new_conv_box)

with open('../src/web/components/FreeScanSnapshotView.tsx', 'w', encoding='utf-8') as f:
    f.write(fs_text)

print('Updated FreeScanSnapshotView.tsx with refined copy')
