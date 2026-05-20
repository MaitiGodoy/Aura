import React, { useState, useEffect, useRef } from 'react';

interface VerbTriangleCardProps {
  presentTerm: string;
  onComplete: (data: { past: string; future: string }) => void;
}

const VerbTriangleCard: React.FC<VerbTriangleCardProps> = ({ presentTerm, onComplete }) => {
  const [past, setPast] = useState('');
  const [future, setFuture] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSubmit = () => {
    if (!past.trim() || !future.trim()) {
      setError('Preencha os dois campos!');
      return;
    }
    setSubmitted(true);
    timerRef.current = setTimeout(() => onComplete({ past, future }), 2000);
  };

  return (
    <div className="flex flex-col gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
        <div className="text-center font-bold text-cyan-400 text-[10px] uppercase tracking-widest">
            {submitted ? "Completo!" : "Complete o triângulo:"}
        </div>
        <div className="w-full text-center p-2 bg-cyan-950/50 rounded-lg border border-cyan-500/30">
            <span className="text-[8px] text-cyan-400 uppercase font-bold tracking-widest block">PRESENTE</span>
            <span className="text-base font-bold text-white">{presentTerm}</span>
        </div>
        <div className="flex gap-3 w-full">
            <div className="w-1/2 flex flex-col gap-1">
                <span className="text-[8px] text-white/50 uppercase font-bold">Passado</span>
                <input 
                    value={past}
                    onChange={(e) => setPast(e.target.value)}
                    placeholder="ex: ate"
                    disabled={submitted}
                    className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white text-sm focus:border-cyan-400 outline-none disabled:opacity-50"
                />
            </div>
            <div className="w-1/2 flex flex-col gap-1">
                <span className="text-[8px] text-white/50 uppercase font-bold">Futuro</span>
                <input 
                    value={future}
                    onChange={(e) => setFuture(e.target.value)}
                    placeholder="ex: will eat"
                    disabled={submitted}
                    className="w-full p-2 bg-black/50 border border-white/20 rounded-lg text-white text-sm focus:border-cyan-400 outline-none disabled:opacity-50"
                />
            </div>
        </div>
        {error && <p className="text-red-400 text-[10px] text-center font-bold">{error}</p>}
        {submitted ? (
            <div className="text-center p-2 bg-green-900/30 rounded-xl border border-green-500/50 text-green-300 space-y-1">
                <p className="text-xs font-bold">Enviado!</p>
                <div className="flex gap-4 text-[10px] font-mono">
                    <div>Past: <span className="font-bold text-white">{past}</span></div>
                    <div>Future: <span className="font-bold text-white">{future}</span></div>
                </div>
            </div>
        ) : (
            <button onClick={handleSubmit} className="w-full bg-cyan-500 hover:bg-cyan-400 py-2 rounded-lg text-black font-black uppercase tracking-widest text-xs transition-all">
                Enviar
            </button>
        )}
    </div>
  );
};

export default VerbTriangleCard;
