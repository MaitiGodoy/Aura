/** GroqPipeline — Frontend service for the Groq + Edge-TTS API server */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export interface ConverseResponse {
  transcricao_aluno: string;
  resposta_texto_aura: string;
  audio_url_ou_base64: string;
  timing_ms?: number;
  error?: string;
}

export class GroqPipeline {
  static async converse(audioBlob: Blob, history?: Array<{ role: string; content: string }>): Promise<ConverseResponse> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    if (history) {
      formData.append('history', JSON.stringify(history));
    }

    const response = await fetch(`${API_BASE}/api/converse`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `API request failed (${response.status})`);
    }

    return response.json();
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
    onTranscript?: (text: string) => void,
    onResponse?: (text: string) => void,
  ): Promise<ConverseResponse> {
    const result = await this.converse(audioBlob, history);

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
