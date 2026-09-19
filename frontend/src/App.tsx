import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { NeuralBackground } from './three/NeuralBackground';

import { LandingPage } from './pages/LandingPage';
import { Workspace } from './pages/Workspace';
import { ClaimsExplorer } from './pages/ClaimsExplorer';
import { EvidenceExplorer } from './pages/EvidenceExplorer';
import { ConsensusVisualizer } from './pages/ConsensusVisualizer';
import { ExecutionHistory } from './pages/ExecutionHistory';
import { AnalyticsDashboard } from './pages/AnalyticsDashboard';
import { SettingsPage } from './pages/SettingsPage';
import { ErrorBoundary } from './components/layout/ErrorBoundary';

export const App: React.FC = () => {
  const [activeExecutionId, setActiveExecutionId] = useState<string | undefined>(undefined);

  return (
    <Router>
      <div className="min-h-screen bg-[#0D1512] text-[#E5DED0] flex relative overflow-x-hidden">
        {/* 3D Evidence Network Background */}
        <NeuralBackground />

        {/* Sidebar Navigation */}
        <Sidebar />

        {/* Header Bar */}
        <Header activeExecutionId={activeExecutionId} />

        {/* Main Content Area */}
        <main className="flex-1 ml-64 min-h-screen relative z-10">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route 
              path="/workspace" 
              element={
                <ErrorBoundary fallbackTitle="Workspace failed to render">
                  <Workspace 
                    setActiveExecutionId={setActiveExecutionId} 
                  />
                </ErrorBoundary>
              } 
            />
            <Route path="/claims" element={<ErrorBoundary fallbackTitle="Claims view failed"><ClaimsExplorer /></ErrorBoundary>} />
            <Route path="/evidence" element={<ErrorBoundary fallbackTitle="Evidence view failed"><EvidenceExplorer /></ErrorBoundary>} />
            <Route path="/consensus" element={<ErrorBoundary fallbackTitle="Consensus view failed"><ConsensusVisualizer /></ErrorBoundary>} />
            <Route path="/history" element={<ErrorBoundary fallbackTitle="History view failed"><ExecutionHistory /></ErrorBoundary>} />
            <Route path="/analytics" element={<ErrorBoundary fallbackTitle="Analytics view failed"><AnalyticsDashboard /></ErrorBoundary>} />
            <Route path="/settings" element={<ErrorBoundary fallbackTitle="Settings view failed"><SettingsPage /></ErrorBoundary>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
