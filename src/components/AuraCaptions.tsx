import React, { useEffect, useRef } from 'react';

interface Props {
  text: string;
  isActive?: boolean;
}

const AuraCaptions: React.FC<Props> = ({ text, isActive }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [text]);

  if (!text) return null;

  return (
    <div
      ref={containerRef}
      className="w-full px-4 py-3 scrollbar-hide"
      style={{
        fontFamily: "'Inter', 'Rajdhani', sans-serif",
        fontSize: '0.9rem',
        fontWeight: 500,
        color: 'rgba(255,255,255,0.95)',
        textShadow: '0 0 8px rgba(0,0,0,0.6)',
        wordBreak: 'break-word',
        lineHeight: '1.45',
        maxHeight: '110px',
        overflowY: 'auto',
        zIndex: 9999,
        scrollBehavior: 'smooth'
      }}
    >
      {text}
    </div>
  );
};

export default AuraCaptions;
