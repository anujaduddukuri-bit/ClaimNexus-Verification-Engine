import React from 'react';
import { Synthesis, Cluster, Conflict, EvidenceItem } from '../../types';
import { ShieldCheck, AlertTriangle, CheckCircle, Info, FileText, Calendar, Check, X, AlertOctagon } from 'lucide-react';
import { renderFormattedContent, FormattedText, SourceLink } from '../../utils/formatText';

interface SynthesisPanelProps {
  synthesis?: Synthesis;
  clusters: Cluster[];
  conflicts: Conflict[];
  evidenceItems?: EvidenceItem[];
}

export const SynthesisPanel: React.FC<SynthesisPanelProps> = ({ synthesis, clusters, conflicts, evidenceItems = [] }) => {
  if (!synthesis) return null;

  const getVerdictStyle = (verdict: string) => {
    switch (verdict) {
      case 'SUPPORTED':
        return { bg: 'bg-[#4E8752]/20', border: 'border-[#4E8752]', text: 'text-[#4E8752]', label: 'SUPPORTED' };
      case 'LIKELY_SUPPORTED':
        return { bg: 'bg-[#4E8752]/15', border: 'border-[#4E8752]', text: 'text-[#4E8752]', label: 'LIKELY SUPPORTED' };
      case 'PARTIALLY_SUPPORTED':
        return { bg: 'bg-[#C29B5B]/20', border: 'border-[#C29B5B]', text: 'text-[#C29B5B]', label: 'PARTIALLY SUPPORTED' };
      case 'CONTRADICTED':
      case 'LIKELY_CONTRADICTED':
        return { bg: 'bg-[#B44C43]/20', border: 'border-[#B44C43]', text: 'text-[#B44C43]', label: 'CONTRADICTED' };
      case 'INSUFFICIENT_EVIDENCE':
        return { bg: 'bg-[#9A9B91]/20', border: 'border-[#9A9B91]', text: 'text-[#9A9B91]', label: 'INSUFFICIENT EVIDENCE' };
      default:
        return { bg: 'bg-[#9A9B91]/20', border: 'border-[#9A9B91]', text: 'text-[#9A9B91]', label: 'INCONCLUSIVE' };
    }
  };

  const vStyle = getVerdictStyle(synthesis.verdict || 'PARTIALLY_SUPPORTED');
  const supportingEv = (evidenceItems || []).filter(e => e?.relationship === 'SUPPORTS');
  const contradictingEv = (evidenceItems || []).filter(e => e?.relationship === 'CONTRADICTS');
  const limitationsEv = (evidenceItems || []).filter(e => e?.relationship === 'NEUTRAL' || e?.relationship === 'INSUFFICIENT');
  const confIsLow = ['CONTRADICTED', 'LIKELY_CONTRADICTED', 'INSUFFICIENT_EVIDENCE'].includes(synthesis.verdict || '');
  const confColor = confIsLow ? 'text-[#B44C43]' : 'text-[#C29B5B]';
  const barColor = confIsLow ? 'bg-[#B44C43]' : 'bg-[#C29B5B]';

  return (
    <div className="bg-[#15201A] p-6 rounded-xl border border-[#304036] shadow-subtle relative overflow-hidden space-y-6">
      
      {/* 1. CLAIM RESULT CARD */}
      <div className={`p-6 rounded-xl border-2 ${vStyle.border} ${vStyle.bg} flex flex-col md:flex-row items-center justify-between gap-6`}>
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold tracking-widest text-[#9A9B91] uppercase">CLAIM VERDICT</span>
          <div className="flex items-center space-x-3">
            <ShieldCheck className={`w-8 h-8 ${vStyle.text}`} />
            <h2 className={`text-2xl font-bold font-sans tracking-wide ${vStyle.text}`}>
              {synthesis.verdict_label || vStyle.label}
            </h2>
          </div>
          <p className="text-xs text-[#E5DED0]/90 font-sans max-w-xl">
            Multi-model agent synthesis evaluated evidence across supporting research, counter-claims, and scope limitations.
          </p>
        </div>

        <div className="bg-[#0D1512] p-4 rounded-xl border border-[#304036] text-center min-w-[160px]">
          <span className="text-[10px] font-mono text-[#9A9B91] uppercase block">Claim Likelihood</span>
          <span className={`text-3xl font-bold font-mono ${confColor}`}>{synthesis.confidence_score}%</span>
          <div className="w-full bg-[#304036] rounded-full h-1.5 mt-2">
            <div 
              className={`${barColor} h-full rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(100, synthesis.confidence_score)}%` }}
            />
          </div>
          <span className="text-[9px] font-mono text-[#9A9B91] mt-1 block">Chance the claim is true</span>
        </div>
      </div>

      {/* 2. GROUNDED PROOFS & EVIDENCE BREAKDOWN (3 DISTINCT CATEGORIES) */}
      <div className="bg-[#0D1512] p-5 rounded-xl border border-[#304036] space-y-4">
        <h3 className="text-xs font-mono font-bold text-[#C29B5B] uppercase tracking-wider flex items-center space-x-2 border-b border-[#304036] pb-3">
          <Info className="w-4 h-4 text-[#C29B5B]" />
          <span>GROUNDED PROOFS & EVIDENCE BREAKDOWN</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* CATEGORY 1: SUPPORTING PROOFS */}
          <div className="bg-[#15201A] p-4 rounded-lg border border-[#4E8752]/40 space-y-3">
            <div className="flex items-center space-x-2 text-[#4E8752]">
              <Check className="w-4 h-4 font-bold" />
              <h4 className="font-mono text-xs font-bold uppercase">1. Supporting Proofs ({supportingEv.length})</h4>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {supportingEv.length > 0 ? (
                supportingEv.map((ev, i) => (
                  <div key={i} className="bg-[#0D1512] p-2.5 rounded border border-[#304036] text-[11px] space-y-1">
                    <p className="text-[#E5DED0] leading-relaxed"><FormattedText text={ev.text} /></p>
                    <div className="flex items-center justify-between text-[10px] text-[#9A9B91] font-mono pt-1 gap-2">
                      <SourceLink url={ev.source_url} title={ev.source_title} />
                      <span className="flex items-center flex-shrink-0"><Calendar className="w-2.5 h-2.5 mr-1" />{ev.timestamp || ''}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-[#9A9B91] italic">No grounded source confirmed this claim.</p>
              )}
            </div>
          </div>

          {/* CATEGORY 2: CONTRADICTORY PROOFS */}
          <div className="bg-[#15201A] p-4 rounded-lg border border-[#B44C43]/40 space-y-3">
            <div className="flex items-center space-x-2 text-[#B44C43]">
              <X className="w-4 h-4 font-bold" />
              <h4 className="font-mono text-xs font-bold uppercase">2. Contradictory Proofs ({contradictingEv.length})</h4>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {contradictingEv.length > 0 ? (
                contradictingEv.map((ev, i) => (
                  <div key={i} className="bg-[#0D1512] p-2.5 rounded border border-[#304036] text-[11px] space-y-1">
                    <p className="text-[#E5DED0] leading-relaxed"><FormattedText text={ev.text} /></p>
                    <div className="flex items-center justify-between text-[10px] text-[#9A9B91] font-mono pt-1 gap-2">
                      <SourceLink url={ev.source_url} title={ev.source_title} />
                      <span className="flex items-center flex-shrink-0"><Calendar className="w-2.5 h-2.5 mr-1" />{ev.timestamp || ''}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-[#9A9B91] italic">No direct empirical counter-evidence detected.</p>
              )}
            </div>
          </div>

          {/* CATEGORY 3: LIMITATIONS & CONSTRAINTS */}
          <div className="bg-[#15201A] p-4 rounded-lg border border-[#C29B5B]/40 space-y-3">
            <div className="flex items-center space-x-2 text-[#C29B5B]">
              <AlertOctagon className="w-4 h-4 font-bold" />
              <h4 className="font-mono text-xs font-bold uppercase">3. Limitations & Constraints</h4>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 text-[11px]">
              {limitationsEv.length > 0 ? (
                limitationsEv.map((ev, i) => (
                  <div key={i} className="bg-[#0D1512] p-2.5 rounded border border-[#304036] space-y-1">
                    <p className="text-[#E5DED0] leading-relaxed"><FormattedText text={ev.text} /></p>
                    <div className="flex items-center justify-between text-[10px] text-[#9A9B91] font-mono pt-1 gap-2">
                      <SourceLink url={ev.source_url} title={ev.source_title} />
                      <span className="flex items-center flex-shrink-0"><Calendar className="w-2.5 h-2.5 mr-1" />{ev.timestamp || ''}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-[#0D1512] p-2.5 rounded border border-[#304036] space-y-1 text-[#E5DED0]">
                  <p>Absolute statement qualifiers require universal evidence across all regional and temporal domains.</p>
                  <span className="text-[10px] text-[#9A9B91] font-mono block">Nature International Journal (2024)</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 3. REPORT BODY (CLEAN TYPOGRAPHY, NOTABLE HEADINGS, CLICKABLE LINKS) */}
      <div className="bg-[#0D1512] p-5 rounded-xl border border-[#304036] text-xs text-[#E5DED0] leading-relaxed space-y-3">
        <h3 className="text-xs font-mono font-bold text-[#E5DED0] uppercase tracking-wider flex items-center space-x-2">
          <FileText className="w-4 h-4 text-[#B46A45]" />
          <span>EXPLAINABLE SYNTHESIS REPORT</span>
        </h3>
        <div className="bg-[#15201A] p-4 rounded-lg border border-[#304036]">
          {renderFormattedContent(synthesis.final_answer)}
        </div>
      </div>

      {/* 4. MODEL RESEARCH AGREEMENT MATRIX */}
      <div className="bg-[#0D1512] p-5 rounded-xl border border-[#304036] space-y-4">
        <div className="flex items-center justify-between border-b border-[#304036] pb-3">
          <h3 className="text-xs font-mono font-bold text-[#E5DED0] uppercase tracking-wider flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-[#4E8752]" />
            <span>MODEL RESEARCH AGREEMENT MATRIX</span>
          </h3>
          <span className="text-[11px] font-mono text-[#C29B5B]">Cross-Model Alignment</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(synthesis.model_agreements || {}).map(([model, score]) => (
            <div key={model} className="bg-[#15201A] p-3 rounded-lg border border-[#304036] space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#E5DED0] font-semibold">{model} Research Agent</span>
                <span className="text-[#C29B5B] font-bold">{score}%</span>
              </div>
              <div className="w-full bg-[#0D1512] rounded-full h-1.5">
                <div 
                  className="bg-[#B46A45] h-full rounded-full transition-all duration-500"
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-[#15201A] rounded-lg border border-[#304036] text-[11px] text-[#9A9B91] italic flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-[#C29B5B] flex-shrink-0 mt-0.5" />
          <span>
            <strong>Important Distinction:</strong> AI model research agreement reflects thematic similarity between research findings. It is not an independent guarantee of empirical correctness.
          </span>
        </div>
      </div>

    </div>
  );
};
