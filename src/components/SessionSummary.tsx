
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { SessionReport } from '../types';

interface Props {
  report: SessionReport;
  onClose: () => void;
}

const SessionSummary: React.FC<Props> = ({ report, onClose }) => {
  const minutes = Math.floor(report.durationSeconds / 60);
  const seconds = Math.floor(report.durationSeconds % 60);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-start bg-transparent p-6 overflow-y-auto pt-10">
      
      <div className="max-w-2xl w-full">
        <h1 className="text-blue-400 font-display font-bold text-4xl mb-2 text-center">
            SESSION COMPLETE
        </h1>
        <p className="text-gray-400 font-mono tracking-widest text-sm mb-10 text-center">
            {minutes}m {seconds}s
        </p>

        <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-neutral-900 border border-gray-800 p-4 rounded-xl text-center">
                <div className="text-3xl font-bold text-white">{report.wordsPracticed}</div>
                <div className="text-[10px] text-gray-500 font-mono uppercase mt-1">Words Practiced</div>
            </div>
            <div className="bg-neutral-900 border border-gray-800 p-4 rounded-xl text-center">
                <div className="text-3xl font-bold text-white">{report.accuracyRate}%</div>
                <div className="text-[10px] text-gray-500 font-mono uppercase mt-1">Accuracy</div>
            </div>
            <div className="bg-neutral-900 border border-gray-800 p-4 rounded-xl text-center">
                <div className="text-3xl font-bold text-white">{(report.cardsCollected || []).length}</div>
                <div className="text-[10px] text-gray-500 font-mono uppercase mt-1">Cards Learned</div>
            </div>
        </div>

        {report.aiBrief && (
            <div className="bg-neutral-900 border border-gray-800 p-4 md:p-6 rounded-xl mb-8 text-left">
                <h3 className="text-blue-400 font-mono text-[10px] uppercase tracking-widest mb-3">Session Notes</h3>
                <div className="text-gray-200 font-tech text-sm leading-relaxed prose prose-invert max-w-none">
                    <ReactMarkdown>{report.aiBrief}</ReactMarkdown>
                </div>
            </div>
        )}

        {(report.cardsCollected || []).length > 0 && (
            <div className="bg-neutral-900 border border-gray-800 p-4 rounded-xl mb-8">
                <h3 className="text-blue-400 font-mono text-[10px] uppercase tracking-widest mb-3">Words Covered</h3>
                <div className="flex flex-wrap gap-2">
                    {report.cardsCollected.map((card, i) => (
                        <span key={i} className="bg-blue-500/10 border border-blue-500/30 text-blue-300 px-3 py-1 rounded-full text-xs font-mono">
                            {card.term}
                        </span>
                    ))}
                </div>
            </div>
        )}

        <button 
            onClick={onClose}
            className="w-full bg-blue-500 text-white font-bold text-lg px-12 py-4 rounded-xl hover:bg-blue-600 hover:scale-[1.02] active:scale-95 transition-all"
        >
            CONTINUE
        </button>
      </div>
    </div>
  );
};

export default SessionSummary;
