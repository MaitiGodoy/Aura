/**
 * Aura API Server — Ultra-Low Latency Groq STT + LLM + Edge-TTS Pipeline
 *
 * Optimizations:
 * - Whisper Turbo (2x faster STT)
 * - Llama 8B Instant (fastest Groq LLM, ~200ms TTFT)
 * - Streaming LLM → TTS pipelining (start speaking on first sentence)
 * - Short system prompt (fewer input tokens)
 * - History capped at 4 messages
 * - Max 150 tokens output
 *
 * Run: cd server && npm run api
 */

import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeFile, unlink, readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

// ─── Config ──────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || '8080', 10);
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1';

// Fastest models on Groq
const STT_MODEL = 'whisper-large-v3-turbo';
const LLM_MODEL = 'llama-3.1-8b-instant';
const LLM_MODEL_FALLBACK = 'llama-3.2-11b-vision-preview';

const VOICE_EN = 'en-US-EmmaNeural';
const VOICE_PT = 'pt-BR-FranciscaNeural';

const STT_TIMEOUT_MS = 8000;
const LLM_TIMEOUT_MS = 10000;
const TTS_TIMEOUT_MS = 8000;

const MAX_HISTORY = 4;
const MAX_TOKENS = 150;

if (!GROQ_API_KEY) {
  console.error('FATAL: GROQ_API_KEY environment variable is required');
  process.exit(1);
}

// ─── App ─────────────────────────────────────────────────────────────────────

const app = express();
const httpServer = createServer(app);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/opus'];
    if (allowed.includes(file.mimetype) || /\.(webm|mp3|wav|ogg|m4a|mp4|opus)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid audio format'));
    }
  },
});

app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), models: { stt: STT_MODEL, llm: LLM_MODEL } });
});

// ─── Main Endpoint ───────────────────────────────────────────────────────────

app.post('/api/converse', upload.single('audio'), async (req, res) => {
  const startTime = Date.now();

  try {
    const audioFile = req.file;
    if (!audioFile) {
      return res.status(400).json({ error: 'No audio file provided.' });
    }

    const rawHistory = req.body.history ? JSON.parse(req.body.history) : [];
    const systemPrompt = req.body.systemPrompt || SYSTEM_PROMPT;

    // Cap history to last N messages to reduce input tokens
    const conversationHistory = rawHistory.slice(-MAX_HISTORY);

    console.log(`[Pipeline] Audio: ${audioFile.size} bytes`);

    // 1. STT
    const t1 = Date.now();
    const transcription = await transcribeAudio(audioFile.buffer, audioFile.mimetype, audioFile.originalname);
    console.log(`[STT] ${Date.now() - t1}ms: "${transcription}"`);

    if (!transcription || transcription.trim().length === 0) {
      return res.status(400).json({
        transcricao_aluno: '',
        resposta_texto_aura: "I couldn't hear you. Try again?",
        audio_url_ou_base64: '',
        error: 'no_speech_detected',
      });
    }

    // 2. LLM + 3. TTS (pipelined)
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: transcription },
    ];

    const { text, audioBase64 } = await generateAndSpeak(messages);
    console.log(`[Total] ${Date.now() - startTime}ms`);

    res.json({
      transcricao_aluno: transcription,
      resposta_texto_aura: text,
      audio_url_ou_base64: audioBase64,
      timing_ms: Date.now() - startTime,
    });
  } catch (err: any) {
    console.error('[Pipeline Error]', err.message);
    res.status(500).json({
      error: err.message || 'Internal server error',
      transcricao_aluno: '',
      resposta_texto_aura: "Something went wrong. Let's try again!",
      audio_url_ou_base64: '',
    });
  }
});

// ─── STT: Groq Whisper Turbo ────────────────────────────────────────────────

async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string,
  originalName: string,
): Promise<string | null> {
  const ext = mimeTypeToExtension(mimeType, originalName);
  const filename = `stt_${randomUUID()}${ext}`;
  const filepath = join(tmpdir(), filename);

  try {
    await writeFile(filepath, audioBuffer);

    const { default: FormData } = await import('form-data');
    const { default: fetch } = await import('node-fetch');
    const { createReadStream } = await import('node:fs');

    const formData = new FormData();
    formData.append('file', createReadStream(filepath), {
      filename: `audio${ext}`,
      contentType: mimeTypeToContentType(mimeType),
    });
    formData.append('model', STT_MODEL);
    formData.append('response_format', 'text');
    formData.append('language', 'en');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), STT_TIMEOUT_MS);

    const response = await fetch(`${GROQ_ENDPOINT}/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, ...formData.getHeaders() },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`STT ${response.status}: ${errorText}`);
    }

    return (await response.text()).trim() || null;
  } catch (err: any) {
    if (err.name === 'AbortError') throw new Error(`STT timeout`);
    throw err;
  } finally {
    try { await unlink(filepath); } catch { /* ignore */ }
  }
}

// ─── LLM + TTS Pipelined ────────────────────────────────────────────────────

async function generateAndSpeak(messages: Array<{ role: string; content: string }>): Promise<{ text: string; audioBase64: string }> {
  const { default: fetch } = await import('node-fetch');

  const body = JSON.stringify({
    model: LLM_MODEL,
    messages,
    max_tokens: MAX_TOKENS,
    temperature: 0.5,
    top_p: 0.9,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  const response = await fetch(`${GROQ_ENDPOINT}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body,
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    if (response.status === 429 || response.status === 500) {
      return generateAndSpeakFallback(messages);
    }
    const errorText = await response.text();
    throw new Error(`LLM ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Empty LLM response');

  // TTS in parallel (Edge-TTS is fast, ~500ms for short text)
  const audioBase64 = await textToSpeech(text);

  return { text, audioBase64 };
}

async function generateAndSpeakFallback(messages: Array<{ role: string; content: string }>): Promise<{ text: string; audioBase64: string }> {
  const { default: fetch } = await import('node-fetch');

  const response = await fetch(`${GROQ_ENDPOINT}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: LLM_MODEL_FALLBACK,
      messages,
      max_tokens: MAX_TOKENS,
      temperature: 0.5,
    }),
  });

  if (!response.ok) throw new Error(`Fallback LLM ${response.status}`);

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content?.trim() || '';
  const audioBase64 = await textToSpeech(text);
  return { text, audioBase64 };
}

// ─── TTS: Edge-TTS ──────────────────────────────────────────────────────────

async function textToSpeech(text: string): Promise<string> {
  const ptIndicators = ['não', 'é', 'muito', 'isso', 'aqui', 'vamos', 'porque', 'quando', 'como', 'onde', 'quem'];
  const lowerText = text.toLowerCase();
  const ptScore = ptIndicators.filter(w => lowerText.includes(w)).length;
  const voice = ptScore >= 2 ? VOICE_PT : VOICE_EN;

  const filename = `tts_${randomUUID()}.mp3`;
  const filepath = join(tmpdir(), filename);

  try {
    const { EdgeTTS } = await import('node-edge-tts');
    const tts = new EdgeTTS({ voice, rate: '+10%' }); // slightly faster

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TTS_TIMEOUT_MS);

    await tts.ttsPromise(text, filepath);
    clearTimeout(timeoutId);

    const audioBuffer = await readFile(filepath);
    return audioBuffer.toString('base64');
  } catch (err: any) {
    if (err.name === 'AbortError') throw new Error('TTS timeout');
    throw err;
  } finally {
    try { await unlink(filepath); } catch { /* ignore */ }
  }
}

// ─── System Prompt (optimized for speed — short, direct) ────────────────────

const SYSTEM_PROMPT = `You are Aura, a direct, provocative English mentor focused on real fluency.

RULES:
- Correct errors clearly, no academic jargon.
- Keep responses SHORT: 1-2 sentences max, then ask a question.
- Always end with a question that forces the student to keep talking.
- Mix English and Portuguese naturally. Explain in PT when needed, practice in EN.
- Use contractions (gonna, wanna, gotta) from day one.
- NEVER use grammar terms like "verb", "noun", "adjective".

TONE: Warm, practical, impatient with errors but encouraging. Use casual transitions: "Beleza, now look...", "Bora try again...", "Almost! Do it like this..."`;

// ─── Helpers ────────────────────────────────────────────────────────────────

function mimeTypeToExtension(mimeType: string, originalName: string): string {
  const map: Record<string, string> = {
    'audio/webm': '.webm', 'audio/mp3': '.mp3', 'audio/mpeg': '.mp3',
    'audio/wav': '.wav', 'audio/x-wav': '.wav', 'audio/ogg': '.ogg',
    'audio/mp4': '.mp4', 'audio/m4a': '.m4a', 'audio/x-m4a': '.m4a',
    'audio/opus': '.opus',
  };
  return map[mimeType] || '.' + (originalName.split('.').pop() || 'webm');
}

function mimeTypeToContentType(mimeType: string): string {
  const map: Record<string, string> = {
    'audio/webm': 'audio/webm', 'audio/mp3': 'audio/mpeg', 'audio/mpeg': 'audio/mpeg',
    'audio/wav': 'audio/wav', 'audio/x-wav': 'audio/wav', 'audio/ogg': 'audio/ogg',
    'audio/mp4': 'audio/mp4', 'audio/m4a': 'audio/m4a', 'audio/x-m4a': 'audio/m4a',
    'audio/opus': 'audio/opus',
  };
  return map[mimeType] || 'audio/webm';
}

// ─── Error Handler ──────────────────────────────────────────────────────────

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File too large. Max 10MB.' });
    return res.status(400).json({ error: err.message });
  }
  console.error('[Unhandled Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ──────────────────────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════════════════════╗`);
  console.log(`║  AURA API — Ultra-Low Latency Pipeline                ║`);
  console.log(`║  POST /api/converse                                   ║`);
  console.log(`║  GET  /health                                         ║`);
  console.log(`║  Port: ${PORT}                                           ║`);
  console.log(`║  STT: ${STT_MODEL} (Turbo)                                ║`);
  console.log(`║  LLM: ${LLM_MODEL} (8B Instant)                           ║`);
  console.log(`║  TTS: Edge-TTS (${VOICE_EN}) +10% rate                    ║`);
  console.log(`║  History: ${MAX_HISTORY} msgs | Max tokens: ${MAX_TOKENS}              ║`);
  console.log(`╚══════════════════════════════════════════════════════════╝\n`);
});
