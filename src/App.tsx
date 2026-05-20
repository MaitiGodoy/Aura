import React, { useState, useRef } from 'react';
import ModuleHub from './components/ModuleHub';
import LiveSession from './components/LiveSession';
import ConceptCard from './components/ConceptCard';
import LoginScreen from './components/LoginScreen';
import SessionSummary from './components/SessionSummary';
import SessionHistory from './components/SessionHistory';
import AuraBackground from './components/AuraBackground';
import DiagnosticPanel from './components/DiagnosticPanel';
import { AppState, ConceptCardData, UserProfile, SessionReport, LiveGameMode } from './types';
import { MemorySystem } from './services/memorySystem';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [currentCard, setCurrentCard] = useState<ConceptCardData | null>(null);
  const [cardVisible, setCardVisible] = useState(false);
  const [lastSessionReport, setLastSessionReport] = useState<SessionReport | null>(null);
  const [isHandsFree, setIsHandsFree] = useState(false);
  const [initialMode, setInitialMode] = useState<LiveGameMode>('FREE_TALK');
  const [lastCardResult, setLastCardResult] = useState<{ correct: boolean; timestamp: number } | null>(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTapDiagnostic = () => {
    tapCountRef.current++;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, 2000);
    if (tapCountRef.current >= 5) { tapCountRef.current = 0; setShowDiagnostic(true); }
  };

  const triggerCard = (card: ConceptCardData) => {
    setCardVisible(false);
    setCurrentCard(card);
    setCardVisible(true);
  };

  const handleLogin = (user: UserProfile, handsFree: boolean) => {
    setIsHandsFree(handsFree);
    setState(AppState.HUB);
  };

  const handleSelectModule = (mode: LiveGameMode) => {
    setInitialMode(mode);
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
            {/* Hidden tap target for diagnostic (5 taps) */}
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
                  <LiveSession
                      onCardTrigger={triggerCard}
                      onFinish={handleSessionFinish}
                      onExit={handleSessionExit}
                      isCardVisible={cardVisible}
                      isHandsFree={isHandsFree}
                      initialMode={initialMode}
                      lastCardResult={lastCardResult}
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

            <ConceptCard
              data={currentCard}
              isVisible={cardVisible}
              onClose={() => setCardVisible(false)}
              onResult={(correct) => setLastCardResult({ correct, timestamp: Date.now() })}
              onRequestHint={() => {
                  console.log("Hint requested for:", currentCard?.term);
              }}
              selectedLanguage={selectedLanguage}
            />

          </div>
        </div>
    </div>
  );
};

export default App;
