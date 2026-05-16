import React, { useState, useEffect } from 'react';
import { LiveGameMode } from '../types';
import { SoundService } from '../services/soundEffects';

interface Props {
  onStart: (isCarMode: boolean, isWokeUpMode: boolean, initialMode: LiveGameMode) => void;
  onHistoryClick: () => void;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
}

const LANGUAGES = [
  { id: 'en', name: 'English', flag: '🇺🇸' },
  { id: 'fr', name: 'Français', flag: '🇫🇷' },
  { id: 'it', name: 'Italiano', flag: '🇮🇹' },
  { id: 'es', name: 'Español', flag: '🇪🇸' },
  { id: 'zh', name: 'Mandarim', flag: '🇨🇳' },
  { id: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

const ModeSelection: React.FC<Props> = ({ onStart, onHistoryClick, selectedLanguage, onLanguageChange }) => {
  const [hypeText, setHypeText] = useState("CHOOSE YOUR PATH");
  const [startInCarMode, setStartInCarMode] = useState(false);
  const [startInWokeUpMode, setStartInWokeUpMode] = useState(false);

  useEffect(() => {
    const messages = [
        "CHOOSE YOUR PATH",
        "ENTER THE ARENA",
        "NO BORING CLASSES",
        "HIGH STAKES ONLY"
    ];
    let i = 0;
    const interval = setInterval(() => {
        i = (i + 1) % messages.length;
        setHypeText(messages[i]);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleStart = (mode: LiveGameMode) => {
    SoundService.playClick();
    onStart(startInCarMode, startInWokeUpMode, mode);
  };

  return (
    <div className="h-full w-full bg-[#030303] flex flex-col items-center justify-center p-6 relative overflow-y-auto">
      
      {/* Background Grid & Ambience */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(20,20,20,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(20,20,20,0.5)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>
      
      <div className="z-10 w-full max-w-2xl text-center space-y-8 pb-10">
        
        <h2 className="text-2xl font-tech text-yellow-500 tracking-widest uppercase animate-pulse">
            {hypeText}
        </h2>

        {/* LANGUAGE SELECTOR */}
        <div className="flex justify-center mb-8">
            <div className="relative inline-block w-48">
                <select 
                    value={selectedLanguage}
                    onChange={(e) => onLanguageChange(e.target.value)}
                    className="block w-full appearance-none bg-neutral-900 border border-gray-700 hover:border-yellow-500 text-white font-mono text-sm py-3 px-4 pr-8 rounded transition-all focus:outline-none focus:ring-1 focus:ring-yellow-500 shadow-[0_0_15px_rgba(0,0,0,0.5)] cursor-pointer"
                >
                    {LANGUAGES.map(lang => (
                        <option key={lang.id} value={lang.id}>
                            {lang.flag} {lang.name}
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
            </div>
        </div>

        {/* START BUTTONS */}
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                    onClick={() => handleStart('FREE_TALK')}
                    className="relative group overflow-hidden bg-yellow-500 text-black font-black py-10 rounded-xl hover:scale-[1.05] transition-all shadow-[0_0_40px_rgba(234,179,8,0.3)] active:scale-95 flex flex-col items-center justify-center border-2 border-white/20"
                >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shine_1s_infinite]"></div>
                    <span className="text-4xl mb-2">⚡</span>
                    <span className="text-sm font-black uppercase tracking-widest">Aura Conversa</span>
                </button>

                <button 
                    onClick={() => handleStart('ICON_STUDY')}
                    className="relative group overflow-hidden bg-[#a855f7] text-white font-black py-10 rounded-xl hover:scale-[1.05] transition-all shadow-[0_0_40px_rgba(168,85,247,0.3)] active:scale-95 flex flex-col items-center justify-center border-2 border-white/20"
                >
                    <span className="text-4xl mb-2">🎓</span>
                    <span className="text-sm font-black uppercase tracking-widest">Aura Icon</span>
                </button>

                <button 
                    onClick={() => handleStart('BRAINSCAPE')}
                    className="relative group overflow-hidden bg-[#00f0ff] text-black font-black py-10 rounded-xl hover:scale-[1.05] transition-all shadow-[0_0_40px_rgba(0,240,255,0.3)] active:scale-95 flex flex-col items-center justify-center border-2 border-white/20"
                >
                    <span className="text-4xl mb-2">🧠</span>
                    <span className="text-sm font-black uppercase tracking-widest">Brainscape</span>
                </button>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-6">
                <label className="flex items-center justify-center gap-2 cursor-pointer group">
                    <input 
                        type="checkbox" 
                        checked={startInCarMode} 
                        onChange={(e) => setStartInCarMode(e.target.checked)}
                        className="w-5 h-5 accent-yellow-500 bg-black border-gray-700 rounded cursor-pointer"
                    />
                    <span className="text-xs font-mono text-gray-400 group-hover:text-yellow-500 transition-colors uppercase tracking-widest">
                        Modo Carro 🚗
                    </span>
                </label>

                <label className="flex items-center justify-center gap-2 cursor-pointer group">
                    <input 
                        type="checkbox" 
                        checked={startInWokeUpMode} 
                        onChange={(e) => setStartInWokeUpMode(e.target.checked)}
                        className="w-5 h-5 accent-blue-500 bg-black border-gray-700 rounded cursor-pointer"
                    />
                    <span className="text-xs font-mono text-gray-400 group-hover:text-blue-500 transition-colors uppercase tracking-widest">
                        Acabei de Acordar ☕
                    </span>
                </label>
            </div>
        </div>
        
        <div className="flex justify-center items-center gap-6 text-[10px] text-gray-600 font-mono uppercase tracking-widest pt-8">
            <span className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors" onClick={onHistoryClick}>LOGS DE SESSÃO</span>
        </div>
      </div>
      
      <style>{`
        @keyframes shine {
            100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default ModeSelection;