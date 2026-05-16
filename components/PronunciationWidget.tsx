import React, { useEffect, useState } from 'react';
import { PronunciationFeedback } from '../types';

interface Props {
  data: PronunciationFeedback | null;
  onClose: () => void;
}

const PronunciationWidget: React.FC<Props> = ({ data, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (data) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300); // Wait for exit animation
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [data, onClose]);

  if (!data && !visible) return null;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400 border-green-500';
    if (score >= 70) return 'text-yellow-400 border-yellow-500';
    return 'text-red-400 border-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:top-32 md:right-4 md:left-auto md:translate-x-0 md:translate-y-0 z-50 transition-all duration-300 transform ${visible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
      <div className={`relative bg-black/90 backdrop-blur-2xl border-l-4 rounded-r-lg p-4 shadow-2xl w-[85vw] max-w-[320px] ${getScoreColor(data?.accuracyScore || 0).split(' ')[1]}`}>
        
        {/* Close Button */}
        <button 
            onClick={() => {
                setVisible(false);
                setTimeout(onClose, 300);
            }}
            className="absolute -top-3 -right-3 bg-neutral-900 text-gray-400 border border-white/20 rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-red-500 hover:text-white transition-colors z-10 shadow-lg"
        >
            ✕
        </button>

        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Audio Analysis</span>
          <div className={`px-2 py-0.5 rounded text-xs font-black text-black ${getScoreBg(data?.accuracyScore || 0)}`}>
            {data?.accuracyScore}%
          </div>
        </div>

        {/* Accuracy Bar */}
        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mb-4">
          <div 
            className={`h-full transition-all duration-1000 ease-out ${getScoreBg(data?.accuracyScore || 0)}`}
            style={{ width: `${data?.accuracyScore || 0}%` }}
          />
        </div>

        {/* Target Word */}
        <div className="text-3xl font-display font-bold text-white mb-2 leading-tight">
          {data?.targetWord}
        </div>

        {/* Phonetic Comparison */}
        <div className="flex items-center gap-2 mb-4 bg-white/5 p-2 rounded border border-white/5">
          <span className="text-gray-500 text-[10px] uppercase font-mono">HEARD:</span>
          <span className="font-mono text-sm text-yellow-300">/{data?.userPhonetic}/</span>
        </div>

        {/* Feedback */}
        <div className="text-sm font-medium text-gray-200 leading-relaxed border-t border-white/10 pt-3 italic">
          "{data?.feedback}"
        </div>

        {/* Scanline decoration */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[size:100%_4px] opacity-20"></div>
      </div>
    </div>
  );
};

export default PronunciationWidget;
