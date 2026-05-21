/** API Router — Google Gemini only (Groq commented out) */

const viteEnv = import.meta.env as Record<string, string | undefined>;

/*
 * Groq API — DESATIVADO PARA CONVERSAÇÃO
 * Mantido como referência para uso futuro em non-conversation (summaries, exercises)
 *
 * const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
 * const GROQ_MODEL = 'llama-3.1-8b-instant';
 * const groqKey = viteEnv.VITE_GROQ_API_KEY || viteEnv.GROQ_API_KEY || '';
 *
 * async function groqChat(messages, options) {
 *   const res = await fetch(GROQ_ENDPOINT, {
 *     method: 'POST',
 *     headers: {
 *       'Authorization': `Bearer ${groqKey}`,
 *       'Content-Type': 'application/json',
 *     },
 *     body: JSON.stringify({
 *       model: GROQ_MODEL,
 *       messages,
 *       temperature: options?.temperature ?? 0.7,
 *       max_tokens: options?.max_tokens ?? 300,
 *     }),
 *   });
 *   const data = await res.json();
 *   return data.choices?.[0]?.message?.content || null;
 * }
 */

class ApiRouterService {
  /* Groq key mantida como comentário para reativação futura
  groqKey = '';
  private groqEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
  private groqModel = 'llama-3.1-8b-instant';

  constructor() {
    this.groqKey = viteEnv.VITE_GROQ_API_KEY || viteEnv.GROQ_API_KEY || '';
  }

  get hasGroq(): boolean {
    return this.groqKey.length > 0;
  }
  */

  get hasGroq(): boolean {
    return false; // Groq desativado — apenas Google Gemini para conversação
  }

  /* Groq chat desativado
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
  */

  // Session summary via Google Gemini (fallback quando Groq desativado)
  async generateSessionSummary(params: {
    duration: number;
    wordsPracticed: number;
    correctAnswers: number;
    cards: string[];
  }): Promise<string | null> {
    // Retorna summary genérico — pode ser implementado com Gemini chat no futuro
    return `Sessão de ${Math.floor(params.duration / 1000)}s. ${params.wordsPracticed} trocas. Bom trabalho!`;
  }
}

export const ApiRouter = new ApiRouterService();
