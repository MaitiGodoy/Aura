
import React, { useState, useEffect } from 'react';
import { X, Mic } from 'lucide-react';
import { ConceptCardData } from '../types';
import { TTSService } from '../services/ttsService';
import { SoundService } from '../services/soundEffects';
import { Vibration } from '../services/vibrationService';
import VerbTriangleCard from './VerbTriangleCard';

interface Props {
  data: ConceptCardData | null;
  isVisible: boolean;
  onClose: () => void;
  onResult?: (correct: boolean) => void;
  onRequestHint?: () => void;
}

const ConceptCard: React.FC<Props> = ({ data, isVisible, onClose, onResult, onRequestHint }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [userGuess, setUserGuess] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [streak, setStreak] = useState(0);
  const [hintLevel, setHintLevel] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [showTensesChallenge, setShowTensesChallenge] = useState(false);
  const [tensesCompleted, setTensesCompleted] = useState(false);

  useEffect(() => {
    if (isVisible && data) {
      SoundService.playCardFlip();
      Vibration.newVocab();
      // Reset state for new card
      setUserGuess('');
      setIsCorrect(null);
      setShowResult(false);
      setHintLevel(0);
    }
  }, [isVisible, data]);

  if (!data || !isVisible) return null;

  // --- CARD TYPE MAPPING ---
  
  // 1. BLUE (VOCAB) - Palavra Nova
  const isVocab = data.type === 'VOCAB';

  // 2. RED (CORRECTION) - Correção de erro
  const isCorrection = data.type === 'CORRECTION' || data.type === 'PENALTY' || data.type === 'DRILL';

  // 3. PURPLE (CONTEXT) - Frase de Contexto
  const isContext = data.type === 'CONTEXT';

  // 4. GREEN (CHALLENGE) - Desafio de Produção
  const isChallenge = data.type === 'CHALLENGE' || data.type === 'TRANSLATION';

  // 5. ORANGE (BRAINSCAPE) - Mecânica Brainscape
  const isBrainscape = data.type === 'BRAINSCAPE';

  // 6. YELLOW (MEMORY_GAP) - Itens que dificilmente lembra
  const isMemoryGap = data.type === 'MEMORY_GAP';

  // 7. GOLD (JACKPOT) - Inventa algo / High Roller
  const isJackpot = data.type === 'JACKPOT' || data.type === 'LEGENDARY' || data.type === 'HIGH_ROLLER';
  
  // DEFAULT THEME (Fallback to Purple if undefined)
  let theme = {
    border: '#a855f7', // Purple
    bg: 'rgba(20, 0, 30, 0.98)',
    title: 'CONTEXT FLOW',
    icon: '🔗'
  };

  if (isVocab) {
    theme = {
      border: '#3b82f6', // Blue-500
      bg: 'rgba(0, 10, 40, 0.98)',
      title: 'NEW VOCABULARY',
      icon: '🧠'
    };
  } else if (isCorrection) {
    theme = {
      border: '#ef4444', // Red-500
      bg: 'rgba(30, 0, 0, 0.98)',
      title: 'CORRECTION REQUIRED',
      icon: '🚨'
    };
  } else if (isContext) {
    theme = {
      border: '#a855f7', // Purple-500
      bg: 'rgba(20, 0, 30, 0.98)',
      title: 'CONTEXT LINK',
      icon: '🔗'
    };
  } else if (isChallenge) {
    theme = {
      border: '#22c55e', // Green-500
      bg: 'rgba(0, 30, 0, 0.98)',
      title: 'PRODUCTION CHALLENGE',
      icon: '🎙️'
    };
  } else if (isMemoryGap) {
    theme = {
      border: '#eab308', // Yellow-500
      bg: 'rgba(30, 30, 0, 0.98)',
      title: 'MEMORY GAP WARNING',
      icon: '⚠️'
    };
  } else if (isJackpot) {
    theme = {
      border: '#fbbf24', // Gold-400
      bg: 'rgba(40, 30, 0, 0.98)',
      title: 'HIGH ROLLER / JACKPOT', 
      icon: '💎'
    };
  } else if (isBrainscape) {
    theme = {
      border: '#f59e0b', // Orange-500
      bg: 'rgba(30, 20, 0, 0.98)',
      title: 'BRAINSCAPE RECALL',
      icon: '🧠'
    };
  }

  const handlePlayAudio = async () => {
    if (isPlaying) return;
    Vibration.pulse();
    setIsPlaying(true);
    await TTSService.speak(data.term);
    setIsPlaying(false);
  };

  const handleVerify = () => {
    const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "").trim();
    const cleanGuess = normalize(userGuess);
    
    if (!cleanGuess) {
      setIsCorrect(false);
      setShowResult(true);
      if (onResult) onResult(false);
      return;
    }
    
    // Check for exact match or if the guess is contained in a multi-option definition
    const options = data.definition.split('/').map(s => normalize(s));
    
    const correct = options.includes(cleanGuess);
    
    if (correct) {
      setIsCorrect(true);
      setStreak(prev => prev + 1);
      SoundService.playSuccess();
      Vibration.success();
      if (onResult) onResult(true);
      
      if (isBrainscape) {
        setShowTensesChallenge(true); // Trigger the triangle
      }
    } else {
      setIsCorrect(false);
      setStreak(0);
      SoundService.playError();
      Vibration.error();
      if (onResult) onResult(false);
    }
    setShowResult(true);
  };

  const handleDontKnow = () => {
    if (onRequestHint) {
       onRequestHint();
    } else {
       setIsCorrect(false);
       setStreak(0);
       setShowResult(true);
       Vibration.error();
       if (onResult) onResult(false);
    }
  };

  const getHint = () => {
    Vibration.pulse();
    setHintLevel(prev => prev + 1);
    if (hintLevel === 0) {
      // First hint: Show first letter of each word
      const hint = data.definition.split(' ').map(w => w[0] + '.'.repeat(w.length - 1)).join(' ');
      setUserGuess(hint);
    } else {
      // More hints: reveal more? 
      setUserGuess(data.definition.substring(0, hintLevel + 1));
    }
  };

  return (
    <div className={`fixed top-4 md:top-10 left-1/2 transform -translate-x-1/2 z-[100] w-[95vw] max-w-sm md:max-w-md perspective-1000 card-enter 
      ${isCorrection ? 'animate-[shake_0.4s_ease-in-out]' : ''} 
      ${isJackpot ? 'animate-[pulse_2s_infinite]' : ''}
    `}>
      {/* CARD CONTAINER */}
      <div 
        className="relative shadow-2xl backdrop-blur-2xl rounded-2xl flex flex-col max-h-[90vh]"
        style={{ 
          border: `3px solid ${theme.border}`,
          boxShadow: `0 0 100px ${theme.border}40`,
          backgroundColor: theme.bg
        }}
      >
        {/* STREAK COUNTER (Only Brainscape) */}
        {isBrainscape && streak > 0 && (
          <div className="absolute top-2 right-4 flex items-center gap-1 z-20">
            <span className="text-[10px] font-black text-cyan-400/60 uppercase">STREAK</span>
            <span className="text-xl font-black text-cyan-400 animate-bounce">{streak} 🔥</span>
          </div>
        )}
        {/* GOLD DUST EFFECT FOR JACKPOT */}
        {isJackpot && (
             <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-spin-slow pointer-events-none"></div>
        )}

        {/* HEADER */}
        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/60 relative z-10 flex-shrink-0">
            <div className="flex items-center gap-2">
                <span className="text-xl animate-pulse">{theme.icon}</span>
                <span className="font-mono font-black tracking-[0.2em] text-xs uppercase" style={{ color: theme.border }}>
                    {theme.title}
                </span>
            </div>
            <button 
                onClick={onClose} 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all text-xl"
                aria-label="Close card"
            >✕</button>
        </div>

        {/* BODY (SCROLLABLE IF NEEDED) */}
        <div className="p-5 md:p-8 space-y-5 md:space-y-6 relative z-10 overflow-y-auto scrollbar-hide">
            
                {/* 1. ENGLISH TERM (HERO) */}
                <div className="text-center relative py-6">
                    <div className="text-[10px] font-mono text-white/40 uppercase mb-2 tracking-[0.3em]">LEARNING</div>
                    
                    <h2 className="text-4xl md:text-6xl font-display font-black text-white leading-[1] drop-shadow-lg break-words text-center mb-3">
                        {data.term}
                    </h2>

                    {/* Conditional display for Phonetics and Meaning */}
                    {(!isBrainscape || showResult) && (
                        <div className="flex justify-center items-center gap-4 text-white/70 mb-4">
                            <span className="font-mono text-lg font-bold" style={{ color: theme.border }}>
                                ({data.phonetic})
                            </span>
                            <span className="text-white/40">|</span>
                            <span className="text-lg italic font-bold">
                                {data.definition}
                            </span>
                        </div>
                    )}
                    
                    {/* Placeholder when hidden */}
                    {isBrainscape && !showResult && (
                         <div className="text-lg text-white/20 italic mb-4">...hidden for challenge...</div>
                    )}

                    <div className="flex gap-2 justify-center">
                        <button 
                            onClick={handlePlayAudio}
                            disabled={isPlaying}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-[10px] md:text-xs font-bold uppercase tracking-widest ${isPlaying ? 'bg-white text-black border-white' : 'bg-white/5 text-white border-white/20 hover:bg-white/10'}`}
                        >
                            {isPlaying ? '🔊 PLAYING' : '🔈 LISTEN'}
                        </button>
                    </div>
                </div>

            {/* BRAINSCAPE CHALLENGE INPUT */}
            {isBrainscape && !showResult && !showTensesChallenge && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="relative">
                  <input 
                    type="text" 
                    value={userGuess}
                    onChange={(e) => setUserGuess(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                    placeholder="Translate to Portuguese..."
                    className="w-full bg-black/60 border-2 border-cyan-500/50 rounded-xl px-4 py-4 text-white font-tech text-lg focus:border-cyan-400 outline-none transition-all placeholder:text-white/20"
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={handleDontKnow}
                    className="bg-white/5 hover:bg-white/10 text-white/60 font-bold py-4 rounded-xl transition-all active:scale-95 border border-white/10 text-[10px]"
                  >
                    NÃO SEI
                  </button>
                  <button 
                    onClick={getHint}
                    className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-bold py-4 rounded-xl transition-all active:scale-95 border border-cyan-500/30 text-[10px] flex items-center justify-center gap-1"
                  >
                    <span>💡</span> DICA
                  </button>
                  <button 
                    onClick={handleVerify}
                    className="bg-cyan-500 hover:bg-cyan-400 text-black font-black py-4 rounded-xl transition-all active:scale-95 shadow-[0_0_20px_rgba(0,240,255,0.4)] text-[10px]"
                  >
                    VERIFICAR
                  </button>
                </div>
              </div>
            )}

            {isBrainscape && !tensesCompleted && (
              <VerbTriangleCard 
                presentTerm={data.term}
                onComplete={() => {
                  setTensesCompleted(true);
                  setShowResult(true);
                }}
              />
            )}

            {/* RESULT SECTION */}
            {(showResult || !isBrainscape) && (
              <div className="space-y-4 md:space-y-5 animate-in zoom-in-95 duration-500 pb-2">
                {isBrainscape && (
                  <div className={`text-center py-3 rounded-xl font-black font-mono tracking-widest border-2 flex flex-col gap-1 shadow-lg ${isCorrect ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-red-500 text-white border-red-400'}`}>
                    <span className="text-xl">{isCorrect ? '⚡ NEURAL LINK: SYNCED! ⚡' : '⚠️ SYNC INTERRUPTED ⚠️'}</span>
                    {!isCorrect && (
                      <div className="mt-1 pt-1 border-t border-white/20">
                        <span className="text-[10px] opacity-80 uppercase font-black italic tracking-normal block">TARGET DATA:</span>
                        <span className="text-lg uppercase">{data.definition}</span>
                      </div>
                    )}
                    {isCorrect && (
                       <span className="text-[10px] opacity-80 uppercase font-black italic tracking-normal block">+10 NEURAL PLUGS RECEIVED (GABARITOU!)</span>
                    )}
                  </div>
                )}

                {isBrainscape && showResult && (
                  <div className="flex flex-col items-center gap-2 py-3 bg-cyan-500/5 rounded-2xl border border-cyan-500/20">
                    <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest animate-pulse">🎙️ PRONUNCIATION CHECK</div>
                    <div className="text-[9px] font-bold text-white/60 uppercase">AURA IS LISTENING... SPEAK NOW!</div>
                  </div>
                )}

                {/* 4. INSTRUCTION (ACTION) */}
                <div className="mt-1 pt-4 border-t border-white/10">
                    <div className="flex items-start gap-3 bg-white/5 p-3 md:p-4 rounded-xl border-l-4" style={{ borderColor: theme.border }}>
                        <span className="text-md mt-1">⚡</span>
                        <div>
                            <div className="text-[9px] md:text-[10px] font-mono text-white/40 uppercase mb-1 tracking-[0.2em]">MISSION</div>
                            <div className="text-sm md:text-base font-black text-white italic leading-tight">
                                {data.context || "Memorize this now."}
                            </div>
                        </div>
                    </div>
                </div>

                {/* NEXT BUTTON (Only Brainscape) */}
                {isBrainscape && showResult && (
                  <button 
                    onClick={onClose}
                    className="w-full bg-white text-black font-black py-4 rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] mt-2"
                  >
                    CONTINUE NEXT CARD →
                  </button>
                )}
              </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default ConceptCard;
