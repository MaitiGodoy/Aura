import React from 'react';
import { getAvailableLanguages } from '../services/languageEngine';

interface Props {
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  onSelectModule: () => void;
  onLogout: () => void;
}

const ModuleHub: React.FC<Props> = ({ selectedLanguage, onLanguageChange, onSelectModule, onLogout }) => {
  const languages = getAvailableLanguages();

  return (
    <div className="h-full w-full bg-transparent flex flex-col items-center justify-start p-6 relative overflow-y-auto pt-12">
      <div className="z-10 w-full max-w-lg space-y-8">
        {/* Language Selector */}
        <div className="flex items-center justify-between">
          <select
            value={selectedLanguage}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="bg-black/80 border border-gray-800 text-white text-sm font-mono px-3 py-2 rounded-lg focus:border-blue-500 focus:outline-none cursor-pointer"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>

          <button
            onClick={onLogout}
            className="text-[10px] text-gray-600 hover:text-white font-mono uppercase tracking-widest transition-colors"
          >
            ← EXIT
          </button>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-4xl font-black text-white italic tracking-tighter font-display drop-shadow-[0_0_30px_rgba(0,255,255,0.3)] transform -rotate-2">
            AURA
          </h1>
          <p className="text-gray-500 text-xs font-mono uppercase tracking-widest mt-2">Groq + Edge-TTS Pipeline</p>
        </div>

        {/* Start Button */}
        <button
          onClick={onSelectModule}
          className="relative group overflow-hidden text-white font-black p-8 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-left border bg-black w-full"
          style={{ borderColor: '#22c55e33', borderWidth: '1px' }}
        >
          <div className="flex items-center gap-4">
            <span className="text-3xl font-sans font-light" style={{ color: '#22c55e' }}>
              ⚡
            </span>
            <div className="flex flex-col">
              <span className="text-lg font-black uppercase tracking-widest" style={{ color: '#22c55e' }}>
                START SESSION
              </span>
              <span className="text-xs text-gray-400 font-mono mt-0.5">Whisper STT + Llama LLM + Edge-TTS</span>
              <span className="text-[10px] text-gray-600 font-mono mt-1">Tap to speak. Tap again to stop.</span>
            </div>
          </div>
        </button>

        {/* Legend */}
        <div className="mt-6 flex justify-around items-center text-xs text-gray-400">
          <div className="flex flex-col items-center">
            <span style={{ color: '#facc15' }}>●</span>
            <span className="mt-1">LISTENING</span>
          </div>
          <div className="flex flex-col items-center">
            <span style={{ color: '#22c55e' }}>●</span>
            <span className="mt-1">SPEAKING</span>
          </div>
          <div className="flex flex-col items-center">
            <span style={{ color: '#ffffff' }}>●</span>
            <span className="mt-1">IDLE</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleHub;
