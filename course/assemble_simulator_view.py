"""
Create src/web/views/GovernanceSimulatorView.tsx
"""
import os

target = r"C:\Users\denio\Documents\Denio\PluginVIbeCOde\standalone-compliance-scanner\src\web\views\GovernanceSimulatorView.tsx"

content = '''import React, { useState, useEffect } from 'react';
import {
  Activity,
  Shield,
  AlertTriangle,
  Play,
  Zap,
  CheckCircle,
  XCircle,
  Lock,
  Flame,
  Terminal,
  Cpu,
  RefreshCw,
  Clock,
  Layers,
  Database,
  Crosshair,
  FileCheck
} from 'lucide-react';
import {
  GovernanceSimulator,
  ADVERSARIAL_SCENARIOS,
  SimulationRun,
  ScenarioDefinition,
  SimulationEvent
} from '../services/governance-simulator';

export const GovernanceSimulatorView: React.FC = () => {
  const [activeRun, setActiveRun] = useState<SimulationRun | null>(GovernanceSimulator.getActiveRun());
  const [history, setHistory] = useState<SimulationRun[]>(GovernanceSimulator.getHistory());
  const [selectedScenario, setSelectedScenario] = useState<ScenarioDefinition>(ADVERSARIAL_SCENARIOS[0]);
  const [stressHz, setStressHz] = useState<number>(50);
  const [stressDuration, setStressDuration] = useState<number>(2);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<SimulationEvent | null>(null);

  useEffect(() => {
    const unsub = GovernanceSimulator.subscribe(() => {
      setActiveRun(GovernanceSimulator.getActiveRun());
      setHistory(GovernanceSimulator.getHistory());
    });
    return unsub;
  }, []);

  const handleRunScenario = (sc: ScenarioDefinition) => {
    setIsRunning(true);
    setSelectedScenario(sc);
    setTimeout(() => {
      const run = GovernanceSimulator.executeScenario(sc.id);
      setActiveRun(run);
      setIsRunning(false);
    }, 400);
  };

  const handleRunStress = () => {
    setIsRunning(true);
    setTimeout(() => {
      const run = GovernanceSimulator.runStressTest(stressHz, stressDuration);
      setActiveRun(run);
      setIsRunning(false);
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in text-slate-100">
      {/* 1. Header with Simulator Indicators */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400">
                <Crosshair className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    Runtime Governance Simulator
                  </h1>
                  <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Simulated Sandbox
                  </span>
                  <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Zero Baseline Pollution
                  </span>
                </div>
                <p className="text-slate-400 text-sm mt-1">
                  Adversarial Stress Testing & Real-Time Runtime Resilience Control Plane (Detect → Decide → Block → Contain → Evidence → Recover)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleRunStress()}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Simulating...' : `Run Stress Burst (${stressHz} ev/s)`}
            </button>
          </div>
        </div>

        {/* 2. Top Summary KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
            <div className="text-xs text-slate-400 font-medium">Events Processed</div>
            <div className="text-xl font-bold text-white mt-1">
              {activeRun ? activeRun.eventsProcessed : 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Isolated Simulation Bus</div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
            <div className="text-xs text-slate-400 font-medium">Blocked / Intercepted</div>
            <div className="text-xl font-bold text-amber-400 mt-1">
              {activeRun ? activeRun.eventsBlocked : 0}
            </div>
            <div className="text-[11px] text-amber-500/80 mt-0.5">HITL Gates & Failsafes</div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
            <div className="text-xs text-slate-400 font-medium">Circuit Breakers Contained</div>
            <div className="text-xl font-bold text-rose-400 mt-1">
              {activeRun ? activeRun.eventsContained : 0}
            </div>
            <div className="text-[11px] text-rose-500/80 mt-0.5">Failsafe Containments</div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
            <div className="text-xs text-slate-400 font-medium">Detection Latency</div>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              {activeRun ? `${activeRun.detectionLatencyMs} ms` : '0 ms'}
            </div>
            <div className="text-[11px] text-emerald-500/80 mt-0.5">Sub-milisecond Policy Gate</div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
            <div className="text-xs text-slate-400 font-medium">Evidence & Ledger Proofs</div>
            <div className="text-xl font-bold text-indigo-400 mt-1">
              {activeRun ? `${activeRun.evidenceGenerated} / ${activeRun.ledgerBlocksCreated}` : '0 / 0'}
            </div>
            <div className="text-[11px] text-indigo-400/80 mt-0.5">SHA-256 Canonical Sealed</div>
          </div>
        </div>
      </div>

      {/* 3. Main Grid: Scenarios & Live Telemetry Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 10 Adversarial Scenarios */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              Adversarial Scenario Library (10)
            </h2>
            <span className="text-xs text-slate-400 font-mono">10 Active Vectors</span>
          </div>

          <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
            {ADVERSARIAL_SCENARIOS.map((sc) => {
              const isSelected = selectedScenario.id === sc.id;
              return (
                <div
                  key={sc.id}
                  onClick={() => setSelectedScenario(sc)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-amber-500/50 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-800 text-amber-400 border border-slate-700">
                          {sc.id}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          {sc.category}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-1.5">{sc.title}</h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {sc.description}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRunScenario(sc);
                      }}
                      disabled={isRunning}
                      className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Test
                    </button>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Cpu className="w-3 h-3 text-slate-400" />
                      Target: <strong className="text-slate-300">{sc.targetAgentName}</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Event Stream & Response Traceability */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Terminal className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white">
                  Live Runtime Governance Stream
                </h2>
                {activeRun && (
                  <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {activeRun.simulationId}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Real-Time Interceptor Bus
              </div>
            </div>

            {/* Event List Table */}
            {activeRun && activeRun.events.length > 0 ? (
              <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
                {activeRun.events.map((ev, idx) => (
                  <div
                    key={ev.eventId}
                    onClick={() => setSelectedEvent(ev)}
                    className="p-3.5 bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 rounded-xl transition-all cursor-pointer text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-500">
                          {ev.timestamp.substring(11, 23)}
                        </span>
                        <span className="font-semibold text-white">
                          {ev.sourceAgentName}
                        </span>
                        <span className="text-slate-400">→</span>
                        <span className="font-mono text-amber-300/90 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          {ev.eventType}
                        </span>
                      </div>

                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${
                          ev.governanceAction === 'BLOCKED' || ev.governanceAction === 'CONTAINED' || ev.governanceAction === 'TAMPER_DETECTED'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : ev.governanceAction === 'HITL_INTERCEPTED' || ev.governanceAction === 'BYPASS_DETECTED'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {ev.governanceAction}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                      <div className="truncate max-w-md">
                        Resource: <span className="font-mono text-slate-300">{ev.targetResource}</span>
                      </div>
                      <span className="font-mono text-emerald-400">{ev.latencyMs} ms</span>
                    </div>

                    {ev.evidenceDigest && (
                      <div className="flex items-center gap-2 text-[10px] font-mono text-indigo-300 bg-indigo-500/10 p-1.5 rounded border border-indigo-500/20 truncate">
                        <Lock className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span className="truncate">{ev.evidenceDigest}</span>
                        {ev.ledgerRef && (
                          <span className="text-slate-400 ml-auto shrink-0 font-sans">
                            Ledger: <strong>{ev.ledgerRef}</strong>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-500 text-sm">
                <Crosshair className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                Select any adversarial scenario on the left or run a stress burst to start real-time telemetry simulation.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
'''

with open(target, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"WRITTEN: {target}")
