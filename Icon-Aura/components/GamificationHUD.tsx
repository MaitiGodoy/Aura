
import React, { useEffect, useState, useRef } from 'react';

interface Props {
  triggerUpdate?: number;
  multiplier: number;
  coins: number;
  hasShield?: boolean;
  isIconMode?: boolean;
  currentPhase?: string;
}

const GamificationHUD: React.FC<Props> = ({ triggerUpdate, multiplier, coins, hasShield, isIconMode, currentPhase }) => {
  const [displayCoins, setDisplayCoins] = useState(0);
  const [popScale, setPopScale] = useState(1);
  const requestRef = useRef<number>(0);

  // Optimized Coin Counter
  useEffect(() => {
    let start = displayCoins;
    const end = coins;
    if (start === end) return;

    const duration = 800; // Slightly slower, more premium feel
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (Ease Out Quart)
      const easeOut = 1 - Math.pow(1 - progress, 4);
      
      const current = Math.floor(start + (end - start) * easeOut);
      setDisplayCoins(current);

      if (progress < 1) {
        requestRef.current = requestAnimationFrame(animate);
      }
    };

    requestRef.current = requestAnimationFrame(animate);
    setPopScale(1.3);
    setTimeout(() => setPopScale(1), 300);
    
    return () => cancelAnimationFrame(requestRef.current);
  }, [coins]);

  return (
    <div className="fixed top-2 sm:top-6 left-0 right-0 px-2 sm:px-6 z-40 pointer-events-none flex justify-between items-start gap-2">
      
      {/* COIN COUNTER (CASINO CHIP STYLE) */}
      <div 
        className={`relative bg-black/80 backdrop-blur-md border rounded-full px-3 sm:px-6 py-1 sm:py-2 flex flex-col items-center shadow-2xl transition-transform duration-200 flex-shrink-0
            ${isIconMode ? 'border-purple-500 shadow-purple-500/20' : 'border-yellow-600/50 shadow-yellow-500/20'}
        `}
        style={{ transform: `scale(${popScale})` }}
      >
        {/* Glow effect */}
        <div className={`absolute inset-0 rounded-full ${isIconMode ? 'bg-gradient-to-r from-transparent via-purple-500/10 to-transparent' : 'bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent'}`}></div>
        
        <div className="flex items-center gap-1.5 sm:gap-3 relative z-10">
            <span className="text-sm sm:text-2xl drop-shadow-md">💰</span>
            <span className={`text-base sm:text-3xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b drop-shadow-sm font-mono tracking-wider
                ${isIconMode ? 'from-white to-purple-400' : 'from-yellow-100 to-yellow-600'}
            `}>
                ${displayCoins.toLocaleString()}
            </span>
        </div>
      </div>

      {/* MULTIPLIER (BADGE STYLE) */}
      <div className="flex flex-col items-end gap-1.5 sm:gap-2 scale-90 sm:scale-100 origin-top-right">
          {currentPhase && (
              <div className="bg-yellow-500/20 border border-yellow-500/50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-md backdrop-blur-sm self-end">
                  <span className="text-[7px] sm:text-[8px] font-black text-yellow-500 font-mono tracking-widest uppercase">
                    PHASE {currentPhase.split('_')[1]}
                  </span>
              </div>
          )}
          
          <div className={`relative transition-all duration-300 ${multiplier > 1 ? 'scale-105 sm:scale-110' : 'scale-100 opacity-70'}`}>
         {/* Shield Glow */}
         {hasShield && <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-60 animate-pulse rounded-full z-0"></div>}
         
         {/* Adrenaline/Heat Glow/Icon Glow */}
         {multiplier > 2 && !hasShield && (
             <div className={`absolute inset-0 blur-2xl opacity-40 animate-pulse rounded-full ${isIconMode ? 'bg-purple-600' : 'bg-red-600'}`}></div>
         )}
         
         <div className={`relative bg-gradient-to-br from-gray-900 to-black border-2 rounded-lg px-2 sm:px-4 py-1 sm:py-2 shadow-2xl flex flex-col items-center min-w-[60px] sm:min-w-[80px] z-10 
            ${hasShield ? 'border-blue-400 shadow-[0_0_15px_#3b82f6]' : (isIconMode ? 'border-purple-500' : 'border-red-500/80')}
         `}>
            {hasShield && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[7px] sm:text-[10px] bg-blue-600 text-white px-1.5 sm:px-2 rounded-full font-bold tracking-widest border border-blue-400 shadow-lg">
                    SHIELDED
                </div>
            )}
            <div className={`text-[7px] sm:text-[9px] font-mono uppercase tracking-widest mb-0.5 sm:mb-1 ${hasShield ? 'text-blue-300' : (isIconMode ? 'text-purple-300' : 'text-red-400')}`}>MULTIPLIER</div>
            <div className={`text-xl sm:text-4xl font-display font-black italic tracking-tighter drop-shadow-md ${hasShield ? 'text-white' : 'text-white'}`}>
               {multiplier.toFixed(1)}x
            </div>
         </div>
      </div>
    </div>
  </div>
);
};

export default GamificationHUD;
