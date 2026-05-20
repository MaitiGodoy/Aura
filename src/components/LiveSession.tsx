
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { AURA_SYSTEM_INSTRUCTION, MODEL_NAMES, AURA_WOKE_UP_SYSTEM_INSTRUCTION, AURA_ICON_SYSTEM_INSTRUCTION, AURA_AMOS_SYSTEM_INSTRUCTION, AURA_HANDS_FREE_SYSTEM_INSTRUCTION } from '../constants';
import { getCurriculum, getTranslatedTag, IconItem } from '../services/curriculum';
import { generateSystemInstruction, getLanguageProfile } from '../services/languageEngine';
import { base64ToUint8Array, arrayBufferToBase64, decodePCM, float32ToPCM16 } from '../services/audioUtils';
import { MemorySystem } from '../services/memorySystem';
import { ApiRouter } from '../services/apiRouter';
import { WebSpeechFallback } from '../services/webSpeechFallback';
import { GroqEngine, GroqToolCall } from '../services/groqConversation';
import { ConceptCardData, SessionReport, LiveGameMode, PronunciationFeedback } from '../types';
import { AURA_TOOLS } from '../services/toolDefinitions';
import PronunciationWidget from './PronunciationWidget';
import GeometricOrb from './GeometricOrb';
import AuraCaptions from './AuraCaptions';
import { SoundService } from '../services/soundEffects';
import { Vibration } from '../services/vibrationService';
import { Amplitude } from '../services/amplitudeStore';

interface Props {
  onCardTrigger: (card: ConceptCardData) => void;
  onFinish: (report: SessionReport) => void;
  onExit: () => void;
  isCardVisible?: boolean;
  isHandsFree?: boolean;
  initialMode?: LiveGameMode;
  lastCardResult?: { correct: boolean; timestamp: number } | null;
  selectedLanguage: string;
}

const LiveSession: React.FC<Props> = ({ onCardTrigger, onFinish, onExit, isCardVisible, isHandsFree = false, initialMode = 'FREE_TALK', lastCardResult, selectedLanguage }) => {
  const [connectionState, setConnectionState] = useState<'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'ERROR'>('CONNECTING');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const isFatalErrorRef = useRef(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [currentMode, setCurrentMode] = useState<LiveGameMode>(initialMode);
  const [retryCount, setRetryCount] = useState(0);
  
  const [selectedIcon, setSelectedIcon] = useState<IconItem | null>(null);
  const [showCurriculum, setShowCurriculum] = useState(initialMode === 'ICON_MODE');
   
  const [caption, setCaption] = useState<string>("");
  const [showCaptions, setShowCaptions] = useState(true);
  const [connectionProgress, setConnectionProgress] = useState<string>('');
  const [pronunciationData, setPronunciationData] = useState<PronunciationFeedback | null>(null);
  const [isCarMode, setIsCarMode] = useState(isHandsFree);
  const [homeworkExercise, setHomeworkExercise] = useState<string | null>(null);
  const [showHomework, setShowHomework] = useState(false);
  const [homeworkInput, setHomeworkInput] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const isIconMode = currentMode === 'ICON_MODE';
  
  const curriculum = getCurriculum(selectedLanguage);

  // Tracking state for session metrics
  const [wordsPracticed, setWordsPracticed] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [currentAmplitude, setCurrentAmplitude] = useState(0);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  
  const handleFocusMode = () => {
    if (connectionState !== 'CONNECTED') return;
    SoundService.playFocus();
    Vibration.pulse();
    setStatusMessage("🎯 FOCUS MODE");
    setTimeout(() => {
        if (isMountedRef.current) {
            setStatusMessage(null);
        }
    }, 2000);
  };
  
  useEffect(() => {
    if (!lastCardResult) return;

    if (isGroqModeRef.current) {
        const msg = lastCardResult.correct
            ? "[[SYSTEM: User correctly identified the card!]]"
            : "[[SYSTEM: User FAILED the card. Correct and coach them.]]";
        GroqEngine.injectSystemMessage(msg);
    } else if (sessionRef.current) {
        sessionRef.current.then(s => {
            if (!s) return;
            const msg = lastCardResult.correct 
                ? "[[SYSTEM: User correctly identified the card!]]" 
                : "[[SYSTEM: User FAILED the card. Correct and coach them.]]";
            s.sendRealtimeInput([{ text: msg }]);
        });
    }
    
    if (lastCardResult.correct) {
        setCorrectAnswers(prev => prev + 1);
    }
    setWordsPracticed(prev => prev + 1);
  }, [lastCardResult]);

  const isUserTalkingRef = useRef(false);
  const lastSpeechTimeRef = useRef<number>(Date.now());
  const captionRef = useRef<string>("");
  
  const audioSilenceTriggeredRef = useRef<boolean>(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<Promise<any> | null>(null); 
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const isMountedRef = useRef(true);
  const nextStartTimeRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const isConnectingRef = useRef<boolean>(false);
  const isGroqModeRef = useRef<boolean>(false);
  const captionTimeoutsRef = useRef<number[]>([]);
  const pendingWordsRef = useRef<string[]>([]);
  const flushTimeoutRef = useRef<any>(null);

  const clearFlushTimeout = () => {
    if (flushTimeoutRef.current !== null) {
      clearTimeout(flushTimeoutRef.current);
      flushTimeoutRef.current = null;
    }
  };

  const clearCaptionTimeouts = () => {
    captionTimeoutsRef.current.forEach(t => clearTimeout(t));
    captionTimeoutsRef.current = [];
  };

  // Pre-created AudioContexts to reduce startup latency
  const preAudioCtxRef = useRef<AudioContext | null>(null);
  const preOutputCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    preAudioCtxRef.current = new AC({ sampleRate: 16000, latencyHint: 'interactive' });
    preOutputCtxRef.current = new AC({ sampleRate: 24000, latencyHint: 'interactive' });
    return () => {
      preAudioCtxRef.current?.close();
      preOutputCtxRef.current?.close();
    };
  }, []);

  const sessionCardsRef = useRef<ConceptCardData[]>([]);
  const startTimeRef = useRef<number>(Date.now());

  const executeModeSwitch = (mode: LiveGameMode) => {
      setCurrentMode(mode);
      SoundService.playModeSwitch();
      Vibration.modeSwitch();
      let msg = "";
      if (mode === 'VOCAB_FOCUS') { msg = "📚 VOCAB FOCUS"; } 
      else if (mode === 'GRAMMAR_PRACTICE') { msg = "✏️ GRAMMAR PRACTICE"; } 
      else if (mode === 'RAPID_DRILL') { msg = "⚡ RAPID DRILL"; } 
      else if (mode === 'BRAINSCAPE') { msg = "🧠 BRAINSCAPE"; } 
      else if (mode === 'DECODE') { msg = "🕵️ DECODE"; } 
      else { msg = "💬 FREE TALK"; }
      
      setStatusMessage(msg);
      setTimeout(() => isMountedRef.current && setStatusMessage(null), 2000);
  };

  const handleManualModeSwitch = (mode: LiveGameMode) => {
      if (mode === currentMode) return;
      SoundService.playClick();
      Vibration.pulse();
      if (connectionState === 'CONNECTED') {
          sessionRef.current?.then(s => s.sendRealtimeInput([{ text: `[SYSTEM: MANUAL SWITCH TO ${mode}]` }])).catch(console.error);
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

  useEffect(() => {
    if (connectionState !== 'CONNECTED') return;

    const interval = setInterval(() => {
        if (!isMountedRef.current) return;
        
        const now = Date.now();
        const timeSinceSpeech = now - lastSpeechTimeRef.current;
        const isAISpeaking = nextStartTimeRef.current > (outputContextRef.current?.currentTime || 0);

        setSessionDuration(prev => {
            const next = prev + 0.1;
            if (Math.floor(next) > Math.floor(prev) && Math.floor(next) % 600 === 0) {
                sessionRef.current?.then(s => s.sendRealtimeInput({
                    text: "[SYSTEM: 10 MINUTE CHECKPOINT. Celebrate progress!]"
                })).catch(() => {});
            }
            return next;
        });

        if (currentMode !== 'VOCAB_FOCUS' && !isUserTalkingRef.current && !isAISpeaking) {
            if (timeSinceSpeech > 12000 && !audioSilenceTriggeredRef.current) {
                audioSilenceTriggeredRef.current = true;
                sessionRef.current?.then(s => s.sendRealtimeInput([{ text: "[SYSTEM: INTERRUPT SILENCE]" }]));
            }
        }
    }, 100);

    return () => clearInterval(interval);
  }, [connectionState, currentMode]);


  const getOrbState = (): 'idle' | 'listening' | 'speaking' => {
    if (isUserSpeaking) return 'listening';
    if (nextStartTimeRef.current > (outputContextRef.current?.currentTime || 0)) return 'speaking';
    return 'idle';
  };

  useEffect(() => {
    isMountedRef.current = true;
    
    const cleanup = async () => {
      clearCaptionTimeouts();
      clearFlushTimeout();
      pendingWordsRef.current = [];
      if (isGroqModeRef.current) {
          GroqEngine.stop();
          isGroqModeRef.current = false;
      }
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
    const executeGroqToolCall = (tool: GroqToolCall) => {
      if (!isMountedRef.current) return;
      switch (tool.name) {
        case 'render_concept_card':
          onCardTrigger({
            term: tool.args.term,
            definition: tool.args.definition,
            phonetic: tool.args.phonetic,
            context: tool.args.instruction,
            type: (tool.args.cardType || 'VOCAB') as any,
            semanticColor: tool.args.semanticColor as any,
            hint: tool.args.hint,
            exampleSentence: tool.args.exampleSentence,
            exampleTranslation: tool.args.exampleTranslation,
          });
          sessionCardsRef.current.push({
            term: tool.args.term,
            definition: tool.args.definition,
            phonetic: tool.args.phonetic,
            context: tool.args.instruction,
            type: (tool.args.cardType || 'VOCAB') as any,
            semanticColor: tool.args.semanticColor as any,
            hint: tool.args.hint,
            exampleSentence: tool.args.exampleSentence,
            exampleTranslation: tool.args.exampleTranslation,
          });
          break;
        case 'switch_game_mode':
          executeModeSwitch(tool.args.mode as LiveGameMode);
          break;
        case 'record_grammar_gap':
          MemorySystem.recordGrammarGap(tool.args.gap);
          setStatusMessage(`FOCUS: ${tool.args.gap}`);
          setTimeout(() => isMountedRef.current && setStatusMessage(null), 3000);
          break;
        case 'trigger_homework':
          setHomeworkExercise(tool.args.exercise);
          setShowHomework(true);
          setStatusMessage("HOMEWORK");
          setTimeout(() => isMountedRef.current && setStatusMessage(null), 2000);
          break;
        case 'switch_difficulty':
          MemorySystem.setDifficultyLevel(tool.args.level as any);
          setStatusMessage(`LEVEL: ${tool.args.level}`);
          setTimeout(() => isMountedRef.current && setStatusMessage(null), 3000);
          break;
        case 'analyze_pronunciation':
          setPronunciationData({
            targetWord: tool.args.targetWord,
            userPhonetic: tool.args.userPhonetic,
            accuracyScore: tool.args.accuracyScore,
            feedback: tool.args.feedback,
          });
          break;
      }
    };

    const startGroqSession = async (lang: string, mode: LiveGameMode, iconTitle?: string) => {
      if (!isMountedRef.current || isGroqModeRef.current) return;
      isGroqModeRef.current = true;

      if (sessionRef.current) {
        try { const s = await sessionRef.current; await s.close(); } catch (e) {}
        sessionRef.current = null;
      }

      setConnectionState('CONNECTED');
      setConnectionError(null);
      setRetryCount(0);
      isConnectingRef.current = false;

      const groqMode = mode === 'FREE_TALK' ? (isHandsFree ? 'HANDS_FREE' : 'FREE_TALK') : mode;
      await GroqEngine.start(lang, groqMode, {
        onTranscript: (text) => {
          captionRef.current = text;
          setCaption(text);
        },
        onResponse: (text) => {
          captionRef.current = text;
          setCaption(text);
          setWordsPracticed(prev => prev + 1);
        },
        onToolCall: (tool) => executeGroqToolCall(tool),
        onError: (error) => {
          console.error('[Groq] Error:', error);
          if (isMountedRef.current) {
            setConnectionError(error);
            setConnectionState('ERROR');
          }
        },
        onSpeakingChange: (speaking) => setIsUserSpeaking(speaking),
      }, iconTitle);
    };

    const startSession = async () => {
      if (isConnectingRef.current) return;
      isConnectingRef.current = true;
      // Reset key statuses on fresh session (not retry)
      if (retryCount === 0) ApiRouter.resetAllKeys();
      try {
        const apiKey = ApiRouter.getGoogleKey();
        if (!apiKey) {
            // Full conversational fallback via Groq + WebSpeech
            if (GroqEngine.isAvailable) {
                console.warn("[LiveSession] No Google API keys. Using Groq conversation engine.");
                isGroqModeRef.current = true;
                await startGroqSession(selectedLanguage, currentMode, selectedIcon?.title || undefined);
                isConnectingRef.current = false;
                return;
            }
            // Basic audio-only fallback (no conversation, just coaching)
            if (WebSpeechFallback.isAvailable) {
                console.warn("[LiveSession] No Google API keys. Using Web Speech fallback.");
                setConnectionState('CONNECTED');
                setRetryCount(0);
                isConnectingRef.current = false;
                setStatusMessage("AURA OFFLINE");
                setTimeout(() => isMountedRef.current && setStatusMessage(null), 3000);
                return;
            }
            console.error("No API keys or fallback available.");
            setConnectionState('ERROR');
            setConnectionError("No API keys available. Add Google or Groq keys to environment.");
            isConnectingRef.current = false;
            return;
        }

        const genAI = new GoogleGenAI({ apiKey });

        if (processorRef.current) { try { processorRef.current.disconnect(); } catch(e) {} processorRef.current = null; }
        if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
        if (audioContextRef.current) { audioContextRef.current.close().catch(() => {}); audioContextRef.current = null; }
        if (outputContextRef.current) { outputContextRef.current.close().catch(() => {}); outputContextRef.current = null; }

        setConnectionState(retryCount > 0 ? 'RECONNECTING' : 'CONNECTING');
        setConnectionProgress('Audio');
        setStatusMessage('🎧 Audio...');
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        
        // Reuse pre-created contexts to skip AudioContext construction latency
        const inputCtx = preAudioCtxRef.current || new AudioContextClass({ sampleRate: 16000, latencyHint: 'interactive' });
        const outputCtx = preOutputCtxRef.current || new AudioContextClass({ sampleRate: 24000, latencyHint: 'interactive' });
        preAudioCtxRef.current = null;
        preOutputCtxRef.current = null;
        
        const outAnalyser = outputCtx.createAnalyser();
        outAnalyser.fftSize = 512;
        outAnalyser.connect(outputCtx.destination);
        outputAnalyserRef.current = outAnalyser;

        await inputCtx.resume();
        await outputCtx.resume();
        
        audioContextRef.current = inputCtx;
        outputContextRef.current = outputCtx;

        const analyser = inputCtx.createAnalyser();
        analyser.fftSize = 2048; 
        analyserRef.current = analyser;

        const timeoutId = setTimeout(() => {
            if (isMountedRef.current && (connectionState === 'CONNECTING' || connectionState === 'RECONNECTING')) {
                console.error("Connection timed out.");
                setConnectionState('ERROR');
                setConnectionError("Connection timed out. Please check your network and try again.");
                isConnectingRef.current = false;
            }
        }, 45000);

        setConnectionProgress('Mic');
        setStatusMessage('🎤 Mic...');
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: false,
                channelCount: { ideal: 1 },
            }
        });
        streamRef.current = stream;
        
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
            
            setCurrentAmplitude(Math.min(vol / 128, 1));
            Amplitude.setMic(vol / 256);
            
            if (vol > 60) { 
                isUserTalkingRef.current = true; 
                setIsUserSpeaking(true);
                lastSpeechTimeRef.current = Date.now(); 
                audioSilenceTriggeredRef.current = false;
                
                if (activeSourcesRef.current.size > 0) {
                    activeSourcesRef.current.forEach(src => {
                        try { src.disconnect(); src.stop(); } catch(e) {}
                    });
                    activeSourcesRef.current.clear();
                    nextStartTimeRef.current = outputCtx.currentTime;
                }

                clearCaptionTimeouts();

                if (captionRef.current !== "") {
                    captionRef.current = "";
                    setCaption("");
                }
            } 
            else { 
                isUserTalkingRef.current = false; 
                setIsUserSpeaking(false);
            }
            requestAnimationFrame(volumeCheck);
        };
        volumeCheck();

        setConnectionProgress('Connect');
        setStatusMessage('☁️ AURA Connect...');
        const sessionPromise = genAI.live.connect({
          model: MODEL_NAMES.LIVE,
          config: {
            responseModalities: [Modality.AUDIO], 
            outputAudioTranscription: {},
            systemInstruction: 
                (isHandsFree
                    ? generateSystemInstruction(AURA_HANDS_FREE_SYSTEM_INSTRUCTION, selectedLanguage, 'WOKE')
                        .replace('{{MEMORY_CONTEXT}}', MemorySystem.getContextPrompt())
                    : currentMode === 'ICON_MODE' 
                    ? generateSystemInstruction(
                        AURA_ICON_SYSTEM_INSTRUCTION
                          .replace('{{SELECTED_ICON}}', selectedIcon ? `${selectedIcon.title} (${selectedIcon.topics.join(', ')})` : 'Ask user what they want to study today.'),
                        selectedLanguage, 'ICON'
                      ).replace('{{MEMORY_CONTEXT}}', MemorySystem.getContextPrompt())
                    : currentMode === 'BRAINSCAPE'
                        ? generateSystemInstruction(AURA_AMOS_SYSTEM_INSTRUCTION, selectedLanguage, 'AMOS')
                            .replace('{{MEMORY_CONTEXT}}', MemorySystem.getContextPrompt())
                        : generateSystemInstruction(AURA_SYSTEM_INSTRUCTION, selectedLanguage, 'FULL')
                            .replace('{{MEMORY_CONTEXT}}', MemorySystem.getContextPrompt())
                ),
            tools: [{ functionDeclarations: AURA_TOOLS }],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: currentMode === 'ICON_MODE' ? 'Puck' : 'Kore' } }
            }
          },
          callbacks: {
            onopen: () => {
                if(!isMountedRef.current) return;
                clearTimeout(timeoutId);
                if (audioContextRef.current !== inputCtx) return;

                setConnectionState('CONNECTED');
                setConnectionProgress('');
                setStatusMessage(null);
                setRetryCount(0);
                isConnectingRef.current = false;
                
                const actualRate = inputCtx.sampleRate || 16000;
                const processor = inputCtx.createScriptProcessor(512, 1, 1);
                processorRef.current = processor;
                
                processor.onaudioprocess = (e) => {
                    const inputData = e.inputBuffer.getChannelData(0);
                    const pcm16 = float32ToPCM16(inputData);
                    const base64Data = arrayBufferToBase64(pcm16.buffer);
                    sessionPromise.then(s => s.sendRealtimeInput({ audio: { mimeType: `audio/pcm;rate=${actualRate}`, data: base64Data } })).catch(() => {});
                };
                
                source.connect(processor);
                
                const silenceNode = inputCtx.createGain();
                silenceNode.gain.value = 0; 
                processor.connect(silenceNode);
                silenceNode.connect(inputCtx.destination);

                // Força a IA a dar o primeiro 'Olá' imediatamente, reduzindo o delay inicial
                setTimeout(() => {
                    if (isMountedRef.current) {
                        sessionPromise.then(s => {
                            // @ts-ignore
                            s.sendRealtimeInput([{ text: "[[SYSTEM: A sessão acabou de conectar. Dê as boas vindas ao usuário de forma curta e super animada imediatamente para iniciar a aula! Não espere ele falar.]]" }]);
                        }).catch(() => {});
                    }
                }, 300);
            },
            onmessage: async (msg: LiveServerMessage) => {
                let textChunk = "";
                if (msg.serverContent?.outputTranscription) {
                    textChunk = msg.serverContent.outputTranscription.text;
                    captionRef.current += textChunk;
                    
                    const newWords = textChunk.trim().split(/\s+/).filter(Boolean);
                    pendingWordsRef.current.push(...newWords);
                    
                    clearFlushTimeout();
                    flushTimeoutRef.current = window.setTimeout(() => {
                        if (isMountedRef.current && pendingWordsRef.current.length > 0) {
                            const words = [...pendingWordsRef.current];
                            pendingWordsRef.current = [];
                            words.forEach((word, idx) => {
                                const timeoutId = window.setTimeout(() => {
                                    if (isMountedRef.current) {
                                        setCaption(prev => {
                                            const trimmed = prev.trim();
                                            return trimmed ? `${trimmed} ${word}` : word;
                                        });
                                    }
                                }, idx * 700);
                                captionTimeoutsRef.current.push(timeoutId);
                            });
                        }
                    }, 1200);
                }

                if (msg.serverContent?.interrupted) {
                    captionRef.current = "";
                    setCaption("");
                    clearCaptionTimeouts();
                    clearFlushTimeout();
                    pendingWordsRef.current = [];
                    activeSourcesRef.current.forEach(src => {
                        try { src.disconnect(); src.stop(); } catch(e) {}
                    });
                    activeSourcesRef.current.clear();
                    nextStartTimeRef.current = outputCtx.currentTime;
                }

                const parts = msg.serverContent?.modelTurn?.parts;
                if (parts && outputContextRef.current === outputCtx) {
                    clearFlushTimeout();
                    
                    const buffers = await Promise.all(parts.map(async part => {
                        const audioData = part.inlineData?.data;
                        if (!audioData) return null;
                        const uint8 = base64ToUint8Array(audioData);
                        return decodePCM(uint8, outputCtx, 24000);
                    }));

                    const validBuffers = buffers.filter((b): b is AudioBuffer => b !== null);
                    let firstBufferScheduledTime: number | null = null;
                    let totalAudioDuration = 0;
                    for (const ab of validBuffers) {
                        totalAudioDuration += ab.duration;
                    }

                    for (let i = 0; i < validBuffers.length; i++) {
                        const audioBuffer = validBuffers[i];
                        const src = outputCtx.createBufferSource();
                        src.buffer = audioBuffer;
                        src.connect(outAnalyser);
                        
                        activeSourcesRef.current.add(src);
                        src.onended = () => activeSourcesRef.current.delete(src);

                        const now = outputCtx.currentTime;
                        const BUFFER_LATENCY = 0.1;
                        
                        if (nextStartTimeRef.current < now) {
                            nextStartTimeRef.current = now + BUFFER_LATENCY;
                        }
                        
                        const scheduledTime = nextStartTimeRef.current;
                        if (i === 0) {
                            firstBufferScheduledTime = scheduledTime;
                        }
                        src.start(scheduledTime);
                        nextStartTimeRef.current += audioBuffer.duration;
                    }

                    if (pendingWordsRef.current.length > 0 && firstBufferScheduledTime !== null && totalAudioDuration > 0) {
                        const now = outputCtx.currentTime;
                        const startDelay = Math.max(0, (firstBufferScheduledTime - now) * 1000);
                        
                        const targetMsPerWord = 700;
                        const maxWords = Math.ceil((totalAudioDuration * 1000) / targetMsPerWord);
                        const wordsToScheduleCount = Math.min(pendingWordsRef.current.length, maxWords);

                        if (wordsToScheduleCount > 0) {
                            const wordsToSchedule = pendingWordsRef.current.splice(0, wordsToScheduleCount);
                            const timePerWordMs = (totalAudioDuration * 1000) / wordsToScheduleCount;

                            wordsToSchedule.forEach((word, idx) => {
                                const wordDelay = startDelay + (idx * timePerWordMs);
                                const timeoutId = window.setTimeout(() => {
                                    if (isMountedRef.current) {
                                        setCaption(prev => {
                                            const trimmed = prev.trim();
                                            return trimmed ? `${trimmed} ${word}` : word;
                                        });
                                    }
                                }, wordDelay);
                                captionTimeoutsRef.current.push(timeoutId);
                            });
                        }
                    }
                } else if (textChunk) {
                    setCaption(prev => {
                        const trimmed = prev.trim();
                        return trimmed ? `${trimmed} ${textChunk}` : textChunk;
                    });
                }
                
                if (msg.toolCall) {
                    const responses = [];
                    for (const fc of msg.toolCall.functionCalls) {
                        if (fc.name === 'render_concept_card') {
                            const args = fc.args as any;
                            const card: ConceptCardData = {
                                term: args.term, definition: args.definition, phonetic: args.phonetic, context: args.instruction,
                                type: args.cardType || 'VOCAB',
                                semanticColor: args.semanticColor as any,
                                hint: args.hint,
                                exampleSentence: args.exampleSentence,
                                exampleTranslation: args.exampleTranslation,
                            };
                            onCardTrigger(card);
                            sessionCardsRef.current.push(card);
                            
                            if (card.type === 'CORRECTION') { 
                                setStatusMessage("🛑 CORRECTION");
                                SoundService.playError();
                                Vibration.error();
                            } else {
                                setStatusMessage("✨ NEW CONCEPT");
                                SoundService.playSuccess();
                                Vibration.newVocab();
                            }
                            setTimeout(() => isMountedRef.current && setStatusMessage(null), 1500);
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
                                feedback: args.feedback,
                                syllableBreakdown: args.syllableBreakdown,
                                specificErrors: args.specificErrors,
                                nativePhonetic: args.nativePhonetic,
                            });
                            Vibration.pronunciation(args.accuracyScore);
                            responses.push({ name: fc.name, id: fc.id, response: { result: "Feedback Shown" } });
                        }
                        else if (fc.name === 'trigger_homework') {
                            const args = fc.args as any;
                            setHomeworkExercise(args.exercise);
                            setShowHomework(true);
                            setStatusMessage("📝 HOMEWORK");
                            setTimeout(() => isMountedRef.current && setStatusMessage(null), 2000);
                            responses.push({ name: fc.name, id: fc.id, response: { result: "Homework triggered" } });
                        }
                        else if (fc.name === 'record_grammar_gap') {
                            const args = fc.args as any;
                            MemorySystem.recordGrammarGap(args.gap);
                            setStatusMessage(`📌 FOCUS: ${args.gap}`);
                            setTimeout(() => isMountedRef.current && setStatusMessage(null), 3000);
                            responses.push({ name: fc.name, id: fc.id, response: { result: "Grammar gap recorded" } });
                        }
                        else if (fc.name === 'switch_difficulty') {
                            const newLevel = (fc.args as any).level;
                            MemorySystem.setDifficultyLevel(newLevel as any);
                            setStatusMessage(`🎭 LEVEL: ${newLevel}`);
                            setTimeout(() => isMountedRef.current && setStatusMessage(null), 3000);
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
                    if (errorStr.includes('quota') || errorStr.includes('429') || errorStr.toLowerCase().includes('spending cap')) {
                        console.error("Billing limit reached. Rotating API key.");
                        ApiRouter.markCurrentKeyFailed('quota_exhausted');
                        setStatusMessage("ROTATING...");
                        
                        if (!ApiRouter.isOnFallback) {
                            isFatalErrorRef.current = false;
                            setTimeout(() => setRetryCount(c => c + 1), 1000);
                            return;
                        }
                        
                        // ALL KEYS EXHAUSTED — try Groq
                        isFatalErrorRef.current = true;
                        if (GroqEngine.isAvailable) {
                            setStatusMessage("SWITCHING TO GROQ");
                            isGroqModeRef.current = true;
                            startGroqSession(selectedLanguage, currentMode, selectedIcon?.title || undefined);
                            setConnectionState('CONNECTED');
                            setConnectionError(null);
                            setTimeout(() => isMountedRef.current && setStatusMessage(null), 2000);
                            return;
                        }
                    }
                    if (errorStr.includes('RATE_LIMIT') || errorStr.includes('rate')) {
                        ApiRouter.markCurrentKeyFailed('rate_limited');
                    }
                    setConnectionError(errorStr);                
                    setConnectionState('ERROR');
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

    const recoveryTimer = setInterval(() => {
        if (isMountedRef.current && (connectionState === 'RECONNECTING' || connectionState === 'CONNECTING')) {
            const now = Date.now();
            if (now - startTimeRef.current > 45000 && retryCount > 0) { 
               console.warn("Forcing connection state reset due to hang");
               setConnectionState('ERROR');
            }
        }
    }, 5000);

    return () => {
        clearInterval(recoveryTimer);
        isMountedRef.current = false;
        cleanup();
    };
  }, [retryCount]);

  const handleFinish = async () => {
      SoundService.playSuccess();
      Vibration.success();
      
      let aiBrief = "SESSION COMPLETE. GOOD WORK.";

      // Stop Groq engine if active
      if (isGroqModeRef.current) {
        GroqEngine.stop();
        isGroqModeRef.current = false;
      }

      try {
        if (ApiRouter.hasGroq) {
          const groqSummary = await ApiRouter.generateSessionSummary({
            duration: Date.now() - startTimeRef.current,
            wordsPracticed,
            correctAnswers,
            cards: (sessionCardsRef.current || []).map(c => c.term)
          });
          if (groqSummary) aiBrief = groqSummary;
        } else {
          const apiKey = ApiRouter.getGoogleKey();
          if (apiKey) {
          const genAI = new GoogleGenAI({ apiKey });
          const result = await genAI.models.generateContent({
                  model: MODEL_NAMES.CHAT,
                  contents: [{
                      role: 'user',
                      parts: [{
                          text: `
                  Generate a brief session summary for an English student.
                  Session Stats:
                  - Duration: ${Math.floor((Date.now() - startTimeRef.current) / 1000)}s
                  - Cards: ${(sessionCardsRef.current || []).map(c => c.term).join(', ')}
                  - Words Practiced: ${wordsPracticed}
                  - Correct Answers: ${correctAnswers}
                  - Grammar Gaps: ${localStorage.getItem('grammar_gaps') || 'None'}

                  Tone: Encouraging, clear, focused on progress.
                  Highlight one positive moment and one area to improve.
                  Keep it under 60 words.
              `
                      }]
                  }]
              });
              aiBrief = result.text || aiBrief;
          }
          }
      } catch (e) {
          console.error("Failed to generate AI brief", e);
      }

      const accuracyRate = wordsPracticed > 0 ? Math.round((correctAnswers / wordsPracticed) * 100) : 0;

      onFinish({
          durationSeconds: (Date.now() - startTimeRef.current) / 1000,
          cardsCollected: sessionCardsRef.current,
          wordsPracticed,
          accuracyRate,
          flowRating: accuracyRate > 85 ? "GODLIKE" : accuracyRate > 70 ? "SOLID" : accuracyRate > 50 ? "STRONG" : "DEVELOPING",
          difficultyLevel: MemorySystem.getDifficultyLevel(),
          aiBrief,
          timestamp: Date.now(),
      });
  };

  if (isCarMode) {
    return (
      <div className={`flex flex-col items-center justify-between h-full w-full p-8 relative overflow-hidden transition-colors duration-500 bg-transparent`}>
        <div className="w-full flex justify-between items-center z-50">
            <div className="flex flex-col">
                <span className="text-gray-500 font-mono text-xs uppercase tracking-widest">Session</span>
                <span className="text-white font-mono text-lg mt-1">
                    {Math.floor(sessionDuration / 60)}:{String(Math.floor(sessionDuration % 60)).padStart(2, '0')}
                </span>
            </div>
            <div className="text-right">
                <div className="text-blue-400 font-display font-black text-3xl">{wordsPracticed}</div>
                <div className="text-gray-500 font-mono text-[10px] uppercase">Words Practiced</div>
            </div>
        </div>

        <div className="flex-1 flex flex-col items-center w-full z-40 relative">
            <div className="flex-1 flex items-center justify-center">
              <div className="relative w-48 h-48 md:w-56 md:h-56">
                      <GeometricOrb state={getOrbState()} amplitude={currentAmplitude} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-4xl md:text-5xl mb-1">{isMuted ? '🔇' : '🎙️'}</span>
                      <span className={`font-mono text-xs font-bold tracking-[0.3em] uppercase ${isUserTalkingRef.current ? 'text-blue-400 animate-pulse' : 'text-gray-600'}`}>
                          {isUserTalkingRef.current ? 'Listening' : 'Standby'}
                      </span>
                  </div>
              </div>
            </div>
        </div>

        <div className="absolute z-50 flex justify-center px-4 pointer-events-none"
          style={{ bottom: '120px', left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 32px)' }}>
          <div className="w-full max-w-lg bg-black/50 backdrop-blur-sm rounded-lg overflow-hidden">
            <AuraCaptions text={caption} isActive={!!caption} />
          </div>
        </div>

        <div className="absolute top-20 right-4 z-50">
            <button 
                onClick={toggleMute}
                className={`h-8 w-8 rounded-full flex items-center justify-center transition-all active:scale-95 border ${isMuted ? 'bg-red-900/20 border-red-500 text-red-500' : 'bg-white/5 border-white/20 text-white'}`}
                title={isMuted ? 'Unmute' : 'Mute'}
            >
                <span className="text-sm">{isMuted ? '🔇' : '🎙️'}</span>
            </button>
        </div>

        <button
          onClick={onExit}
          className="absolute top-3 left-3 z-[120] bg-black/60 backdrop-blur text-white border border-white/20 px-3 py-1.5 text-[10px] font-bold rounded-full hover:bg-white/10 hover:border-white/50 transition-all tracking-wider"
        >
          ← MÓDULOS
        </button>

        <button 
            onClick={() => {
                setIsCarMode(false);
                if (connectionState === 'CONNECTED' && sessionRef.current) {
                    sessionRef.current.then(s => s.sendRealtimeInput([{ text: "[SYSTEM: EXITING HANDS-FREE MODE. Screen available. Normal pacing resumed. User can see the display.]" }])).catch(console.error);
                }
            }}
            className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-900/50 text-gray-500 px-4 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest border border-gray-800 hover:text-white hover:border-white transition-all z-50"
        >
            Exit Hands-Free
        </button>

        {statusMessage && (
            <div className="absolute inset-0 flex items-center justify-center z-[60] bg-black/60 backdrop-blur-sm pointer-events-none">
                <h1 className="text-5xl font-bold text-center px-4 text-blue-400">
                    {statusMessage}
                </h1>
            </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center h-full w-full relative overflow-hidden transition-all duration-500 bg-transparent`}>
      
      <div className="absolute inset-0 pointer-events-none z-0"
        style={{ 
            background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.15) 100%)'
        }}
      ></div>

      <GeometricOrb state={getOrbState()} amplitude={currentAmplitude} />

       {showCaptions && caption && (
         <div className="absolute z-40 flex justify-center px-4 pointer-events-none transition-all duration-300"
           style={{ bottom: isCardVisible ? '16px' : '120px', left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 32px)' }}>
           <div className="w-full max-w-lg bg-black/50 backdrop-blur-sm rounded-lg overflow-hidden">
             <AuraCaptions text={caption} isActive={!!caption} />
           </div>
         </div>
       )}

      <div className="absolute top-0 left-0 w-full h-1 bg-gray-900 z-50">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
            style={{ width: `${Math.min((sessionDuration / 3600) * 100, 100)}%` }}
          ></div>
      </div>

      <div className="absolute top-16 left-0 w-full flex sm:justify-center gap-2 z-40 px-4 overflow-x-auto flex-nowrap scrollbar-hide pb-2">
        {(['FREE_TALK', 'VOCAB_FOCUS', 'GRAMMAR_PRACTICE', 'RAPID_DRILL', 'BRAINSCAPE', 'DECODE', 'ICON_MODE'] as LiveGameMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => handleManualModeSwitch(mode)}
            className={`px-3 py-1 text-[10px] md:text-xs font-bold font-mono uppercase tracking-wider border transition-all rounded-sm backdrop-blur-md
              ${currentMode === mode 
                ? (mode === 'ICON_MODE' ? 'bg-purple-500 text-white border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.6)]' : 'bg-blue-500 text-white border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]') 
                : 'bg-black/40 text-gray-500 border-gray-800 hover:border-white hover:text-white'
              }`}
          >
            {mode === 'ICON_MODE' ? '🎓 AURA MODE' : mode === 'BRAINSCAPE' ? '🧠 BRAINSCAPE' : mode.replace('_', ' ')}
          </button>
        ))}
      </div>

      <button
        onClick={onExit}
        className="absolute top-3 left-3 z-[120] bg-black/60 backdrop-blur text-white border border-white/20 px-3 py-1.5 text-[10px] font-bold rounded-full hover:bg-white/10 hover:border-white/50 transition-all tracking-wider"
      >
        ← MÓDULOS
      </button>

      {connectionState === 'CONNECTING' && (
        <div className="z-50 flex flex-col items-center gap-2">
          <div className="text-blue-400 animate-pulse font-mono bg-black/80 px-4 py-2 rounded uppercase tracking-widest">Connecting...</div>
          {connectionProgress && (
            <div className="flex items-center gap-2">
              {['Audio', 'Mic', 'Connect'].map((step) => (
                <div key={step} className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider border transition-all ${
                  connectionProgress === step
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500 animate-pulse'
                    : ['Audio', 'Mic', 'Connect'].indexOf(connectionProgress) > ['Audio', 'Mic', 'Connect'].indexOf(step)
                    ? 'bg-green-500/20 text-green-300 border-green-500'
                    : 'bg-gray-900/50 text-gray-600 border-gray-800'
                }`}>
                  {step === 'Audio' ? '🎧' : step === 'Mic' ? '🎤' : '☁️'} {step}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {connectionState === 'RECONNECTING' && <div className="z-50 text-cyan-400 animate-pulse font-mono bg-black/80 px-4 py-2 rounded uppercase tracking-widest">Reconnecting... ({retryCount})</div>}
      {connectionState === 'ERROR' && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
              <div className={`flex flex-col items-center gap-6 p-10 rounded-2xl border-2 shadow-2xl max-w-sm w-full mx-4 ${isIconMode ? 'bg-[#1a0b2e] border-purple-500' : 'bg-neutral-900 border-red-500'}`}>
                  <div className={`${isIconMode ? 'text-purple-400' : 'text-red-500'} font-black text-3xl uppercase tracking-tighter text-center leading-none`}>
                    {connectionError && (connectionError.includes('quota') || connectionError.includes('429') || connectionError.toLowerCase().includes('spending cap')) ? 'LIMIT REACHED' : 'Connection Error'}
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
                    {connectionError && (connectionError.includes('quota') || connectionError.includes('429') || connectionError.toLowerCase().includes('spending cap')) ? 'TRY ANYWAY' : 'RECONNECT'}
                  </button>
              </div>
          </div>
      )}
      
      {statusMessage && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none text-center w-full">
              <h1 className="text-5xl font-bold text-white drop-shadow-lg">
                  {statusMessage}
              </h1>
          </div>
      )}

      <PronunciationWidget data={pronunciationData} onClose={() => setPronunciationData(null)} />



      <style>{`
        @keyframes shake {
            0%, 100% { transform: translate(0, 0); }
            25% { transform: translate(-2px, 2px); }
            50% { transform: translate(2px, -2px); }
            75% { transform: translate(-2px, -2px); }
        }
      `}</style>

      {showHomework && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6">
              <div className="w-full max-w-lg bg-[#0a0a1a] border-2 border-blue-500 rounded-[2rem] p-8 shadow-[0_0_150px_rgba(59,130,246,0.2)] relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500"></div>
                  
                  <div className="flex justify-between items-start mb-8">
                      <div className="flex flex-col">
                        <h2 className="text-3xl font-bold text-blue-400 uppercase tracking-tighter leading-none">HOMEWORK</h2>
                      </div>
                      <button onClick={() => setShowHomework(false)} className="bg-white/10 hover:bg-white/20 w-10 h-10 rounded-full flex items-center justify-center text-white transition-all transform hover:rotate-90">✕</button>
                  </div>
                  
                  <div className="bg-black/40 border border-blue-500/30 rounded-2xl p-6 mb-8 relative">
                      <div className="absolute -top-3 left-4 bg-blue-500 text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase">Exercise</div>
                      <p className="text-white font-mono text-base leading-relaxed italic">"{homeworkExercise || "Prove you understood what we learned!"}"</p>
                  </div>

                  <textarea 
                    value={homeworkInput}
                    onChange={(e) => setHomeworkInput(e.target.value)}
                    placeholder="Write your answer here..."
                    className="w-full h-48 bg-black/60 border-2 border-blue-500/30 rounded-2xl p-6 text-white font-mono text-base focus:outline-none focus:border-blue-500 transition-all placeholder:text-gray-700 mb-8 resize-none shadow-inner"
                  />

                  <button 
                    onClick={() => {
                        if (!homeworkInput.trim()) return;
                        
                        SoundService.playSuccess();
                        MemorySystem.saveHomework(homeworkExercise || "General Lesson", homeworkInput);
                        
                        sessionRef.current?.then(s => {
                            s.sendRealtimeInput([{
                                text: `[HOMEWORK SUBMISSION] Exercise: ${homeworkExercise}. My Answer: ${homeworkInput}.`
                            }]);
                        });

                        setStatusMessage("✅ CHALLENGE COMPLETED");
                        setTimeout(() => {
                            setStatusMessage(null);
                            setShowHomework(false);
                        }, 2000);
                        setHomeworkInput("");
                    }}
                    className="w-full bg-blue-500 text-white font-bold py-5 rounded-2xl shadow-[0_10px_30px_rgba(59,130,246,0.4)] hover:scale-[1.05] active:scale-95 transition-all text-xl uppercase tracking-tighter"
                  >
                      SUBMIT
                  </button>
              </div>
          </div>
      )}

      {showCurriculum && (
          <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 sm:p-6 overflow-y-auto">
              <div className="w-full max-w-lg bg-[#0a0a1a] border border-white/10 shadow-[0_0_80px_rgba(59,130,246,0.2)] rounded-2xl p-5 flex flex-col max-h-[85vh]">
                  
                  <div className="flex justify-between items-center mb-5">
                      <div>
                          <h2 className="text-lg font-bold text-white uppercase tracking-tighter leading-none">{curriculum.title}</h2>
                          <p className="text-[9px] text-gray-500 font-mono mt-1 tracking-wider">All levels. One flow. No gates.</p>
                      </div>
                      <button onClick={() => setShowCurriculum(false)} className="text-gray-500 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition-all">✕</button>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
                      {curriculum.modules.map((module) => (
                          <div key={module.id} className="space-y-1.5">
                              <h3 className="text-blue-400/70 font-mono text-[9px] uppercase tracking-[0.2em] font-bold">{module.title}</h3>
                              <div className="grid gap-1">
                                   {module.iconItems.map((iconItem) => {
                                       const levelTag = iconItem.tags?.[0] || 'BASIC';
                                       const displayedTag = getTranslatedTag(levelTag, selectedLanguage);
                                       const tagColor = levelTag === 'ADVANCED' ? 'text-red-400/70 border-red-500/20 bg-red-500/5' : levelTag === 'INTERMEDIATE' ? 'text-yellow-400/70 border-yellow-500/20 bg-yellow-500/5' : 'text-green-400/70 border-green-500/20 bg-green-500/5';
                                       return (
                                       <button 
                                         key={iconItem.id}
                                         onClick={() => {
                                             SoundService.playClick();
                                             setSelectedIcon(iconItem);
                                             setShowCurriculum(false);
                                             if (connectionState === 'CONNECTED') {
                                                 sessionRef.current?.then(s => s.sendRealtimeInput({ 
                                                     text: `[SYSTEM: USER CHOSE iCON: ${iconItem.title}. TOPICS: ${iconItem.topics.join(', ')}. Remember fusion methodology — mix levels, teach contractions immediately, code-switch naturally.]` 
                                                 })).catch(() => {});
                                             }
                                         }}
                                         className={`w-full text-left px-3 py-2 rounded-lg border transition-all group flex justify-between items-center text-sm ${selectedIcon?.id === iconItem.id ? 'bg-blue-500/15 border-blue-500/40' : 'bg-white/[0.02] border-transparent hover:bg-white/5 hover:border-white/10'}`}
                                       >
                                           <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                               <div className="flex items-center gap-2">
                                                   <span className="text-white/90 font-semibold text-[13px] leading-tight truncate group-hover:text-blue-300 transition-colors">{iconItem.title}</span>
                                                   <span className={`text-[8px] font-mono px-1 py-px rounded border shrink-0 ${tagColor}`}>{displayedTag}</span>
                                               </div>
                                               <span className="text-[9px] text-gray-600 font-mono truncate">{iconItem.topics.join(' • ')}</span>
                                           </div>
                                           <span className="text-white/20 text-sm opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">→</span>
                                       </button>
                                   )})}
                              </div>
                          </div>
                      ))}
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/5 flex justify-center">
                    <p className="text-[9px] text-gray-600 font-mono uppercase tracking-widest italic">No levels. No gates. Just progress.</p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default LiveSession;
