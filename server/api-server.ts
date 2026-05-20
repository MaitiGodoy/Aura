/**
 * Aura API Server — Natural Brazilian Portuguese + ElevenLabs TTS
 *
 * Characters:
 * - Aura: Female, Brazilian teacher — ElevenLabs "Rachel" voice
 * - iCON: Male, carioca (Rio) — ElevenLabs "Antoni" voice
 * - AMOS: Female, mineira (Minas) — ElevenLabs "Bella" voice
 *
 * TTS: ElevenLabs eleven_multilingual_v2 — indistinguishable from human speech
 * STT: Groq Whisper Turbo
 * LLM: Groq Llama 3.1 8B Instant
 */

import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import { createServer } from 'http';
import { tmpdir } from 'os';
import { join } from 'path';
import { writeFile, unlink, readFile } from 'fs/promises';
import { randomUUID } from 'crypto';

// ─── Config ──────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || '8080', 10);
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1';
const ELEVENLABS_ENDPOINT = 'https://api.elevenlabs.io/v1';

const STT_MODEL = 'whisper-large-v3-turbo';
const LLM_MODEL = 'llama-3.1-8b-instant';
const TTS_MODEL = 'eleven_multilingual_v2';

// ─── Character System ────────────────────────────────────────────────────────

interface CharacterConfig {
  voiceId: string;
  systemPrompt: string;
  voiceSettings: {
    stability: number;
    similarityBoost: number;
    style: number;
  };
}

const CHARACTERS: Record<string, CharacterConfig> = {
  aura: {
    voiceId: '21m00Tcm4TlvDq8ikWAM',
    voiceSettings: { stability: 0.5, similarityBoost: 0.8, style: 0.2 },
    systemPrompt: `Você é Aura, uma professora de inglês brasileira. Você fala PORTUGUÊS BRASILEIRO o tempo todo, com frases em inglês misturadas naturalmente.

REGRA PRINCIPAL: SEMPRE responda em português brasileiro. Use inglês APENAS para ensinar palavras/frases específicas.

EXEMPLO DE COMO FALAR:
- "Beleza, você disse 'I go to store'. O certo é 'I go to the store'. Não esquece do 'the', tá? Agora me diz: onde você costuma ir?"
- "Quase isso! 'I am working' é o certo. 'I working' não existe, falta o 'am'. Bora tentar de novo?"
- "Isso aí! 'How are you?' é o básico. Agora tenta: 'How have you been?'"

REGRAS:
- Respostas MÁXIMO 2 frases + 1 pergunta
- SEMPRE em português, com inglês só nas frases de exemplo
- NUNCA use termos gramaticais (verbo, substantivo, adjetivo, pronome)
- Corrija erros de forma direta e prática
- Sempre termine com uma pergunta em português

TOM: Direta, prática, calorosa. Como uma amiga que te ensina inglês.`,
  },
  icon: {
    voiceId: 'pNInz6ob7DYSrtmYbDnL',
    voiceSettings: { stability: 0.4, similarityBoost: 0.85, style: 0.3 },
    systemPrompt: `Você é iCON, um professor de inglês CARIOCA do Rio de Janeiro. Você fala PORTUGUÊS BRASILEIRO com sotaque e gírias cariocas.

REGRA PRINCIPAL: SEMPRE responda em português brasileiro com gírias cariocas. Use inglês APENAS para ensinar frases.

GÍRIAS CARIOCAS QUE VOCÊ USA:
- "cara", "tá ligado", "beleza", "mano", "suave", "de boa", "pô", "e aí", "firmeza", "tá tranquilo"

EXEMPLO DE COMO FALAR:
- "E aí cara, beleza? Você falou 'I go store'. Tá ligado que falta o 'to the'? 'I go to the store'. Suave? Me diz aí, onde você vai sempre?"
- "Pô mano, quase! 'I am working' é o certo. Falta o 'am' aí. De boa, bora de novo?"
- "Firmeza! 'How are you?' é básico. Agora tenta 'How's it going?' — é mais natural, tá ligado?"

REGRAS:
- Respostas MÁXIMO 2 frases + 1 pergunta
- SEMPRE em português com gírias cariocas
- NUNCA use termos gramaticais
- Corrija de forma direta, como um amigo carioca
- Sempre termine com uma pergunta

TOM: Descontraído, carioca raiz, amigo que ensina. Usa "cara", "mano", "tá ligado" naturalmente.`,
  },
  amos: {
    voiceId: 'EXAVITh4vr4yRbJXh',
    voiceSettings: { stability: 0.55, similarityBoost: 0.75, style: 0.15 },
    systemPrompt: `Você é AMOS, uma professora de inglês MINEIRA de Minas Gerais. Você fala PORTUGUÊS BRASILEIRO com sotaque e expressões mineiras.

REGRA PRINCIPAL: SEMPRE responda em português brasileiro com expressões mineiras. Use inglês APENAS para ensinar frases.

EXPRESSÕES MINEIRAS QUE VOCÊ USA:
- "uai", "trem", "sô", "nossa", "meu Deus", "abençoado", "benzinho", "uai sô", "trem bão", "uai, como assim"

EXEMPLO DE COMO FALAR:
- "Uai sô, você disse 'I go store'. Tá faltando o 'to the' aí, benzinho. O certo é 'I go to the store'. Uai, me conta: pra onde você vai sempre?"
- "Nossa, quase trem! 'I am working' é o certo. Falta o 'am' aí, sô. Mas tá bão, bora de novo?"
- "Trem bão! 'How are you?' é o básico. Agora tenta 'How have you been?' — é mais bonito, uai!"

REGRAS:
- Respostas MÁXIMO 2 frases + 1 pergunta
- SEMPRE em português com expressões mineiras
- NUNCA use termos gramaticais
- Corrija de forma acolhedora, como uma mineira
- Sempre termine com uma pergunta

TOM: Acolhedora, mineira raiz, paciente. Usa "uai", "trem", "sô" naturalmente.`,
  },
};

const DEFAULT_CHARACTER = 'aura';

const STT_TIMEOUT_MS = 4000;
const LLM_TIMEOUT_MS = 6000;
const TTS_TIMEOUT_MS = 10000;

const MAX_HISTORY = 4;
const MAX_TOKENS = 80;

if (!GROQ_API_KEY) {
  console.error('FATAL: GROQ_API_KEY environment variable is required');
  process.exit(1);
}

if (!ELEVENLABS_API_KEY) {
  console.error('FATAL: ELEVENLABS_API_KEY environment variable is required');
  process.exit(1);
}

// ─── App ─────────────────────────────────────────────────────────────────────

const app = express();
const httpServer = createServer(app);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

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
  res.json({ status: 'ok', uptime: process.uptime(), models: { stt: STT_MODEL, llm: LLM_MODEL, tts: 'ElevenLabs ' + TTS_MODEL }, characters: Object.keys(CHARACTERS) });
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
    const characterName = req.body.character || DEFAULT_CHARACTER;
    const character = CHARACTERS[characterName] || CHARACTERS[DEFAULT_CHARACTER];

    const conversationHistory = rawHistory.slice(-MAX_HISTORY);

    console.log(`[Pipeline] Character: ${characterName}, Audio: ${audioFile.size} bytes`);

    // 1. STT
    const t1 = Date.now();
    const transcription = await transcribeAudio(audioFile.buffer, audioFile.mimetype, audioFile.originalname);
    console.log(`[STT] ${Date.now() - t1}ms: "${transcription}"`);

    if (!transcription || transcription.trim().length === 0) {
      return res.status(400).json({
        transcricao_aluno: '',
        resposta_texto_aura: "Não consegui te ouvir. Tenta de novo?",
        audio_url_ou_base64: '',
        error: 'no_speech_detected',
        character: characterName,
      });
    }

    // 2. LLM + 3. TTS
    const messages = [
      { role: 'system', content: character.systemPrompt },
      ...conversationHistory,
      { role: 'user', content: transcription },
    ];

    const { text, audioBase64 } = await generateAndSpeak(messages, character);
    console.log(`[Total] ${Date.now() - startTime}ms`);

    res.json({
      transcricao_aluno: transcription,
      resposta_texto_aura: text,
      audio_url_ou_base64: audioBase64,
      timing_ms: Date.now() - startTime,
      character: characterName,
    });
  } catch (err: any) {
    console.error('[Pipeline Error]', err.message);
    res.status(500).json({
      error: err.message || 'Internal server error',
      transcricao_aluno: '',
      resposta_texto_aura: "Algo deu errado. Bora tentar de novo!",
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
    if (err.name === 'AbortError') throw new Error('STT timeout');
    throw err;
  } finally {
    try { await unlink(filepath); } catch { /* ignore */ }
  }
}

// ─── LLM + TTS ──────────────────────────────────────────────────────────────

async function generateAndSpeak(
  messages: Array<{ role: string; content: string }>,
  character: CharacterConfig,
): Promise<{ text: string; audioBase64: string }> {
  const { default: fetch } = await import('node-fetch');

  const body = JSON.stringify({
    model: LLM_MODEL,
    messages,
    max_tokens: MAX_TOKENS,
    temperature: 0.7,
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
    const errorText = await response.text();
    throw new Error(`LLM ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Empty LLM response');

  const audioBase64 = await textToSpeech(text, character);

  return { text, audioBase64 };
}

// ─── TTS: ElevenLabs ────────────────────────────────────────────────────────

async function textToSpeech(text: string, character: CharacterConfig): Promise<string> {
  const { default: fetch } = await import('node-fetch');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TTS_TIMEOUT_MS);

  const response = await fetch(`${ELEVENLABS_ENDPOINT}/text-to-speech/${character.voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: TTS_MODEL,
      voice_settings: {
        stability: character.voiceSettings.stability,
        similarity_boost: character.voiceSettings.similarityBoost,
        style: character.voiceSettings.style,
        use_speaker_boost: true,
      },
    }),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs TTS ${response.status}: ${errorText}`);
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer());
  return audioBuffer.toString('base64');
}

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
  console.log(`║  AURA API — ElevenLabs Natural Voices Pipeline          ║`);
  console.log(`║  POST /api/converse                                   ║`);
  console.log(`║  GET  /health                                         ║`);
  console.log(`║  Port: ${PORT}                                           ║`);
  console.log(`║  STT: ${STT_MODEL} (Turbo)                                ║`);
  console.log(`║  LLM: ${LLM_MODEL} (8B Instant)                           ║`);
  console.log(`║  TTS: ElevenLabs ${TTS_MODEL}                           ║`);
  console.log(`║  Characters: ${Object.keys(CHARACTERS).join(', ')}                   ║`);
  console.log(`║  Max tokens: ${MAX_TOKENS} (short responses)                 ║`);
  console.log(`╚══════════════════════════════════════════════════════════╝\n`);
});
