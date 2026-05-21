/** RealtimeSession — Conversação em tempo real com Groq STT + LLM + Browser TTS */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CharacterName, CHARACTERS } from '../services/groqPipeline';
import { SoundService } from '../services/soundEffects';
import { Amplitude } from '../services/amplitudeStore';
import GeometricOrb from './GeometricOrb';
import AuraCaptions from './AuraCaptions';

interface RealtimeSessionProps {
  onExit: () => void;
  onFinish: (report: any) => void;
  selectedLanguage: string;
  initialMode?: string;
  character?: CharacterName;
}

type LoopState = 'listening' | 'speaking' | 'error' | 'connecting';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const GROQ_STT_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';

const RealtimeSession: React.FC<RealtimeSessionProps> = ({ onExit, onFinish, character = 'aura' }) => {
  const [loopState, setLoopState] = useState<LoopState>('connecting');
  const [userCaption, setUserCaption] = useState('');
  const [auraText, setAuraText] = useState('');
  const [sessionDuration, setSessionDuration] = useState(0);
  const [wordsPracticed, setWordsPracticed] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentAmplitude, setCurrentAmplitude] = useState(0);

  const charInfo = CHARACTERS[character] || CHARACTERS.aura;

  // Refs for audio processing
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const isMountedRef = useRef(true);
  const conversationHistoryRef = useRef<Array<{role: string, content: string}>>([]);
  const loopStateRef = useRef<LoopState>('connecting');
  const isProcessingRef = useRef(false);

  // VAD refs
  const isUserSpeakingRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceStartRef = useRef(0);
  const audioChunksRef = useRef<Int16Array[]>([]);

  const SILENCE_THRESHOLD = 0.06;
  const SILENCE_DURATION_MS = 800;

  // Keep ref in sync with state
  useEffect(() => { loopStateRef.current = loopState; }, [loopState]);

  // ─── PCM to WAV converter ─────────────────────────────────────────────────

  const pcmToWav = (pcmData: Int16Array, sampleRate: number): Blob => {
    const buffer = new ArrayBuffer(44 + pcmData.length * 2);
    const view = new DataView(buffer);
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + pcmData.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, pcmData.length * 2, true);
    for (let i = 0; i < pcmData.length; i++) view.setInt16(44 + i * 2, pcmData[i], true);
    return new Blob([buffer], { type: 'audio/wav' });
  };

  // ─── STT: Send audio to Groq Whisper ───────────────────────────────────────

  const processUserAudio = useCallback(async () => {
    if (audioChunksRef.current.length === 0 || isProcessingRef.current) return;
    isProcessingRef.current = true;

    const totalLength = audioChunksRef.current.reduce((acc, chunk) => acc + chunk.length, 0);
    const combined = new Int16Array(totalLength);
    let offset = 0;
    for (const chunk of audioChunksRef.current) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    const wavBlob = pcmToWav(combined, 16000);
    audioChunksRef.current = [];

    try {
      setLoopState('connecting');

      const formData = new FormData();
      formData.append('file', wavBlob, 'audio.wav');
      formData.append('model', 'whisper-large-v3');
      formData.append('language', 'pt');

      const response = await fetch(GROQ_STT_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` },
        body: formData,
      });

      if (!response.ok) throw new Error(`STT error: ${response.status}`);

      const data = await response.json();
      const userText = data.text?.trim();

      if (!userText) {
        setLoopState('listening');
        isProcessingRef.current = false;
        return;
      }

      setUserCaption(userText);
      setWordsPracticed(prev => prev + 1);

      // Get AI response
      conversationHistoryRef.current.push({ role: 'user', content: userText });

      const chatResponse = await fetch(GROQ_CHAT_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-70b-versatile',
          messages: [
            { role: 'system', content: charInfo.systemPrompt },
            ...conversationHistoryRef.current.slice(-10),
          ],
          max_tokens: 300,
          temperature: 0.8,
        }),
      });

      if (!chatResponse.ok) throw new Error(`LLM error: ${chatResponse.status}`);

      const chatData = await chatResponse.json();
      const aiResponse = chatData.choices?.[0]?.message?.content?.trim();

      if (!aiResponse) {
        setLoopState('listening');
        isProcessingRef.current = false;
        return;
      }

      conversationHistoryRef.current.push({ role: 'assistant', content: aiResponse });
      setAuraText(aiResponse);

      // Speak using browser TTS
      setLoopState('speaking');
      SoundService.playClick();
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(aiResponse);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const ptBrVoice = voices.find(v => v.lang.startsWith('pt-BR') || v.lang.startsWith('pt_BR'));
      if (ptBrVoice) utterance.voice = ptBrVoice;

      utterance.onend = () => {
        if (isMountedRef.current) {
          setLoopState('listening');
          setAuraText('');
          isProcessingRef.current = false;
        }
      };

      utterance.onerror = () => {
        if (isMountedRef.current) {
          setLoopState('listening');
          isProcessingRef.current = false;
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('[Pipeline] Error:', err);
      if (isMountedRef.current) {
        setErrorMsg('Erro no processamento. Tentando novamente...');
        setLoopState('listening');
      }
      isProcessingRef.current = false;
    }
  }, [charInfo]);

  // ─── Audio Capture Setup ──────────────────────────────────────────────────

  const setupMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 16000,
        },
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      const audioCtx = new AudioContext({ sampleRate: 16000 });
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);

      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      source.connect(processor);
      processor.connect(audioCtx.destination);
      processorRef.current = processor;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      processor.onaudioprocess = (e) => {
        if (!isMountedRef.current) return;

        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const normalized = Math.min(avg / 128, 1);
        setCurrentAmplitude(normalized);
        Amplitude.setMic(normalized / 2);

        const isSpeaking = normalized > SILENCE_THRESHOLD;
        const currentState = loopStateRef.current;

        if (isSpeaking) {
          if (silenceStartRef.current > 0) silenceStartRef.current = 0;
          if (!isUserSpeakingRef.current) {
            isUserSpeakingRef.current = true;
            audioChunksRef.current = [];
          }
          // Record audio chunks while listening and not processing
          if (currentState === 'listening' && !isProcessingRef.current) {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcm = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              pcm[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32767));
            }
            audioChunksRef.current.push(pcm);
          }
        } else {
          if (silenceStartRef.current === 0 && isUserSpeakingRef.current) {
            silenceStartRef.current = Date.now();
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
              if (isMountedRef.current && isUserSpeakingRef.current) {
                isUserSpeakingRef.current = false;
                silenceStartRef.current = 0;
                processUserAudio();
              }
            }, SILENCE_DURATION_MS);
          }
        }
      };

      setLoopState('listening');
    } catch {
      if (isMountedRef.current) {
        setErrorMsg('Microfone não acessível. Verifique as permissões.');
        setLoopState('error');
      }
    }
  }, [processUserAudio]);

  const stopAll = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    window.speechSynthesis.cancel();
    isUserSpeakingRef.current = false;
    isProcessingRef.current = false;
  }, []);

  // ─── Init ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    isMountedRef.current = true;

    const timer = setInterval(() => {
      if (isMountedRef.current) setSessionDuration(prev => prev + 0.1);
    }, 100);

    // Load voices
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.getVoices(); };

    conversationHistoryRef.current = [];

    const initTimer = setTimeout(() => {
      if (isMountedRef.current) setupMic();
    }, 500);

    return () => {
      isMountedRef.current = false;
      clearInterval(timer);
      clearTimeout(initTimer);
      stopAll();
    };
  }, []);

  const handleFinish = useCallback(() => {
    stopAll();
    onFinish({
      durationSeconds: sessionDuration,
      wordsPracticed,
      accuracyRate: 100,
      flowRating: wordsPracticed > 10 ? 'GODLIKE' : wordsPracticed > 5 ? 'SOLID' : 'DEVELOPING',
      aiBrief: `Session complete! ${wordsPracticed} exchanges.`,
      timestamp: Date.now(),
    });
  }, [sessionDuration, wordsPracticed, stopAll]);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full relative overflow-hidden bg-transparent">
      <div className="absolute inset-0 pointer-events-none z-0" style={{ background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.15) 100%)' }} />

      {/* Progress bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gray-900 z-50">
        <div className="h-full transition-all duration-300" style={{ width: `${Math.min((sessionDuration / 3600) * 100, 100)}%`, background: `linear-gradient(to right, ${charInfo.color}, ${charInfo.accentColor})` }} />
      </div>

      {/* Timer */}
      <div className="absolute top-4 left-4 z-50">
        <span className="text-gray-500 font-mono text-[10px] uppercase tracking-widest">Session</span>
        <div className="font-mono text-sm mt-0.5" style={{ color: charInfo.color }}>{Math.floor(sessionDuration / 60)}:{String(Math.floor(sessionDuration % 60)).padStart(2, '0')}</div>
      </div>

      {/* Exit */}
      <button onClick={handleFinish} className="absolute top-3 right-3 z-[120] bg-black/60 backdrop-blur text-white border border-white/20 px-3 py-1.5 text-[10px] font-bold rounded-full hover:bg-white/10 transition-all">FINISH →</button>

      {/* Orb */}
      <GeometricOrb
        state={loopState === 'listening' ? 'listening' : loopState === 'speaking' ? 'speaking' : 'idle'}
        amplitude={currentAmplitude}
        character={character}
      />

      {/* User caption */}
      {userCaption && (
        <div className="absolute z-40 flex justify-center px-4 pointer-events-none" style={{ bottom: '140px', left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 32px)' }}>
          <div className="w-full max-w-lg bg-black/50 backdrop-blur-sm rounded-lg overflow-hidden">
            <AuraCaptions text={userCaption} isActive={!!userCaption} />
          </div>
        </div>
      )}

      {/* Aura response */}
      {auraText && loopState !== 'listening' && (
        <div className="absolute z-40 flex justify-center px-4 pointer-events-none" style={{ bottom: '80px', left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 32px)' }}>
          <div className="w-full max-w-lg backdrop-blur-sm rounded-lg p-3 border" style={{ backgroundColor: `${charInfo.color}10`, borderColor: `${charInfo.color}30` }}>
            <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: charInfo.color }}>{charInfo.label}</div>
            <div className="text-sm text-white/90 leading-relaxed">{auraText}</div>
          </div>
        </div>
      )}

      {/* State indicator */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50">
        {loopState === 'connecting' && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: charInfo.color, borderTopColor: 'transparent' }} />
            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: charInfo.color }}>Processing...</span>
          </div>
        )}
        {loopState === 'listening' && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: charInfo.orbListening }} />
            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: charInfo.orbListening }}>Listening...</span>
          </div>
        )}
        {loopState === 'speaking' && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: charInfo.orbSpeaking }} />
            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: charInfo.orbSpeaking }}>Speaking...</span>
          </div>
        )}
        {loopState === 'error' && (
          <div className="text-center">
            <div className="text-red-400 text-sm mb-2">{errorMsg}</div>
            <button onClick={() => { setErrorMsg(null); setupMic(); }} className="text-[10px] font-mono text-red-300 underline">Retry</button>
          </div>
        )}
      </div>

      {/* Exchanges counter */}
      <div className="absolute bottom-8 right-4 z-50 text-right">
        <div className="font-display font-black text-xl" style={{ color: charInfo.color }}>{wordsPracticed}</div>
        <div className="text-gray-600 font-mono text-[9px] uppercase">Exchanges</div>
      </div>
    </div>
  );
};

export default RealtimeSession;
