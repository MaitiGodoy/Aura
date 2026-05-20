/**
 * Aura API Server — Groq STT + LLM + Edge-TTS Pipeline
 *
 * POST /api/converse
 * Receives audio (WebM/MP3/WAV) → Whisper transcription → LLM response → Edge-TTS audio
 * Returns JSON with transcription, text response, and base64 audio
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

const STT_MODEL = 'whisper-large-v3';
const LLM_MODEL = 'llama-3.3-70b-specdec';
const LLM_MODEL_FALLBACK = 'llama-3.1-70b-versatile';

const VOICE_EN = 'en-US-EmmaNeural';
const VOICE_PT = 'pt-BR-FranciscaNeural';

const STT_TIMEOUT_MS = 15000;
const LLM_TIMEOUT_MS = 20000;
const TTS_TIMEOUT_MS = 10000;

if (!GROQ_API_KEY) {
  console.error('FATAL: GROQ_API_KEY environment variable is required');
  process.exit(1);
}

// ─── App ─────────────────────────────────────────────────────────────────────

const app = express();
const httpServer = createServer(app);

// Multer: accept audio files up to 25MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/mp4', 'audio/m4a', 'audio/x-m4a'];
    if (allowed.includes(file.mimetype) || /\.(webm|mp3|wav|ogg|m4a|mp4)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid audio format. Accepts: WebM, MP3, WAV, OGG, M4A'));
    }
  },
});

app.use(express.json({ limit: '1mb' }));

// ─── Health ──────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), models: { stt: STT_MODEL, llm: LLM_MODEL } });
});

// ─── Main Endpoint ───────────────────────────────────────────────────────────

app.post('/api/converse', upload.single('audio'), async (req, res) => {
  const startTime = Date.now();

  try {
    // 1. Validate input
    const audioFile = req.file;
    if (!audioFile) {
      return res.status(400).json({ error: 'No audio file provided. Send multipart/form-data with field "audio".' });
    }

    const conversationHistory = req.body.history ? JSON.parse(req.body.history) : [];
    const systemPrompt = req.body.systemPrompt || buildSystemPrompt();

    console.log(`[Pipeline] Audio received: ${audioFile.size} bytes, type: ${audioFile.mimetype}`);

    // 2. STT: Transcribe with Groq Whisper
    const transcription = await transcribeAudio(audioFile.buffer, audioFile.mimetype, audioFile.originalname);
    if (!transcription || transcription.trim().length === 0) {
      return res.status(400).json({
        transcricao_aluno: '',
        resposta_texto_aura: "I couldn't hear you clearly. Could you try again? Speak a bit louder.",
        audio_url_ou_base64: '',
        error: 'no_speech_detected',
      });
    }

    console.log(`[STT] "${transcription}" (${Date.now() - startTime}ms)`);

    // 3. LLM: Generate Aura response
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: transcription },
    ];

    const auraResponse = await generateLLMResponse(messages);
    console.log(`[LLM] "${auraResponse}" (${Date.now() - startTime}ms)`);

    // 4. TTS: Convert response to speech with Edge-TTS
    const audioBase64 = await textToSpeech(auraResponse);
    console.log(`[TTS] Audio generated (${Date.now() - startTime}ms total)`);

    // 5. Return response
    res.json({
      transcricao_aluno: transcription,
      resposta_texto_aura: auraResponse,
      audio_url_ou_base64: audioBase64,
      timing_ms: Date.now() - startTime,
    });
  } catch (err: any) {
    console.error('[Pipeline Error]', err.message);
    res.status(500).json({
      error: err.message || 'Internal server error',
      transcricao_aluno: '',
      resposta_texto_aura: "Something went wrong on my end. Let's try again!",
      audio_url_ou_base64: '',
    });
  }
});

// ─── STT: Groq Whisper ──────────────────────────────────────────────────────

async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string,
  originalName: string,
): Promise<string | null> {
  const ext = mimeTypeToExtension(mimeType, originalName);
  const filename = `stt_${randomUUID()}${ext}`;
  const filepath = join(tmpdir(), filename);

  try {
    // Write buffer to temp file
    await writeFile(filepath, audioBuffer);

    // Build FormData for Groq API
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
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        ...formData.getHeaders(),
      },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq STT failed (${response.status}): ${errorText}`);
    }

    const text = (await response.text()).trim();
    return text || null;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`STT timeout after ${STT_TIMEOUT_MS / 1000}s`);
    }
    throw err;
  } finally {
    // Always clean up temp file
    try {
      await unlink(filepath);
    } catch { /* ignore */ }
  }
}

// ─── LLM: Groq Chat ─────────────────────────────────────────────────────────

async function generateLLMResponse(messages: Array<{ role: string; content: string }>): Promise<string> {
  const { default: fetch } = await import('node-fetch');

  const body = JSON.stringify({
    model: LLM_MODEL,
    messages,
    max_tokens: 300,
    temperature: 0.7,
    top_p: 0.95,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
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
      const errorText = await response.text();
      // Fallback to secondary model on rate limit or server error
      if (response.status === 429 || response.status === 500) {
        console.warn(`[LLM] Primary model failed, falling back to ${LLM_MODEL_FALLBACK}`);
        return generateLLMWithModel(messages, LLM_MODEL_FALLBACK);
      }
      throw new Error(`Groq LLM failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty LLM response');
    return content.trim();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`LLM timeout after ${LLM_TIMEOUT_MS / 1000}s`);
    }
    throw err;
  }
}

async function generateLLMWithModel(
  messages: Array<{ role: string; content: string }>,
  model: string,
): Promise<string> {
  const { default: fetch } = await import('node-fetch');

  const body = JSON.stringify({
    model,
    messages,
    max_tokens: 300,
    temperature: 0.7,
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
    throw new Error(`Groq LLM fallback also failed (${response.status})`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

// ─── TTS: Edge-TTS ──────────────────────────────────────────────────────────

async function textToSpeech(text: string): Promise<string> {
  // Detect if text is primarily Portuguese
  const ptIndicators = ['não', 'é', 'muito', 'isso', 'aqui', 'vamos', 'porque', 'quando', 'como', 'onde', 'quem', 'o que'];
  const lowerText = text.toLowerCase();
  const ptScore = ptIndicators.filter(w => lowerText.includes(w)).length;
  const voice = ptScore >= 2 ? VOICE_PT : VOICE_EN;

  const filename = `tts_${randomUUID()}.mp3`;
  const filepath = join(tmpdir(), filename);

  try {
    const { EdgeTTS } = await import('node-edge-tts');
    const tts = new EdgeTTS({ voice });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TTS_TIMEOUT_MS);

    await tts.ttsPromise(text, filepath);

    clearTimeout(timeoutId);

    // Read generated audio and convert to base64
    const audioBuffer = await readFile(filepath);
    return audioBuffer.toString('base64');
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`TTS timeout after ${TTS_TIMEOUT_MS / 1000}s`);
    }
    throw new Error(`Edge-TTS failed: ${err.message}`);
  } finally {
    // Always clean up temp file
    try {
      await unlink(filepath);
    } catch { /* ignore */ }
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `Você é a Aura, uma mentora de inglês provocativa, direta e focada em fluência real.

REGRAS:
- Corrige erros gramaticais e de pronúncia do aluno de forma clara, sem enrolação ou jargões acadêmicos.
- Mantém as respostas curtas (máximo 2-3 frases), dinâmicas e naturais.
- SEMPRE termina com uma pergunta que force o aluno a continuar falando.
- Se o aluno errar, mostre o correto imediatamente e peça para repetir.
- Misture inglês e português naturalmente — explique em português quando necessário, mas pratique em inglês.
- Use contrações nativas (gonna, wanna, gotta) desde o início.
- Trate erros como dados, não como falhas. Seja encorajadora mas exigente.
- NUNCA use termos gramaticais como "verbo", "substantivo", "adjetivo". Explique por função e contexto.

TOM:
- Calorosa, prática, paciente, mas implacável com erros.
- Transições informais: "Beleza, agora olha isso...", "Bora tentar de outro jeito...", "Quase! Faz assim ó..."
- Energia alta, como uma professora de elite que quer ver você fluente.`;
}

function mimeTypeToExtension(mimeType: string, originalName: string): string {
  const map: Record<string, string> = {
    'audio/webm': '.webm',
    'audio/mp3': '.mp3',
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
    'audio/x-wav': '.wav',
    'audio/ogg': '.ogg',
    'audio/mp4': '.mp4',
    'audio/m4a': '.m4a',
    'audio/x-m4a': '.m4a',
  };
  return map[mimeType] || '.' + (originalName.split('.').pop() || 'webm');
}

function mimeTypeToContentType(mimeType: string): string {
  const map: Record<string, string> = {
    'audio/webm': 'audio/webm',
    'audio/mp3': 'audio/mpeg',
    'audio/mpeg': 'audio/mpeg',
    'audio/wav': 'audio/wav',
    'audio/x-wav': 'audio/wav',
    'audio/ogg': 'audio/ogg',
    'audio/mp4': 'audio/mp4',
    'audio/m4a': 'audio/m4a',
    'audio/x-m4a': 'audio/m4a',
  };
  return map[mimeType] || 'audio/webm';
}

// ─── Error Handler ──────────────────────────────────────────────────────────

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Audio file too large. Max 25MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  console.error('[Unhandled Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ──────────────────────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════════════╗`);
  console.log(`║  AURA API Server — Groq + Edge-TTS Pipeline     ║`);
  console.log(`║  POST /api/converse                             ║`);
  console.log(`║  GET  /health                                   ║`);
  console.log(`║  Port: ${PORT}                                     ║`);
  console.log(`║  STT: ${STT_MODEL}                               ║`);
  console.log(`║  LLM: ${LLM_MODEL}                               ║`);
  console.log(`║  TTS: Edge-TTS (${VOICE_EN})                      ║`);
  console.log(`╚══════════════════════════════════════════════════╝\n`);
});
