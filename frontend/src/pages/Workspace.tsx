import React, { useState } from 'react';
import { 
  QueryRequest, ExecutionDetail, ExecutionEvent, ExecutionMode 
} from '../types';
import { runConsensus } from '../services/api';
import { AgentGraph } from '../components/graph/AgentGraph';
import { ModelCards } from '../components/workspace/ModelCards';
import { SynthesisPanel } from '../components/workspace/SynthesisPanel';
import { Play, Settings2, ShieldCheck, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Cpu } from 'lucide-react';
import { ErrorBoundary } from '../components/layout/ErrorBoundary';

interface WorkspaceProps {
  setActiveExecutionId: (id: string | undefined) => void;
}

export const Workspace: React.FC<WorkspaceProps> = ({ setActiveExecutionId }) => {
  const [query, setQuery] = useState("Electric vehicles are always cheaper than petrol cars over their entire lifetime.");
  const [selectedModels, setSelectedModels] = useState<string[]>(["gemini", "groq"]);
  const [mode, setMode] = useState<ExecutionMode>("BALANCED");
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(1024);
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(0.82);

  const [loading, setLoading] = useState(false);
  const [execution, setExecution] = useState<ExecutionDetail | null>(null);
  const [realtimeEvents, setRealtimeEvents] = useState<ExecutionEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showTechnical, setShowTechnical] = useState(false);

  const handleRunConsensus = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setRealtimeEvents([]);
    setExecution(null);

    const payload: QueryRequest = {
      query,
      models: selectedModels,
      mode,
      temperature,
      max_tokens: maxTokens,
      similarity_threshold: similarityThreshold
    };

    try {
      const res = await runConsensus(payload);
      setExecution(res);
      setActiveExecutionId(res.execution_id);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : (err?.message || "Verification failed. Check backend server connection."));
    } finally {
      setLoading(false);
    }
  };

  const sampleQueries = [
    "Electric vehicles are always cheaper than petrol cars over their entire lifetime.",
    "All programming jobs will disappear because of AI within 5 years.",
    "India has the world's largest population."
  ];

  return (
    <div className="pt-20 pb-16 px-6 max-w-7xl mx-auto space-y-6">
      {/* Top Input & Config Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Input Panel */}
        <div className="lg:col-span-2 bg-[#15201A] p-6 rounded-xl border border-[#304036] flex flex-col justify-between shadow-subtle">
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="font-mono text-xs font-bold text-[#C29B5B] uppercase tracking-wider flex items-center">
                <ShieldCheck className="w-4 h-4 mr-1.5 text-[#B46A45]" /> VERIFY A CLAIM
              </label>
              <div className="flex items-center space-x-2 text-[10px] font-mono text-[#9A9B91]">
                <span className="w-2 h-2 rounded-full bg-[#4E8752]" />
                <span>Gemini & Groq Available</span>
              </div>
            </div>

            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What claim would you like to investigate?"
              rows={4}
              className="w-full bg-[#0D1512] text-[#E5DED0] p-4 rounded-xl border border-[#304036] focus:border-[#B46A45] focus:outline-none font-sans text-sm resize-none leading-relaxed"
            />

            {/* Sample Claim Chips */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-[11px] font-mono text-[#9A9B91] self-center">Sample Claims:</span>
              {sampleQueries.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => setQuery(q)}
                  className="text-[11px] font-mono bg-[#0D1512] hover:bg-[#20372B] text-[#9A9B91] hover:text-[#E5DED0] px-2.5 py-1 rounded border border-[#304036] transition-all text-left truncate max-w-xs"
                >
                  {q.substring(0, 35)}...
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#304036] flex items-center justify-between">
            <div className="flex items-center space-x-3 text-xs">
              <span className="font-mono text-[#9A9B91]">Agents:</span>
              <span className="px-2.5 py-1 rounded bg-[#0D1512] border border-[#304036] text-[#E5DED0] font-mono">Gemini</span>
              <span className="px-2.5 py-1 rounded bg-[#0D1512] border border-[#304036] text-[#E5DED0] font-mono">Groq</span>
            </div>

            <button
              onClick={handleRunConsensus}
              disabled={loading}
              className="px-6 py-2.5 rounded-lg bg-[#B46A45] hover:bg-[#B46A45]/90 text-white font-bold font-mono text-xs flex items-center space-x-2 shadow-subtle transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>INVESTIGATING...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>VERIFY CLAIM</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Execution Config */}
        <div className="bg-[#15201A] p-6 rounded-xl border border-[#304036] space-y-4 shadow-subtle">
          <div className="flex items-center space-x-2 border-b border-[#304036] pb-3">
            <Settings2 className="w-4 h-4 text-[#C29B5B]" />
            <h3 className="font-mono text-xs font-bold text-[#E5DED0] uppercase tracking-wider">VERIFICATION PARAMETERS</h3>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <label className="text-[#9A9B91] block mb-1.5">Strategy</label>
              <div className="grid grid-cols-3 gap-2">
                {(["FAST", "BALANCED", "DEEP"] as ExecutionMode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`py-1.5 rounded text-[11px] font-bold border transition-all ${
                      mode === m
                        ? 'bg-[#B46A45]/20 border-[#B46A45] text-[#E5DED0]'
                        : 'bg-[#0D1512] border-[#304036] text-[#9A9B91]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[#9A9B91] mb-1">
                <span>Similarity Threshold</span>
                <span className="text-[#C29B5B] font-bold">{similarityThreshold}</span>
              </div>
              <input
                type="range"
                min="0.50"
                max="0.95"
                step="0.01"
                value={similarityThreshold}
                onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
                className="w-full accent-[#B46A45] bg-[#0D1512] rounded h-1.5 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-[#B44C43]/20 border border-[#B44C43] p-4 rounded-xl flex items-center space-x-3 text-xs text-[#E5DED0]">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-[#B44C43]" />
          <span>{error}</span>
        </div>
      )}

      {/* 11-Stage Live Agent Workflow Graph */}
      <ErrorBoundary fallbackTitle="Workflow graph failed">
        <AgentGraph events={execution ? execution.events : realtimeEvents} />
      </ErrorBoundary>

      {/* Verification Output */}
      {execution && (
        <div className="space-y-6">
          <ErrorBoundary fallbackTitle="Synthesis panel failed">
            <SynthesisPanel 
              synthesis={execution.synthesis}
              clusters={execution.clusters || []}
              conflicts={execution.conflicts || []}
              evidenceItems={execution.evidence_items || []}
            />
          </ErrorBoundary>

          {/* Technical Analysis Accordion */}
          <div className="bg-[#15201A] rounded-xl border border-[#304036] overflow-hidden">
            <button
              onClick={() => setShowTechnical(!showTechnical)}
              className="w-full p-4 flex items-center justify-between text-xs font-mono font-semibold text-[#9A9B91] hover:text-[#E5DED0] bg-[#0D1512]"
            >
              <span className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-[#B46A45]" />
                <span>TECHNICAL ANALYSIS & RAW MODEL RESPONSES</span>
              </span>
              {showTechnical ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showTechnical && (
              <div className="p-6 space-y-6 border-t border-[#304036]">
                <ModelCards runs={execution.model_runs} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
