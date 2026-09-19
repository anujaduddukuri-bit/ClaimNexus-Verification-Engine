import React from 'react';
import { ShieldCheck, Cpu, PlayCircle } from 'lucide-react';

interface HeaderProps {
  activeExecutionId?: string;
}

export const Header: React.FC<HeaderProps> = ({ activeExecutionId }) => {
  return (
    <header className="h-16 border-b border-[#304036] bg-[#15201A]/90 backdrop-blur-md fixed top-0 right-0 left-64 z-20 px-6 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <span className="text-xs font-mono text-[#9A9B91]">CLAIM VERIFICATION PLATFORM</span>
        <span className="text-[#304036]">/</span>
        <span className="text-xs font-mono text-[#B46A45] font-semibold">ClaimNexus v2.0</span>
      </div>

      <div className="flex items-center space-x-4 text-xs">
        {activeExecutionId && (
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-[#B46A45]/15 border border-[#B46A45]/40 text-[#B46A45] font-mono animate-pulse">
            <PlayCircle className="w-3.5 h-3.5" />
            <span>VERIFYING: {activeExecutionId}</span>
          </div>
        )}

        <div className="px-3 py-1 rounded-full border border-[#4E8752]/40 bg-[#4E8752]/10 text-[#4E8752] flex items-center space-x-1.5 font-mono">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>LIVE MODE ONLY</span>
        </div>

        <div className="flex items-center space-x-2 text-[#9A9B91] border-l border-[#304036] pl-4">
          <Cpu className="w-4 h-4 text-[#C29B5B]" />
          <span>Gemini & Groq Agents</span>
        </div>
      </div>
    </header>
  );
};
