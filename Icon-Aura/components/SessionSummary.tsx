
import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { SessionReport } from '../types';
import { Vibration } from '../services/vibrationService';

interface Props {
  report: SessionReport;
  onClose: () => void;
}

const SessionSummary: React.FC<Props> = ({ report, onClose }) => {
  useEffect(() => {
    Vibration.jackpot();
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-start bg-black/95 backdrop-blur-xl p-6 overflow-y-auto pt-10">
      
      <div className="text-center animate-bounce-in max-w-2xl w-full">
        <h1 className="text-yellow-500 font-display font-black text-6xl mb-2 drop-shadow-[0_0_30px_#EAB308]">
            CASH OUT
        </h1>
        <p className="text-white font-mono tracking-widest text-lg mb-10">
            SESSION COMPLETE
        </p>

        <div className="bg-[#111] border-4 border-yellow-500 p-8 rounded-xl shadow-[0_0_50px_rgba(234,179,8,0.3)] mb-8 transform rotate-1">
            <div className="text-gray-400 font-mono text-xs uppercase mb-2">TOTAL WINNINGS</div>
            <div className="text-7xl font-display font-black text-white">
                ${report.totalCoins.toLocaleString()}
            </div>
        </div>

        <div className="bg-blue-900/20 border border-blue-500/50 p-4 md:p-6 rounded-xl mb-8 text-left relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 text-blue-500/20 font-black text-2xl md:text-4xl">INTEL</div>
                <h3 className="text-[#00f0ff] font-display font-bold text-xs uppercase tracking-widest mb-3">Strategic Debrief</h3>
                <div className="text-gray-200 font-tech text-sm md:text-lg leading-relaxed prose prose-invert max-w-none">
                    <ReactMarkdown>{report.aiBrief}</ReactMarkdown>
                </div>
            </div>

        <div className="flex gap-4 justify-center mb-10">
            <div className="text-center">
                <div className="text-purple-500 font-bold text-2xl">{report.maxMultiplier.toFixed(1)}x</div>
                <div className="text-xs text-gray-500">PEAK MULTIPLIER</div>
            </div>
            <div className="text-center">
                <div className="text-[#00f0ff] font-bold text-2xl">{(report.cardsCollected || []).length}</div>
                <div className="text-xs text-gray-500">LOOT BOXES</div>
            </div>
        </div>

        <button 
            onClick={onClose}
            className="bg-white text-black font-black text-xl px-12 py-4 rounded-full hover:bg-gray-200 hover:scale-105 transition-transform"
        >
            PLAY AGAIN
        </button>
      </div>
    </div>
  );
};

export default SessionSummary;
