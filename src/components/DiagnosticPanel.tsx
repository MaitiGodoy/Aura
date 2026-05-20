import React, { useState, useEffect } from 'react';
import { ApiRouter } from '../services/apiRouter';
import { WebSpeechFallback } from '../services/webSpeechFallback';

type TestResult = 'pending' | 'pass' | 'fail';

const DiagnosticPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [tests, setTests] = useState<Record<string, TestResult>>({
    env: 'pending', groq: 'pending', stt: 'pending', tts: 'pending', mic: 'pending',
  });
  const [groqTestResult, setGroqTestResult] = useState('');

  useEffect(() => {
    runAll();
  }, []);

  const mark = (key: string, result: TestResult) => {
    setTests(prev => ({ ...prev, [key]: result }));
  };

  const runAll = async () => {
    // 1. Env vars
    const hasGoogle = ApiRouter.googleKeys.some(k => k.length > 0);
    const hasGroq = ApiRouter.hasGroq;
    mark('env', (hasGoogle || hasGroq) ? 'pass' : 'fail');

    // 2. Groq API call
    if (hasGroq) {
      mark('groq', 'pending');
      const res = await ApiRouter.groqChat([
        { role: 'user', content: 'Say "ok" in one word.' }
      ], { max_tokens: 10 });
      if (res) {
        setGroqTestResult(res);
        mark('groq', 'pass');
      } else {
        mark('groq', 'fail');
      }
    } else {
      mark('groq', 'fail');
    }

    // 3. STT
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    mark('stt', SR ? 'pass' : 'fail');

    // 4. TTS
    mark('tts', 'speechSynthesis' in window ? 'pass' : 'fail');

    // 5. Microphone
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      mark('mic', 'pass');
    } catch {
      mark('mic', 'fail');
    }
  };

  const color = (t: TestResult) => t === 'pass' ? '#00FF00' : t === 'fail' ? '#FF4444' : '#FFFF00';
  const label = (t: TestResult) => t === 'pass' ? 'OK' : t === 'fail' ? 'FAIL' : '...';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6">
      <div className="w-full max-w-sm bg-[#0a0a1a] border border-cyan-500/30 rounded-2xl p-6 shadow-[0_0_60px_rgba(0,255,255,0.1)]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-cyan-400 font-black text-lg uppercase tracking-widest">Diagnóstico</h2>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white text-xl">✕</button>
        </div>

        <div className="space-y-3 font-mono text-sm">
          {[
            { key: 'env', label: 'API Keys (Google/Groq)' },
            { key: 'groq', label: 'Groq API → resposta' },
            { key: 'stt', label: 'Speech Recognition (STT)' },
            { key: 'tts', label: 'Speech Synthesis (TTS)' },
            { key: 'mic', label: 'Microfone (permissão)' },
          ].map(({ key, label: lbl }) => (
            <div key={key} className="flex justify-between items-center bg-black/40 px-4 py-3 rounded-lg border border-white/5">
              <span className="text-white/60 text-[10px] uppercase tracking-wider">{lbl}</span>
              <span style={{ color: color(tests[key]) }} className="font-black text-xs">{label(tests[key])}</span>
            </div>
          ))}

          {groqTestResult && (
            <div className="mt-4 p-3 bg-cyan-950/30 border border-cyan-500/20 rounded-lg">
              <div className="text-[9px] text-cyan-400/60 uppercase tracking-widest mb-1">Groq respondeu:</div>
              <div className="text-white/80 text-sm italic">"{groqTestResult}"</div>
            </div>
          )}
        </div>

        <button
          onClick={() => { setTests({ env: 'pending', groq: 'pending', stt: 'pending', tts: 'pending', mic: 'pending' }); runAll(); }}
          className="w-full mt-6 bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 font-black py-3 rounded-xl text-xs uppercase tracking-widest hover:bg-cyan-500/30 transition-all"
        >
          Rodar Novamente
        </button>
      </div>
    </div>
  );
};

export default DiagnosticPanel;
