import React from 'react';
import { getAvailableLanguages } from '../services/languageEngine';

interface Props {
  onSelect: (lang: string) => void;
}

const LanguageSelection: React.FC<Props> = ({ onSelect }) => {
  const languages = getAvailableLanguages();

  return (
    <div className="flex flex-col items-center justify-center h-full bg-transparent text-white p-6">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-purple-500 font-display tracking-tighter">
          AURA PROTOCOL
        </h1>
        <p className="text-gray-400 font-tech uppercase tracking-widest">Select your operating language</p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => onSelect(lang.code)}
            className="group px-6 py-4 bg-gray-950 border border-gray-800 hover:border-cyan-500 transition-all font-tech text-lg flex items-center justify-between text-left hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]"
          >
            <div className="flex flex-col">
              <span>{lang.name}</span>
              <span className="text-[10px] text-gray-600 font-mono uppercase tracking-wider">{lang.code.toUpperCase()}</span>
            </div>
            <span className="text-xl opacity-60 group-hover:opacity-100 transition-opacity">{lang.flag}</span>
          </button>
        ))}
      </div>
      
      <p className="mt-8 text-[10px] text-gray-600 font-mono tracking-wider text-center max-w-xs">
        Each language adapts to you — phonetics, macetes, common mistakes, and cultural context.
      </p>
    </div>
  );
};

export default LanguageSelection;
