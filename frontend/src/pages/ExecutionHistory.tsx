import React, { useState, useEffect } from 'react';
import { ExecutionDetail } from '../types';
import { getExecutions, deleteExecution, clearAllExecutions } from '../services/api';
import { Layers, Clock, Calendar, Trash2, ShieldCheck, AlertTriangle, RefreshCw } from 'lucide-react';
import { SynthesisPanel } from '../components/workspace/SynthesisPanel';
import { ModelCards } from '../components/workspace/ModelCards';
import { ErrorBoundary } from '../components/layout/ErrorBoundary';

export const ExecutionHistory: React.FC = () => {
  const [executions, setExecutions] = useState<ExecutionDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExec, setSelectedExec] = useState<ExecutionDetail | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const [loadError, setLoadError] = useState<string | null>(null);

  const loadInFlight = React.useRef(false);

  const loadHistory = async (isSilent = false) => {
    if (loadInFlight.current) return;
    loadInFlight.current = true;
    try {
      if (!isSilent) setRefreshing(true);
      setLoadError(null);
      const data = await getExecutions(20);
      setExecutions(data);
      if (data.length > 0) {
        setSelectedExec(prev => {
          if (!prev) return data[0];
          const found = data.find(x => x.execution_id === prev.execution_id);
          return found || data[0];
        });
      } else {
        setSelectedExec(null);
      }
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Failed loading executions history:", err);
      setLoadError("Could not load execution history. Is the backend running?");
    } finally {
      loadInFlight.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHistory();
    const interval = setInterval(() => {
      loadHistory(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDeleteSingle = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteExecution(id);
      setExecutions(prev => prev.filter(x => x.execution_id !== id));
      if (selectedExec?.execution_id === id) {
        setSelectedExec(null);
      }
    } catch (err) {
      console.error("Failed deleting execution:", err);
    }
  };

  const handleClearAll = async () => {
    try {
      setDeleting(true);
      await clearAllExecutions();
      setExecutions([]);
      setSelectedExec(null);
      setShowClearModal(false);
    } catch (err) {
      console.error("Failed clearing all executions:", err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="pt-20 pb-16 px-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#304036] pb-4">
        <div>
          <h1 className="text-xl font-bold font-sans text-[#E5DED0] tracking-wider flex items-center space-x-2">
            <Layers className="w-5 h-5 text-[#B46A45]" />
            <span>EXECUTION HISTORY</span>
          </h1>
          <p className="text-xs text-[#9A9B91]">Recorded Claim Verification Runs • Live Auto-Sync (5s)</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => loadHistory(false)}
            className="p-1.5 rounded bg-[#15201A] hover:bg-[#20372B] text-[#C29B5B] border border-[#304036] transition-all"
            title="Refresh History Now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <span className="px-3 py-1 rounded bg-[#15201A] text-[#C29B5B] text-xs font-mono border border-[#304036]">
            {executions.length} RECORDED RUNS
          </span>

          {executions.length > 0 && (
            <button
              onClick={() => setShowClearModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-[#B44C43]/20 hover:bg-[#B44C43]/30 text-[#B44C43] border border-[#B44C43]/40 text-xs font-mono font-bold flex items-center space-x-1.5 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>CLEAR ALL</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Execution List */}
        <div className="lg:col-span-2 space-y-3">
          {executions.length > 0 ? (
            executions.map((exec) => {
              const verdict = String(exec.synthesis?.verdict_label || "INCONCLUSIVE");
              const confidence = Number(exec.synthesis?.confidence_score ?? 0);

              return (
                <div
                  key={exec.execution_id}
                  onClick={() => setSelectedExec(exec)}
                  className={`bg-[#15201A] p-4 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    selectedExec?.execution_id === exec.execution_id
                      ? 'border-[#B46A45] bg-[#20372B]/40 shadow-subtle'
                      : 'border-[#304036] hover:border-[#B46A45]/50'
                  }`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-[#B46A45]">{exec.execution_id}</span>
                      <span className="px-2 py-0.5 rounded bg-[#4E8752]/20 text-[#4E8752] border border-[#4E8752]/40 text-[10px] font-mono font-bold">
                        {verdict.toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#0D1512] text-[#C29B5B] font-mono text-[10px] border border-[#304036]">
                        {confidence}% CONFIDENCE
                      </span>
                    </div>

                    <p className="text-xs text-[#E5DED0] font-sans font-medium line-clamp-2">{exec.query}</p>

                    <div className="flex items-center space-x-4 text-[11px] font-mono text-[#9A9B91]">
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1 text-[#B46A45]" /> {exec.total_latency}s
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1 text-[#9A9B91]" /> {new Date(exec.created_at).toLocaleDateString()}
                      </span>
                      <span>Models: Gemini, Groq</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end md:self-center">
                    <button
                      onClick={(e) => handleDeleteSingle(e, exec.execution_id)}
                      className="p-2 rounded-lg bg-[#0D1512] hover:bg-[#B44C43]/20 text-[#9A9B91] hover:text-[#B44C43] border border-[#304036] transition-all text-xs"
                      title="Delete Execution"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-[#15201A] p-12 text-center font-mono text-xs text-[#9A9B91] rounded-xl border border-[#304036]">
              {loading ? "Loading execution records..." : (loadError || "No execution history recorded yet.")}
            </div>
          )}
        </div>

        {/* Detail Inspector */}
        <div className="bg-[#15201A] p-6 rounded-xl border border-[#304036] space-y-6 h-fit shadow-subtle lg:col-span-3">
          <div className="flex items-center justify-between border-b border-[#304036] pb-3">
            <h3 className="font-mono text-xs font-bold text-[#E5DED0] uppercase tracking-wider flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-[#B46A45]" />
              <span>FULL EXECUTION INSPECTOR & SYNTHESIS DETAILS</span>
            </h3>

            {selectedExec && (
              <span className="text-xs font-mono text-[#C29B5B] bg-[#0D1512] px-3 py-1 rounded border border-[#304036]">
                RUN ID: {selectedExec.execution_id}
              </span>
            )}
          </div>

          {selectedExec ? (
            <div className="space-y-6 text-xs font-sans">
              <div>
                <span className="font-mono text-[10px] text-[#9A9B91] uppercase block mb-1">Target Claim Investigated</span>
                <p className="bg-[#0D1512] p-4 rounded-xl border border-[#304036] text-[#E5DED0] text-sm font-semibold leading-relaxed">
                  "{selectedExec.query}"
                </p>
              </div>

              {selectedExec.synthesis && (
                <ErrorBoundary fallbackTitle="History synthesis failed">
                  <SynthesisPanel 
                    synthesis={selectedExec.synthesis}
                    clusters={selectedExec.clusters || []}
                    conflicts={selectedExec.conflicts || []}
                    evidenceItems={selectedExec.evidence_items || []}
                  />
                </ErrorBoundary>
              )}

              {selectedExec.model_runs && selectedExec.model_runs.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-[#304036]">
                  <span className="font-mono text-xs font-bold text-[#E5DED0] uppercase tracking-wider block">
                    TECHNICAL AGENT RESPONSES & METRICS
                  </span>
                  <ModelCards runs={selectedExec.model_runs} />
                </div>
              )}
            </div>
          ) : (
            <p className="text-[#9A9B91] font-mono text-xs italic">Select an execution run above to inspect detailed synthesis and grounding proofs.</p>
          )}
        </div>
      </div>

      {/* Clear All Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#15201A] border-2 border-[#B44C43] rounded-xl max-w-md w-full p-6 space-y-4 shadow-subtle">
            <div className="flex items-center space-x-3 text-[#B44C43]">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-sans font-bold text-base text-[#E5DED0]">Clear All Execution History?</h3>
            </div>

            <p className="text-xs text-[#9A9B91] leading-relaxed">
              All claims, evidence items, consensus results, model runs, and associated execution data will be permanently removed from the database and cache.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 rounded-lg bg-[#0D1512] border border-[#304036] text-[#E5DED0] text-xs font-mono hover:bg-[#20372B]"
              >
                CANCEL
              </button>
              <button
                onClick={handleClearAll}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-[#B44C43] text-white text-xs font-mono font-bold hover:bg-[#B44C43]/90"
              >
                {deleting ? "DELETING..." : "DELETE ALL"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
