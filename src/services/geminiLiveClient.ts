/** GeminiLiveClient — WebSocket client for Gemini Live API proxy */

const WS_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '') || '';

export type CharacterName = 'aura' | 'icon' | 'amos';

export interface GeminiLiveClientEvents {
  ready: () => void;
  audioChunk: (base64Data: string, mimeType: string) => void;
  speakingStart: () => void;
  speakingEnd: () => void;
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

    const wsUrl = `${WS_BASE.replace(/^http/, 'ws')}/ws?character=${this.character}`;
    console.log('[GeminiLive] Connecting to:', wsUrl);

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('[GeminiLive] Connected');
      this.isConnecting = false;
      this.events.ready?.();
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case 'ready':
            this.events.ready?.();
            break;
          case 'audio_chunk':
            this.events.audioChunk?.(msg.data, msg.mimeType);
            break;
          case 'speaking_start':
            this.events.speakingStart?.();
            break;
          case 'speaking_end':
            this.events.speakingEnd?.();
            break;
          case 'transcription':
            this.events.transcription?.(msg.text, msg.source);
            break;
          case 'interrupted':
            this.events.interrupted?.();
            break;
          case 'error':
            this.events.error?.(msg.message);
            break;
        }
      } catch (err) {
        console.error('[GeminiLive] Parse error:', err);
      }
    };

    this.ws.onclose = () => {
      console.log('[GeminiLive] Disconnected');
      this.isConnecting = false;
      this.events.close?.();

      // Reconnect after 2s
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => this.connectWs(), 2000);
    };

    this.ws.onerror = () => {
      this.isConnecting = false;
    };
  }

  sendAudioChunk(pcmData: Int16Array) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    // Convert Int16Array to base64
    const bytes = new Uint8Array(pcmData.buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    this.ws.send(JSON.stringify({
      type: 'audio_chunk',
      data: base64,
    }));
  }

  activityStart() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'activity_start' }));
  }

  activityEnd() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'activity_end' }));
  }

  interrupt() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'interrupt' }));
  }

  sendText(text: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'text_input', text }));
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnecting = false;
  }
}
