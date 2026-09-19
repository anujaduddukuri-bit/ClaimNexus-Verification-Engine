import React, { useState, useEffect } from 'react';
import { Cluster, ExecutionDetail } from '../types';
import { getExecutions } from '../services/api';
import { Network, Info, RefreshCw, Layers, ChevronDown, ArrowLeft, X } from 'lucide-react';
import { FormattedText } from '../utils/formatText';

export const ConsensusVisualizer: React.FC = () => {
  const [executions, setExecutions] = useState<ExecutionDetail[]>([]);
  const [selectedExecId, setSelectedExecId] = useState<string>('ALL');
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [visibleLimit, setVisibleLimit] = useState<number>(12);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadConsensusData = async (isSilent = false) => {
    try {
      if (!isSilent) setRefreshing(true);
      const data = await getExecutions(30);
      setExecutions(data);

      if (data.length > 0) {
        let activeClusters: Cluster[] = [];
        if (selectedExecId === 'ALL') {
          activeClusters = data.flatMap(e => e.clusters);
        } else {
          const match = data.find(e => e.execution_id === selectedExecId);
          activeClusters = match ? match.clusters : data.flatMap(e => e.clusters);
        }
        setClusters(activeClusters);
        setSelectedCluster(prev => {
          if (!prev) return null;
          const found = activeClusters.find(c => c.cluster_id === prev.cluster_id);
          return found || null;
        });
      } else {
        setClusters([]);
        setSelectedCluster(null);
      }
    } catch (err) {
      console.error("Failed loading consensus clusters:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadConsensusData();
    const interval = setInterval(() => {
      loadConsensusData(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedExecId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedCluster(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const displayedClusters = clusters.slice(0, visibleLimit);

  return (
    <div className="pt-20 pb-16 px-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#304036] pb-4 gap-4">
        <div>
          <h1 className="text-xl font-bold font-sans text-[#E5DED0] tracking-wider flex items-center space-x-2">
            <Network className="w-5 h-5 text-[#B46A45]" />
            <span>CONSENSUS CLUSTER NETWORK</span>
          </h1>
          <p className="text-xs text-[#9A9B91]">Semantic Claim Agreement & Topology • Live Auto-Sync (5s)</p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center space-x-2 bg-[#15201A] px-3 py-1.5 rounded-lg border border-[#304036]">
            <Layers className="w-3.5 h-3.5 text-[#B46A45]" />
            <span className="text-[#9A9B91]">Execution:</span>
            <select
              value={selectedExecId}
              onChange={(e) => {
                setSelectedExecId(e.target.value);
                setVisibleLimit(12);
              }}
              className="bg-[#0D1512] text-[#E5DED0] px-2 py-1 rounded border border-[#304036] focus:outline-none"
            >
              <option value="ALL">All Executions ({executions.length})</option>
              {executions.map((e) => (
                <option key={e.execution_id} value={e.execution_id}>
                  {e.execution_id} ({e.query.substring(0, 25)}...)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => loadConsensusData(false)}
            className="p-1.5 rounded bg-[#15201A] hover:bg-[#20372B] text-[#C29B5B] border border-[#304036] transition-all"
            title="Refresh Consensus Topology"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <span className="px-2.5 py-1 rounded bg-[#4E8752]/20 text-[#4E8752] border border-[#4E8752]/40 font-bold">
            {clusters.filter(c => c.consensus_percentage >= 60).length} AGREEMENTS
          </span>
          <span className="px-2.5 py-1 rounded bg-[#B44C43]/20 text-[#B44C43] border border-[#B44C43]/40 font-bold">
            {clusters.filter(c => c.status === 'Conflicting').length} CONFLICTS
          </span>
        </div>
      </div>

      {/* Main Container - Full Width Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#304036] pb-2">
          <h3 className="font-mono text-xs font-bold text-[#9A9B91] uppercase tracking-widest">
            CONSENSUS CLUSTERS ({displayedClusters.length} OF {clusters.length} DISPLAYED)
          </h3>
          <span className="text-[11px] font-mono text-[#C29B5B]">Click any cluster to inspect details</span>
        </div>

        {displayedClusters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedClusters.map((cluster) => {
              const isSelected = selectedCluster?.cluster_id === cluster.cluster_id;
              return (
                <div
                  key={cluster.cluster_id}
                  onClick={() => setSelectedCluster(cluster)}
                  className={`bg-[#15201A] p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between hover:scale-[1.01] ${
                    isSelected 
                      ? 'border-[#B46A45] bg-[#20372B]/40 shadow-subtle ring-1 ring-[#B46A45]' 
                      : 'border-[#304036] hover:border-[#B46A45]/70'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs font-bold text-[#B46A45]">{cluster.cluster_id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        cluster.status === 'Conflicting'
                          ? 'bg-[#B44C43]/20 text-[#B44C43] border border-[#B44C43]/40'
                          : cluster.consensus_percentage >= 70
                          ? 'bg-[#4E8752]/20 text-[#4E8752] border border-[#4E8752]/40'
                          : 'bg-[#C29B5B]/20 text-[#C29B5B] border border-[#C29B5B]/40'
                      }`}>
                        {cluster.status}
                      </span>
                    </div>

                    <p className="text-xs text-[#E5DED0] font-sans font-medium line-clamp-3 mb-4 leading-relaxed">
                      "{cluster.canonical_claim}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono pt-3 border-t border-[#304036]/60">
                    <div className="flex items-center space-x-1 text-[#9A9B91]">
                      <span>Models:</span>
                      <span className="text-[#E5DED0] font-semibold">{cluster.supporting_models.join(", ")}</span>
                    </div>
                    <span className="text-[#C29B5B] font-bold">{cluster.consensus_percentage}% Agreement</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#15201A] p-12 text-center font-mono text-xs text-[#9A9B91] rounded-xl border border-[#304036]">
            {loading ? "Loading consensus cluster topology..." : "No consensus clusters found."}
          </div>
        )}

        {/* Show More Button */}
        {clusters.length > visibleLimit && (
          <div className="pt-4 text-center">
            <button
              onClick={() => setVisibleLimit(prev => prev + 12)}
              className="px-6 py-2.5 rounded-xl bg-[#15201A] hover:bg-[#20372B] text-[#C29B5B] hover:text-[#E5DED0] border border-[#304036] font-mono text-xs font-bold transition-all shadow-subtle flex items-center space-x-2 mx-auto"
            >
              <span>SHOW MORE CLUSTERS (+{clusters.length - visibleLimit} REMAINING)</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Cluster Inspector Modal / Backdrop Overlay */}
      {selectedCluster && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 animate-fade-in"
          onClick={() => setSelectedCluster(null)}
        >
          <div 
            className="bg-[#15201A] max-w-3xl w-full max-h-[90vh] flex flex-col rounded-2xl border border-[#304036] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#304036] bg-[#0D1512]">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSelectedCluster(null)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#15201A] hover:bg-[#20372B] text-[#C29B5B] hover:text-[#E5DED0] border border-[#304036] font-mono text-xs transition-all"
                  title="Close inspector and return to cluster list"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Review Other Clusters</span>
                </button>
                <div className="h-4 w-[1px] bg-[#304036]" />
                <h3 className="font-mono text-sm font-bold text-[#E5DED0] uppercase tracking-wider flex items-center space-x-2">
                  <Info className="w-4 h-4 text-[#B46A45]" />
                  <span>CLUSTER INSPECTOR</span>
                </h3>
              </div>

              <div className="flex items-center space-x-3">
                <span className="font-mono text-xs font-bold text-[#B46A45] bg-[#15201A] px-2.5 py-1 rounded-lg border border-[#304036]">
                  {selectedCluster.cluster_id}
                </span>
                <button
                  onClick={() => setSelectedCluster(null)}
                  className="text-[#9A9B91] hover:text-[#E5DED0] p-1.5 rounded-lg hover:bg-[#15201A] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              <div>
                <span className="font-mono text-[11px] text-[#9A9B91] uppercase tracking-wider block mb-1">Canonical Statement</span>
                <p className="bg-[#0D1512] p-4 rounded-xl border border-[#304036] text-[#E5DED0] text-xs md:text-sm leading-relaxed font-medium">
                  "{selectedCluster.canonical_claim}"
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 md:gap-4 font-mono">
                <div className="bg-[#0D1512] p-3.5 rounded-xl border border-[#304036]">
                  <span className="text-[10px] md:text-[11px] text-[#9A9B91] block mb-1">Status</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold ${
                    selectedCluster.status === 'Conflicting'
                      ? 'bg-[#B44C43]/20 text-[#B44C43] border border-[#B44C43]/40'
                      : selectedCluster.consensus_percentage >= 70
                      ? 'bg-[#4E8752]/20 text-[#4E8752] border border-[#4E8752]/40'
                      : 'bg-[#C29B5B]/20 text-[#C29B5B] border border-[#C29B5B]/40'
                  }`}>
                    {selectedCluster.status}
                  </span>
                </div>

                <div className="bg-[#0D1512] p-3.5 rounded-xl border border-[#304036]">
                  <span className="text-[10px] md:text-[11px] text-[#9A9B91] block mb-1">Consensus Score</span>
                  <span className="text-sm md:text-base font-bold text-[#4E8752]">{selectedCluster.consensus_percentage}%</span>
                </div>

                <div className="bg-[#0D1512] p-3.5 rounded-xl border border-[#304036]">
                  <span className="text-[10px] md:text-[11px] text-[#9A9B91] block mb-1">Confidence</span>
                  <span className="text-sm md:text-base font-bold text-[#C29B5B]">{(selectedCluster.confidence_score * 100).toFixed(0)}%</span>
                </div>
              </div>

              <div>
                <span className="font-mono text-[11px] text-[#9A9B91] uppercase tracking-wider block mb-2">Supporting AI Research Agents</span>
                <div className="flex flex-wrap gap-2">
                  {selectedCluster.supporting_models.map((m, i) => (
                    <span key={i} className="px-3 py-1 rounded-lg bg-[#0D1512] text-[#E5DED0] font-mono text-xs border border-[#304036] flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#4E8752]"></span>
                      <span>{m} Agent</span>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-mono text-[11px] text-[#9A9B91] uppercase tracking-wider block mb-2">
                  Supporting Extracted Claims ({selectedCluster.claims.length})
                </span>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {selectedCluster.claims?.map((c) => (
                    <div key={c.claim_id} className="bg-[#0D1512] p-4 rounded-xl border border-[#304036] space-y-1.5">
                      <div className="flex justify-between items-center font-mono text-xs">
                        <span className="text-[#B46A45] font-bold">{c.source_model}</span>
                        <span className="text-[#9A9B91] text-[10px]">{c.claim_id}</span>
                      </div>
                      <p className="text-[#E5DED0] text-xs leading-relaxed font-sans"><FormattedText text={c.text} /></p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#304036] bg-[#0D1512] flex justify-between items-center">
              <span className="text-xs text-[#9A9B91] font-mono">Press ESC or click outside to dismiss</span>
              <button
                onClick={() => setSelectedCluster(null)}
                className="px-5 py-2 rounded-xl bg-[#20372B] hover:bg-[#304036] text-[#E5DED0] border border-[#4E8752]/40 font-mono text-xs font-bold transition-all flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Review Other Clusters</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


