/** GroqSession — Push-to-talk session using Groq + Edge-TTS API server */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GroqPipeline, ConverseResponse } from '../services/groqPipeline';
import { MemorySystem } from '../services/memorySystem';
import { SoundService } from '../services/soundEffects';
import { Vibration } from '../services/vibrationService';
import { Amplitude } from '../services/amplitudeStore';
import GeometricOrb from './GeometricOrb';
import AuraCaptions from './AuraCaptions';

interface GroqSessionProps {
  onExit: () => void;
  onFinish: (report: any) => void;
  selectedLanguage: string;
}

type SessionState = 'idle' | 'recording' | 'processing' | 'playing' | 'checking';

const GroqSession: React.FC<GroqSessionProps> = ({ onExit, onFinish, selectedLanguage }) => {
  const [sessionState, setSessionState] = useState<SessionState>('checking');
  const [caption, setCaption] = useState('');
  const [auraResponse, setAuraResponse] = useState('');
  const [sessionDuration, setSessionDuration] = useState(0);
  const [wordsPracticed, setWordsPracticed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [serverOnline, setServerOnline] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isMountedRef = useRef(true);
  const historyRef = useRef<Array<{ role: string; content: string }>>([]);
  const startTimeRef = useRef(Date.now());
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Amplitude monitoring
  const [currentAmplitude, setCurrentAmplitude] = useState(0);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);

  useEffect(() => {
    isMountedRef.current = true;
    startTimeRef.current = Date.now();

    // Check if API server is online
    const checkServer = async () => {
      try {
        const res = await fetch('http://localhost:8080/health');
        if (res.ok) {
          setServerOnline(true);
          setSessionState('idle');
        } else {
          setError('API server is not responding.');
        }
      } catch {
        setError('Cannot connect to API server. Make sure it is running on port 8080.');
      }
    };
    checkServer();

    const timer = setInterval(() => {
      if (isMountedRef.current) {
        setSessionDuration(prev => prev + 0.1);
      }
    }, 100);

    return () => {
      isMountedRef.current = false;
      clearInterval(timer);
      cleanup();
    };
  }, []);

  const cleanup = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setAuraResponse('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });

      streamRef.current = stream;

      // Setup analyser for amplitude
      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkAmplitude = () => {
        if (!isMountedRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const normalized = Math.min(avg / 128, 1);
        setCurrentAmplitude(normalized);
        setIsUserSpeaking(normalized > 0.2);
        Amplitude.setMic(normalized / 2);
        requestAnimationFrame(checkAmplitude);
      };
      checkAmplitude();

      // Setup MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        if (!isMountedRef.current) return;

        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        if (audioBlob.size < 1000) {
          setError('Áudio muito curto. Fale mais.');
          setSessionState('idle');
          return;
        }

        setSessionState('processing');
        SoundService.playClick();

        try {
          const result: ConverseResponse = await GroqPipeline.converseAndPlay(
            audioBlob,
            historyRef.current,
            (transcript) => {
              if (isMountedRef.current) {
                setCaption(transcript);
                historyRef.current.push({ role: 'user', content: transcript });
              }
            },
            (response) => {
              if (isMountedRef.current) {
                setAuraResponse(response);
                historyRef.current.push({ role: 'assistant', content: response });
                setWordsPracticed(prev => prev + 1);
              }
            },
          );

          if (isMountedRef.current) {
            setSessionState('idle');
          }
        } catch (err: any) {
          if (isMountedRef.current) {
            setError(err.message || 'Falha na comunicação com o servidor.');
            setSessionState('idle');
          }
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setSessionState('recording');
      SoundService.playClick();
      Vibration.pulse();
    } catch (err: any) {
      setError('Não foi possível acessar o microfone.');
      console.error(err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      Vibration.pulse();
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (streamRef.current) {
      const newState = !isMuted;
      streamRef.current.getTracks().forEach(track => track.enabled = !newState);
      setIsMuted(newState);
    }
  }, [isMuted]);

  const handleFinish = useCallback(() => {
    cleanup();
    onFinish({
      durationSeconds: sessionDuration,
      wordsPracticed,
      accuracyRate: 100,
      flowRating: wordsPracticed > 10 ? 'GODLIKE' : wordsPracticed > 5 ? 'SOLID' : 'DEVELOPING',
      difficultyLevel: MemorySystem.getDifficultyLevel(),
      aiBrief: `Session complete! You practiced ${wordsPracticed} exchanges.`,
      timestamp: Date.now(),
    });
  }, [sessionDuration, wordsPracticed, onFinish, cleanup]);

  const getOrbState = (): 'idle' | 'listening' | 'speaking' => {
    if (sessionState === 'recording') return 'listening';
    if (sessionState === 'playing') return 'speaking';
    return 'idle';
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full relative overflow-hidden bg-transparent">
      <div className="absolute inset-0 pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.15) 100%)' }}
      />

      {/* Progress bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gray-900 z-50">
        <div
          className="h-full bg-gradient-to-r from-green-500 to-yellow-400 transition-all duration-300"
          style={{ width: `${Math.min((sessionDuration / 3600) * 100, 100)}%` }}
        />
      </div>

      {/* Session timer */}
      <div className="absolute top-4 left-4 z-50">
        <span className="text-gray-500 font-mono text-[10px] uppercase tracking-widest">Session</span>
        <div className="text-white font-mono text-sm mt-0.5">
          {Math.floor(sessionDuration / 60)}:{String(Math.floor(sessionDuration % 60)).padStart(2, '0')}
        </div>
      </div>

      {/* Exit button */}
      <button
        onClick={handleFinish}
        className="absolute top-3 right-3 z-[120] bg-black/60 backdrop-blur text-white border border-white/20 px-3 py-1.5 text-[10px] font-bold rounded-full hover:bg-white/10 hover:border-white/50 transition-all tracking-wider"
      >
        FINISH →
      </button>

      {/* Mute button */}
      <button
        onClick={toggleMute}
        className={`absolute top-3 right-24 z-50 h-8 w-8 rounded-full flex items-center justify-center transition-all active:scale-95 border ${isMuted ? 'bg-red-900/20 border-red-500 text-red-500' : 'bg-white/5 border-white/20 text-white'}`}
      >
        <span className="text-sm">{isMuted ? '🔇' : '🎙️'}</span>
      </button>

      {/* Orb */}
      <GeometricOrb state={getOrbState()} amplitude={currentAmplitude} />

      {/* Captions */}
      {caption && (
        <div className="absolute z-40 flex justify-center px-4 pointer-events-none"
          style={{ bottom: '140px', left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 32px)' }}>
          <div className="w-full max-w-lg bg-black/50 backdrop-blur-sm rounded-lg overflow-hidden">
            <AuraCaptions text={caption} isActive={!!caption} />
          </div>
        </div>
      )}

      {/* Aura response */}
      {auraResponse && sessionState !== 'recording' && (
        <div className="absolute z-40 flex justify-center px-4 pointer-events-none"
          style={{ bottom: '80px', left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 32px)' }}>
          <div className="w-full max-w-lg bg-green-500/10 backdrop-blur-sm rounded-lg p-3 border border-green-500/20">
            <div className="text-[9px] font-mono text-green-400 uppercase tracking-widest mb-1">AURA</div>
            <div className="text-sm text-white/90 leading-relaxed">{auraResponse}</div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute z-50 top-1/3 left-1/2 -translate-x-1/2 bg-red-500/20 backdrop-blur border border-red-500/30 rounded-xl px-6 py-3 max-w-xs text-center">
          <div className="text-red-400 text-sm">{error}</div>
          <button onClick={() => setError(null)} className="text-red-300/60 text-[10px] mt-2 underline">Dismiss</button>
        </div>
      )}

      {/* Recording button */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3">
        {sessionState === 'checking' && (
          <>
            <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            </div>
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">Connecting...</span>
          </>
        )}

        {sessionState === 'idle' && (
          <>
            <button
              onClick={startRecording}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.4)] hover:scale-105 active:scale-95 transition-all border-2 border-green-400/50"
            >
              <span className="text-3xl">🎤</span>
            </button>
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Tap to speak</span>
          </>
        )}

        {sessionState === 'recording' && (
          <>
            <button
              onClick={stopRecording}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.4)] animate-pulse hover:scale-105 active:scale-95 transition-all border-2 border-red-400/50"
            >
              <div className="w-6 h-6 bg-white rounded-sm" />
            </button>
            <span className="text-[10px] font-mono text-red-400 uppercase tracking-widest animate-pulse">Recording...</span>
          </>
        )}

        {sessionState === 'processing' && (
          <>
            <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            </div>
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">Thinking...</span>
          </>
        )}

        {sessionState === 'playing' && (
          <>
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
              <span className="text-2xl">🔊</span>
            </div>
            <span className="text-[10px] font-mono text-green-400 uppercase tracking-widest">Speaking...</span>
          </>
        )}
      </div>

      {/* Words practiced */}
      <div className="absolute bottom-8 right-4 z-50 text-right">
        <div className="text-green-400 font-display font-black text-xl">{wordsPracticed}</div>
        <div className="text-gray-600 font-mono text-[9px] uppercase">Exchanges</div>
      </div>
    </div>
  );
};

export default GroqSession;
