/** API Router — 5-key Google rotation + Groq logic + Web Speech fallback */

export type KeyStatus = 'active' | 'rate_limited' | 'quota_exhausted';

class ApiRouterService {
  googleKeys: string[] = [];
  private currentGoogleIndex = 0;
  private keyStatuses: KeyStatus[] = [];
  private groqKey = '';
  private groqEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
  private groqModel = 'llama-3.3-70b-versatile';

  constructor() {
    // Load 5 Google keys from process.env
    this.googleKeys = [
      process.env.GOOGLE_API_KEY_1 || '',
      process.env.GOOGLE_API_KEY_2 || '',
      process.env.GOOGLE_API_KEY_3 || '',
      process.env.GOOGLE_API_KEY_4 || '',
      process.env.GOOGLE_API_KEY_5 || '',
    ].filter(k => k.length > 0);

    // Fallback to single GEMINI_API_KEY if rotation array not configured
    if (this.googleKeys.length === 0) {
      const singleKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
      if (singleKey) this.googleKeys = [singleKey];
    }

    this.keyStatuses = this.googleKeys.map(() => 'active');
    this.groqKey = process.env.GROQ_API_KEY || '';
  }

  /** Get current active Google API key. Skips exhausted keys on each call. */
  getGoogleKey(): string {
    // Skip to next ACTIVE key
    if (this.keyStatuses[this.currentGoogleIndex] !== 'active') {
      this.rotateToNextActiveKey();
    }

    const key = this.googleKeys[this.currentGoogleIndex] || '';
    if (!key || this.keyStatuses[this.currentGoogleIndex] !== 'active') {
      return '';
    }
    return key;
  }

  /** Get the index of the current Google key */
  getCurrentIndex(): number {
    return this.currentGoogleIndex;
  }

  /** Get status of all keys */
  getKeyStatuses(): KeyStatus[] {
    return [...this.keyStatuses];
  }

  /** Check if all keys are exhausted */
  get isOnFallback(): boolean {
    return this.keyStatuses.every(s => s !== 'active') && this.keyStatuses.length > 0;
  }

  /** Check if Groq is available */
  get hasGroq(): boolean {
    return this.groqKey.length > 0;
  }

  /** Check if any Google key is active */
  get hasGoogleKey(): boolean {
    return this.googleKeys.some((k, i) => k && this.keyStatuses[i] === 'active');
  }

  /** Mark current key as failed (rate limited or quota exhausted) */
  markCurrentKeyFailed(status: 'rate_limited' | 'quota_exhausted'): void {
    this.keyStatuses[this.currentGoogleIndex] = status;
    console.warn(`[APIRouter] Key ${this.currentGoogleIndex + 1} marked as ${status}`);

    // Rotate to next active key
    this.rotateToNextActiveKey();
  }

  /** Rotate to the next active key */
  private rotateToNextActiveKey(): void {
    const startIndex = this.currentGoogleIndex;
    let attempts = 0;

    do {
      this.currentGoogleIndex = (this.currentGoogleIndex + 1) % this.googleKeys.length;
      attempts++;
      if (this.keyStatuses[this.currentGoogleIndex] === 'active') return;
    } while (attempts < this.googleKeys.length);

    console.error('[APIRouter] All Google API keys exhausted. Switching to fallback mode.');
  }

  /** Reset all key statuses (call periodically or on new session) */
  resetAllKeys(): void {
    this.keyStatuses = this.googleKeys.map(() => 'active');
    this.currentGoogleIndex = 0;
    console.log('[APIRouter] All Google API keys reset to active.');
  }

  /** Manually set a specific key index */
  setKeyIndex(index: number): void {
    if (index >= 0 && index < this.googleKeys.length) {
      this.currentGoogleIndex = index;
    }
  }

  /** Count active keys remaining */
  get activeKeyCount(): number {
    return this.keyStatuses.filter(s => s === 'active').length;
  }

  // --- GROQ API ---

  /** Call Groq API for text generation (logic, summaries, lesson plans) */
  async groqChat(
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    options?: { temperature?: number; max_tokens?: number }
  ): Promise<string | null> {
    if (!this.hasGroq) {
      console.warn('[APIRouter] Groq API key not configured');
      return null;
    }

    try {
      const res = await fetch(this.groqEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.groqModel,
          messages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.max_tokens ?? 1024,
        }),
      });

      if (!res.ok) {
        console.error(`[APIRouter] Groq API error: ${res.status}`, await res.text());
        return null;
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content || null;
    } catch (e) {
      console.error('[APIRouter] Groq request failed:', e);
      return null;
    }
  }

  /** Generate session summary via Groq (text logic, not voice) */
  async generateSessionSummary(params: {
    duration: number;
    wordsPracticed: number;
    correctAnswers: number;
    cards: string[];
  }): Promise<string | null> {
    return this.groqChat([
      {
        role: 'system',
        content: 'You are AURA, an English coach. Generate a brief session summary (max 60 words). Encouraging tone. Highlight one positive moment and one area to improve. Respond in Portuguese or English naturally.'
      },
      {
        role: 'user',
        content: `Session Stats:\n- Duration: ${Math.floor(params.duration / 1000)}s\n- Cards: ${params.cards.join(', ')}\n- Words Practiced: ${params.wordsPracticed}\n- Correct Answers: ${params.correctAnswers}\n\nGenerate a short encouraging summary:`
      }
    ], { max_tokens: 200 });
  }

  /** Generate lesson plan via Groq */
  async generateLessonPlan(topic: string, level: string): Promise<string | null> {
    return this.groqChat([
      {
        role: 'system',
        content: 'You are an expert English curriculum designer. Create a short, practical lesson plan.'
      },
      {
        role: 'user',
        content: `Create a 5-minute lesson plan for level "${level}" on topic "${topic}". Focus on speaking practice.`
      }
    ], { max_tokens: 500 });
  }
}

export const ApiRouter = new ApiRouterService();
