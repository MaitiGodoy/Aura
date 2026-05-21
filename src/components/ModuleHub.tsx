import React, { useState } from 'react';
import { getAvailableLanguages } from '../services/languageEngine';
import { getCurriculum, getTranslatedTag, IconItem } from '../services/curriculum';
import { LiveGameMode } from '../types';
import { SoundService } from '../services/soundEffects';
import { CharacterName, CHARACTERS } from '../services/groqPipeline';

interface Props {
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  onSelectModule: (mode: LiveGameMode, character?: CharacterName) => void;
  onLogout: () => void;
}

const ModuleHub: React.FC<Props> = ({ selectedLanguage, onLanguageChange, onSelectModule, onLogout }) => {
  const languages = getAvailableLanguages();
  const [showCurriculum, setShowCurriculum] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<IconItem | null>(null);
  const curriculum = getCurriculum(selectedLanguage);

  const modules = [
    {
      id: 'AURA',
      title: 'AURA',
      subtitle: 'Free Conversation',
      description: 'Speak naturally. No script, no limits.',
      mode: 'FREE_TALK' as LiveGameMode,
      character: 'aura' as CharacterName,
      color: CHARACTERS.aura.color,
      icon: '◇',
    },
    {
      id: 'iCON',
      title: 'iCON',
      subtitle: 'Structured Lessons',
      description: 'Follow a curriculum. Step by step.',
      mode: 'ICON_MODE' as LiveGameMode,
      character: 'icon' as CharacterName,
      color: CHARACTERS.icon.color,
      icon: '◎',
    },
    {
      id: 'AMOS',
      title: 'AMOS',
      subtitle: 'Spaced Repetition',
      description: 'Lock in what you learned. Memory engine.',
      mode: 'BRAINSCAPE' as LiveGameMode,
      character: 'amos' as CharacterName,
      color: CHARACTERS.amos.color,
      icon: '◇',
    },
    {
      id: 'GAÚCHA',
      title: 'GAÚCHA',
      subtitle: 'Gaúcha Mode',
      description: 'Bah tchê! Learn English with a gaúcha.',
      mode: 'FREE_TALK' as LiveGameMode,
      character: 'gaucho' as CharacterName,
      color: CHARACTERS.gaucho.color,
      icon: '☆',
    },
  ];

  if (showCurriculum) {
    return (
      <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 sm:p-6 overflow-y-auto">
        <div className="w-full max-w-lg bg-[#0a0a1a] border border-white/10 shadow-[0_0_80px_rgba(59,130,246,0.2)] rounded-2xl p-5 flex flex-col max-h-[85vh]">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-tighter leading-none">{curriculum.title}</h2>
              <p className="text-[9px] text-gray-500 font-mono mt-1 tracking-wider">All levels. One flow. No gates.</p>
            </div>
            <button onClick={() => setShowCurriculum(false)} className="text-gray-500 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition-all">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
            {curriculum.modules.map((module) => (
              <div key={module.id} className="space-y-1.5">
                <h3 className="text-blue-400/70 font-mono text-[9px] uppercase tracking-[0.2em] font-bold">{module.title}</h3>
                <div className="grid gap-1">
                  {module.iconItems.map((iconItem) => {
                    const levelTag = iconItem.tags?.[0] || 'BASIC';
                    const displayedTag = getTranslatedTag(levelTag, selectedLanguage);
                    const tagColor = levelTag === 'ADVANCED' ? 'text-red-400/70 border-red-500/20 bg-red-500/5' : levelTag === 'INTERMEDIATE' ? 'text-yellow-400/70 border-yellow-500/20 bg-yellow-500/5' : 'text-green-400/70 border-green-500/20 bg-green-500/5';
                    return (
                      <button
                        key={iconItem.id}
                        onClick={() => {
                          SoundService.playClick();
                          setSelectedIcon(iconItem);
                          onSelectModule('ICON_MODE', 'icon');
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg border transition-all group flex justify-between items-center text-sm ${selectedIcon?.id === iconItem.id ? 'bg-blue-500/15 border-blue-500/40' : 'bg-white/[0.02] border-transparent hover:bg-white/5 hover:border-white/10'}`}
                      >
                        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white/90 font-semibold text-[13px] leading-tight truncate group-hover:text-blue-300 transition-colors">{iconItem.title}</span>
                            <span className={`text-[8px] font-mono px-1 py-px rounded border shrink-0 ${tagColor}`}>{displayedTag}</span>
                          </div>
                          <span className="text-[9px] text-gray-600 font-mono truncate">{iconItem.topics.join(' • ')}</span>
                        </div>
                        <span className="text-white/20 text-sm opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">→</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-white/5 flex justify-center">
            <p className="text-[9px] text-gray-600 font-mono uppercase tracking-widest italic">No levels. No gates. Just progress.</p>
          </div>
        </div>
      </div>
    );
  }

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
              onClick={() => {
                if (mod.id === 'iCON') {
                  setShowCurriculum(true);
                } else {
                  SoundService.playClick();
                  onSelectModule(mod.mode, mod.character);
                }
              }}
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
