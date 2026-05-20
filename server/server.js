/**
 * Aura WebSocket Audio Streaming Server (plain JS, zero deps beyond ws)
 *
 * Pipeline:
 *   Client PCM chunks → WebSocket → VAD → Groq STT → Groq LLM (stream) → TTS → audio → Client
 *
 * Run: cd server && npm install && npm start
 */
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 8080;
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1';

if (!GROQ_API_KEY) {
  console.error('GROQ_API_KEY required');
  process.exit(1);
}

const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws) => {
  console.log('[WS] connected');

  let audioBuffer = Buffer.alloc(0);
  let isProcessing = false;
  let history = [];
  let systemInstruction = '';

  ws.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      await handleMessage(ws, msg);
    } catch {
      audioBuffer = Buffer.concat([audioBuffer, raw]);
    }
  });

  ws.on('close', () => console.log('[WS] disconnected'));
  ws.on('error', (e) => console.error('[WS] error:', e.message));

  async function handleMessage(ws, msg) {
    switch (msg.type) {
      case 'init':
        systemInstruction = msg.systemInstruction || '';
        history = [{ role: 'system', content: systemInstruction }];
        ws.send(JSON.stringify({ type: 'init_ack' }));
        break;

      case 'transcript':
        history.push({ role: 'user', content: msg.text });
        await streamLLM(ws);
        break;

      case 'vad_end':
        if (audioBuffer.length > 0 && !isProcessing) {
          isProcessing = true;
          await runPipeline(ws);
          isProcessing = false;
        }
        break;

      case 'interrupt':
        ws.send(JSON.stringify({ type: 'interrupt_ack' }));
        audioBuffer = Buffer.alloc(0);
        break;

      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
    }
  }

  async function runPipeline(ws) {
    try {
      const transcript = await sttGroq(audioBuffer);
      audioBuffer = Buffer.alloc(0);
      if (!transcript) return;
      ws.send(JSON.stringify({ type: 'transcript', text: transcript }));
      history.push({ role: 'user', content: transcript });
      await streamLLM(ws);
    } catch (err) {
      console.error('[Pipeline]', err.message);
      ws.send(JSON.stringify({ type: 'error', message: err.message }));
    }
  }

  async function sttGroq(buf) {
    const blob = new Blob([buf], { type: 'audio/wav' });
    const form = new FormData();
    form.append('file', blob, 'input.wav');
    form.append('model', 'whisper-large-v3');
    form.append('response_format', 'text');

    const res = await fetch(`${GROQ_ENDPOINT}/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
      body: form,
    });

    if (!res.ok) {
      console.error('[STT]', res.status, await res.text());
      return null;
    }
    return res.text();
  }

  async function streamLLM(ws) {
    const res = await fetch(`${GROQ_ENDPOINT}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: history,
        stream: true,
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      ws.send(JSON.stringify({ type: 'error', message: 'LLM failed' }));
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = '', buf = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const json = line.slice(6).trim();
        if (json === '[DONE]') break;
        try {
          const chunk = JSON.parse(json);
          const delta = chunk.choices?.[0]?.delta?.content || '';
          if (delta) {
            full += delta;
            ws.send(JSON.stringify({ type: 'token', text: delta }));
          }
        } catch { /* skip */ }
      }
    }

    if (full) {
      history.push({ role: 'assistant', content: full });
      ws.send(JSON.stringify({ type: 'response_end', text: full }));
    }
  }
});

httpServer.listen(PORT, () => {
  console.log(`[Aura WS] :${PORT}`);
});
