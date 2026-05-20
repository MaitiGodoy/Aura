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

      ctx.clearRect(0, 0, w, h);

      const time = Date.now() / 1000;
      const baseRadius = 94;

      let primaryColor = 'rgba(255, 255, 255, 0.5)';
      let secondaryColor = 'rgba(255, 255, 255, 0.2)';
      let shadowColor = '#ffffff';

      if (state === 'speaking') {
        primaryColor = 'rgba(34, 197, 94, 0.9)';
        secondaryColor = 'rgba(16, 185, 129, 0.6)';
        shadowColor = '#22c55e';
      } else if (state === 'listening') {
        primaryColor = 'rgba(250, 204, 21, 0.9)';
        secondaryColor = 'rgba(245, 158, 11, 0.6)';
        shadowColor = '#facc15';
      }

      // Draw smoke rings
      for (let layer = 0; layer < 2; layer++) {
        ctx.save();
        ctx.beginPath();
        
        const numPoints = 120;
        const layerPhase = layer * Math.PI;
        const waveAmplitude = state === 'speaking' 
          ? 18 * amplitude 
          : state === 'listening' 
          ? 8 * amplitude 
          : 3;
        
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

  return (
    <div className={`absolute inset-0 w-full h-full pointer-events-none z-10 ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />
      
      {/* Clean center circle - no photo */}
      <div 
        className="absolute pointer-events-none rounded-full z-10 flex items-center justify-center"
        style={{
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${1 + (state === 'speaking' ? amplitude * 0.15 : state === 'listening' ? amplitude * 0.05 : 0)})`,
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: state === 'listening' 
            ? 'radial-gradient(circle, rgba(250,204,21,0.12) 0%, transparent 70%)' 
            : state === 'speaking' 
            ? `radial-gradient(circle, rgba(34,197,94,${0.08 + amplitude * 0.12}) 0%, transparent 70%)` 
            : 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
          boxShadow: state === 'listening' 
            ? '0 0 35px rgba(250, 204, 21, 0.15)' 
            : state === 'speaking' 
            ? `0 0 ${35 + amplitude * 35}px rgba(34, 197, 94, ${0.15 + amplitude * 0.25})` 
            : '0 0 25px rgba(255, 255, 255, 0.08)',
        }}
      />
    </div>
  );
};

export default GeometricOrb;
