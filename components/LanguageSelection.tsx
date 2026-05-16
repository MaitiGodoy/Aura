import React from 'react';

const LANGUAGES = [
  { id: 'en', name: 'English', flag: '🇺🇸' },
  { id: 'fr', name: 'Français', flag: '🇫🇷' },
  { id: 'it', name: 'Italiano', flag: '🇮🇹' },
  { id: 'es', name: 'Español', flag: '🇪🇸' },
  { id: 'zh', name: 'Mandarim', flag: '🇨🇳' },
  { id: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

interface Props {
  onSelect: (lang: string) => void;
}

const LanguageSelection: React.FC<Props> = ({ onSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-black text-white p-6">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-purple-500 font-display tracking-tighter">
          AURA PROTOCOL
        </h1>
        <p className="text-gray-400 font-tech uppercase tracking-widest">Select your operating language</p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.id}
            onClick={() => onSelect(lang.id)}
            className="group px-6 py-4 bg-gray-950 border border-gray-800 hover:border-cyan-500 transition-all font-tech text-lg flex items-center justify-between text-left hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]"
          >
            <span>{lang.name}</span>
            <span className="text-xl opacity-60 group-hover:opacity-100 transition-opacity">{lang.flag}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelection;
