import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Cpu, ArrowRight, Layers, Network, Search, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pt-20 px-8 max-w-7xl mx-auto flex flex-col justify-between">
      {/* Hero Section */}
      <section className="text-center py-16 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#15201A] border border-[#304036] text-[#C29B5B] text-xs font-mono mb-6 shadow-subtle">
            <ShieldCheck className="w-3.5 h-3.5 text-[#B46A45]" />
            <span>AGENTIC CLAIM VERIFICATION & EVIDENCE SYSTEM</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-[#E5DED0] tracking-tight mb-6 font-sans leading-tight">
            ClaimNexus
          </h1>

          <p className="text-xl md:text-2xl text-[#C29B5B] font-light mb-4 font-serif italic">
            "Investigate Claims. Compare Evidence. Understand the Truth."
          </p>

          <p className="max-w-3xl mx-auto text-[#9A9B91] text-sm md:text-base leading-relaxed mb-10 font-sans">
            An agentic claim-verification platform that investigates claims using multiple AI research agents, 
            retrieves and classifies grounding evidence, semantically aligns supporting and contradicting statements, 
            detects conflicts, and generates an explainable verification report.
          </p>

          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => navigate('/workspace')}
              className="px-8 py-3.5 rounded-xl bg-[#B46A45] hover:bg-[#B46A45]/90 text-white font-bold text-sm font-mono flex items-center space-x-2 shadow-subtle hover:scale-105 transition-all"
            >
              <span>VERIFY A CLAIM</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/evidence')}
              className="px-8 py-3.5 rounded-xl bg-[#15201A] border border-[#304036] text-[#E5DED0] font-medium text-sm font-mono hover:border-[#B46A45] transition-all"
            >
              EXPLORE EVIDENCE
            </button>
          </div>
        </motion.div>
      </section>

      {/* Visual Pipeline Showcase */}
      <section className="py-12 border-y border-[#304036]">
        <h3 className="text-center font-mono text-xs text-[#9A9B91] uppercase tracking-widest mb-8">
          11-STAGE VERIFICATION WORKFLOW
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center">
          {[
            { step: "01", title: "CLAIM ANALYSIS", desc: "Structure & Qualifiers", icon: Search },
            { step: "02", title: "AI RESEARCH", desc: "Gemini • Groq", icon: Cpu },
            { step: "03", title: "EVIDENCE RETRIEVAL", desc: "Grounding Extraction", icon: Layers },
            { step: "04", title: "CLASSIFICATION", desc: "Supports vs Contradicts", icon: Network },
            { step: "05", title: "CRITIC & VERDICT", desc: "Evidence Weight Audit", icon: ShieldCheck },
            { step: "06", title: "SYNTHESIS", desc: "Explainable Report", icon: CheckCircle2 },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="bg-[#15201A] p-4 rounded-xl border border-[#304036] hover:border-[#B46A45] transition-all">
                <span className="text-[10px] font-mono text-[#B46A45] font-bold block mb-2">{item.step}</span>
                <Icon className="w-5 h-5 mx-auto text-[#C29B5B] mb-2" />
                <h4 className="font-sans text-xs font-bold text-[#E5DED0] mb-1">{item.title}</h4>
                <p className="text-[10px] text-[#9A9B91] font-mono">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Core Features */}
      <section className="py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#15201A] p-6 rounded-2xl border border-[#304036] shadow-subtle">
            <div className="p-3 bg-[#0D1512] rounded-xl w-fit mb-4 text-[#B46A45] border border-[#304036]">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-sans text-[#E5DED0] mb-2">Independent AI Research Agents</h3>
            <p className="text-xs text-[#9A9B91] leading-relaxed">
              Queries Google Gemini and Groq LLaMA-3 concurrently to gather independent research insights and evidence.
            </p>
          </div>

          <div className="bg-[#15201A] p-6 rounded-2xl border border-[#304036] shadow-subtle">
            <div className="p-3 bg-[#0D1512] rounded-xl w-fit mb-4 text-[#C29B5B] border border-[#304036]">
              <Network className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-sans text-[#E5DED0] mb-2">Grounding Evidence Classification</h3>
            <p className="text-xs text-[#9A9B91] leading-relaxed">
              Classifies evidence into Supports ✓, Contradicts ✕, and Neutral ○, evaluating source quality from academic and institutional sources.
            </p>
          </div>

          <div className="bg-[#15201A] p-6 rounded-2xl border border-[#304036] shadow-subtle">
            <div className="p-3 bg-[#0D1512] rounded-xl w-fit mb-4 text-[#4E8752] border border-[#304036]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-sans text-[#E5DED0] mb-2">Explainable Verdict Engine</h3>
            <p className="text-xs text-[#9A9B91] leading-relaxed">
              Generates clean, objective verdicts (Supported, Partially Supported, Contradicted) distinguishing model agreement from evidence proof.
            </p>
          </div>
        </div>
      </section>

      <footer className="py-6 border-t border-[#304036] text-center font-mono text-xs text-[#9A9B91]">
        ClaimNexus — Multi-Agent Claim Verification & Evidence Engine
      </footer>
    </div>
  );
};
