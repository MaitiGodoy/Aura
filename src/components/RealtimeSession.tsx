/** RealtimeSession — Conversação em tempo real com Gemini Live API (continuous streaming) */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CharacterName, CHARACTERS } from '../services/groqPipeline';
import { GeminiLiveClient } from '../services/geminiLiveClient';
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

type LoopState = 'listening' | 'speaking' | 'error' | 'connecting' | 'idle';

const RealtimeSession: React.FC<RealtimeSessionProps> = ({ onExit, onFinish, character = 'aura' }) => {
  const [loopState, setLoopState] = useState<LoopState>('idle');
  const [userCaption, setUserCaption] = useState('');
  const [auraCaption, setAuraCaption] = useState('');
  const [sessionDuration, setSessionDuration] = useState(0);
  const [wordsPracticed, setWordsPracticed] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentAmplitude, setCurrentAmplitude] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(false);

  const charInfo = CHARACTERS[character] || CHARACTERS.aura;

  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const clientRef = useRef<GeminiLiveClient | null>(null);
  const isMountedRef = useRef(true);
  const startTimeRef = useRef(Date.now());

  // Audio playback
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const scheduledTimeRef = useRef(0);
  const isGeminiSpeakingRef = useRef(false);

  // VAD for interruption detection only (not for gating audio)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const silenceStartRef = useRef(0);
  const isUserSpeakingRef = useRef(false);

  const SILENCE_THRESHOLD = 0.03;
  const INTERRUPT_SILENCE_MS = 600;

  // ─── Enable Audio: Request mic permission ──────────────────────────────────

  const enableAudio = useCallback(async () => {
    console.log('[Session] enableAudio called, requesting mic...');
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

      console.log('[Session] Mic granted!', stream.getTracks().map(t => t.label));
      streamRef.current = stream;

      const audioCtx = new AudioContext({ sampleRate: 16000 });
      audioCtxRef.current = audioCtx;
      console.log('[Session] AudioContext created, state:', audioCtx.state);

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);
      analyserRef.current = analyser;

      // VAD visualization loop (always running)
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const vadLoop = () => {
        if (!isMountedRef.current || !analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const normalized = Math.min(avg / 128, 1);
        setCurrentAmplitude(normalized);
        Amplitude.setMic(normalized / 2);
        requestAnimationFrame(vadLoop);
      };
      vadLoop();

      setAudioEnabled(true);
    } catch (err) {
      console.error('[Mic] Error:', err);
      setErrorMsg('Permissão do microfone negada. Habilite nas configurações do navegador.');
      setLoopState('error');
    }
  }, []);

  // ─── Start continuous audio streaming to Gemini ────────────────────────────

  const startStreaming = useCallback(() => {
    if (!audioCtxRef.current || !streamRef.current || !clientRef.current) return;

    console.log('[Session] Starting continuous audio streaming to Gemini');

    const audioCtx = audioCtxRef.current;

    // ScriptProcessor for continuous PCM capture
    const processor = audioCtx.createScriptProcessor(4096, 1, 1);
    const source = audioCtx.createMediaStreamSource(streamRef.current!);

    // Muted gain to avoid feedback loop (audio goes to Gemini, not to speakers)
    const mutedGain = audioCtx.createGain();
    mutedGain.gain.value = 0;

    source.connect(processor);
    processor.connect(mutedGain);
    mutedGain.connect(audioCtx.destination);
    processorRef.current = processor;

    const dataArray = new Uint8Array(analyserRef.current!.frequencyBinCount);

    processor.onaudioprocess = (e) => {
      if (!isMountedRef.current) return;

      // VAD analysis (for interruption detection + amplitude visualization)
      analyserRef.current!.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const normalized = Math.min(avg / 128, 1);

      const isSpeaking = normalized > SILENCE_THRESHOLD;

      // Interruption detection: if Gemini is speaking and user starts talking
      if (isSpeaking && isGeminiSpeakingRef.current) {
        if (silenceStartRef.current > 0) silenceStartRef.current = 0;
        if (!isUserSpeakingRef.current) {
          isUserSpeakingRef.current = true;
          console.log('[VAD] User started speaking while Gemini is talking — will interrupt');
        }
        // Start silence timer for interruption
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (isMountedRef.current && isUserSpeakingRef.current && isGeminiSpeakingRef.current) {
            console.log('[VAD] User spoke long enough — interrupting Gemini');
            clientRef.current?.interrupt();
            isUserSpeakingRef.current = false;
          }
        }, INTERRUPT_SILENCE_MS);
      } else if (!isSpeaking) {
        if (silenceStartRef.current === 0 && isUserSpeakingRef.current) {
          silenceStartRef.current = Date.now();
        }
      }

      // ALWAYS send audio chunks to Gemini — no gating
      const inputData = e.inputBuffer.getChannelData(0);
      const pcm = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        pcm[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32767));
      }
      clientRef.current?.sendAudioChunk(pcm);
    };

    setLoopState('listening');
  }, []);

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
    if (playbackCtxRef.current) {
      playbackCtxRef.current.close();
      playbackCtxRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    scheduledTimeRef.current = 0;
    isUserSpeakingRef.current = false;
    isGeminiSpeakingRef.current = false;
  }, []);

  // ─── Gemini Live Client ────────────────────────────────────────────────────

  useEffect(() => {
    if (!audioEnabled) return;
    isMountedRef.current = true;
    startTimeRef.current = Date.now();

    const timer = setInterval(() => {
      if (isMountedRef.current) setSessionDuration(prev => prev + 0.1);
    }, 100);

    const client = new GeminiLiveClient();
    clientRef.current = client;

    client.on('ready', () => {
      console.log('[Session] Gemini ready, starting continuous streaming');
      startStreaming();
    });

    client.on('audio_chunk', (base64Data) => {
      if (!isMountedRef.current) return;

      if (!playbackCtxRef.current) {
        playbackCtxRef.current = new AudioContext({ sampleRate: 24000 });
        scheduledTimeRef.current = 0;
      }

      const ctx = playbackCtxRef.current;
      const binary = atob(base64Data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      // PCM 16-bit signed → Float32
      const samples = new Float32Array(bytes.length / 2);
      const view = new DataView(bytes.buffer);
      for (let i = 0; i < samples.length; i++) {
        samples[i] = view.getInt16(i * 2, true) / 32768;
      }

      const buffer = ctx.createBuffer(1, samples.length, 24000);
      buffer.getChannelData(0).set(samples);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      const now = ctx.currentTime;
      const start = Math.max(now, scheduledTimeRef.current);
      source.start(start);
      scheduledTimeRef.current = start + buffer.duration;
    });

    client.on('speaking_start', () => {
      if (!isMountedRef.current) return;
      isGeminiSpeakingRef.current = true;
      setLoopState('speaking');
      SoundService.playClick();
    });

    client.on('speaking_end', () => {
      if (!isMountedRef.current) return;
      isGeminiSpeakingRef.current = false;
      setLoopState('listening');
      setUserCaption('');
      setAuraCaption('');
    });

    client.on('transcription', (text, source) => {
      if (!isMountedRef.current) return;
      if (source === 'model') {
        setAuraCaption(prev => prev + text);
      } else {
        setUserCaption(prev => prev + text);
      }
    });

    client.on('interrupted', () => {
      if (!isMountedRef.current) return;
      isGeminiSpeakingRef.current = false;
      isUserSpeakingRef.current = false;
      setLoopState('listening');
      setUserCaption('');
      setAuraCaption('');
    });

    client.on('error', (message) => {
      if (!isMountedRef.current) return;
      setErrorMsg(message);
      setLoopState('error');
    });

    client.on('close', () => {
      if (!isMountedRef.current) return;
      setLoopState('connecting');
    });

    client.connect(character);

    return () => {
      isMountedRef.current = false;
      clearInterval(timer);
      client.disconnect();
      stopAll();
    };
  }, [audioEnabled, character, startStreaming, stopAll]);

  const handleFinish = useCallback(() => {
    stopAll();
    clientRef.current?.disconnect();
    onFinish({
      durationSeconds: sessionDuration,
      wordsPracticed,
      accuracyRate: 100,
      flowRating: wordsPracticed > 10 ? 'GODLIKE' : wordsPracticed > 5 ? 'SOLID' : 'DEVELOPING',
      aiBrief: `Session complete! ${wordsPracticed} exchanges.`,
      timestamp: Date.now(),
    });
  }, [sessionDuration, wordsPracticed, stopAll]);

  // ─── Audio Enable Overlay ─────────────────────────────────────────────────

  if (!audioEnabled) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-black/80">
        <button
          onClick={enableAudio}
          className="px-8 py-4 rounded-full text-white font-bold text-lg transition-all hover:scale-105"
          style={{ background: `linear-gradient(135deg, ${charInfo.color}, ${charInfo.accentColor})` }}
        >
          🎤 Ativar Microfone e Áudio
        </button>
        <p className="text-gray-400 text-sm mt-4">Precisamos de acesso ao seu microfone</p>
      </div>
    );
  }

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
      {userCaption && loopState !== 'listening' && (
        <div className="absolute z-40 flex justify-center px-4 pointer-events-none" style={{ bottom: '140px', left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 32px)' }}>
          <div className="w-full max-w-lg bg-black/50 backdrop-blur-sm rounded-lg overflow-hidden">
            <AuraCaptions text={userCaption} isActive={false} />
          </div>
        </div>
      )}

      {/* Aura response */}
      {auraCaption && loopState !== 'listening' && (
        <div className="absolute z-40 flex justify-center px-4 pointer-events-none" style={{ bottom: '80px', left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 32px)' }}>
          <div className="w-full max-w-lg backdrop-blur-sm rounded-lg p-3 border" style={{ backgroundColor: `${charInfo.color}10`, borderColor: `${charInfo.color}30` }}>
            <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: charInfo.color }}>{charInfo.label}</div>
            <div className="text-sm text-white/90 leading-relaxed">{auraCaption}</div>
          </div>
        </div>
      )}

      {/* State indicator */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50">
        {loopState === 'connecting' && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: charInfo.color, borderTopColor: 'transparent' }} />
            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: charInfo.color }}>Connecting to Gemini...</span>
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
            <button onClick={() => { setErrorMsg(null); enableAudio(); }} className="text-[10px] font-mono text-red-300 underline">Retry</button>
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
