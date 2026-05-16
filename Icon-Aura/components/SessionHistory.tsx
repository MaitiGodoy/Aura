import React, { useState, useEffect } from 'react';
import { SessionReport } from '../types';

interface Props {
  onClose: () => void;
}

const SessionHistory: React.FC<Props> = ({ onClose }) => {
  const [history, setHistory] = useState<SessionReport[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('session_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory).reverse()); // Show newest first
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-2xl flex flex-col h-[80vh] border border-white/10 rounded-xl bg-neutral-900/50 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40">
          <h2 className="text-2xl font-display font-bold text-white tracking-wider flex items-center gap-2">
            <span className="text-yellow-500">📜</span> SESSION LOGS
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {history.length === 0 ? (
            <div className="text-center text-gray-500 font-mono py-12">
              NO DATA FOUND. START A SESSION TO GENERATE LOGS.
            </div>
          ) : (
            history.map((session, index) => (
              <div key={index} className="bg-white/5 border border-white/5 rounded-lg p-4 hover:border-yellow-500/30 transition-colors group">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${session.flowRating === 'GODLIKE' ? 'bg-yellow-500 animate-pulse' : 'bg-blue-500'}`}></div>
                    <span className="font-mono text-xs text-gray-400">
                      {new Date().toLocaleDateString()} {/* In a real app, save timestamp in report */}
                    </span>
                  </div>
                  <div className="font-display font-bold text-yellow-500 text-xl">
                    +{session.totalCoins} XP
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-black/30 p-2 rounded text-center">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Duration</div>
                    <div className="font-mono font-bold text-white">{Math.floor(session.durationSeconds / 60)}m {Math.floor(session.durationSeconds % 60)}s</div>
                  </div>
                  <div className="bg-black/30 p-2 rounded text-center">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Cards</div>
                    <div className="font-mono font-bold text-white">{(session.cardsCollected || []).length}</div>
                  </div>
                  <div className="bg-black/30 p-2 rounded text-center">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Rating</div>
                    <div className={`font-mono font-bold ${session.flowRating === 'GODLIKE' ? 'text-yellow-400' : 'text-blue-400'}`}>
                      {session.flowRating}
                    </div>
                  </div>
                </div>

                {/* Mini Card Preview */}
                {session.cardsCollected && session.cardsCollected.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {session.cardsCollected.map((card, i) => (
                      <div key={i} className="flex-shrink-0 px-2 py-1 bg-white/5 rounded text-[10px] font-mono border border-white/5 text-gray-300 whitespace-nowrap">
                        {card.term}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionHistory;
