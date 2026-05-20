import React, { useState, useRef } from 'react';
import ModuleHub from './components/ModuleHub';
import GroqSession from './components/GroqSession';
import LoginScreen from './components/LoginScreen';
import SessionSummary from './components/SessionSummary';
import SessionHistory from './components/SessionHistory';
import AuraBackground from './components/AuraBackground';
import DiagnosticPanel from './components/DiagnosticPanel';
import { AppState, UserProfile, SessionReport } from './types';
import { MemorySystem } from './services/memorySystem';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [lastSessionReport, setLastSessionReport] = useState<SessionReport | null>(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTapDiagnostic = () => {
    tapCountRef.current++;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, 2000);
    if (tapCountRef.current >= 5) { tapCountRef.current = 0; setShowDiagnostic(true); }
  };

  const handleLogin = (user: UserProfile, _handsFree: boolean) => {
    setState(AppState.HUB);
  };

  const handleSelectModule = () => {
    setState(AppState.LIVE_SESSION);
  };

  const handleSessionFinish = (report: SessionReport) => {
      setLastSessionReport(report);
      MemorySystem.saveSessionReport(report);
      setState(AppState.SESSION_SUMMARY);
  };

  const handleSessionExit = () => {
    setState(AppState.HUB);
  };

  const handleLogout = () => {
    setState(AppState.IDLE);
  };

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
  };

  return (
    <div className="glass-wrapper h-full w-full flex flex-col relative font-tech overflow-hidden text-white">
        <AuraBackground />
        <div className="h-full w-full z-10 flex items-center justify-center sm:p-4">
          <div className="w-full h-full sm:max-w-[400px] sm:max-h-[850px] relative bg-transparent overflow-hidden sm:shadow-[0_0_50px_rgba(0,255,255,0.1)] sm:rounded-3xl sm:border border-white/10">
            <div
              onClick={handleTapDiagnostic}
              className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-12 z-[150] cursor-pointer opacity-0"
            />

            {showDiagnostic && <DiagnosticPanel onClose={() => setShowDiagnostic(false)} />}

            <main className="flex-1 relative h-full w-full">
               {state === AppState.IDLE && (
                  <LoginScreen
                      onLogin={handleLogin}
                  />
               )}

               {state === AppState.HUB && (
                  <ModuleHub
                      selectedLanguage={selectedLanguage}
                      onLanguageChange={handleLanguageChange}
                      onSelectModule={handleSelectModule}
                      onLogout={handleLogout}
                  />
               )}
               
               {state === AppState.LIVE_SESSION && (
                  <GroqSession
                      onFinish={handleSessionFinish}
                      onExit={handleSessionExit}
                      selectedLanguage={selectedLanguage}
                  />
               )}
               
               {state === AppState.SESSION_SUMMARY && lastSessionReport && (
                  <SessionSummary report={lastSessionReport} onClose={handleSessionExit} />
               )}

               {state === AppState.SESSION_HISTORY && (
                  <SessionHistory onClose={handleSessionExit} />
               )}
            </main>
          </div>
        </div>
    </div>
  );
};

export default App;
