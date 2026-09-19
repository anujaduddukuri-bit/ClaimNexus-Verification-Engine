import React, { useState, useEffect } from 'react';
import { Claim } from '../types';
import { getExecutions } from '../services/api';
import { Search, Filter, FileText, RefreshCw } from 'lucide-react';
import { FormattedText } from '../utils/formatText';

export const ClaimsExplorer: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modelFilter, setModelFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadClaims = async (isSilent = false) => {
    try {
      if (!isSilent) setRefreshing(true);
      const executions = await getExecutions(30);
      const allClaims = executions.flatMap(e => e.claims);
      setClaims(allClaims);
    } catch (err) {
      console.error("Failed loading claims:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadClaims();
    const interval = setInterval(() => {
      loadClaims(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredClaims = claims.filter(c => {
    const matchesSearch = c.text.toLowerCase().includes(searchTerm.toLowerCase()) || c.claim_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModel = modelFilter === 'ALL' || c.source_model.toLowerCase().includes(modelFilter.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || c.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesModel && matchesCategory;
  });

  return (
    <div className="pt-20 pb-16 px-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-[#304036] pb-4">
        <div>
          <h1 className="text-xl font-bold font-sans text-[#E5DED0] tracking-wider flex items-center space-x-2">
            <FileText className="w-5 h-5 text-[#B46A45]" />
            <span>CLAIM EXPLORER</span>
          </h1>
          <p className="text-xs text-[#9A9B91]">Extracted Structured Claims & Research Findings • Live Auto-Sync (5s)</p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <button
            onClick={() => loadClaims(false)}
            className="p-1.5 rounded bg-[#15201A] hover:bg-[#20372B] text-[#C29B5B] border border-[#304036] transition-all"
            title="Refresh Claims"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <span className="text-[#9A9B91]">Total Extracted:</span>
          <span className="px-2.5 py-1 rounded bg-[#15201A] text-[#C29B5B] font-bold border border-[#304036]">
            {filteredClaims.length} CLAIMS
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#15201A] p-4 rounded-xl border border-[#304036] flex flex-wrap gap-4 items-center justify-between shadow-subtle">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#9A9B91] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search claim text or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0D1512] text-xs text-[#E5DED0] pl-9 pr-4 py-2.5 rounded-lg border border-[#304036] focus:border-[#B46A45] focus:outline-none font-mono"
          />
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5 text-[#9A9B91]" />
            <span className="text-[#9A9B91]">Model:</span>
            <select
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
              className="bg-[#0D1512] text-[#E5DED0] px-2.5 py-1.5 rounded border border-[#304036] font-mono focus:outline-none"
            >
              <option value="ALL">All Models</option>
              <option value="gemini">Gemini</option>
              <option value="groq">Groq</option>
            </select>
          </div>

          <div className="flex items-center space-x-1">
            <span className="text-[#9A9B91]">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#0D1512] text-[#E5DED0] px-2.5 py-1.5 rounded border border-[#304036] font-mono focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="factual">Factual</option>
              <option value="conceptual">Conceptual</option>
              <option value="comparative">Comparative</option>
              <option value="predictive">Predictive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Claims Table */}
      <div className="bg-[#15201A] rounded-xl border border-[#304036] overflow-hidden shadow-subtle">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#304036] bg-[#0D1512] font-mono text-[11px] text-[#9A9B91] uppercase">
              <th className="p-4">Claim ID</th>
              <th className="p-4">Source Model</th>
              <th className="p-4">Category</th>
              <th className="p-4">Claim Statement</th>
              <th className="p-4 text-right">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#304036]/60 text-xs font-sans">
            {filteredClaims.length > 0 ? (
              filteredClaims.map((claim) => (
                <tr key={claim.claim_id} className="hover:bg-[#20372B]/30 transition-colors">
                  <td className="p-4 font-mono text-[#B46A45] text-[11px] font-semibold">{claim.claim_id}</td>
                  <td className="p-4 font-mono text-[#E5DED0]">
                    <span className="px-2 py-0.5 rounded bg-[#0D1512] border border-[#304036] text-[10px]">
                      {claim.source_model}
                    </span>
                  </td>
                  <td className="p-4 font-mono">
                    <span className="px-2 py-0.5 rounded bg-[#C29B5B]/15 text-[#C29B5B] border border-[#C29B5B]/30 text-[10px] uppercase">
                      {claim.category}
                    </span>
                  </td>
                  <td className="p-4 text-[#E5DED0] max-w-xl leading-relaxed"><FormattedText text={claim.text} /></td>
                  <td className="p-4 text-right font-mono font-bold text-[#4E8752]">
                    {(claim.confidence * 100).toFixed(0)}%
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[#9A9B91] font-mono text-xs">
                  {loading ? "Loading claim records..." : "No claims match the specified filter parameters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
