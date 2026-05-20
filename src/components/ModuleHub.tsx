import React from 'react';
import { getAvailableLanguages } from '../services/languageEngine';
import { LiveGameMode } from '../types';

interface Props {
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  onSelectModule: (mode: LiveGameMode) => void;
  onLogout: () => void;
}

const ModuleHub: React.FC<Props> = ({ selectedLanguage, onLanguageChange, onSelectModule, onLogout }) => {
  const languages = getAvailableLanguages();

  const modules = [
    {
      id: 'AURA',
      title: 'AURA',
      subtitle: 'Free Conversation',
      description: 'Speak naturally. No script, no limits.',
      mode: 'FREE_TALK' as LiveGameMode,
      color: '#00FFFF',
      icon: '◇',
    },
    {
      id: 'iCON',
      title: 'iCON',
      subtitle: 'Structured Lessons',
      description: 'Follow a curriculum. Step by step.',
      mode: 'ICON_MODE' as LiveGameMode,
      color: '#E6E6FA',
      icon: '◎',
    },
    {
      id: 'AMOS',
      title: 'AMOS',
      subtitle: 'Spaced Repetition',
      description: 'Lock in what you learned. Memory engine.',
      mode: 'BRAINSCAPE' as LiveGameMode,
      color: '#00FFFF',
      icon: '◇',
    },
  ];

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
          <p className="text-gray-500 text-xs font-mono uppercase tracking-widest mt-2">Choose your mode</p>
        </div>

        {/* Module Cards */}
        <div className="grid gap-4">
          {modules.map((mod) => (
            <button
              key={mod.id}
              onClick={() => onSelectModule(mod.mode)}
              className="relative group overflow-hidden text-white font-black p-6 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-left border bg-black"
              style={{ borderColor: `${mod.color}33`, borderWidth: '1px' }}
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl font-sans font-light" style={{ color: mod.color }}>
                  {mod.icon}
                </span>
                <div className="flex flex-col">
                  <span className="text-lg font-black uppercase tracking-widest" style={{ color: mod.color }}>
                    {mod.title}
                  </span>
                  <span className="text-xs text-gray-400 font-mono mt-0.5">{mod.subtitle}</span>
                  <span className="text-[10px] text-gray-600 font-mono mt-1">{mod.description}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Legend for modules */}
        <div className="mt-6 flex justify-around items-center text-xs text-gray-400">
          {modules.map(mod => (
            <div key={mod.id} className="flex flex-col items-center">
              <span style={{ color: mod.color }}>{mod.icon}</span>
              <span className="mt-1 uppercase" style={{ color: mod.color }}>{mod.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModuleHub;
