import React, { useState } from 'react';

interface VerbTriangleCardProps {
  presentTerm: string;
  onComplete: (data: { past: string; future: string }) => void;
}

const VerbTriangleCard: React.FC<VerbTriangleCardProps> = ({ presentTerm, onComplete }) => {
  const [past, setPast] = useState('');
  const [future, setFuture] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!past.trim() || !future.trim()) {
      setError('Preencha os dois campos, sô!');
      return;
    }
    setSubmitted(true);
    // In a real app we'd validate against the correct answer.
    // For now we'll just show what the user typed as "submitted".
    setTimeout(() => onComplete({ past, future }), 3000);
  };

  return (
    <div className="flex flex-col gap-4 p-4 animate-in fade-in zoom-in-95 duration-500 bg-white/5 rounded-2xl border border-white/10">
        <div className="text-center font-bold text-cyan-400 text-sm uppercase tracking-widest mb-1">
            {submitted ? "AURA: Óia como ficou o trem!" : "Sacou o Presente? Agora completa o triângulo!"}
        </div>
        {/* Top: Present */}
        <div className="w-full text-center p-4 bg-cyan-950/50 rounded-lg border border-cyan-500/30">
            <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-widest block mb-1">PRESENTE</span>
            <span className="text-xl font-bold text-white">{presentTerm}</span>
        </div>
        
        {/* Triangle / Side-by-side */}
        <div className="flex gap-4 w-full">
            <div className="w-1/2 flex flex-col gap-1">
                <span className="text-[10px] text-white/50 uppercase font-bold">Passado</span>
                <input 
                    value={past}
                    onChange={(e) => setPast(e.target.value)}
                    placeholder="ex: ate"
                    disabled={submitted}
                    className="w-full p-3 bg-black/50 border border-white/20 rounded-lg text-white focus:border-cyan-400 outline-none disabled:opacity-50"
                />
            </div>
            <div className="w-1/2 flex flex-col gap-1">
                <span className="text-[10px] text-white/50 uppercase font-bold">Futuro</span>
                <input 
                    value={future}
                    onChange={(e) => setFuture(e.target.value)}
                    placeholder="ex: will eat"
                    disabled={submitted}
                    className="w-full p-3 bg-black/50 border border-white/20 rounded-lg text-white focus:border-cyan-400 outline-none disabled:opacity-50"
                />
            </div>
        </div>
        {error && <p className="text-red-400 text-xs text-center font-bold">{error}</p>}
        {submitted ? (
            <div className="text-center p-4 bg-green-900/30 rounded-xl border border-green-500/50 text-green-300 space-y-2">
                <p className="text-sm font-bold">Massa, uai! Agora é só continuar os estudos!</p>
                <div className="flex gap-4 text-xs font-mono">
                    <div className="w-1/2">Past: <span className="font-bold text-white">{past}</span></div>
                    <div className="w-1/2">Future: <span className="font-bold text-white">{future}</span></div>
                </div>
            </div>
        ) : (
            <button onClick={handleSubmit} className="w-full bg-cyan-500 hover:bg-cyan-400 py-3 rounded-lg text-black font-black uppercase tracking-widest transition-all">
                Enviar Tenses
            </button>
        )}
    </div>
  );
};

export default VerbTriangleCard;
