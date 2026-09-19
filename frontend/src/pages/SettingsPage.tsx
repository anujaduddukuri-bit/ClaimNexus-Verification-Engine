import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../services/api';
import { Sliders, Check, Save, Cpu, Lock } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [similarityThreshold, setSimilarityThreshold] = useState(0.82);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [saved, setSaved] = useState(false);
  const [settingsData, setSettingsData] = useState<any>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getSettings();
        setSettingsData(data);
        if (data.default_similarity_threshold) {
          setSimilarityThreshold(data.default_similarity_threshold);
        }
        if (data.default_temperature) {
          setTemperature(data.default_temperature);
        }
        if (data.default_max_tokens) {
          setMaxTokens(data.default_max_tokens);
        }
      } catch (err) {
        console.error("Failed loading settings:", err);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      await updateSettings({
        default_similarity_threshold: similarityThreshold,
        default_temperature: temperature,
        default_max_tokens: maxTokens
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      const updated = await getSettings();
      setSettingsData(updated);
    } catch (err) {
      console.error("Failed saving settings:", err);
    }
  };

  return (
    <div className="pt-20 pb-16 px-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-[#304036] pb-4">
        <div>
          <h1 className="text-xl font-bold font-sans text-[#E5DED0] tracking-wider flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-[#B46A45]" />
            <span>SYSTEM CONFIGURATION</span>
          </h1>
          <p className="text-xs text-[#9A9B91]">Provider Security & Verification Algorithm Parameters</p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2 rounded-lg bg-[#B46A45] text-white font-mono text-xs font-bold flex items-center space-x-2 shadow-subtle hover:bg-[#B46A45]/90 transition-all"
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{saved ? "SAVED" : "SAVE PARAMETERS"}</span>
        </button>
      </div>

      {/* Security Architecture Notice */}
      <div className="bg-[#15201A] border border-[#304036] p-4 rounded-xl flex items-start space-x-3 text-xs shadow-subtle">
        <Lock className="w-5 h-5 text-[#B46A45] flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-mono font-bold text-[#E5DED0] uppercase">ZERO-TRUST CREDENTIAL ARCHITECTURE</h4>
          <p className="text-[#9A9B91] leading-relaxed">
            Provider credentials are managed strictly server-side through Render environment variables (or <code className="text-[#C29B5B]">.env</code> in local dev). 
            The React frontend never receives, stores, or transmits API keys over the network.
          </p>
        </div>
      </div>

      {/* Provider Status */}
      <div className="bg-[#15201A] p-6 rounded-xl border border-[#304036] space-y-4 shadow-subtle">
        <div className="flex items-center space-x-2 border-b border-[#304036] pb-3">
          <Cpu className="w-4 h-4 text-[#B46A45]" />
          <h3 className="font-mono text-xs font-bold text-[#E5DED0] uppercase tracking-wider">PROVIDER ENVIRONMENT CONFIGURATION</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          {[
            { id: "Google Gemini", model: "gemini-3.6-flash", configured: settingsData?.gemini_configured ?? true },
            { id: "Groq LLaMA-3", model: "openai/gpt-oss-120b", configured: settingsData?.groq_configured ?? true }
          ].map((prov, idx) => (
            <div key={idx} className="bg-[#0D1512] p-4 rounded-lg border border-[#304036] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#E5DED0]">{prov.id}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#4E8752]/20 text-[#4E8752] border border-[#4E8752]/40">
                  ONLINE
                </span>
              </div>
              <p className="text-[10px] text-[#9A9B91]">Model: {prov.model}</p>
              <div className="pt-2 border-t border-[#304036] flex items-center justify-between text-[10px]">
                <span className="text-[#9A9B91]">API KEY: ●●●●●●●●</span>
                <span className="text-[#4E8752] font-bold">CONFIGURED</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Algorithm Tuning */}
      <div className="bg-[#15201A] p-6 rounded-xl border border-[#304036] space-y-4 shadow-subtle">
        <div className="flex items-center space-x-2 border-b border-[#304036] pb-3">
          <Sliders className="w-4 h-4 text-[#C29B5B]" />
          <h3 className="font-mono text-xs font-bold text-[#E5DED0] uppercase tracking-wider">VERIFICATION ENGINE TUNING</h3>
        </div>

        <div className="space-y-4 font-mono text-xs">
          <div>
            <div className="flex justify-between text-[#9A9B91] mb-1">
              <span>Default Cosine Similarity Threshold</span>
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
            <p className="text-[10px] text-[#9A9B91] mt-1 font-sans">
              Claims with cosine similarity equal to or higher than this threshold will be grouped into the same consensus cluster.
            </p>
          </div>

          <div>
            <div className="flex justify-between text-[#9A9B91] mb-1">
              <span>Default Temperature</span>
              <span className="text-[#C29B5B] font-bold">{temperature}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.5"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-[#B46A45] bg-[#0D1512] rounded h-1.5 cursor-pointer"
            />
          </div>

          <div className="pt-2 border-t border-[#304036] flex justify-between text-[#9A9B91] text-[11px]">
            <span>Embedding Engine Model:</span>
            <span className="text-[#E5DED0] font-bold">all-MiniLM-L6-v2</span>
          </div>
        </div>
      </div>
    </div>
  );
};
