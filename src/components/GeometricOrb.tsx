import React, { useRef, useEffect } from 'react';
import { CharacterName, CHARACTERS } from '../services/groqPipeline';

type OrbState = 'idle' | 'listening' | 'speaking';

interface Props {
  state?: OrbState;
  amplitude?: number;
  className?: string;
  character?: CharacterName;
}

const GeometricOrb: React.FC<Props> = ({ state = 'idle', amplitude = 0, className = '', character = 'aura' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  const charInfo = CHARACTERS[character] || CHARACTERS.aura;

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

      let primaryColor = charInfo.orbIdle;
      let secondaryColor = `rgba(255, 255, 255, 0.2)`;
      let shadowColor = '#ffffff';

      if (state === 'speaking') {
        primaryColor = charInfo.orbSpeaking;
        secondaryColor = charInfo.orbSpeaking.replace('0.9', '0.6');
        shadowColor = charInfo.color;
      } else if (state === 'listening') {
        primaryColor = charInfo.orbListening;
        secondaryColor = charInfo.orbListening.replace('0.9', '0.6');
        shadowColor = charInfo.color;
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
  }, [state, amplitude, character, charInfo]);

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
            ? `radial-gradient(circle, ${charInfo.orbListening.replace('0.9', '0.12')} 0%, transparent 70%)`
            : state === 'speaking'
            ? `radial-gradient(circle, ${charInfo.orbSpeaking.replace('0.9', '0.08')} 0%, transparent 70%)`
            : `radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)`,
          boxShadow: state === 'listening'
            ? `0 0 35px ${charInfo.color}25`
            : state === 'speaking'
            ? `0 0 ${35 + amplitude * 35}px ${charInfo.color}${Math.floor((0.15 + amplitude * 0.25) * 255).toString(16).padStart(2, '0')}`
            : '0 0 25px rgba(255, 255, 255, 0.08)',
        }}
      />
    </div>
  );
};

export default GeometricOrb;
