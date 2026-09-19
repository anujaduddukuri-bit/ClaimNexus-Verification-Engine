import React, { useState, useEffect } from 'react';
import { AnalyticsSummary } from '../types';
import { getAnalytics, getExecutions } from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';
import { BarChart3, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, PieChart as PieIcon } from 'lucide-react';

const VERDICT_COLORS: Record<string, string> = {
  'Supported': '#4E8752',
  'Likely Supported': '#4E8752',
  'Partially Supported': '#C29B5B',
  'Contradicted': '#B44C43',
  'Likely Contradicted': '#B44C43',
  'Inconclusive': '#9A9B91',
  'Insufficient Evidence': '#9A9B91'
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const name = data.name || data.payload?.name || 'Metric';
    const value = data.value;
    return (
      <div className="bg-[#0D1512] border-2 border-[#B46A45] p-3 rounded-xl shadow-2xl font-mono text-xs text-[#E5DED0] space-y-1 z-50">
        <p className="font-bold text-[#C29B5B] uppercase tracking-wider">{name}</p>
        <p className="text-xs text-[#E5DED0]">
          Occurrences / Value: <span className="font-bold text-white text-sm ml-1">{value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export const AnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [totalEvidence, setTotalEvidence] = useState<number>(0);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadAnalytics = async (isSilent = false) => {
    try {
      if (!isSilent) setRefreshing(true);
      const [analyticsData, executionsData] = await Promise.all([
        getAnalytics(),
        getExecutions(50)
      ]);
      setAnalytics(analyticsData);
      
      const evCount = executionsData.reduce((acc, exec) => acc + (exec.evidence_items?.length || 0), 0);
      setTotalEvidence(evCount);
    } catch (err) {
      console.error("Failed loading analytics:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
    const interval = setInterval(() => {
      loadAnalytics(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const modelData = [
    { 
      name: 'Gemini 2.5', 
      latency: analytics?.model_performance?.Gemini?.latency || 0,
      runs: analytics?.model_performance?.Gemini?.total_runs || 0
    },
    { 
      name: 'Groq LLaMA-3', 
      latency: analytics?.model_performance?.Groq?.latency || 0,
      runs: analytics?.model_performance?.Groq?.total_runs || 0
    }
  ];

  const verdictData = analytics?.verdict_distribution
    ? Object.entries(analytics.verdict_distribution)
        .filter(([_, val]) => val > 0)
        .map(([name, value]) => ({
          name,
          value,
          color: VERDICT_COLORS[name] || '#C29B5B'
        }))
    : [];

  const totalVerdicts = verdictData.reduce((acc, item) => acc + item.value, 0);

  return (
    <div className="pt-20 pb-16 px-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-[#304036] pb-4">
        <div>
          <h1 className="text-xl font-bold font-sans text-[#E5DED0] tracking-wider flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-[#B46A45]" />
            <span>VERIFICATION ANALYTICS</span>
          </h1>
          <p className="text-xs text-[#9A9B91]">Claim Verification Performance & Evidence Metrics • Live Auto-Sync (5s)</p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <button
            onClick={() => loadAnalytics(false)}
            className="p-1.5 rounded bg-[#15201A] hover:bg-[#20372B] text-[#C29B5B] border border-[#304036] transition-all"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <span className="px-3 py-1 rounded bg-[#15201A] text-[#C29B5B] text-xs font-mono font-bold border border-[#304036]">
            LIVE AGGREGATION
          </span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#15201A] p-4 rounded-xl border border-[#304036] space-y-1 shadow-subtle">
          <span className="text-[10px] font-mono text-[#9A9B91] uppercase">Total Executions</span>
          <p className="text-2xl font-bold font-mono text-[#E5DED0]">{analytics?.total_executions || 0}</p>
        </div>

        <div className="bg-[#15201A] p-4 rounded-xl border border-[#304036] space-y-1 shadow-subtle">
          <span className="text-[10px] font-mono text-[#9A9B91] uppercase">Avg Latency</span>
          <p className="text-2xl font-bold font-mono text-[#B46A45]">{analytics?.avg_latency || 0}s</p>
        </div>

        <div className="bg-[#15201A] p-4 rounded-xl border border-[#304036] space-y-1 shadow-subtle">
          <span className="text-[10px] font-mono text-[#9A9B91] uppercase">Avg Confidence Score</span>
          <p className="text-2xl font-bold font-mono text-[#4E8752]">{analytics?.avg_confidence_score || 0}%</p>
        </div>

        <div className="bg-[#15201A] p-4 rounded-xl border border-[#304036] space-y-1 shadow-subtle">
          <span className="text-[10px] font-mono text-[#9A9B91] uppercase">Evidence Items Evaluated</span>
          <p className="text-2xl font-bold font-mono text-[#C29B5B]">{totalEvidence}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latency Comparison Chart */}
        <div className="bg-[#15201A] p-6 rounded-xl border border-[#304036] space-y-4 shadow-subtle">
          <h3 className="font-mono text-xs font-bold text-[#E5DED0] uppercase tracking-wider flex items-center space-x-2 border-b border-[#304036] pb-3">
            <BarChart3 className="w-4 h-4 text-[#B46A45]" />
            <span>RESEARCH AGENT AVERAGE LATENCY (SECONDS)</span>
          </h3>
          <div className="h-64">
            {modelData.some(d => d.latency > 0 || d.runs > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelData}>
                  <XAxis dataKey="name" stroke="#9A9B91" tick={{ fontSize: 12, fill: '#E5DED0' }} />
                  <YAxis stroke="#9A9B91" tick={{ fontSize: 12, fill: '#E5DED0' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="latency" fill="#B46A45" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center font-mono text-xs text-[#9A9B91]">
                No research agent runs recorded yet. Execute a claim verification to populate live latency metrics.
              </div>
            )}
          </div>
        </div>

        {/* Verdict Distribution with High-Contrast Tooltip & Side Legend */}
        <div className="bg-[#15201A] p-6 rounded-xl border border-[#304036] space-y-4 shadow-subtle">
          <h3 className="font-mono text-xs font-bold text-[#E5DED0] uppercase tracking-wider flex items-center space-x-2 border-b border-[#304036] pb-3">
            <PieIcon className="w-4 h-4 text-[#C29B5B]" />
            <span>VERDICT CATEGORY DISTRIBUTION</span>
          </h3>
          
          {verdictData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              {/* Pie / Donut Chart */}
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={verdictData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {verdictData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#0D1512" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Side Legend & Progress Breakdown */}
              <div className="space-y-3 font-mono text-xs">
                <span className="text-[10px] text-[#9A9B91] uppercase block mb-1 border-b border-[#304036] pb-1">
                  CATEGORY BREAKDOWN ({totalVerdicts} RUNS)
                </span>
                
                {verdictData.map((v) => {
                  const pct = totalVerdicts > 0 ? ((v.value / totalVerdicts) * 100).toFixed(0) : 0;
                  return (
                    <div key={v.name} className="space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: v.color }} />
                          <span className="text-[#E5DED0] font-semibold">{v.name}</span>
                        </span>
                        <span className="text-[#C29B5B] font-bold">{v.value} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-[#0D1512] rounded-full h-1.5 border border-[#304036]">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ width: `${pct}%`, backgroundColor: v.color }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center font-mono text-xs text-[#9A9B91]">
              No verdict distribution data recorded yet. Run claim verifications to populate verdict metrics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


