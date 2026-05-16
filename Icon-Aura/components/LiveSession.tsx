
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { AURA_SYSTEM_INSTRUCTION, MODEL_NAMES, AURA_WOKE_UP_SYSTEM_INSTRUCTION, AURA_ICON_SYSTEM_INSTRUCTION, AURA_BRAINSCAPE_SYSTEM_INSTRUCTION } from '../constants';
import { getCurriculum, Lesson } from '../services/curriculum';
import { base64ToUint8Array, arrayBufferToBase64, decodePCM, float32ToPCM16 } from '../services/audioUtils';
import { MemorySystem } from '../services/memorySystem';
import { ConceptCardData, SessionReport, LiveGameMode, PronunciationFeedback } from '../types';
import { AURA_TOOLS } from '../services/toolDefinitions';
import { ApiKeyManager } from '../services/apiKeyManager';
import GamificationHUD from './GamificationHUD';
import PronunciationWidget from './PronunciationWidget';
import { SoundService } from '../services/soundEffects';
import { Vibration } from '../services/vibrationService';

interface Props {
  onCardTrigger: (card: ConceptCardData) => void;
  onFinish: (report: SessionReport) => void;
  isCardVisible?: boolean;
  initialCarMode?: boolean;
  isWokeUpMode?: boolean;
  initialMode?: LiveGameMode;
  lastCardResult?: { correct: boolean; timestamp: number } | null;
  selectedLanguage: string;
}

const LiveSession: React.FC<Props> = ({ onCardTrigger, onFinish, isCardVisible, initialCarMode = false, isWokeUpMode = false, initialMode = 'FREE_TALK', lastCardResult, selectedLanguage }) => {
  const [connectionState, setConnectionState] = useState<'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'ERROR'>('CONNECTING');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const isFatalErrorRef = useRef(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [currentMode, setCurrentMode] = useState<LiveGameMode>(initialMode);
  const [retryCount, setRetryCount] = useState(0);
  
  // CURRICULUM STATE
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showCurriculum, setShowCurriculum] = useState(initialMode === 'ICON_STUDY');
  const [selectedLevel, setSelectedLevel] = useState<'BASIC' | 'INTERMEDIATE' | 'ADVANCED'>('BASIC');
  // GAMIFICATION STATE
  const [coins, setCoins] = useState(0);
  const [multiplier, setMultiplier] = useState(1.0);
  const [hypeMessage, setHypeMessage] = useState<string | null>(null);
  const [caption, setCaption] = useState<string>("");
  const [showCaptions, setShowCaptions] = useState(true);
  const [pronunciationData, setPronunciationData] = useState<PronunciationFeedback | null>(null);
  const [isBoosting, setIsBoosting] = useState(false);
  const [isCarMode, setIsCarMode] = useState(initialCarMode);
  const [homeworkExercise, setHomeworkExercise] = useState<string | null>(null);
  const [showHomework, setShowHomework] = useState(false);
  const [homeworkInput, setHomeworkInput] = useState("");

  const isIconMode = currentMode === 'ICON_STUDY';
  
  const curriculum = getCurriculum(selectedLanguage);
  // POWER-UP STATE
  const [hasShield, setHasShield] = useState(false);

  const handleEnergyBoost = () => {
    if (isBoosting) return;
    SoundService.playBoost();
    Vibration.overdrive();
    setIsBoosting(true);
    setMultiplier(prev => prev * 2);
    setHypeMessage("🚀 ENERGY OVERDRIVE!!!");
    
    setTimeout(() => {
        if (isMountedRef.current) {
            setIsBoosting(false);
            setMultiplier(prev => prev / 2);
            setHypeMessage(null);
        }
    }, 5000);
  };
  
  // Watch for card results from parent to inform AI
  useEffect(() => {
    if (lastCardResult && sessionRef.current) {
        sessionRef.current.then(s => {
            if (!s) return;
            const msg = lastCardResult.correct 
                ? "[[SYSTEM: User correctly identified the card! Celebration mode ON.]]" 
                : "[[SYSTEM: User FAILED the card. You must notice this and correct/coach them gently but firmly.]]";
            s.sendRealtimeInput([{ text: msg }]);
        });
    }
  }, [lastCardResult]);

  // ADRENALINE SYSTEM (RETENTION MECHANIC)
  const [adrenaline, setAdrenaline] = useState(100); // 0 to 100
  const [streak, setStreak] = useState(0);
  
  // Refs
  const sessionCardsRef = useRef<ConceptCardData[]>([]);
  const startTimeRef = useRef<number>(Date.now());
  const maxMultiplierRef = useRef(1.0);
  const hasShieldRef = useRef(false);
  const captionRef = useRef<string>("");

  const isUserTalkingRef = useRef(false);
  const lastSpeechTimeRef = useRef<number>(Date.now());
  const lastHeartbeatRef = useRef<number>(0);
  
  // Silence Detection Refs
  const audioSilenceTriggeredRef = useRef<boolean>(false);
  
  // Audio Refs - Keep these for cleanup only
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<Promise<any> | null>(null); 
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const isMountedRef = useRef(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nextStartTimeRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const isConnectingRef = useRef<boolean>(false);
  
  // Animation Refs
  const visualizerFrameRef = useRef<number>(0);
  const particlesRef = useRef<{x: number, y: number, vx: number, vy: number, color: string, life: number}[]>([]);

  useEffect(() => {
    hasShieldRef.current = hasShield;
  }, [hasShield]);

  useEffect(() => {
    if (multiplier > maxMultiplierRef.current) {
        maxMultiplierRef.current = multiplier;
    }
  }, [multiplier]);

  const executeModeSwitch = (mode: LiveGameMode) => {
      setCurrentMode(mode);
      SoundService.playModeSwitch();
      Vibration.modeSwitch();
      let msg = "";
      if (mode === 'VOCAB_BLITZ') { msg = "🎰 BLITZ MODE"; setMultiplier(prev => prev * 1.5); } 
      else if (mode === 'GRAMMAR_GAUNTLET') { msg = "🔫 GAUNTLET"; setMultiplier(prev => prev * 2.0); } 
      else if (mode === 'RAPID_FIRE') { msg = "⚡ RAPID FIRE"; setMultiplier(prev => prev * 2.5); } 
      else if (mode === 'BRAINSCAPE') { msg = "🧠 BRAINSCAPE"; setMultiplier(prev => prev * 3.0); } 
      else if (mode === 'DECODE') { msg = "🕵️ DECODE"; setMultiplier(1.0); } 
      else { msg = "🍸 VIP LOUNGE"; setMultiplier(1.0); }
      
      setHypeMessage(msg);
      setTimeout(() => isMountedRef.current && setHypeMessage(null), 3000);
  };

  const handleManualModeSwitch = (mode: LiveGameMode) => {
      if (mode === currentMode) return;
      SoundService.playClick();
      Vibration.pulse();
      if (connectionState === 'CONNECTED') {
          sessionRef.current?.then(s => s.sendRealtimeInput({ text: `[SYSTEM: MANUAL SWITCH TO ${mode}]` })).catch(console.error);
      }
      executeModeSwitch(mode);
  };
  
  const toggleMute = () => {
      SoundService.playClick();
      if (streamRef.current) {
          const newState = !isMuted;
          streamRef.current.getAudioTracks().forEach(track => track.enabled = !newState);
          setIsMuted(newState);
      }
  };

  // --- GAME ENGINE & HEARTBEAT ---
  useEffect(() => {
    if (connectionState !== 'CONNECTED') return;

    const interval = setInterval(() => {
        if (!isMountedRef.current) return;
        
        const now = Date.now();
        const timeSinceSpeech = now - lastSpeechTimeRef.current;
        const isAISpeaking = nextStartTimeRef.current > (outputContextRef.current?.currentTime || 0);

        // 1. ADRENALINE & STREAK
        setAdrenaline(prev => {
            const next = isUserTalkingRef.current ? Math.min(prev + 3, 100) : 
                         isAISpeaking ? Math.min(prev + 1, 100) : 
                         Math.max(prev - (prev > 50 ? 0.2 : 0.1), 0);
            
            if (next < 20 && now - lastHeartbeatRef.current > 1000) {
                Vibration.vibrate([50, 100]);
                lastHeartbeatRef.current = now;
            }
            return next;
        });

        if (isUserTalkingRef.current) {
            setStreak(s => s + 1);
        } else if (!isAISpeaking && timeSinceSpeech > 3000) {
            setStreak(0);
        }

        // 2. SESSION CLOCK
        setSessionDuration(prev => {
            const next = prev + 0.1; // Interval is 100ms
            if (Math.floor(next) > Math.floor(prev) && Math.floor(next) % 600 === 0) {
                sessionRef.current?.then(s => s.sendRealtimeInput({
                    text: "[SYSTEM: 10 MINUTE CHECKPOINT. Celebrate progress!]"
                })).catch(() => {});
            }
            return next;
        });

        // 3. SILENCE INTERVENTION
        if (currentMode !== 'VOCAB_BLITZ' && !isUserTalkingRef.current && !isAISpeaking) {
            if (timeSinceSpeech > 12000 && !audioSilenceTriggeredRef.current) {
                audioSilenceTriggeredRef.current = true;
                sessionRef.current?.then(s => s.sendRealtimeInput([{ text: "[SYSTEM: INTERRUPT SILENCE]" }]));
            }
        }
    }, 100);

    return () => clearInterval(interval);
  }, [connectionState, currentMode]);


  // --- VISUALIZER ENGINE ---
  const drawVisualizer = () => {
    if (!canvasRef.current || !isMountedRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false }); 
    if (!ctx) return;
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Ensure sizing
    if (canvas.width !== window.innerWidth) canvas.width = window.innerWidth;
    if (canvas.height !== window.innerHeight) canvas.height = window.innerHeight;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const draw = () => {
      if (!isMountedRef.current) return;
      visualizerFrameRef.current = requestAnimationFrame(draw);
      
      const w = canvas.width;
      const h = canvas.height;
      
      // BACKGROUND COLOR BASED ON ADRENALINE (THE "TILT" MECHANIC)
      ctx.fillStyle = isUserTalkingRef.current ? '#1a1000' : '#050505';
      ctx.fillRect(0, 0, w, h);

      // PARTICLE SPAWNER
      if (isUserTalkingRef.current && Math.random() > 0.5) {
          const speed = currentMode === 'RAPID_FIRE' ? 15 : 8;
          particlesRef.current.push({
              x: cx, y: cy,
              vx: (Math.random() - 0.5) * speed,
              vy: (Math.random() - 0.5) * speed,
              color: Math.random() > 0.5 ? '#fbbf24' : '#ffffff',
              life: 1.0
          });
      }

      // PARTICLE RENDERER
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.02;
          
          if (p.life <= 0) {
              particlesRef.current.splice(i, 1);
          } else {
              ctx.globalAlpha = p.life;
              ctx.fillStyle = p.color;
              ctx.beginPath();
              ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2);
              ctx.fill();
          }
      }
      ctx.globalAlpha = 1.0;

      // RING VISUALIZER
      const auraLevel = new Uint8Array(outputAnalyserRef.current?.frequencyBinCount || 0);
      if (outputAnalyserRef.current) outputAnalyserRef.current.getByteTimeDomainData(auraLevel);
      
      analyser.getByteTimeDomainData(dataArray);
      const radius = Math.min(w, h) * 0.25; 
      const isSpeaking = isUserTalkingRef.current || (nextStartTimeRef.current > (outputContextRef.current?.currentTime || 0));
      const scale = isSpeaking ? 1.1 : 1.0; 
      
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.beginPath();
      
      const accentColor = isUserTalkingRef.current ? '#fbbf24' : (nextStartTimeRef.current > (outputContextRef.current?.currentTime || 0) ? '#22d3ee' : '#333');
      ctx.lineWidth = isSpeaking ? 6 : 2;
      ctx.strokeStyle = accentColor;
      ctx.shadowBlur = isSpeaking ? 20 : 0;
      ctx.shadowColor = accentColor;

      for (let i = 0; i < bufferLength; i++) {
        // Mix user and AI audio for the visualizer
        const userV = (dataArray[i] / 128.0) - 1.0;
        const aiV = (auraLevel[i] ? (auraLevel[i] / 128.0) - 1.0 : 0);
        const v = 1.0 + userV + aiV;

        const angle = (i / bufferLength) * Math.PI * 2;
        const x = (radius + v * 50) * Math.cos(angle);
        const y = (radius + v * 50) * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    };
    draw();
  };

  // --- CONNECTION LOGIC ---
  useEffect(() => {
    isMountedRef.current = true;
    
    const cleanup = async () => {
      if (processorRef.current) { 
          try { processorRef.current.disconnect(); } catch(e) {}
          processorRef.current = null; 
      }
      if (streamRef.current) { 
          streamRef.current.getTracks().forEach(t => t.stop()); 
          streamRef.current = null; 
      }
      
      if (audioContextRef.current) { 
          const ctx = audioContextRef.current;
          audioContextRef.current = null;
          if (ctx.state !== 'closed') {
              try { await ctx.close(); } catch(e) {}
          }
      }

      if (outputContextRef.current) { 
          const ctx = outputContextRef.current;
          outputContextRef.current = null;
          if (ctx.state !== 'closed') {
              try { await ctx.close(); } catch(e) {}
          }
      }

      if (sessionRef.current) { 
          const sPromise = sessionRef.current;
          sessionRef.current = null;
          try {
              const s = await sPromise;
              await s.close();
          } catch(e) {}
      }
    };
    const startSession = async () => {
      if (isConnectingRef.current) return;
      isConnectingRef.current = true;
      try {
        const apiKey = ApiKeyManager.getValidKey();
        if (!apiKey) {
            console.error("No valid API Key found in environment.");
            setConnectionState('ERROR');
            setConnectionError("Nenhuma API Key válida configurada. Verifique o arquivo .env.");
            isConnectingRef.current = false;
            return;
        }

        const genAI = new GoogleGenAI({ apiKey });

        // Ensure previous session is fully dead before starting new one
        if (processorRef.current) { try { processorRef.current.disconnect(); } catch(e) {} processorRef.current = null; }
        if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
        if (audioContextRef.current) { audioContextRef.current.close().catch(() => {}); audioContextRef.current = null; }
        if (outputContextRef.current) { outputContextRef.current.close().catch(() => {}); outputContextRef.current = null; }

        setConnectionState(retryCount > 0 ? 'RECONNECTING' : 'CONNECTING');
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        
        // 1. Create LOCAL instances first to ensure no ref race conditions
        const inputCtx = new AudioContextClass({ sampleRate: 16000 });
        const outputCtx = new AudioContextClass({ sampleRate: 24000 });
        
        const outAnalyser = outputCtx.createAnalyser();
        outAnalyser.fftSize = 512;
        outAnalyser.connect(outputCtx.destination);
        outputAnalyserRef.current = outAnalyser;

        // Resume contexts immediately
        await inputCtx.resume();
        await outputCtx.resume();
        
        // Store in refs for cleanup
        audioContextRef.current = inputCtx;
        outputContextRef.current = outputCtx;

        const analyser = inputCtx.createAnalyser();
        analyser.fftSize = 2048; 
        analyserRef.current = analyser;

        // CONNECTION TIMEOUT (45s extended for stability)
        const timeoutId = setTimeout(() => {
            if (isMountedRef.current && (connectionState === 'CONNECTING' || connectionState === 'RECONNECTING')) {
                console.error("Connection timed out.");
                setConnectionState('ERROR');
                setConnectionError("Connection timed out. Please check your network and try again.");
                isConnectingRef.current = false;
            }
        }, 45000);

        let stream: MediaStream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: { ideal: true },
                    noiseSuppression: { ideal: true },
                    autoGainControl: { ideal: false },
                    channelCount: { ideal: 1 },
                }
            });
        } catch (micError: any) {
            console.error("Microphone access denied:", micError);
            clearTimeout(timeoutId);
            isFatalErrorRef.current = true;
            setConnectionState('ERROR');
            setConnectionError("Acesso ao microfone negado. Permita o acesso ao microfone e recarregue a página.");
            isConnectingRef.current = false;
            return;
        }
        streamRef.current = stream;
        
        // Ensure connection wasn't closed during await
        if (!isMountedRef.current || audioContextRef.current !== inputCtx) {
            clearTimeout(timeoutId);
            cleanup();
            isConnectingRef.current = false;
            return;
        }

        const source = inputCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const volumeCheck = () => {
            if (!isMountedRef.current) return;
            const data = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(data);
            const vol = data.reduce((a, b) => a + b) / data.length;
            
            // SENSITIVITY THRESHOLD ADJUSTED FOR BETTER DETECTION
            if (vol > 45) { 
                isUserTalkingRef.current = true; 
                lastSpeechTimeRef.current = Date.now(); 
                audioSilenceTriggeredRef.current = false;
                
                // BARGE-IN: Stop model audio immediately when user starts talking
                if (activeSourcesRef.current.size > 0) {
                    activeSourcesRef.current.forEach(src => {
                        try { src.disconnect(); src.stop(); } catch(e) {}
                    });
                    activeSourcesRef.current.clear();
                    nextStartTimeRef.current = outputCtx.currentTime;
                }

                // CLEAR CAPTION ON SPEECH (VAD)
                if (captionRef.current !== "") {
                    captionRef.current = "";
                    setCaption("");
                }
            } 
            else { isUserTalkingRef.current = false; }
            requestAnimationFrame(volumeCheck);
        };
        volumeCheck();

        const languageMap: Record<string, string> = {
            'en': 'English',
            'fr': 'French',
            'it': 'Italian',
            'es': 'Spanish',
            'zh': 'Mandarin',
            'de': 'German'
        };
        const langName = languageMap[selectedLanguage] || 'English';
        const sessionPromise = genAI.live.connect({
          model: MODEL_NAMES.LIVE,
          config: {
            responseModalities: [Modality.AUDIO], 
            outputAudioTranscription: {}, // ENABLE CAPTIONS
            systemInstruction: 
                (currentMode === 'ICON_STUDY' 
                    ? AURA_ICON_SYSTEM_INSTRUCTION
                        .replace('{{SELECTED_LESSON}}', selectedLesson ? `${selectedLesson.title} (${selectedLesson.topics.join(', ')})` : 'Ask user what they want to study today.')
                        .replace('{{MEMORY_CONTEXT}}', MemorySystem.getContextPrompt()) 
                    : currentMode === 'BRAINSCAPE'
                        ? AURA_BRAINSCAPE_SYSTEM_INSTRUCTION.replace('{{MEMORY_CONTEXT}}', MemorySystem.getContextPrompt())
                        : isWokeUpMode 
                            ? AURA_WOKE_UP_SYSTEM_INSTRUCTION.replace('{{MEMORY_CONTEXT}}', MemorySystem.getContextPrompt()) 
                            : AURA_SYSTEM_INSTRUCTION.replace('{{MEMORY_CONTEXT}}', MemorySystem.getContextPrompt())
                ).replace(/English/g, langName),
            tools: [{ functionDeclarations: AURA_TOOLS }],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: currentMode === 'ICON_STUDY' ? 'Puck' : 'Kore' } }
            }
          },
          callbacks: {
            onopen: () => {
                if(!isMountedRef.current) return;
                clearTimeout(timeoutId);
                if (audioContextRef.current !== inputCtx) return;

                setConnectionState('CONNECTED');
                setRetryCount(0);
                isConnectingRef.current = false;
                
                const actualRate = inputCtx.sampleRate || 16000;
                // OPTIMIZED BUFFER SIZE: 4096 for better stability
                const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                processorRef.current = processor;
                
                processor.onaudioprocess = (e) => {
                    const inputData = e.inputBuffer.getChannelData(0);
                    const pcm16 = float32ToPCM16(inputData);
                    const base64Data = arrayBufferToBase64(pcm16.buffer);
                    sessionPromise.then(s => s.sendRealtimeInput({ audio: { mimeType: `audio/pcm;rate=${actualRate}`, data: base64Data } })).catch(() => {});
                };
                
                source.connect(processor);
                
                // PREVENT FEEDBACK: Use LOCAL inputCtx
                const silenceNode = inputCtx.createGain();
                silenceNode.gain.value = 0; 
                processor.connect(silenceNode);
                silenceNode.connect(inputCtx.destination);
                
                drawVisualizer();
            },
            onmessage: async (msg: LiveServerMessage) => {
                // CAPTIONS
                if (msg.serverContent?.outputTranscription) {
                    const text = msg.serverContent.outputTranscription.text;
                    captionRef.current += text;
                    setCaption(prev => prev + text);
                }

                // INTERRUPTION -> Clear Captions and Stop Audio
                if (msg.serverContent?.interrupted) {
                    captionRef.current = "";
                    setCaption("");
                    activeSourcesRef.current.forEach(src => {
                        try { src.disconnect(); src.stop(); } catch(e) {}
                    });
                    activeSourcesRef.current.clear();
                    nextStartTimeRef.current = outputCtx.currentTime;
                }

                // Audio Output
                const parts = msg.serverContent?.modelTurn?.parts;
                if (parts && outputContextRef.current === outputCtx) {
                    // DECODE IN PARALLEL
                    const buffers = await Promise.all(parts.map(async part => {
                        const audioData = part.inlineData?.data;
                        if (!audioData) return null;
                        const uint8 = base64ToUint8Array(audioData);
                        return decodePCM(uint8, outputCtx, 24000);
                    }));

                    for (const audioBuffer of buffers) {
                        if (!audioBuffer) continue;
                        const src = outputCtx.createBufferSource();
                        src.buffer = audioBuffer;
                        src.connect(outAnalyser); // Route through output analyser
                        
                        activeSourcesRef.current.add(src);
                        src.onended = () => activeSourcesRef.current.delete(src);

                        const now = outputCtx.currentTime;
                        // JITTER BUFFER: 100ms if we are starting fresh or had a gap
                        const BUFFER_LATENCY = 0.1;
                        
                        if (nextStartTimeRef.current < now) {
                            nextStartTimeRef.current = now + BUFFER_LATENCY;
                        }
                        
                        src.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                    }
                }
                
                if (msg.toolCall) {
                    const responses = [];
                    for (const fc of msg.toolCall.functionCalls) {
                        if (fc.name === 'render_concept_card') {
                            const args = fc.args as any;
                            const card: ConceptCardData = {
                                term: args.term, definition: args.definition, phonetic: args.phonetic, context: args.instruction, type: args.cardType || 'VOCAB'
                            };
                            onCardTrigger(card);
                            const cardIndex = sessionCardsRef.current.length;
                            sessionCardsRef.current.push(card);
                            
                            let points = 500;
                            if (card.type === 'JACKPOT') { 
                                points = 1000; 
                                setHypeMessage("💎 JACKPOT!"); 
                                SoundService.playJackpot();
                                Vibration.jackpot();
                            }
                            else if (card.type === 'CORRECTION') { 
                                points = hasShieldRef.current ? 0 : 0; 
                                setHypeMessage(hasShieldRef.current ? "🛡️ BLOCKED" : "🛑 OOPS");
                                if(hasShieldRef.current) setHasShield(false);
                                SoundService.playError();
                                Vibration.error();
                            } else {
                                setHypeMessage("✨ NICE");
                                SoundService.playSuccess();
                                Vibration.newVocab();
                            }
                            setCoins(c => c + Math.floor(points * maxMultiplierRef.current));
                            setTimeout(() => isMountedRef.current && setHypeMessage(null), 1500);
                            responses.push({ name: fc.name, id: fc.id, response: { result: "Card Shown" } });
                        }
                        else if (fc.name === 'switch_game_mode') {
                            const newMode = (fc.args as any).mode;
                            executeModeSwitch(newMode);
                            responses.push({ name: fc.name, id: fc.id, response: { result: `Mode: ${newMode}` } });
                        }
                        else if (fc.name === 'analyze_pronunciation') {
                            const args = fc.args as any;
                            setPronunciationData({
                                targetWord: args.targetWord,
                                userPhonetic: args.userPhonetic,
                                accuracyScore: args.accuracyScore,
                                feedback: args.feedback
                            });
                            Vibration.pronunciation(args.accuracyScore);
                            responses.push({ name: fc.name, id: fc.id, response: { result: "Feedback Shown" } });
                        }
                        else if (fc.name === 'trigger_homework') {
                            const args = fc.args as any;
                            setHomeworkExercise(args.exercise);
                            setShowHomework(true);
                            setHypeMessage("📝 HOMEWORK UNLOCKED!");
                            setTimeout(() => isMountedRef.current && setHypeMessage(null), 2000);
                            responses.push({ name: fc.name, id: fc.id, response: { result: "Homework triggered" } });
                        }
                        else if (fc.name === 'record_grammar_gap') {
                            const args = fc.args as any;
                            MemorySystem.recordGrammarGap(args.gap);
                            setHypeMessage(`📌 FOCUS: ${args.gap}`);
                            setTimeout(() => isMountedRef.current && setHypeMessage(null), 3000);
                            responses.push({ name: fc.name, id: fc.id, response: { result: "Grammar gap recorded" } });
                        }
                        else if (fc.name === 'switch_difficulty') {
                            const newLevel = (fc.args as any).level;
                            MemorySystem.setDifficultyLevel(newLevel as any);
                            setHypeMessage(`🎭 LEVEL ADAPTED: ${newLevel}`);
                            setTimeout(() => isMountedRef.current && setHypeMessage(null), 3000);
                            responses.push({ name: fc.name, id: fc.id, response: { result: `Difficulty switched to ${newLevel}` } });
                        }
                    }
                    if (responses.length > 0) sessionPromise.then(s => s.sendToolResponse({ functionResponses: responses })).catch(() => {});
                }
            },
            onclose: () => { 
                if (isMountedRef.current && connectionState !== 'ERROR' && !isFatalErrorRef.current) {
                    console.log(`Connection closed, retrying in ${Math.min(1000 * Math.pow(2, retryCount), 10000)}ms...`);
                    setConnectionState('RECONNECTING');
                    isConnectingRef.current = false;
                    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
                    setTimeout(() => isMountedRef.current && setRetryCount(c => c + 1), delay);
                } 
            },
            onerror: (e) => { 
                console.error("Live session error:", e);
                const errorStr = String(e);
                if (isMountedRef.current) {
                    // Check for Quota Exceeded (429) or Billing limits
                    if (errorStr.includes('quota') || errorStr.includes('429') || errorStr.toLowerCase().includes('spending cap')) {
                        console.error("Billing limit reached for current key.");
                        
                        // Burn the current key
                        const currentKey = ApiKeyManager.getValidKey();
                        if (currentKey) {
                            ApiKeyManager.reportKeyFailure(currentKey);
                        }

                        // Check if there are other keys available
                        const nextKey = ApiKeyManager.getValidKey();
                        if (nextKey && nextKey !== currentKey) {
                            console.log("Auto-switching to the next API key...");
                            setConnectionState('RECONNECTING');
                            isConnectingRef.current = false;
                            setTimeout(() => setRetryCount(c => c + 1), 1000);
                            return; // Bypass the fatal error state
                        } else {
                            setHypeMessage("⚠️ TODAS AS CHAVES ESGOTADAS. RENOVE NO AI STUDIO.");
                            isFatalErrorRef.current = true;
                        }
                    }
                    
                    if (!isFatalErrorRef.current) {
                        setConnectionError(errorStr);                
                        setConnectionState('ERROR');
                    }
                    isConnectingRef.current = false;
                }
            }
          }
        });
        sessionRef.current = sessionPromise;

      } catch (e) {
        console.error("Failed to start session:", e);
        const errorStr = String(e);
        if (isMountedRef.current) {
            setConnectionError(errorStr);
            setConnectionState('ERROR');
            isConnectingRef.current = false;
        }
      }
    };
    startSession();

    const lessonTimer = setInterval(() => {
        if (connectionState === 'CONNECTED') {
            setSessionDuration(prev => {
                const next = prev + 1;
                if (next > 0 && next % 600 === 0) { // 10 minutes
                    sessionRef.current?.then(s => s.sendRealtimeInput({
                        text: "[SYSTEM: 10 MINUTE CHECKPOINT. Tell the user they are doing great and ask if they want to keep going or stop. Use your Carioca energy!]"
                    })).catch(() => {});
                }
                return next;
            });
        }
    }, 1000);

    // SAFETY RECOVERY: If stuck in RECONNECTING/CONNECTING for > 15s after retrying
    const recoveryTimer = setInterval(() => {
        if (isMountedRef.current && (connectionState === 'RECONNECTING' || connectionState === 'CONNECTING')) {
            const now = Date.now();
            if (now - startTimeRef.current > 45000 && retryCount > 0) { 
               console.warn("Forcing connection state reset due to hang");
               // If it's stuck for 45s, something is wrong
               setConnectionState('ERROR');
            }
        }
    }, 5000);

    return () => {
        clearInterval(lessonTimer);
        clearInterval(recoveryTimer);
        isMountedRef.current = false;
        if (visualizerFrameRef.current) cancelAnimationFrame(visualizerFrameRef.current);
        cleanup();
    };
  }, [retryCount]);

  const handleFinish = async () => {
      SoundService.playSuccess();
      Vibration.success();
      
      let aiBrief = "MISSION COMPLETE. GOOD WORK.";

      try {
          const apiKey = ApiKeyManager.getValidKey();
          if (apiKey) {
          const genAI = new GoogleGenAI({ apiKey });
          const result = await genAI.models.generateContent({
                  model: MODEL_NAMES.CHAT,
                  contents: [{
                      role: 'user',
                      parts: [{
                          text: `
                  Generate a "Strategic Mission Debrief" for an English student.
                  Session Stats:
                  - Duration: ${Math.floor((Date.now() - startTimeRef.current) / 1000)}s
                  - Coins: ${coins}
                  - Cards: ${(sessionCardsRef.current || []).map(c => c.term).join(', ')}
                  - Adrenaline: ${adrenaline}%
                  - Grammar Gaps: ${localStorage.getItem('grammar_gaps') || 'None'}

                  Tone: Hyper-Extroverted, Cyberpunk, Aggressive Positive Reinforcement. 
                  Highlight one "Heroic Linguistic Moment" and one "Sector to Neutralize" (Grammar Gap).
                  Keep it under 60 words. Use emojis.
              `
                      }]
                  }]
              });
              aiBrief = result.text || aiBrief;
          }
      } catch (e) {
          console.error("Failed to generate AI brief", e);
      }

      onFinish({
          durationSeconds: (Date.now() - startTimeRef.current) / 1000,
          cardsCollected: sessionCardsRef.current,
          totalCoins: coins,
          maxMultiplier: maxMultiplierRef.current,
          flowRating: adrenaline > 80 ? "GODLIKE" : "SOLID",
          difficultyLevel: MemorySystem.getDifficultyLevel(),
          aiBrief
      });
  };

  // --- RENDER HELPERS ---
  const getAdrenalineColor = () => {
    if (isIconMode) {
      if (adrenaline > 70) return 'from-purple-400 via-white to-purple-400';
      if (adrenaline > 30) return 'from-purple-600 to-purple-400';
      return 'from-purple-900 via-red-900 to-red-600';
    }
    if (adrenaline > 70) return 'from-yellow-500 to-amber-500'; // High
    if (adrenaline > 30) return 'from-blue-500 to-blue-400'; // Med
    return 'from-red-600 to-red-500'; // Danger
  };

  if (isCarMode) {
    return (
      <div className={`flex flex-col items-center justify-between h-full w-full p-8 relative overflow-hidden transition-colors duration-500 ${isIconMode ? 'bg-[#1a0b2e]' : 'bg-[#050505]'}`}>
        {/* CAR MODE HUD */}
        <div className="w-full flex justify-between items-center z-50">
            <div className="flex flex-col">
                <span className="text-gray-500 font-mono text-xs uppercase tracking-widest">Adrenaline</span>
                <div className="w-32 h-3 bg-gray-900 rounded-full mt-1 overflow-hidden border border-gray-800">
                    <div className={`h-full bg-gradient-to-r ${getAdrenalineColor()}`} style={{ width: `${adrenaline}%` }}></div>
                </div>
            </div>
            <div className="text-right">
                <div className={isIconMode ? "text-purple-400 font-display font-black text-3xl" : "text-yellow-500 font-display font-black text-3xl"}>${coins.toLocaleString()}</div>
                <div className="text-gray-500 font-mono text-[10px] uppercase">Session Earnings</div>
            </div>
        </div>

        {/* CENTER VISUALIZER / CAPTION */}
        <div className="flex-1 flex flex-col items-center justify-center w-full gap-12 z-40">
            {/* LARGE CIRCULAR VISUALIZER */}
            <div className="relative w-64 h-64 md:w-80 md:h-80">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-6xl md:text-8xl mb-2">{isMuted ? '🔇' : '🎙️'}</span>
                    <span className={`font-mono text-sm font-bold tracking-[0.5em] uppercase ${isUserTalkingRef.current ? (isIconMode ? 'text-purple-400 animate-pulse' : 'text-yellow-500 animate-pulse') : 'text-gray-600'}`}>
                        {isUserTalkingRef.current ? 'Listening' : 'Standby'}
                    </span>
                </div>
            </div>

            {/* GIANT CAPTION */}
            <div className={`w-full max-w-4xl bg-black/40 backdrop-blur-xl border-y py-8 px-6 text-center ${isIconMode ? 'border-purple-500/30' : 'border-white/5'}`}>
                <p className="text-2xl md:text-4xl font-bold text-white leading-tight">
                    {caption || (isUserTalkingRef.current ? "..." : "AURA is ready")}
                </p>
            </div>
        </div>

        {/* CAR MODE CONTROLS */}
        <div className="w-full grid grid-cols-2 gap-6 z-50">
            <button 
                onClick={toggleMute}
                className={`h-32 rounded-3xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 border-4 ${isMuted ? 'bg-red-900/20 border-red-500 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 'bg-white/5 border-white/20 text-white'}`}
            >
                <span className="text-4xl">{isMuted ? '🔇' : '🎙️'}</span>
                <span className="font-black text-lg uppercase tracking-widest">{isMuted ? 'Unmute' : 'Mute'}</span>
            </button>

            <button 
                onClick={handleFinish}
                className={`h-32 rounded-3xl text-black flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${isIconMode ? 'bg-purple-500 shadow-purple-500/30' : 'bg-yellow-500 shadow-yellow-500/30'}`}
            >
                <span className="text-4xl">🏁</span>
                <span className="font-black text-lg uppercase tracking-widest">Finish</span>
            </button>
        </div>

        {/* EXIT CAR MODE */}
        <button 
            onClick={() => setIsCarMode(false)}
            className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-900/50 text-gray-500 px-4 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest border border-gray-800 hover:text-white hover:border-white transition-all z-50"
        >
            Exit Car Mode
        </button>

        {/* HYPE OVERLAY */}
        {hypeMessage && (
            <div className="absolute inset-0 flex items-center justify-center z-[60] bg-black/60 backdrop-blur-sm pointer-events-none">
                <h1 className={`text-7xl font-black italic animate-bounce text-center px-4 drop-shadow-2xl ${isIconMode ? 'text-purple-400' : 'text-yellow-500'}`}>
                    {hypeMessage}
                </h1>
            </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center h-full w-full relative overflow-hidden transition-all duration-500 ${isIconMode ? 'bg-[#1a0b2e]' : 'bg-black'} ${isBoosting ? 'scale-[1.02] shadow-[inset_0_0_100px_rgba(234,179,8,0.3)] is-boosting' : ''}`}>
      
      {/* 1. DANGER VIGNETTE (TILT MECHANIC) */}
      <div 
        className={`absolute inset-0 pointer-events-none z-0 transition-opacity duration-1000 ${isBoosting ? 'animate-pulse' : ''}`}
        style={{ 
            opacity: isBoosting ? 0.8 : Math.max(0, (50 - adrenaline) / 50), // Opacity goes up as Adrenaline goes down
            background: isBoosting ? 'radial-gradient(circle, transparent 40%, rgba(234,179,8,0.4) 100%)' : 'radial-gradient(circle, transparent 40%, rgba(255,0,0,0.4) 100%)'
        }}
      ></div>

      {/* CANVAS */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10 pointer-events-none" />
      
      {/* 1. BRAINSCAPE BACKGROUND (NEURAL OVERDRIVE) */}
      {currentMode === 'BRAINSCAPE' && (
          <div className="absolute inset-0 z-0 overflow-hidden bg-[#000508]">
            {/* Deep space gradients */}
            <div className="absolute top-0 left-0 w-full h-full opacity-60">
              <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-cyan-900/20 rounded-full blur-[120px] animate-pulse"></div>
              <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-blue-900/20 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '3s' }}></div>
            </div>
            
            {/* Moving Nano-Grid */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `linear-gradient(rgba(0, 240, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.1) 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
                transform: 'perspective(1000px) rotateX(60deg) scale(3) translateY(-100px)',
                transformOrigin: 'top',
                animation: 'grid-move 20s linear infinite'
              }}
            ></div>

            {/* Neural Pulses (Floating particles) */}
            <div className="absolute inset-0 z-1 pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <div 
                  key={i}
                  className="absolute w-px h-20 bg-gradient-to-b from-transparent via-cyan-400 to-transparent opacity-20"
                  style={{
                    left: `${i * 20}%`,
                    top: `${Math.random() * 100}%`,
                    animation: `scan ${5 + i}s linear infinite`,
                    animationDelay: `${i * 2}s`
                  }}
                ></div>
              ))}
            </div>

            {/* Scanning Line High-tech */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent shadow-[0_0_20px_rgba(34,211,238,0.5)] animate-[scan_8s_linear_infinite]"></div>

            {/* Vignette Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]"></div>
          </div>
      )}

      {/* 2. ADRENALINE BAR (TOP RETENTION HOOK) */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gray-900 z-50">
          <div 
            className={`h-full bg-gradient-to-r ${isBoosting ? 'from-yellow-400 to-white animate-pulse' : getAdrenalineColor()} transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.5)]`}
            style={{ width: `${adrenaline}%` }}
          ></div>
      </div>

      {/* 3. LIVE CAPTIONS (REPLACES SCROLLING TICKER) */}
      {!isCardVisible && showCaptions && (
        <div className="absolute bottom-36 sm:bottom-44 w-full z-40 flex justify-center px-6 pointer-events-none transition-all duration-300">
            <div className="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-3xl px-8 py-5 max-w-4xl text-center shadow-2xl shadow-black/80 min-h-[4rem] flex items-center justify-center transform transition-all duration-300">
              <p className="text-white font-sans text-xl md:text-2xl font-medium leading-relaxed tracking-wide drop-shadow-sm">
                 {caption || (isUserTalkingRef.current ? "LISTENING..." : "AURA STANDBY")}
              </p>
            </div>
        </div>
      )}

      {/* MODE SELECTOR */}
      <div className="absolute top-24 left-0 w-full flex justify-center gap-2 z-40 px-4 flex-wrap">
        {(['FREE_TALK', 'VOCAB_BLITZ', 'GRAMMAR_GAUNTLET', 'RAPID_FIRE', 'BRAINSCAPE', 'DECODE', 'ICON_STUDY'] as LiveGameMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => handleManualModeSwitch(mode)}
            className={`px-3 py-1 text-[10px] md:text-xs font-bold font-mono uppercase tracking-wider border transition-all rounded-sm backdrop-blur-md
              ${currentMode === mode 
                ? (mode === 'ICON_STUDY' ? 'bg-purple-500 text-white border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.6)]' : 'bg-yellow-500 text-black border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.6)]') 
                : 'bg-black/40 text-gray-500 border-gray-800 hover:border-white hover:text-white'
              }`}
          >
            {mode === 'ICON_STUDY' ? '🎓 AURA MODE' : mode === 'BRAINSCAPE' ? '🧠 BRAINSCAPE' : mode.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* CONNECTION UI */}
      {connectionState === 'CONNECTING' && <div className="z-50 text-yellow-500 animate-pulse font-mono bg-black/80 px-4 py-2 rounded uppercase tracking-widest">Establishing Neural Link...</div>}
      {connectionState === 'RECONNECTING' && <div className="z-50 text-[#00f0ff] animate-pulse font-mono bg-black/80 px-4 py-2 rounded uppercase tracking-widest">Hold on! Recalibrating... ({retryCount})</div>}
      {connectionState === 'ERROR' && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
              <div className={`flex flex-col items-center gap-6 p-10 rounded-2xl border-2 shadow-2xl max-w-sm w-full mx-4 ${isIconMode ? 'bg-[#1a0b2e] border-purple-500 shadow-purple-500/20' : 'bg-neutral-900 border-red-500 shadow-red-500/20'}`}>
                  <div className={`${isIconMode ? 'text-purple-400' : 'text-red-500'} font-black text-3xl uppercase tracking-tighter text-center leading-none`}>
                    {connectionError && (connectionError.includes('quota') || connectionError.includes('429') || connectionError.toLowerCase().includes('spending cap')) ? 'LIMIT REACHED' : 'Neural Link Severed!'}
                  </div>
                  <p className="text-gray-400 text-sm italic text-center">
                    {connectionError && (connectionError.includes('quota') || connectionError.includes('429') || connectionError.toLowerCase().includes('spending cap')) 
                        ? 'You have exceeded your daily API quota or monthly spending limit. Please check your AI Studio billing configuration.' 
                        : 'A connection error occurred.'}
                  </p>
                  <button 
                    onClick={() => {
                        SoundService.playClick();
                        setConnectionState('CONNECTING');
                        setConnectionError(null);
                        setTimeout(() => setRetryCount(c => c + 1), 100);
                    }}
                    className="w-full bg-white text-black font-black px-8 py-4 rounded-xl hover:bg-opacity-90 transition-all shadow-lg active:scale-95 uppercase tracking-widest"
                  >
                    {connectionError && (connectionError.includes('quota') || connectionError.includes('429') || connectionError.toLowerCase().includes('spending cap')) ? 'TRY ANYWAY' : 'REBOOT SYSTEM'}
                  </button>
              </div>
          </div>
      )}
      
      {/* HYPE TEXT */}
      {hypeMessage && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none text-center w-full">
              <h1 className="text-6xl font-black font-display italic text-transparent bg-clip-text bg-gradient-to-b from-white to-yellow-500 drop-shadow-[0_0_20px_rgba(255,215,0,0.8)] animate-[bounce_0.5s_infinite]">
                  {hypeMessage}
              </h1>
          </div>
      )}

      {/* LOW ADRENALINE WARNING */}
      {adrenaline < 20 && connectionState === 'CONNECTED' && !hypeMessage && (
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
              <div className="text-red-500 font-black text-4xl animate-pulse text-center opacity-50 uppercase">
                  ⚠ ENERGY LOW<br/>WAKE UP! ⚡
              </div>
           </div>
      )}

      {/* HUD */}
      <GamificationHUD 
        multiplier={multiplier} 
        coins={coins} 
        hasShield={hasShield} 
        isIconMode={isIconMode} 
        currentPhase={MemorySystem.getActiveUser()?.currentPhase}
      />
      
      {/* PRONUNCIATION WIDGET */}
      <PronunciationWidget data={pronunciationData} onClose={() => setPronunciationData(null)} />

      {/* BOTTOM CONTROLS */}
      <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-50 flex flex-wrap justify-center gap-3 sm:gap-6 items-center w-full px-4 max-w-4xl">
        {/* BOOST BUTTON */}
        <button 
            onClick={handleEnergyBoost}
            disabled={isBoosting || connectionState !== 'CONNECTED'}
            className={`group relative w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-90 disabled:opacity-30 disabled:grayscale 
              ${isBoosting 
                ? (isIconMode ? 'bg-purple-500 scale-110 shadow-purple-500/50' : 'bg-yellow-500 scale-110 shadow-yellow-500/50') 
                : (isIconMode ? 'bg-neutral-800 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400' : 'bg-neutral-800 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-500')
              }`}
        >
            <span className={`text-xl sm:text-2xl transition-transform ${isBoosting ? 'animate-bounce' : 'group-hover:scale-125'}`}>⚡</span>
            {isBoosting && <div className={`absolute -inset-2 rounded-full animate-ping ${isIconMode ? 'bg-purple-500/20' : 'bg-yellow-500/20'}`}></div>}
            <div className={`absolute -bottom-6 text-[8px] sm:text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ${isIconMode ? 'text-purple-400' : 'text-yellow-500'}`}>ENERGY BOOST</div>
        </button>

        <button onClick={toggleMute} className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 flex items-center justify-center text-xl sm:text-2xl bg-black/50 backdrop-blur transition-all ${isMuted ? 'border-red-500 text-red-500 shadow-[0_0_15px_#ff0000]' : 'border-white/20 text-white hover:border-white'}`}>
            {isMuted ? '🔇' : '🎙️'}
        </button>

        <button 
            onClick={() => {
                SoundService.playClick();
                setShowCaptions(!showCaptions);
            }} 
            className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 flex items-center justify-center text-lg sm:text-xl bg-black/50 backdrop-blur transition-all 
              ${!showCaptions 
                ? 'border-gray-600 text-gray-600' 
                : (isIconMode ? 'border-purple-500 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]' : 'border-yellow-500/50 text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]')}`}
            title={showCaptions ? "Hide Captions" : "Show Captions"}
        >
            {showCaptions ? 'CC' : 'cc'}
        </button>

        <button 
            onClick={handleFinish} 
            className={`text-black font-black text-base sm:text-xl px-6 sm:px-12 py-3 sm:py-4 rounded-xl shadow-lg hover:scale-105 transition-all
                ${isIconMode 
                    ? 'bg-gradient-to-r from-purple-600 to-purple-400 shadow-purple-500/40 text-white' 
                    : 'bg-gradient-to-r from-yellow-600 to-yellow-400 shadow-yellow-500/40'}
            `}
        >
            CASH OUT
        </button>

        <button 
            onClick={() => setIsCarMode(true)}
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-white/10 flex items-center justify-center text-xl sm:text-2xl bg-black/50 backdrop-blur hover:border-white transition-all"
            title="Car Mode"
        >
            🚗
        </button>

        <button 
            onClick={() => {
                SoundService.playClick();
                setShowCurriculum(true);
            }}
            className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 flex items-center justify-center text-xl sm:text-2xl transition-all ${isIconMode ? 'bg-purple-600 border-yellow-400 shadow-[0_0_20px_#a855f7]' : 'bg-black/50 border-white/20 hover:border-white'}`}
            title="Lesson Plan"
        >
            📚
        </button>

        <button 
            onClick={() => handleManualModeSwitch(isIconMode ? 'FREE_TALK' : 'ICON_STUDY')}
            className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 flex items-center justify-center text-xl sm:text-2xl transition-all ${isIconMode ? 'bg-purple-600 border-yellow-400 shadow-[0_0_20px_#a855f7]' : 'bg-black/50 border-white/20 hover:border-white'}`}
            title="Modulo Icon (Carioca Teacher)"
        >
            🎓
        </button>
      </div>

      <style>{`
        @keyframes shake {
            0%, 100% { transform: translate(0, 0); }
            25% { transform: translate(-2px, 2px); }
            50% { transform: translate(2px, -2px); }
            75% { transform: translate(-2px, -2px); }
        }
        .is-boosting {
            animation: shake 0.1s infinite;
        }
      `}</style>

      {/* HOMEWORK MODAL */}
      {showHomework && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6">
              <div className="w-full max-w-lg bg-[#2a0e4a] border-4 border-yellow-500 rounded-[2rem] p-8 shadow-[0_0_150px_rgba(234,179,8,0.2)] relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-purple-500 to-yellow-500"></div>
                  
                  <div className="flex justify-between items-start mb-8">
                      <div className="flex flex-col">
                        <h2 className="text-4xl font-black text-yellow-400 uppercase tracking-tighter italic leading-none">THE ICON</h2>
                        <h2 className="text-2xl font-black text-white uppercase tracking-widest opacity-80">CHALLENGE</h2>
                      </div>
                      <button onClick={() => setShowHomework(false)} className="bg-white/10 hover:bg-white/20 w-10 h-10 rounded-full flex items-center justify-center text-white transition-all transform hover:rotate-90">✕</button>
                  </div>
                  
                  <div className="bg-black/40 border border-yellow-500/30 rounded-2xl p-6 mb-8 relative">
                      <div className="absolute -top-3 left-4 bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase">Professor's Orders</div>
                      <p className="text-white font-mono text-base leading-relaxed italic">"{homeworkExercise || "Mermão, prove que você entendeu o que eu ensinei!"}"</p>
                  </div>

                  <textarea 
                    value={homeworkInput}
                    onChange={(e) => setHomeworkInput(e.target.value)}
                    placeholder="Escribe sua mágica aqui, mermão..."
                    className="w-full h-48 bg-black/60 border-2 border-purple-500/30 rounded-2xl p-6 text-white font-mono text-base focus:outline-none focus:border-yellow-500 transition-all placeholder:text-gray-700 mb-8 resize-none shadow-inner"
                  />

                  <button 
                    onClick={() => {
                        if (!homeworkInput.trim()) return;
                        
                        SoundService.playSuccess();
                        MemorySystem.saveHomework(homeworkExercise || "General Lesson", homeworkInput);
                        
                        // Send text input to AI for feedback
                        sessionRef.current?.then(s => {
                            s.sendRealtimeInput([{
                                text: `[HOMEWORK SUBMISSION] Exercise: ${homeworkExercise}. My Answer: ${homeworkInput}. Note: I am the student, you are the Carioca teacher. Check my answer and give me feedback with your ginga!`
                            }]);
                        });

                        setHypeMessage("🚀 CHALLENGE COMPLETED!");
                        setTimeout(() => {
                            setHypeMessage(null);
                            setShowHomework(false);
                        }, 2000);
                        setHomeworkInput("");
                    }}
                    className="w-full bg-yellow-500 text-black font-black py-5 rounded-2xl shadow-[0_10px_30px_rgba(234,179,8,0.4)] hover:scale-[1.05] active:scale-95 transition-all text-xl uppercase tracking-tighter"
                  >
                      SUBMIT & SHINE ✨
                  </button>
              </div>
          </div>
      )}

      {/* CURRICULUM SELECTOR MODAL */}
      {showCurriculum && (
          <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 sm:p-6 overflow-y-auto">
              <div className="w-full max-w-2xl bg-[#0f0718] border-2 border-purple-500 shadow-[0_0_80px_rgba(168,85,247,0.3)] rounded-3xl p-6 sm:p-8 flex flex-col max-h-[90vh]">
                  
                  <div className="flex justify-between items-center mb-8">
                      <div>
                          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">PLANO DE AULA</h2>
                          <div className="flex gap-4 mt-4">
                              <button 
                                onClick={() => setSelectedLevel('BASIC')}
                                className={`text-[10px] uppercase font-black tracking-widest px-4 py-1.5 rounded-full transition-all ${selectedLevel === 'BASIC' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                              >
                                Nível Básico
                              </button>
                              <button 
                                onClick={() => setSelectedLevel('INTERMEDIATE')}
                                className={`text-[10px] uppercase font-black tracking-widest px-4 py-1.5 rounded-full transition-all ${selectedLevel === 'INTERMEDIATE' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                              >
                                Intermediário
                              </button>
                              <button 
                                onClick={() => setSelectedLevel('ADVANCED')}
                                className={`text-[10px] uppercase font-black tracking-widest px-4 py-1.5 rounded-full transition-all ${selectedLevel === 'ADVANCED' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                              >
                                Avançado
                              </button>
                          </div>
                      </div>
                      <button onClick={() => setShowCurriculum(false)} className="text-gray-500 hover:text-white text-3xl">✕</button>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                      {(curriculum.find(c => c.id === selectedLevel)?.modules || []).map((module) => (
                          <div key={module.id} className="space-y-3">
                              <h3 className="text-purple-400 font-mono text-[10px] uppercase tracking-[0.3em] font-black">{module.title}</h3>
                              <div className="grid gap-2">
                                  {module.lessons.map((lesson) => (
                                      <button 
                                        key={lesson.id}
                                        onClick={() => {
                                            SoundService.playClick();
                                            setSelectedLesson(lesson);
                                            setShowCurriculum(false);
                                            if (connectionState === 'CONNECTED') {
                                                sessionRef.current?.then(s => s.sendRealtimeInput({ 
                                                    text: `[SYSTEM: USER CHOSE LESSON: ${lesson.title}. TOPICS: ${lesson.topics.join(', ')}. Introduce this lesson as AURA ICON and start the didactic explanation with cards.]` 
                                                })).catch(() => {});
                                            }
                                        }}
                                        className={`w-full text-left p-4 rounded-xl border border-white/5 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all group flex justify-between items-center ${selectedLesson?.id === lesson.id ? 'bg-purple-500/20 border-purple-500' : 'bg-white/5'}`}
                                      >
                                          <div className="flex flex-col">
                                              <span className="text-white font-bold text-base leading-tight group-hover:text-purple-300 transition-colors">{lesson.title}</span>
                                              <span className="text-[10px] text-gray-500 font-mono mt-1 group-hover:text-gray-400">{lesson.topics.join(' • ')}</span>
                                          </div>
                                          <span className="text-xl opacity-0 group-hover:opacity-100 transition-opacity">⚡</span>
                                      </button>
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/10 flex justify-center">
                    <p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest italic">Prepare to have your brain rewired by ICON methodology</p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default LiveSession;
