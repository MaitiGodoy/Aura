
import React, { useState, useEffect } from 'react';
import ModeSelection from './components/ModeSelection';
import LiveSession from './components/LiveSession';
import ThinkingChat from './components/ThinkingChat';
import ConceptCard from './components/ConceptCard';
import LoginScreen from './components/LoginScreen';
import SessionSummary from './components/SessionSummary';
import SessionHistory from './components/SessionHistory';
import NudgeManager from './components/NudgeManager';
import { AppState, ConceptCardData, UserProfile, SessionReport, LiveGameMode } from './types';
import { MemorySystem } from './services/memorySystem';

const App: React.FC = () => {
  // Start flow at LOGIN
  const [state, setState] = useState<AppState>(AppState.LOGIN);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [currentCard, setCurrentCard] = useState<ConceptCardData | null>(null);
  const [cardVisible, setCardVisible] = useState(false);
  const [lastSessionReport, setLastSessionReport] = useState<SessionReport | null>(null);
  const [isCarMode, setIsCarMode] = useState(false);
  const [isWokeUpMode, setIsWokeUpMode] = useState(false);
  const [initialMode, setInitialMode] = useState<LiveGameMode>('FREE_TALK');
  const [lastCardResult, setLastCardResult] = useState<{ correct: boolean; timestamp: number } | null>(null);

  useEffect(() => {
      // Para fins de teste (forçar a tela de login inicial sempre aparecer):
      // Comentado o auto-login que pulava a tela caso já houvesse cache na máquina.
      /*
      const savedUser = MemorySystem.getActiveUser();
      if (savedUser) {
          setState(AppState.MODE_SELECTION);
      }
      */
  }, []);

  const triggerCard = (card: ConceptCardData) => {
    setCardVisible(false);
    setTimeout(() => {
        setCurrentCard(card);
        setCardVisible(true);
    }, 100);
  };

  const handleLoginSuccess = (user: UserProfile) => {
    // After login, go directly to mode selection (Language is now inside Mode Selection)
    setState(AppState.MODE_SELECTION);
  };

  const handleModeStart = (carMode: boolean, wokeUpMode: boolean, mode: LiveGameMode) => {
    setIsCarMode(carMode);
    setIsWokeUpMode(wokeUpMode);
    setInitialMode(mode);
    setState(AppState.LIVE_SESSION);
  };

  const handleSessionFinish = (report: SessionReport) => {
      setLastSessionReport(report);
      
      const existingHistory = localStorage.getItem('session_history');
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      history.push(report);
      localStorage.setItem('session_history', JSON.stringify(history));

      setState(AppState.SESSION_SUMMARY);
  };

  return (
    <div className="h-full w-full flex flex-col relative bg-black font-tech overflow-hidden text-white">
      <NudgeManager />
      <main className="flex-1 relative h-full w-full">
         
         {state === AppState.LOGIN && (
            <LoginScreen onLoginSuccess={handleLoginSuccess} />
         )}

         {state === AppState.MODE_SELECTION && (
             <ModeSelection 
                onStart={handleModeStart}
                onHistoryClick={() => setState(AppState.SESSION_HISTORY)}
                selectedLanguage={selectedLanguage}
                onLanguageChange={setSelectedLanguage}
             />
         )}

         {state === AppState.IDLE && (
            <div className="h-full w-full flex items-center justify-center">
              <button 
                  onClick={() => setState(AppState.MODE_SELECTION)}
                  className="bg-yellow-500 text-black px-6 py-3 rounded font-bold"
              >
                RETURN TO LOBBY
              </button>
            </div>
         )}
         
         {state === AppState.LIVE_SESSION && (
            <LiveSession 
                onCardTrigger={triggerCard} 
                onFinish={handleSessionFinish} 
                isCardVisible={cardVisible}
                initialCarMode={isCarMode}
                isWokeUpMode={isWokeUpMode}
                initialMode={initialMode}
                lastCardResult={lastCardResult}
                selectedLanguage={selectedLanguage}
            />
         )}
         
         {state === AppState.TEXT_CHAT && (
             <ThinkingChat onCardTrigger={triggerCard} selectedLanguage={selectedLanguage} />
         )}

         {state === AppState.SESSION_SUMMARY && lastSessionReport && (
            <SessionSummary report={lastSessionReport} onClose={() => setState(AppState.MODE_SELECTION)} />
         )}

         {state === AppState.SESSION_HISTORY && (
            <SessionHistory onClose={() => setState(AppState.MODE_SELECTION)} />
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
      />

      {state !== AppState.LOGIN && state !== AppState.LANGUAGE_SELECTION && state !== AppState.IDLE && state !== AppState.SESSION_SUMMARY && state !== AppState.SESSION_HISTORY && state !== AppState.MODE_SELECTION && (
          <div className="absolute top-4 right-4 z-50">
            <button 
                onClick={() => setState(AppState.MODE_SELECTION)}
                className="bg-black/50 backdrop-blur text-red-500 border border-red-900/50 px-4 py-2 text-xs font-bold rounded hover:bg-red-900/50 hover:text-white transition-colors"
            >
                EXIT
            </button>
          </div>
      )}
    </div>
  );
};

export default App;
