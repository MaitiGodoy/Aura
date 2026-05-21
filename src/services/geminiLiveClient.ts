/** GeminiLiveClient — Direct WebSocket client for Gemini Live API */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const MODEL = 'gemini-2.5-flash-native-audio-latest';

// Gemini Live API WebSocket endpoint
const WS_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;

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
  private ws: WebSocket | null = null;
  private events: Partial<GeminiLiveClientEvents> = {};
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private character: CharacterName = 'aura';
  private isConnecting = false;
  private isGenerating = false;

  on<K extends keyof GeminiLiveClientEvents>(event: K, callback: GeminiLiveClientEvents[K]) {
    this.events[event] = callback;
  }

  connect(character: CharacterName = 'aura') {
    this.character = character;
    this.connectWs();
  }

  private connectWs() {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) return;
    this.isConnecting = true;

    console.log('[GeminiLive] Connecting directly to:', WS_URL);

    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      console.log('[GeminiLive] Connected to Gemini');
      this.isConnecting = false;

      // Send setup message
      const characterConfig = CHARACTERS[this.character];
      const setup = {
        setup: {
          model: `models/${MODEL}`,
          generation_config: {
            response_modalities: ['AUDIO'],
            speech_config: {
              voice_config: {
                prebuilt_voice_config: {
                  voice_name: characterConfig.voiceName,
                },
              },
            },
          },
          system_instruction: {
            parts: [{ text: characterConfig.systemPrompt }],
          },
        },
      };

      console.log('[GeminiLive] Sending setup');
      this.ws!.send(JSON.stringify(setup));
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.setupComplete) {
          console.log('[GeminiLive] Setup complete');
          this.events.ready?.();
          return;
        }

        if (msg.error) {
          console.error('[GeminiLive] Error:', JSON.stringify(msg.error));
          this.events.error?.(msg.error.message || 'Gemini error');
          return;
        }

        if (msg.serverContent) {
          const content = msg.serverContent;

          if (content.modelTurn?.parts?.length > 0) {
            if (!this.isGenerating) {
              this.isGenerating = true;
              this.events.speaking_start?.();
            }

            for (const part of content.modelTurn.parts) {
              if (part.inlineData?.data) {
                this.events.audio_chunk?.(part.inlineData.data);
              }
              if (part.text) {
                this.events.transcription?.(part.text, 'model');
              }
            }
          }

          if (content.turnComplete) {
            this.isGenerating = false;
            this.events.speaking_end?.();
          }

          if (content.interrupted) {
            this.isGenerating = false;
            this.events.interrupted?.();
          }
        }
      } catch (err) {
        console.error('[GeminiLive] Parse error:', err);
      }
    };

    this.ws.onclose = () => {
      console.log('[GeminiLive] Disconnected');
      this.isConnecting = false;
      this.isGenerating = false;
      this.events.close?.();

      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => this.connectWs(), 2000);
    };

    this.ws.onerror = () => {
      this.isConnecting = false;
    };
  }

  sendAudioChunk(pcmData: Int16Array) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const bytes = new Uint8Array(pcmData.buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    this.ws.send(JSON.stringify({
      realtime_input: {
        media_chunks: [{
          mime_type: 'audio/pcm;rate=16000',
          data: base64,
        }],
      },
    }));
  }

  activityStart() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({
      client_content: {
        turns: [{ role: 'user', parts: [] }],
        turn_complete: false,
      },
    }));
  }

  activityEnd() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({
      client_content: {
        turns: [{ role: 'user', parts: [] }],
        turn_complete: true,
      },
    }));
  }

  interrupt() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({
      client_content: {
        turns: [{ role: 'user', parts: [] }],
        turn_complete: true,
      },
    }));
  }

  sendText(text: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({
      client_content: {
        turns: [{ role: 'user', parts: [{ text }] }],
        turn_complete: true,
      },
    }));
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnecting = false;
    this.isGenerating = false;
  }
}
