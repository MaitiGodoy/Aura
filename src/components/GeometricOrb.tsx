import React, { useRef, useEffect } from 'react';

type OrbState = 'idle' | 'listening' | 'speaking';

interface Props {
  state?: OrbState;
  amplitude?: number;
  className?: string;
}

const GeometricOrb: React.FC<Props> = ({ state = 'idle', amplitude = 0, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth || 390;
        canvas.height = parent.clientHeight || 844;
      } else {
        canvas.width = 390;
        canvas.height = 844;
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const draw = () => {
      frameRef.current = requestAnimationFrame(draw);

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      // Clear with transparency to allow the background to be visible
      ctx.clearRect(0, 0, w, h);

      const time = Date.now() / 1000;
      const baseRadius = 94; // slightly larger than avatar 90px radius

      let primaryColor = 'rgba(34, 197, 94, 0.9)'; // green
      let secondaryColor = 'rgba(16, 185, 129, 0.6)'; // emerald
      let shadowColor = '#22c55e';

      if (state === 'speaking') {
        primaryColor = 'rgba(34, 197, 94, 0.9)'; // green
        secondaryColor = 'rgba(16, 185, 129, 0.6)'; // emerald
        shadowColor = '#22c55e';
      } else if (state === 'listening') {
        primaryColor = 'rgba(250, 204, 21, 0.9)'; // yellow
        secondaryColor = 'rgba(245, 158, 11, 0.6)'; // amber
        shadowColor = '#facc15';
      } else if (state === 'idle') {
        primaryColor = 'rgba(255, 255, 255, 0.5)'; // white
        secondaryColor = 'rgba(255, 255, 255, 0.2)';
        shadowColor = '#ffffff';
      }

      // Draw two layered glowing waveforms
      for (let layer = 0; layer < 2; layer++) {
        ctx.save();
        ctx.beginPath();
        
        const numPoints = 120;
        const layerPhase = layer * Math.PI;
        const waveAmplitude = state === 'speaking' 
          ? 18 * amplitude 
          : state === 'listening' 
          ? 8 * amplitude 
          : 3; // small heartbeat when idle
        
        ctx.lineWidth = layer === 0 ? 3.5 : 2;
        ctx.strokeStyle = layer === 0 ? primaryColor : secondaryColor;
        
        ctx.shadowBlur = state === 'idle' ? 5 : 20;
        ctx.shadowColor = shadowColor;

        for (let i = 0; i <= numPoints; i++) {
          const theta = (i / numPoints) * Math.PI * 2;
          const noiseFreq1 = state === 'speaking' ? 7 : 4;
          const noiseFreq2 = state === 'speaking' ? 3 : 2;
          const speed = state === 'speaking' ? 14 : 5;

          const noise = Math.sin(theta * noiseFreq1 + time * speed + layerPhase) * 0.6 + 
                        Math.cos(theta * noiseFreq2 - time * (speed * 0.75) + layerPhase) * 0.4;
          
          const r = baseRadius + noise * waveAmplitude;
          const x = cx + r * Math.cos(theta);
          const y = cy + r * Math.sin(theta);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }
    };

    draw();
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [state, amplitude]);

  // Determine avatar src based on states to display correct version
  const avatarSrc = state === 'listening' 
    ? '/aura_aparencia_nova2.png' 
    : state === 'speaking' 
    ? '/aura_aparencia_nova3.png' 
    : '/aura_aparencia_nova.png';

  return (
    <div className={`absolute inset-0 w-full h-full pointer-events-none z-10 ${className}`}>
      {/* Canvas for the glowing waveforms */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />
      
      {/* Centered Avatar Image */}
      <div 
        className="absolute pointer-events-auto rounded-full overflow-hidden border border-white/20 transition-all duration-300 z-10 flex items-center justify-center"
        style={{
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${1 + (state === 'speaking' ? amplitude * 0.15 : state === 'listening' ? amplitude * 0.05 : 0)})`,
          width: '180px',
          height: '180px',
          boxShadow: state === 'listening' 
            ? '0 0 35px rgba(250, 204, 21, 0.5), inset 0 0 15px rgba(250, 204, 21, 0.3)' 
            : state === 'speaking' 
            ? `0 0 ${35 + amplitude * 35}px rgba(34, 197, 94, ${0.4 + amplitude * 0.4}), inset 0 0 15px rgba(34, 197, 94, 0.3)` 
            : '0 0 25px rgba(255, 255, 255, 0.25), inset 0 0 10px rgba(255, 255, 255, 0.1)',
        }}
      >
        <img 
          src={avatarSrc} 
          alt="Aura Face" 
          className="w-full h-full object-cover select-none"
          onError={(e) => {
            e.currentTarget.src = '/aura_aparencia_nova.png';
          }}
        />
      </div>
    </div>
  );
};

export default GeometricOrb;
