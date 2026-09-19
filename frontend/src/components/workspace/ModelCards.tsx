import React, { useState } from 'react';
import { ModelRunResult } from '../../types';
import { Clock, Cpu, FileText, Copy, Check, ExternalLink } from 'lucide-react';
import { renderFormattedContent } from '../../utils/formatText';

interface ModelCardsProps {
  runs: ModelRunResult[];
}

export const ModelCards: React.FC<ModelCardsProps> = ({ runs }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {runs.map((run, idx) => (
        <div 
          key={idx} 
          className="bg-[#15201A] p-5 rounded-xl border border-[#304036] hover:border-[#B46A45]/80 transition-all space-y-4 shadow-subtle"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-[#304036] pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-[#0D1512] border border-[#304036]">
                <Cpu className="w-4 h-4 text-[#B46A45]" />
              </div>
              <div>
                <h3 className="font-sans text-sm font-bold text-[#E5DED0]">{run.model_name}</h3>
                <span className="text-[10px] font-mono text-[#9A9B91]">Research Agent Output</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleCopy(run.response_text || '', idx)}
                className="p-1.5 rounded bg-[#0D1512] hover:bg-[#20372B] text-[#9A9B91] hover:text-[#C29B5B] border border-[#304036] transition-all text-xs flex items-center space-x-1"
                title="Copy Raw Text"
              >
                {copiedIndex === idx ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#4E8752]" />
                    <span className="text-[10px] text-[#4E8752] font-mono">COPIED</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-mono">COPY</span>
                  </>
                )}
              </button>

              <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold border ${
                run.status === 'COMPLETED' 
                  ? 'bg-[#4E8752]/20 text-[#4E8752] border-[#4E8752]/40'
                  : 'bg-[#B44C43]/20 text-[#B44C43] border-[#B44C43]/40'
              }`}>
                {run.status}
              </span>
            </div>
          </div>

          {/* Performance Metrics Bar */}
          <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
            <div className="bg-[#0D1512] p-2.5 rounded-lg border border-[#304036] flex items-center justify-between text-[#9A9B91]">
              <span className="flex items-center text-[#9A9B91]">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-[#B46A45]" /> Response Latency
              </span>
              <span className="text-[#E5DED0] font-bold">{run.latency_seconds}s</span>
            </div>

            <div className="bg-[#0D1512] p-2.5 rounded-lg border border-[#304036] flex items-center justify-between text-[#9A9B91]">
              <span className="flex items-center text-[#9A9B91]">
                <FileText className="w-3.5 h-3.5 mr-1.5 text-[#C29B5B]" /> Token Usage
              </span>
              <span className="text-[#E5DED0] font-bold">{run.token_count}</span>
            </div>
          </div>

          {/* Formatted Response View */}
          <div className="bg-[#0D1512] p-4 rounded-xl border border-[#304036] max-h-80 overflow-y-auto space-y-2">
            <span className="text-[10px] font-mono text-[#9A9B91] uppercase block border-b border-[#304036]/60 pb-1.5 mb-2">
              TECHNICAL AGENT ANALYSIS & FINDINGS
            </span>
            {run.response_text ? (
              renderFormattedContent(run.response_text)
            ) : (
              <p className="text-[#9A9B91] italic font-mono text-xs">{run.error_message || "No response text available."}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
