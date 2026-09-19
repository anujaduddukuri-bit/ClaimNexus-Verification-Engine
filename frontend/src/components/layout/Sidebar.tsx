import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  CheckCircle2, 
  Layers, 
  FileText, 
  Search,
  Network, 
  BarChart3, 
  Settings, 
  Globe, 
  ShieldCheck
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { label: "Overview", icon: Globe, path: "/" },
    { label: "Verify Claim", icon: CheckCircle2, path: "/workspace" },
    { label: "Executions", icon: Layers, path: "/history" },
    { label: "Claims", icon: FileText, path: "/claims" },
    { label: "Evidence", icon: Search, path: "/evidence" },
    { label: "Consensus", icon: Network, path: "/consensus" },
    { label: "Analytics", icon: BarChart3, path: "/analytics" },
    { label: "Settings", icon: Settings, path: "/settings" },
  ];

  return (
    <aside className="w-64 bg-[#15201A] border-r border-[#304036] flex flex-col justify-between h-screen fixed left-0 top-0 z-30">
      <div>
        {/* Logo */}
        <div className="p-5 border-b border-[#304036] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#B46A45] flex items-center justify-center shadow-subtle">
              <ShieldCheck className="w-5 h-5 text-[#E5DED0]" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wider text-[#E5DED0] font-sans">ClaimNexus</h1>
              <p className="text-[10px] text-[#C29B5B] tracking-widest uppercase">Verification Engine</p>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="p-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-[#20372B] text-[#E5DED0] font-medium border border-[#304036] shadow-subtle'
                      : 'text-[#9A9B91] hover:text-[#E5DED0] hover:bg-[#20372B]/50'
                  }`
                }
              >
                <Icon className="w-4 h-4 text-[#B46A45]" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* System Status Footer */}
      <div className="p-4 border-t border-[#304036]">
        <div className="bg-[#0D1512] p-3 rounded-lg border border-[#304036] flex items-center space-x-3 text-xs">
          <div className="w-2.5 h-2.5 rounded-full bg-[#4E8752] animate-pulse" />
          <div>
            <p className="text-[#E5DED0] font-medium">LIVE PROVIDERS</p>
            <p className="text-[11px] text-[#9A9B91] font-mono">Gemini • Groq</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
