import { useEffect, useRef } from 'react';

const RUNES = [
  'ᚠ','ᚡ','ᚢ','ᚣ','ᚤ','ᚥ','ᚦ','ᚧ','ᚨ','ᚩ','ᚪ','ᚫ','ᚬ','ᚭ','ᚮ','ᚯ',
  'ᚰ','ᚱ','ᚲ','ᚳ','ᚴ','ᚵ','ᚶ','ᚷ','ᚸ','ᚹ','ᚺ','ᚻ','ᚼ','ᚽ','ᚾ','ᚿ',
  '⇀','↯','⌘','⚛','☯','⟡','⟢','⟣','⟤','⟥','⬡','⬢','⬣','◈','◎','◇',
  '✦','✧','❖','⊛','⊚','⊙','⊝','⋆','★','☆','⎔','⎔','⎔',
];

interface RuneParticle {
  x: number; y: number;
  char: string;
  size: number;
  speedX: number; speedY: number;
  alpha: number; targetAlpha: number;
  glow: boolean;
  blur: boolean;
  phase: number;
}

interface NodePoint {
  x: number; y: number;
  vx: number; vy: number;
  connections: number[];
  alpha: number;
  pulsePhase: number;
}

interface Props {
  intensity?: number;
}

const AuraBackground: React.FC<Props> = ({ intensity = 1 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let w = 0, h = 0;
    let time = 0;
    let nodes: NodePoint[] = [];
    let runes: RuneParticle[] = [];
    let mouseX = 0, mouseY = 0;

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      initScene();
    };

    const initScene = () => {
      // Constellation nodes — fewer on mobile
      const nodeCount = Math.min(Math.floor((w * h) / 30000), 80);
      nodes = [];
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          connections: [],
          alpha: 0.3 + Math.random() * 0.7,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }

      // Build connections (nearest neighbors, up to 3 each)
      for (let i = 0; i < nodes.length; i++) {
        const dists = nodes.map((n, j) => ({ j, d: Math.hypot(n.x - nodes[i].x, n.y - nodes[i].y) }));
        dists.sort((a, b) => a.d - b.d);
        nodes[i].connections = dists.slice(1, 4).map(d => d.j);
      }

      // Runic characters
      const runeCount = Math.floor(nodeCount * 1.5);
      runes = [];
      for (let i = 0; i < runeCount; i++) {
        const glow = Math.random() > 0.6;
        runes.push({
          x: Math.random() * w, y: Math.random() * h,
          char: RUNES[Math.floor(Math.random() * RUNES.length)],
          size: glow ? 12 + Math.random() * 18 : 20 + Math.random() * 40,
          speedX: (Math.random() - 0.5) * 0.2,
          speedY: (Math.random() - 0.5) * 0.2 - 0.05,
          alpha: glow ? 0.15 + Math.random() * 0.3 : 0.02 + Math.random() * 0.06,
          targetAlpha: 0,
          glow,
          blur: !glow && Math.random() > 0.4,
          phase: Math.random() * Math.PI * 2,
        });
      }
    };

    const drawBackground = () => {
      // Deep blue immersive field
      const grad = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
      grad.addColorStop(0, '#0a0a3a');
      grad.addColorStop(0.4, '#060622');
      grad.addColorStop(0.7, '#030315');
      grad.addColorStop(1, '#010108');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Subtle vignette overlay
      const vig = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.max(w, h) * 0.15, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.4)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);
    };

    const drawNetwork = () => {
      // Lines between connected nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        for (const j of n.connections) {
          const m = nodes[j];
          const dx = m.x - n.x, dy = m.y - n.y;
          const dist = Math.hypot(dx, dy);
          if (dist > Math.max(w, h) * 0.3) continue;

          const pulse = 0.5 + 0.5 * Math.sin(time * 0.001 + n.pulsePhase);
          const alpha = (0.08 + 0.12 * pulse) * (1 - dist / (Math.max(w, h) * 0.3));
          
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(m.x, m.y);
          ctx.strokeStyle = `rgba(0, 180, 255, ${alpha * intensity})`;
          ctx.lineWidth = 0.5 + pulse * 0.8;
          ctx.stroke();

          // Faint secondary glow line
          ctx.shadowColor = `rgba(0, 200, 255, ${alpha * 0.3 * intensity})`;
          ctx.shadowBlur = 4;
          ctx.strokeStyle = `rgba(100, 200, 255, ${alpha * 0.2 * intensity})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }
    };

    const drawNodes = () => {
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const pulse = 0.5 + 0.5 * Math.sin(time * 0.0015 + n.pulsePhase * 1.3);
        const alpha = n.alpha * (0.5 + 0.5 * pulse);

        // Outer glow
        const glowRadius = 3 + pulse * 5;
        const gradient = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowRadius);
        gradient.addColorStop(0, `rgba(100, 220, 255, ${alpha * 0.8 * intensity})`);
        gradient.addColorStop(0.4, `rgba(0, 180, 255, ${alpha * 0.3 * intensity})`);
        gradient.addColorStop(1, `rgba(0, 100, 200, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(n.x, n.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Core point
        ctx.shadowColor = `rgba(100, 220, 255, ${alpha * 0.6 * intensity})`;
        ctx.shadowBlur = 8;
        ctx.fillStyle = `rgba(180, 240, 255, ${alpha * intensity})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.2 + pulse * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    const drawRunes = () => {
      for (let i = 0; i < runes.length; i++) {
        const r = runes[i];
        const drift = Math.sin(time * 0.0005 + r.phase) * 0.15;
        const px = r.x + drift;
        const py = r.y;

        if (r.glow) {
          // Glowing runes
          const alpha = r.alpha * (0.6 + 0.4 * Math.sin(time * 0.002 + r.phase));
          ctx.shadowColor = `rgba(150, 220, 255, ${alpha * 0.5 * intensity})`;
          ctx.shadowBlur = 6 + 4 * Math.sin(time * 0.0015 + r.phase);
          ctx.fillStyle = `rgba(180, 235, 255, ${alpha * intensity})`;
          ctx.font = `${r.size}px "Segoe UI Symbol", "Arial Unicode MS", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(r.char, px, py);
          ctx.shadowBlur = 0;
        } else {
          // Blurred dark runes
          const alpha = r.alpha * (0.5 + 0.5 * Math.sin(time * 0.001 + r.phase));
          ctx.fillStyle = `rgba(80, 150, 255, ${alpha * intensity})`;
          ctx.font = `${r.size}px "Segoe UI Symbol", "Arial Unicode MS", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          if (r.blur) {
            ctx.shadowColor = 'rgba(30, 60, 150, 0.1)';
            ctx.shadowBlur = 6;
          }
          ctx.fillText(r.char, px, py);
          ctx.shadowBlur = 0;
        }
      }
    };

    const update = () => {
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx + (mouseX - w / 2) * 0.00002;
        n.y += n.vy + (mouseY - h / 2) * 0.00002;
        if (n.x < 0) n.x = w;
        if (n.x > w) n.x = 0;
        if (n.y < 0) n.y = h;
        if (n.y > h) n.y = 0;
      }

      for (let i = 0; i < runes.length; i++) {
        const r = runes[i];
        r.x += r.speedX;
        r.y += r.speedY;
        r.alpha += (r.targetAlpha - r.alpha) * 0.001;
        if (r.y < -50) { r.y = h + 50; r.x = Math.random() * w; }
        if (r.x < -50) r.x = w + 50;
        if (r.x > w + 50) r.x = -50;
      }
    };

    const loop = (t: number) => {
      time = t;
      drawBackground();
      drawNetwork();
      drawNodes();
      drawRunes();
      update();
      animId = requestAnimationFrame(loop);
    };

    const onMouse = (e: MouseEvent | TouchEvent) => {
      if ('touches' in e && e.touches.length > 0) {
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
      }
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouse as any);
    window.addEventListener('touchmove', onMouse as any, { passive: true });

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(animId);
      } else {
        animId = requestAnimationFrame(loop);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    resize();
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse as any);
      window.removeEventListener('touchmove', onMouse as any);
    };
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};

export default AuraBackground;
