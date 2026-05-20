/** API Router — Groq only (STT + LLM + TTS via API server) */

const viteEnv = import.meta.env as Record<string, string | undefined>;

class ApiRouterService {
  groqKey = '';
  private groqEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
  private groqModel = 'llama-3.1-8b-instant';

  constructor() {
    this.groqKey = viteEnv.VITE_GROQ_API_KEY || viteEnv.GROQ_API_KEY || '';
  }

  get hasGroq(): boolean {
    return this.groqKey.length > 0;
  }

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
          max_tokens: options?.max_tokens ?? 300,
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
}

export const ApiRouter = new ApiRouterService();
