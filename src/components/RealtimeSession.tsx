/** RealtimeSession — Conversação automática com VAD (detecção de silêncio) */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GroqPipeline, ConverseResponse, CharacterName, CHARACTERS, CharacterInfo } from '../services/groqPipeline';
import { MemorySystem } from '../services/memorySystem';
import { SoundService } from '../services/soundEffects';
import { Vibration } from '../services/vibrationService';
import { Amplitude } from '../services/amplitudeStore';
import { getCurriculum, getAllIconItems, IconItem } from '../services/curriculum';
import GeometricOrb from './GeometricOrb';
import AuraCaptions from './AuraCaptions';

interface RealtimeSessionProps {
  onExit: () => void;
  onFinish: (report: any) => void;
  selectedLanguage: string;
  initialMode?: string;
  character?: CharacterName;
}

type LoopState = 'listening' | 'thinking' | 'speaking' | 'error';

// VAD — tuned to NOT cut off mid-sentence
const SILENCE_THRESHOLD = 0.12;
const SILENCE_DURATION_MS = 2000;
const MIN_AUDIO_MS = 800;

const RealtimeSession: React.FC<RealtimeSessionProps> = ({ onExit, onFinish, selectedLanguage, character = 'aura' }) => {
  const [loopState, setLoopState] = useState<LoopState>('listening');
  const [caption, setCaption] = useState('');
  const [auraText, setAuraText] = useState('');
  const [sessionDuration, setSessionDuration] = useState(0);
  const [wordsPracticed, setWordsPracticed] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentAmplitude, setCurrentAmplitude] = useState(0);

  const charInfo = CHARACTERS[character] || CHARACTERS.aura;

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const isMountedRef = useRef(true);
  const historyRef = useRef<Array<{ role: string; content: string }>>([]);
  const startTimeRef = useRef(Date.now());
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const speakingStartRef = useRef(0);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    startTimeRef.current = Date.now();

    const timer = setInterval(() => {
      if (isMountedRef.current) setSessionDuration(prev => prev + 0.1);
    }, 100);

    startListening();

    return () => {
      isMountedRef.current = false;
      clearInterval(timer);
      stopAll();
    };
  }, []);

  const stopAll = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
    if (audioPlayerRef.current) { audioPlayerRef.current.pause(); audioPlayerRef.current = null; }
  }, []);

  const startListening = useCallback(async () => {
    if (!isMountedRef.current || isProcessingRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
      });

      streamRef.current = stream;

      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let silenceStart = 0;

      const checkVAD = () => {
        if (!isMountedRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const normalized = Math.min(avg / 128, 1);
        setCurrentAmplitude(normalized);
        Amplitude.setMic(normalized / 2);

        if (normalized > SILENCE_THRESHOLD) {
          if (silenceStart === 0) speakingStartRef.current = Date.now();
          silenceStart = 0;
        } else if (silenceStart === 0 && Date.now() - speakingStartRef.current > MIN_AUDIO_MS) {
          silenceStart = Date.now();
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (isMountedRef.current && !isProcessingRef.current) {
              stopRecordingAndProcess();
            }
          }, SILENCE_DURATION_MS);
        }

        requestAnimationFrame(checkVAD);
      };
      checkVAD();

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorderRef.current = recorder;
      recorder.start(100);
      setLoopState('listening');
      setCaption('');
    } catch {
      if (isMountedRef.current) {
        setErrorMsg('Microfone não acessível. Verifique as permissões.');
        setLoopState('error');
      }
    }
  }, []);

  const stopRecordingAndProcess = useCallback(async () => {
    if (isProcessingRef.current || !recorderRef.current) return;
    isProcessingRef.current = true;
    stopAll();

    const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
    console.log(`[VAD] Audio blob size: ${audioBlob.size} bytes, chunks: ${chunksRef.current.length}`);

    if (audioBlob.size < 500) {
      console.log('[VAD] Audio too short, restarting listen');
      isProcessingRef.current = false;
      if (isMountedRef.current) startListening();
      return;
    }

    setLoopState('thinking');
    SoundService.playClick();

    try {
      const result: ConverseResponse = await GroqPipeline.converse(audioBlob, historyRef.current, character);

      if (!isMountedRef.current) return;

      setCaption(result.transcricao_aluno);
      historyRef.current.push({ role: 'user', content: result.transcricao_aluno });
      setAuraText(result.resposta_texto_aura);
      historyRef.current.push({ role: 'assistant', content: result.resposta_texto_aura });
      setWordsPracticed(prev => prev + 1);

      if (result.audio_url_ou_base64) {
        setLoopState('speaking');
        const audio = new Audio(`data:audio/mp3;base64,${result.audio_url_ou_base64}`);
        audioPlayerRef.current = audio;

        audio.onended = () => {
          audioPlayerRef.current = null;
          if (isMountedRef.current) {
            isProcessingRef.current = false;
            setAuraText('');
            startListening();
          }
        };

        audio.onerror = () => {
          audioPlayerRef.current = null;
          if (isMountedRef.current) {
            isProcessingRef.current = false;
            setAuraText('');
            startListening();
          }
        };

        await audio.play();
      } else {
        isProcessingRef.current = false;
        if (isMountedRef.current) {
          setAuraText('');
          startListening();
        }
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setErrorMsg(err.message || 'Falha na comunicação.');
        setLoopState('error');
        isProcessingRef.current = false;
      }
    }
  }, [startListening, stopAll, character]);

  const handleFinish = useCallback(() => {
    stopAll();
    onFinish({
      durationSeconds: sessionDuration,
      wordsPracticed,
      accuracyRate: 100,
      flowRating: wordsPracticed > 10 ? 'GODLIKE' : wordsPracticed > 5 ? 'SOLID' : 'DEVELOPING',
      difficultyLevel: MemorySystem.getDifficultyLevel(),
      aiBrief: `Session complete! ${wordsPracticed} exchanges.`,
      timestamp: Date.now(),
    });
  }, [sessionDuration, wordsPracticed, onFinish, stopAll]);

  const getOrbState = (): 'idle' | 'listening' | 'speaking' => {
    if (loopState === 'listening') return 'listening';
    if (loopState === 'speaking') return 'speaking';
    return 'idle';
  };

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

      {/* Orb with character colors */}
      <GeometricOrb
        state={getOrbState()}
        amplitude={currentAmplitude}
        character={character}
      />

      {/* User caption */}
      {caption && (
        <div className="absolute z-40 flex justify-center px-4 pointer-events-none" style={{ bottom: '140px', left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 32px)' }}>
          <div className="w-full max-w-lg bg-black/50 backdrop-blur-sm rounded-lg overflow-hidden">
            <AuraCaptions text={caption} isActive={!!caption} />
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
        {loopState === 'listening' && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: charInfo.orbListening }} />
            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: charInfo.orbListening }}>Listening...</span>
          </div>
        )}
        {loopState === 'thinking' && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: charInfo.color, borderTopColor: 'transparent' }} />
            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: charInfo.color }}>Thinking...</span>
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
            <button onClick={() => { setErrorMsg(null); startListening(); }} className="text-[10px] font-mono text-red-300 underline">Retry</button>
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
