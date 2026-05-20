/** GroqPipeline — Frontend service for the Groq + Edge-TTS API server */

const API_BASE = import.meta.env.VITE_API_URL || '';

export interface ConverseResponse {
  transcricao_aluno: string;
  resposta_texto_aura: string;
  audio_url_ou_base64: string;
  timing_ms?: number;
  error?: string;
  character?: string;
}

export type CharacterName = 'aura' | 'icon' | 'amos';

export interface CharacterInfo {
  name: CharacterName;
  label: string;
  color: string;
  accentColor: string;
  orbListening: string;
  orbSpeaking: string;
  orbIdle: string;
  description: string;
}

export const CHARACTERS: Record<CharacterName, CharacterInfo> = {
  aura: {
    name: 'aura',
    label: 'AURA',
    color: '#00FFFF',
    accentColor: '#00E5FF',
    orbListening: 'rgba(250, 204, 21, 0.9)',
    orbSpeaking: 'rgba(34, 197, 94, 0.9)',
    orbIdle: 'rgba(255, 255, 255, 0.5)',
    description: 'Free Conversation',
  },
  icon: {
    name: 'icon',
    label: 'iCON',
    color: '#E6E6FA',
    accentColor: '#D4B4FF',
    orbListening: 'rgba(139, 92, 246, 0.9)',
    orbSpeaking: 'rgba(59, 130, 246, 0.9)',
    orbIdle: 'rgba(230, 230, 250, 0.5)',
    description: 'Structured Lessons',
  },
  amos: {
    name: 'amos',
    label: 'AMOS',
    color: '#FFB6C1',
    accentColor: '#FF69B4',
    orbListening: 'rgba(244, 114, 182, 0.9)',
    orbSpeaking: 'rgba(236, 72, 153, 0.9)',
    orbIdle: 'rgba(255, 182, 193, 0.5)',
    description: 'Spaced Repetition',
  },
};

export class GroqPipeline {
  static async converse(
    audioBlob: Blob,
    history?: Array<{ role: string; content: string }>,
    character?: CharacterName,
  ): Promise<ConverseResponse> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    if (history) {
      formData.append('history', JSON.stringify(history));
    }
    if (character) {
      formData.append('character', character);
    }

    console.log('[GroqPipeline] Sending audio to API:', audioBlob.size, 'bytes');
    console.log('[GroqPipeline] Character:', character || 'aura');
    console.log('[GroqPipeline] API URL:', `${API_BASE}/api/converse`);

    const response = await fetch(`${API_BASE}/api/converse`, {
      method: 'POST',
      body: formData,
    });

    console.log('[GroqPipeline] Response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('[GroqPipeline] API error:', error);
      throw new Error(error.error || `API request failed (${response.status})`);
    }

    const result = await response.json();
    console.log('[GroqPipeline] Success:', result.transcricao_aluno?.substring(0, 50));
    return result;
  }

  static playAudio(base64Audio: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      audio.onended = () => resolve();
      audio.onerror = (e) => reject(e);
      audio.play().catch(reject);
    });
  }

  static async converseAndPlay(
    audioBlob: Blob,
    history?: Array<{ role: string; content: string }>,
    character?: CharacterName,
    onTranscript?: (text: string) => void,
    onResponse?: (text: string) => void,
  ): Promise<ConverseResponse> {
    const result = await this.converse(audioBlob, history, character);

    if (result.transcricao_aluno && onTranscript) {
      onTranscript(result.transcricao_aluno);
    }

    if (result.resposta_texto_aura && onResponse) {
      onResponse(result.resposta_texto_aura);
    }

    if (result.audio_url_ou_base64) {
      await this.playAudio(result.audio_url_ou_base64);
    }

    return result;
  }
}
