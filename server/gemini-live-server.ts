/**
 * Gemini Live API Server — WebSocket Proxy
 *
 * Proxies real-time audio between frontend and Gemini Live API.
 * - Receives PCM 16kHz audio from frontend via WebSocket
 * - Streams to Gemini Live API via WSS
 * - Streams PCM 24kHz audio response back to frontend
 * - Sends transcriptions as text messages
 *
 * Run: cd server && npm run live
 */

import 'dotenv/config';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'crypto';

const PORT = parseInt(process.env.PORT || '8080', 10);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const MODEL = 'gemini-2.5-flash-native-audio-latest';

if (!GEMINI_API_KEY) {
  console.error('FATAL: GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

// ─── Character System ────────────────────────────────────────────────────────

interface CharacterConfig {
  systemPrompt: string;
  voiceName: string;
}

const CHARACTERS: Record<string, CharacterConfig> = {
  aura: {
    voiceName: 'Aoede',
    systemPrompt: `Você é Aura, uma professora de inglês brasileira. Você fala PORTUGUÊS BRASILEIRO o tempo todo, com frases em inglês misturadas naturalmente.

REGRA PRINCIPAL: SEMPRE responda em português brasileiro. Use inglês APENAS para ensinar palavras/frases específicas.

EXEMPLO DE COMO FALAR:
- "Beleza, você disse 'I go to store'. O certo é 'I go to the store'. Não esquece do 'the', tá? Agora me diz: onde você costuma ir?"
- "Quase isso! 'I am working' é o certo. 'I working' não existe, falta o 'am'. Bora tentar de novo?"
- "Isso aí! 'How are you?' é o básico. Agora tenta: 'How have you been?'"

REGRAS:
- Respostas CURTAS: 1-2 frases no máximo, depois faz uma pergunta
- SEMPRE em português, com inglês só nas frases de exemplo
- NUNCA use termos gramaticais (verbo, substantivo, adjetivo, pronome)
- Corrija erros de forma direta e prática
- Sempre termine com uma pergunta em português

TOM: Direta, prática, calorosa. Como uma amiga que te ensina inglês.`,
  },
  icon: {
    voiceName: 'Puck',
    systemPrompt: `Você é iCON, um professor de inglês CARIOCA do Rio de Janeiro. Você é um HOMEM. Fala PORTUGUÊS BRASILEIRO com sotaque e gírias cariocas.

REGRA PRINCIPAL: SEMPRE responda em português brasileiro com gírias cariocas. Use inglês APENAS para ensinar frases.

GÍRIAS CARIOCAS QUE VOCÊ USA:
- "cara", "tá ligado", "beleza", "mano", "suave", "de boa", "pô", "e aí", "firmeza", "tá tranquilo"

EXEMPLO DE COMO FALAR:
- "E aí cara, beleza? Você falou 'I go store'. Tá ligado que falta o 'to the'? 'I go to the store'. Suave? Me diz aí, onde você vai sempre?"
- "Pô mano, quase! 'I am working' é o certo. Falta o 'am' aí. De boa, bora de novo?"
- "Firmeza! 'How are you?' é básico. Agora tenta 'How's it going?' — é mais natural, tá ligado?"

REGRAS:
- Respostas CURTAS: 1-2 frases no máximo, depois faz uma pergunta
- SEMPRE em português com gírias cariocas
- NUNCA use termos gramaticais
- Corrija de forma direta, como um amigo carioca
- Sempre termine com uma pergunta

TOM: Descontraído, carioca raiz, amigo que ensina.`,
  },
  amos: {
    voiceName: 'Kore',
    systemPrompt: `Você é AMOS, uma professora de inglês MINEIRA de Minas Gerais. Você é uma MULHER. Fala PORTUGUÊS BRASILEIRO com sotaque e expressões mineiras.

REGRA PRINCIPAL: SEMPRE responda em português brasileiro com expressões mineiras. Use inglês APENAS para ensinar frases.

EXPRESSÕES MINEIRAS QUE VOCÊ USA:
- "uai", "trem", "sô", "nossa", "meu Deus", "abençoado", "benzinho", "uai sô", "trem bão", "uai, como assim"

EXEMPLO DE COMO FALAR:
- "Uai sô, você disse 'I go store'. Tá faltando o 'to the' aí, benzinho. O certo é 'I go to the store'. Uai, me conta: pra onde você vai sempre?"
- "Nossa, quase trem! 'I am working' é o certo. Falta o 'am' aí, sô. Mas tá bão, bora de novo?"
- "Trem bão! 'How are you?' é o básico. Agora tenta 'How have you been?' — é mais bonito, uai!"

REGRAS:
- Respostas CURTAS: 1-2 frases no máximo, depois faz uma pergunta
- SEMPRE em português com expressões mineiras
- NUNCA use termos gramaticais
- Corrija de forma acolhedora, como uma mineira
- Sempre termine com uma pergunta

TOM: Acolhedora, mineira raiz, paciente.`,
  },
  gaucho: {
    voiceName: 'Leda',
    systemPrompt: `Você é GAÚCHA, uma professora de inglês do Rio Grande do Sul. Você é uma MULHER gaúcha, campeira, direta e acolhedora. Fala PORTUGUÊS BRASILEIRO com sotaque e expressões gaúchas.

REGRA PRINCIPAL: SEMPRE responda em português brasileiro com expressões gaúchas. Use inglês APENAS para ensinar frases.

EXPRESSÕES GAÚCHAS QUE VOCÊ USA:
- "bah", "tchê", "tri", "guri", "guapa", "capaz", "bah tchê", "tri legal", "bah, guri", "tchê, olha só", "capaz que não", "lindo", "querido"

EXEMPLO DE COMO FALAR:
- "Bah tchê, tu disseste 'I go store'. Tá faltando o 'to the' aí, guri. O certo é 'I go to the store'. Tri fácil, bah! Me conta: pra onde tu vais sempre?"
- "Capaz, quase! 'I am working' é o certo. Falta o 'am' aí, tchê. Mas tá tri bom, bora de novo?"
- "Tri legal! 'How are you?' é o básico. Agora tenta 'How have you been?' — é mais bonito, bah!"

REGRAS:
- Respostas CURTAS: 1-2 frases no máximo, depois faz uma pergunta
- SEMPRE em português com expressões gaúchas
- NUNCA use termos gramaticais
- Corrija de forma direta e campeira, como uma gaúcha
- Sempre termine com uma pergunta

TOM: Campeira, gaúcha raiz, feminina, direta mas acolhedora. Usa "bah", "tchê", "tri", "guri" naturalmente.`,
  },
};

// ─── HTTP + WebSocket Server ─────────────────────────────────────────────────

const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', model: MODEL, characters: Object.keys(CHARACTERS) }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (clientWs, req) => {
  const sessionId = randomUUID().slice(0, 8);
  console.log(`[WS] Client connected: ${sessionId}`);

  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const characterName = url.searchParams.get('character') || 'aura';
  const character = CHARACTERS[characterName] || CHARACTERS.aura;

  console.log(`[WS] Character: ${characterName}, Voice: ${character.voiceName}`);

  // Connect to Gemini Live API (Developer API endpoint)
  const geminiWs = new WebSocket(
    `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`,
  );

  let geminiReady = false;
  let isGenerating = false;

  geminiWs.on('open', () => {
    console.log(`[Gemini] Connected: ${sessionId}`);

    // Send setup message — Developer API format
    const setup = {
      setup: {
        model: `models/${MODEL}`,
        generation_config: {
          response_modalities: ['AUDIO'],
          speech_config: {
            voice_config: {
              prebuilt_voice_config: {
                voice_name: character.voiceName,
              },
            },
          },
        },
        system_instruction: {
          parts: [{ text: character.systemPrompt }],
        },
      },
    };

    console.log(`[Gemini] Sending setup for ${sessionId}`);
    geminiWs.send(JSON.stringify(setup));
  });

  geminiWs.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      // Log all messages for debugging
      console.log(`[Gemini] Message: ${sessionId}`, JSON.stringify(message).substring(0, 200));

      // Setup complete
      if (message.setupComplete) {
        console.log(`[Gemini] Setup complete: ${sessionId}`);
        geminiReady = true;
        clientWs.send(JSON.stringify({ type: 'ready' }));
        return;
      }

      // Error from Gemini
      if (message.error) {
        console.error(`[Gemini] Error: ${sessionId}`, JSON.stringify(message.error));
        clientWs.send(JSON.stringify({ type: 'error', message: message.error.message || 'Gemini error' }));
        return;
      }

      // Audio/text output from Gemini
      if (message.serverContent) {
        const content = message.serverContent;

        // Model started generating
        if (content.modelTurn?.parts?.length > 0) {
          if (!isGenerating) {
            isGenerating = true;
            clientWs.send(JSON.stringify({ type: 'speaking_start' }));
          }

          for (const part of content.modelTurn.parts) {
            if (part.inlineData?.data) {
              clientWs.send(JSON.stringify({
                type: 'audio_chunk',
                data: part.inlineData.data,
                mimeType: part.inlineData.mimeType || 'audio/pcm;rate=24000',
              }));
            }
            if (part.text) {
              clientWs.send(JSON.stringify({
                type: 'transcription',
                text: part.text,
                source: 'model',
              }));
            }
          }
        }

        // Model finished
        if (content.turnComplete) {
          isGenerating = false;
          clientWs.send(JSON.stringify({ type: 'speaking_end' }));
        }

        // Interruption
        if (content.interrupted) {
          isGenerating = false;
          clientWs.send(JSON.stringify({ type: 'interrupted' }));
        }
      }
    } catch (err) {
      console.error(`[Gemini] Parse error: ${sessionId}`, err);
    }
  });

  geminiWs.on('error', (err) => {
    console.error(`[Gemini] Error: ${sessionId}`, err.message);
    clientWs.send(JSON.stringify({ type: 'error', message: `Gemini connection error: ${err.message}` }));
  });

  geminiWs.on('close', (code, reason) => {
    console.log(`[Gemini] Disconnected: ${sessionId} code=${code} reason=${reason.toString()}`);
  });

  // Handle messages from frontend
  clientWs.on('message', (data) => {
    if (geminiWs.readyState !== WebSocket.OPEN) return;

    try {
      const message = JSON.parse(data.toString());

      if (message.type === 'audio_chunk' && message.data) {
        geminiWs.send(JSON.stringify({
          realtime_input: {
            media_chunks: [{
              mime_type: 'audio/pcm;rate=16000',
              data: message.data,
            }],
          },
        }));
      }

      if (message.type === 'activity_start') {
        geminiWs.send(JSON.stringify({
          client_content: {
            turns: [{ role: 'user', parts: [] }],
            turn_complete: false,
          },
        }));
      }

      if (message.type === 'activity_end') {
        geminiWs.send(JSON.stringify({
          client_content: {
            turns: [{ role: 'user', parts: [] }],
            turn_complete: true,
          },
        }));
      }

      if (message.type === 'interrupt') {
        geminiWs.send(JSON.stringify({
          client_content: {
            turns: [{ role: 'user', parts: [] }],
            turn_complete: true,
          },
        }));
      }

      if (message.type === 'text_input' && message.text) {
        geminiWs.send(JSON.stringify({
          client_content: {
            turns: [{ role: 'user', parts: [{ text: message.text }] }],
            turn_complete: true,
          },
        }));
      }
    } catch (err) {
      console.error(`[WS] Parse error: ${sessionId}`, err);
    }
  });

  clientWs.on('close', () => {
    console.log(`[WS] Client disconnected: ${sessionId}`);
    if (geminiWs.readyState === WebSocket.OPEN) {
      geminiWs.close();
    }
  });

  clientWs.on('error', (err) => {
    console.error(`[WS] Error: ${sessionId}`, err.message);
  });
});

// ─── Start ──────────────────────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════════════════════╗`);
  console.log(`║  AURA API — Gemini Live API Proxy                       ║`);
  console.log(`║  WebSocket: ws://localhost:${PORT}                          ║`);
  console.log(`║  GET  /health                                         ║`);
  console.log(`║  Port: ${PORT}                                           ║`);
  console.log(`║  Model: ${MODEL}           ║`);
  console.log(`║  Characters: ${Object.keys(CHARACTERS).join(', ')}                   ║`);
  console.log(`║  Voices: ${Object.values(CHARACTERS).map(c => c.voiceName).join(', ')}             ║`);
  console.log(`╚══════════════════════════════════════════════════════════╝\n`);
});
