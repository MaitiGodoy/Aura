/** GeminiLiveClient — Uses @google/genai SDK for Gemini Live API */

import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const MODEL = 'gemini-2.5-flash-native-audio-latest';

export type CharacterName = 'aura' | 'icon' | 'amos' | 'gaucho';

interface CharacterConfig {
  systemPrompt: string;
  voiceName: string;
}

const CHARACTERS: Record<CharacterName, CharacterConfig> = {
  aura: {
    voiceName: 'Aoede',
    systemPrompt: `Você é Aura, uma professora de inglês brasileira. Fale PORTUGUÊS BRASILEIRO o tempo todo, com frases em inglês misturadas naturalmente. SEMPRE responda em português. Use inglês APENAS para ensinar palavras/frases. Respostas CURTAS: 1-2 frases no máximo, depois faz uma pergunta. NUNCA use termos gramaticais. Corrija erros de forma direta e prática. Sempre termine com uma pergunta em português.`,
  },
  icon: {
    voiceName: 'Puck',
    systemPrompt: `Você é iCON, um professor de inglês CARIOCA. Você é um HOMEM. Fale PORTUGUÊS BRASILEIRO com gírias cariocas ("cara", "tá ligado", "beleza", "mano", "suave", "de boa", "pô"). SEMPRE responda em português com gírias cariocas. Respostas CURTAS: 1-2 frases, depois faz uma pergunta. NUNCA use termos gramaticais. Sempre termine com uma pergunta.`,
  },
  amos: {
    voiceName: 'Kore',
    systemPrompt: `Você é AMOS, uma professora de inglês MINEIRA. Você é uma MULHER. Fale PORTUGUÊS BRASILEIRO com expressões mineiras ("uai", "trem", "sô", "nossa", "benzinho", "trem bão"). SEMPRE responda em português com expressões mineiras. Respostas CURTAS: 1-2 frases, depois faz uma pergunta. NUNCA use termos gramaticais. Sempre termine com uma pergunta.`,
  },
  gaucho: {
    voiceName: 'Leda',
    systemPrompt: `Você é GAÚCHA, uma professora de inglês do Rio Grande do Sul. Você é uma MULHER gaúcha. Fale PORTUGUÊS BRASILEIRO com expressões gaúchas ("bah", "tchê", "tri", "guri", "capaz", "tri legal"). SEMPRE responda em português com expressões gaúchas. Respostas CURTAS: 1-2 frases, depois faz uma pergunta. NUNCA use termos gramaticais. Sempre termine com uma pergunta.`,
  },
};

export interface GeminiLiveClientEvents {
  ready: () => void;
  audio_chunk: (base64Data: string) => void;
  speaking_start: () => void;
  speaking_end: () => void;
  transcription: (text: string, source: 'user' | 'model') => void;
  interrupted: () => void;
  error: (message: string) => void;
  close: () => void;
}

export class GeminiLiveClient {
  private genAI: GoogleGenAI | null = null;
  private session: any = null;
  private sessionPromise: Promise<any> | null = null;
  private events: Partial<GeminiLiveClientEvents> = {};
  private character: CharacterName = 'aura';
  private isGenerating = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isConnecting = false;

  on<K extends keyof GeminiLiveClientEvents>(event: K, callback: GeminiLiveClientEvents[K]) {
    this.events[event] = callback;
  }

  connect(character: CharacterName = 'aura') {
    this.character = character;
    this.connectSession();
  }

  private connectSession() {
    if (this.isConnecting || this.session) return;
    this.isConnecting = true;
    this.isGenerating = false;

    console.log('[GeminiLive] Connecting via @google/genai SDK');
    console.log('[GeminiLive] Model:', MODEL);
    console.log('[GeminiLive] Voice:', CHARACTERS[this.character].voiceName);

    this.genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const characterConfig = CHARACTERS[this.character];

    this.sessionPromise = this.genAI.live.connect({
      model: MODEL,
      config: {
        responseModalities: [Modality.AUDIO],
        outputAudioTranscription: {},
        inputAudioTranscription: {},
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: characterConfig.voiceName,
            },
          },
        },
        systemInstruction: characterConfig.systemPrompt,
      },
      callbacks: {
        onopen: () => {
          console.log('[GeminiLive] Session opened — ready for audio');
          this.isConnecting = false;
          this.events.ready?.();

          // Force Gemini to say hello immediately
          setTimeout(() => {
            if (this.session) {
              this.session.sendRealtimeInput([{
                text: '[[SYSTEM: A sessão acabou de conectar. Dê as boas vindas ao usuário de forma curta e super animada imediatamente para iniciar a aula! Não espere ele falar.]]',
              }]);
            }
          }, 300);
        },
        onmessage: async (msg: LiveServerMessage) => {
          // Input transcription (user speech)
          if (msg.serverContent?.inputTranscription?.text) {
            console.log('[GeminiLive] User:', msg.serverContent.inputTranscription.text);
            this.events.transcription?.(msg.serverContent.inputTranscription.text, 'user');
          }

          // Output transcription (model speech)
          if (msg.serverContent?.outputTranscription?.text) {
            this.events.transcription?.(msg.serverContent.outputTranscription.text, 'model');
          }

          // Audio from model
          const parts = msg.serverContent?.modelTurn?.parts;
          if (parts && parts.length > 0) {
            if (!this.isGenerating) {
              this.isGenerating = true;
              console.log('[GeminiLive] Model started speaking');
              this.events.speaking_start?.();
            }

            for (const part of parts) {
              if (part.inlineData?.data) {
                this.events.audio_chunk?.(part.inlineData.data);
              }
              if (part.text) {
                this.events.transcription?.(part.text, 'model');
              }
            }
          }

          // Model finished
          if (msg.serverContent?.turnComplete) {
            this.isGenerating = false;
            console.log('[GeminiLive] Model finished speaking');
            this.events.speaking_end?.();
          }

          // Interrupted
          if (msg.serverContent?.interrupted) {
            this.isGenerating = false;
            console.log('[GeminiLive] Model interrupted');
            this.events.interrupted?.();
          }
        },
        onclose: () => {
          console.log('[GeminiLive] Session closed');
          this.isConnecting = false;
          this.isGenerating = false;
          this.session = null;
          this.events.close?.();

          if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => this.connectSession(), 2000);
        },
        onerror: (e) => {
          console.error('[GeminiLive] Session error:', e);
          const errorStr = String(e);
          this.isConnecting = false;

          if (errorStr.includes('quota') || errorStr.includes('429') || errorStr.toLowerCase().includes('spending cap')) {
            this.events.error?.('API quota reached. Please try again later.');
          } else {
            this.events.error?.(errorStr);
          }
        },
      },
    });

    this.session = this.sessionPromise;
  }

  /** Send PCM audio chunk to Gemini — call continuously while mic is active */
  sendAudioChunk(base64Data: string, sampleRate: number = 16000) {
    if (!this.session) return;
    this.session.then((s: any) => {
      s.sendRealtimeInput({
        audio: {
          mimeType: `audio/pcm;rate=${sampleRate}`,
          data: base64Data,
        },
      });
    }).catch(() => {});
  }

  /** Interrupt Gemini while it's speaking */
  interrupt() {
    if (!this.session) return;
    console.log('[GeminiLive] Sending interrupt');
    this.session.then((s: any) => {
      s.sendRealtimeInput([{
        text: '[[SYSTEM: USER INTERRUPTED. Stop speaking immediately and listen to the user.]]',
      }]);
    }).catch(() => {});
  }

  sendText(text: string) {
    if (!this.session) return;
    this.session.then((s: any) => {
      s.sendRealtimeInput([{ text }]);
    }).catch(() => {});
  }

  async disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.session) {
      try {
        const s = await this.session;
        await s.close();
      } catch {}
      this.session = null;
      this.sessionPromise = null;
    }
    this.isConnecting = false;
    this.isGenerating = false;
  }
}
