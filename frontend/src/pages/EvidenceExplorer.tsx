import React, { useState, useEffect } from 'react';
import { getExecutions } from '../services/api';
import { EvidenceItem, EvidenceRelationship, SourceQuality } from '../types';
import { Search, ShieldCheck, Filter } from 'lucide-react';
import { FormattedText, SourceLink } from '../utils/formatText';

export const EvidenceExplorer: React.FC = () => {
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [filterRel, setFilterRel] = useState<string>('ALL');
  const [filterQuality, setFilterQuality] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchEvidence = async () => {
      try {
        const executions = await getExecutions(20);
        const allEv: EvidenceItem[] = [];
        executions.forEach(exec => {
          if (exec.evidence_items) {
            allEv.push(...exec.evidence_items);
          }
        });
        setEvidenceList(allEv);
      } catch (err) {
        console.error("Failed to load evidence:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvidence();
  }, []);

  const filteredItems = evidenceList.filter(ev => {
    if (filterRel !== 'ALL' && ev.relationship !== filterRel) return false;
    if (filterQuality !== 'ALL' && ev.quality !== filterQuality) return false;
    if (searchQuery && !ev.text.toLowerCase().includes(searchQuery.toLowerCase()) && !ev.source_title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 pt-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#304036] pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#E5DED0] tracking-wide flex items-center space-x-2">
            <Search className="w-5 h-5 text-[#B46A45]" />
            <span>Evidence Explorer</span>
          </h1>
          <p className="text-xs text-[#9A9B91]">Grounding evidence statements and source quality ratings</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="relative">
            <input
              type="text"
              placeholder="Search evidence..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#15201A] border border-[#304036] text-[#E5DED0] px-3 py-1.5 rounded-lg w-48 text-xs focus:outline-none focus:border-[#B46A45]"
            />
          </div>

          <select
            value={filterRel}
            onChange={(e) => setFilterRel(e.target.value)}
            className="bg-[#15201A] border border-[#304036] text-[#E5DED0] px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-[#B46A45]"
          >
            <option value="ALL">All Relationships</option>
            <option value="SUPPORTS">✓ Supports Claim</option>
            <option value="CONTRADICTS">✕ Contradicts Claim</option>
            <option value="NEUTRAL">○ Neutral / Context</option>
          </select>

          <select
            value={filterQuality}
            onChange={(e) => setFilterQuality(e.target.value)}
            className="bg-[#15201A] border border-[#304036] text-[#E5DED0] px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-[#B46A45]"
          >
            <option value="ALL">All Quality Ratings</option>
            <option value="HIGH">HIGH Quality</option>
            <option value="MEDIUM">MEDIUM Quality</option>
            <option value="LOW">LOW Quality</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-[#9A9B91] text-xs">Loading evidence database...</div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-[#15201A] rounded-xl border border-[#304036] text-[#9A9B91] text-xs">
          No evidence items found. Submit a claim investigation to generate grounding evidence.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((ev, idx) => (
            <div key={idx} className="bg-[#15201A] p-4 rounded-xl border border-[#304036] space-y-3 hover:border-[#B46A45] transition-all">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold ${
                  ev.relationship === 'SUPPORTS' ? 'bg-[#4E8752]/20 text-[#4E8752] border border-[#4E8752]/40' :
                  ev.relationship === 'CONTRADICTS' ? 'bg-[#B44C43]/20 text-[#B44C43] border border-[#B44C43]/40' :
                  'bg-[#9A9B91]/20 text-[#9A9B91] border border-[#304036]'
                }`}>
                  {ev.relationship === 'SUPPORTS' ? '✓ SUPPORTS' : ev.relationship === 'CONTRADICTS' ? '✕ CONTRADICTS' : '○ NEUTRAL'}
                </span>

                <span className="text-[10px] font-mono bg-[#0D1512] px-2 py-0.5 rounded border border-[#304036] text-[#C29B5B]">
                  QUALITY: {ev.quality}
                </span>
              </div>

              <p className="text-xs text-[#E5DED0] leading-relaxed font-sans"><FormattedText text={ev.text} /></p>

              <div className="flex items-start justify-between pt-2 border-t border-[#304036]/60 text-[11px] text-[#9A9B91] gap-3">
                <SourceLink url={ev.source_url} title={ev.source_title} />
                <span className="flex-shrink-0">Agent: {ev.research_agent}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
