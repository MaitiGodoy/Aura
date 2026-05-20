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
        setTimeout(onClose, 300);
      }, 8000);
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
    <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:top-20 md:right-4 md:left-auto md:translate-x-0 md:translate-y-0 z-50 transition-all duration-300 transform ${visible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
      <div className={`relative bg-black/95 backdrop-blur-2xl border-l-4 rounded-r-lg p-5 shadow-2xl w-[90vw] max-w-[360px] ${getScoreColor(data?.accuracyScore || 0).split(' ')[1]}`}>
        
        <button 
            onClick={() => {
                setVisible(false);
                setTimeout(onClose, 300);
            }}
            className="absolute -top-3 -right-3 bg-neutral-900 text-gray-400 border border-white/20 rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-red-500 hover:text-white transition-colors z-10 shadow-lg"
        >
            ✕
        </button>

        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Análise de Pronúncia</span>
          <div className={`px-3 py-1 rounded-full text-sm font-black text-black ${getScoreBg(data?.accuracyScore || 0)}`}>
            {data?.accuracyScore}%
          </div>
        </div>

        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mb-4">
          <div 
            className={`h-full transition-all duration-1000 ease-out ${getScoreBg(data?.accuracyScore || 0)}`}
            style={{ width: `${data?.accuracyScore || 0}%` }}
          />
        </div>

        <div className="text-2xl font-display font-bold text-white mb-1 leading-tight">
          {data?.targetWord}
        </div>

        {data?.nativePhonetic && (
          <div className="text-sm font-mono text-cyan-400 mb-3">
            → {data.nativePhonetic}
          </div>
        )}

        <div className="flex items-center gap-2 mb-4 bg-white/5 p-2 rounded border border-white/5">
          <span className="text-gray-500 text-[10px] uppercase font-mono">OUVIU:</span>
          <span className="font-mono text-sm text-yellow-300">{data?.userPhonetic}</span>
        </div>

        {data?.syllableBreakdown && data.syllableBreakdown.length > 0 && (
          <div className="mb-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-2">SÍLABAS</div>
            <div className="flex flex-wrap gap-2">
              {data.syllableBreakdown.map((syl, idx) => (
                <div 
                  key={idx}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${
                    syl.correct 
                      ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}
                >
                  {syl.syllable}
                  {!syl.correct && syl.tip && (
                    <div className="text-[9px] text-red-300/70 mt-0.5 font-normal">{syl.tip}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {data?.specificErrors && data.specificErrors.length > 0 && (
          <div className="mb-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-2">AJUSTAR</div>
            <div className="space-y-1">
              {data.specificErrors.map((err, idx) => (
                <div key={idx} className="text-xs text-yellow-300/90 flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  {err}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-sm font-medium text-gray-200 leading-relaxed border-t border-white/10 pt-3 italic">
          "{data?.feedback}"
        </div>

        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[size:100%_4px] opacity-20"></div>
      </div>
    </div>
  );
};

export default PronunciationWidget;
