import React, { useState, useEffect, useRef } from 'react';
import { ConceptCardData, SemanticColor } from '../types';
import { TTSService } from '../services/ttsService';
import { SoundService } from '../services/soundEffects';
import VerbTriangleCard from './VerbTriangleCard';

const COLOR_MAP: Record<SemanticColor, string> = {
  blue:   '#00FFFF',
  red:    '#FF0000',
  green:  '#00FF00',
  purple: '#800080',
  orange: '#FFA500',
  yellow: '#FFFF00',
};

const COLOR_TITLES: Record<SemanticColor, string> = {
  blue:   'NOVA PALAVRA',
  red:    'CORREÇÃO',
  green:  'COMO SE DIZ?',
  purple: 'NOVA FORMA DE FALAR',
  orange: 'PASSADO',
  yellow: 'FUTURO',
};

interface Props {
  data: ConceptCardData | null;
  isVisible: boolean;
  onClose: () => void;
  onResult?: (correct: boolean) => void;
  onRequestHint?: () => void;
  selectedLanguage?: string;
}

const ConceptCard: React.FC<Props> = ({ data, isVisible, onClose, onResult, onRequestHint, selectedLanguage }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [userGuess, setUserGuess] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [showTensesChallenge, setShowTensesChallenge] = useState(false);
  const [tensesCompleted, setTensesCompleted] = useState(false);
  const hintLevelRef = useRef(0);

  useEffect(() => {
    if (isVisible && data) {
      SoundService.playCardFlip();
      setUserGuess('');
      setIsCorrect(null);
      setShowResult(false);
      setHintLevel(0);
      setShowTensesChallenge(false);
      setTensesCompleted(false);
    }
  }, [isVisible, data]);

  if (!data || !isVisible) return null;

  const cardType = data.type || 'VOCAB';
  const semanticColor = data.semanticColor;
  const borderColor = semanticColor ? COLOR_MAP[semanticColor] : '#00FFFF';
  const title = semanticColor ? COLOR_TITLES[semanticColor] : 'CONCEITO';

  const handlePlayAudio = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    await TTSService.speak(data.term);
    setIsPlaying(false);
  };

  const handleHintAudio = async () => {
    if (data.hint) {
      setIsPlaying(true);
      // Translate hint if user language is not English
      const hintText = selectedLanguage && selectedLanguage !== 'en' ? `Dica: ${data.hint}` : data.hint;
      await TTSService.speak(hintText);
      setIsPlaying(false);
    } else if (onRequestHint) {
      onRequestHint();
    }
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

    const options = data.definition.split('/').map(s => normalize(s));
    const correct = options.includes(cleanGuess);

    if (correct) {
      setIsCorrect(true);
      SoundService.playSuccess();
      if (onResult) onResult(true);
      if (cardType === 'BRAINSCAPE') setShowTensesChallenge(true);
    } else {
      setIsCorrect(false);
      SoundService.playError();
      if (onResult) onResult(false);
    }
    setShowResult(true);
  };

  const handleDontKnow = () => {
    if (onRequestHint) {
      onRequestHint();
    } else {
      setIsCorrect(false);
      setShowResult(true);
      if (onResult) onResult(false);
    }
  };

  const getHint = () => {
    if (data.hint) {
      handleHintAudio();
      return;
    }
    hintLevelRef.current += 1;
    if (hintLevelRef.current === 1) {
      const hint = data.definition.split(' ').map(w => w[0] + '.'.repeat(w.length - 1)).join(' ');
      setUserGuess(hint);
    } else if (hintLevelRef.current === 2) {
      setUserGuess(data.definition.substring(0, Math.ceil(data.definition.length / 2)));
    } else {
      setUserGuess(data.definition);
    }
  };

  const isBrainscape = cardType === 'BRAINSCAPE';
  const hasHint = data.hint || cardType === 'BRAINSCAPE';
  const showDica = (!isBrainscape && data.hint) || (isBrainscape && !showResult);
  const isLikelyVerb = data.type === 'CHALLENGE' || data.type === 'MEMORY_GAP' || /\b(to|will|can|must|have|be)\b/i.test(data.definition) || /(ed|ing)$/i.test(data.term);

  return (
    <div
      className="fixed bg-black/90 backdrop-blur-xl flex flex-col"
      style={{
        width: '350px',
        maxHeight: '500px',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 999,
        borderRadius: '16px',
        border: `2px solid ${borderColor}`,
        boxShadow: `0 0 60px ${borderColor}30`,
        padding: '24px',
      }}
    >
      <button
        onClick={onClose}
        className="absolute flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all text-lg font-bold"
        style={{ top: '16px', right: '16px', width: '48px', height: '48px' }}
        aria-label="Close card"
      >
        ✕
      </button>

      <div className="flex flex-col gap-4 overflow-y-auto flex-1 min-h-0 scrollbar-hide" style={{ overscrollBehavior: 'contain' }}>
        <div className="text-center pt-4">
          <h2 className="text-3xl font-display font-black text-white leading-tight drop-shadow-lg break-words mb-2">
            {data.term}
          </h2>

          {(!isBrainscape || showResult) && (
            <div className="flex flex-col items-center gap-1 text-white/70 mb-3">
              <span className="font-mono text-sm font-bold" style={{ color: borderColor }}>
                {data.phonetic}
              </span>
              <span className="text-sm italic font-bold text-white/80">
                {data.definition}
              </span>
            </div>
          )}

          {isBrainscape && !showResult && (
            <div className="text-sm text-white/20 italic mb-3">...</div>
          )}

          <div className="flex gap-2 justify-center">
            <button
              onClick={handlePlayAudio}
              disabled={isPlaying}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[10px] font-bold uppercase tracking-widest ${isPlaying ? 'bg-white text-black border-white' : 'bg-white/5 text-white border-white/20 hover:bg-white/10'}`}
            >
              {isPlaying ? '◉' : '◇'} LISTEN
            </button>
          </div>
        </div>

        {isBrainscape && !showResult && !showTensesChallenge && (
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={userGuess}
                onChange={(e) => setUserGuess(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                placeholder="Traduza para o português..."
                className="w-full bg-black/60 border-2 border-cyan-500/50 rounded-xl px-3 py-3 text-white font-tech text-sm focus:border-cyan-400 outline-none transition-all placeholder:text-white/20"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleDontKnow}
                className="bg-white/5 hover:bg-white/10 text-white/60 font-bold py-3 rounded-xl transition-all active:scale-95 border border-white/10 text-[10px]"
              >
                NÃO SEI
              </button>
              <button
                onClick={getHint}
                className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-bold py-3 rounded-xl transition-all active:scale-95 border border-cyan-500/30 text-[10px] flex items-center justify-center gap-1"
              >
                DICA
              </button>
              <button
                onClick={handleVerify}
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-black py-3 rounded-xl transition-all active:scale-95 shadow-[0_0_20px_rgba(0,240,255,0.4)] text-[10px]"
              >
                VERIFICAR
              </button>
            </div>
          </div>
        )}

        {isBrainscape && showResult && isCorrect && !tensesCompleted && (
          <VerbTriangleCard
            presentTerm={data.term}
            onComplete={(data) => {
              setTensesCompleted(true);
              setShowResult(true);
            }}
          />
        )}

        {showDica && (
          <div className="flex justify-center">
            <button
              onClick={handleHintAudio}
              disabled={isPlaying}
              className="flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-[10px] font-bold uppercase tracking-widest bg-white/5 text-white/60 border-white/20 hover:bg-white/10"
            >
              {isPlaying ? '◉' : '◇'} DICA
            </button>
          </div>
        )}

        {(showResult || !isBrainscape) && (
          <div className="space-y-3 pb-1">
            {isBrainscape && (
              <div className={`text-center py-2 rounded-xl font-black font-mono tracking-widest border-2 flex flex-col gap-1 shadow-lg text-sm ${isCorrect ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-red-500 text-white border-red-400'}`}>
                <span>{isCorrect ? 'SINCRONIZADO!' : 'FALHA'}</span>
                {!isCorrect && (
                  <div className="mt-1 pt-1 border-t border-white/20">
                    <span className="text-[8px] opacity-80 uppercase font-black italic tracking-normal block">RESPOSTA:</span>
                    <span className="text-base uppercase">{data.definition}</span>
                  </div>
                )}
              </div>
            )}

        {isBrainscape && showResult && isCorrect && !tensesCompleted && isLikelyVerb && (
              <div className="flex flex-col items-center gap-2 py-2 bg-cyan-500/5 rounded-2xl border border-cyan-500/20">
                <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">◇ FALE EM VOZ ALTA</div>
                <div className="text-[8px] font-bold text-white/60 uppercase">Pronuncie a palavra agora</div>
              </div>
            )}

            {(!isBrainscape || (showResult && (tensesCompleted || !isCorrect))) && (
              <div className="flex items-start gap-2 bg-white/5 p-3 rounded-xl border-l-4" style={{ borderColor }}>
                <span className="text-xs mt-0.5" style={{ color: borderColor }}>⌖</span>
                <div>
                  <div className="text-[8px] font-mono text-white/40 uppercase mb-0.5 tracking-[0.2em]">MISSÃO</div>
                  <div className="text-xs font-black text-white italic leading-tight">
                    {data.context || "Memorize isso agora."}
                  </div>
                </div>
              </div>
            )}

            {isBrainscape && showResult && tensesCompleted && (
              <button
                onClick={onClose}
                className="w-full bg-white text-black font-black py-3 rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] text-sm"
              >
                PRÓXIMO →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConceptCard;
