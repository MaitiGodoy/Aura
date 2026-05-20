/** Web Speech API Fallback — native browser TTS/STT when cloud APIs are exhausted */

class WebSpeechFallbackService {
  private speechSynth: SpeechSynthesis | null = null;
  private recognition: any = null;
  private isSpeaking = false;
  private isListening = false;
  private onTranscriptCallback: ((text: string) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.speechSynth = window.speechSynthesis;

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal && this.onTranscriptCallback) {
              this.onTranscriptCallback(transcript);
            }
          }
        };

        this.recognition.onerror = (event: any) => {
          console.warn('[WebSpeech] Recognition error:', event.error);
          if (event.error === 'not-allowed') {
            this.isListening = false;
          }
        };
      }
    }
  }

  get isAvailable(): boolean {
    return !!(this.speechSynth || this.recognition);
  }

  get hasTTS(): boolean {
    return !!this.speechSynth;
  }

  get hasSTT(): boolean {
    return !!this.recognition;
  }

  // --- TEXT-TO-SPEECH ---

  speak(text: string, options?: { rate?: number; pitch?: number; voice?: string }): Promise<void> {
    return new Promise((resolve) => {
      if (!this.speechSynth) {
        resolve();
        return;
      }

      // Cancel any ongoing speech
      this.speechSynth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options?.rate ?? 0.9;  // Slightly slower for clarity
      utterance.pitch = options?.pitch ?? 1.0;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';

      // Try to find a good English voice
      const voices = this.speechSynth.getVoices();
      const preferredVoice = voices.find(v =>
        v.lang.startsWith('en') && v.name.includes('Female')
      ) || voices.find(v => v.lang.startsWith('en'));

      if (preferredVoice) utterance.voice = preferredVoice;

      if (options?.voice) {
        const named = voices.find(v => v.name.includes(options.voice!));
        if (named) utterance.voice = named;
      }

      this.isSpeaking = true;
      utterance.onend = () => {
        this.isSpeaking = false;
        resolve();
      };
      utterance.onerror = () => {
        this.isSpeaking = false;
        resolve();
      };

      this.speechSynth.speak(utterance);
    });
  }

  stopSpeaking(): void {
    if (this.speechSynth) {
      this.speechSynth.cancel();
      this.isSpeaking = false;
    }
  }

  // --- SPEECH-TO-TEXT ---

  startListening(onTranscript: (text: string) => void): void {
    this.onTranscriptCallback = onTranscript;
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
        this.isListening = true;
        console.log('[WebSpeech] STT started');
      } catch (e) {
        console.warn('[WebSpeech] Failed to start STT:', e);
      }
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('[WebSpeech] Failed to stop STT:', e);
      }
      this.isListening = false;
      this.onTranscriptCallback = null;
      console.log('[WebSpeech] STT stopped');
    }
  }

  /** Speak an AURA message and return when done */
  async speakAuraMessage(text: string): Promise<void> {
    if (!this.hasTTS) return;
    await this.speak(text, { rate: 0.85, pitch: 1.05 });
  }
}

export const WebSpeechFallback = new WebSpeechFallbackService();
