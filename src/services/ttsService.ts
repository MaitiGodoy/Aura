import { GoogleGenAI } from '@google/genai';
import { MODEL_NAMES } from '../constants';
import { ApiRouter } from './apiRouter';
import { WebSpeechFallback } from './webSpeechFallback';
import { base64ToUint8Array, decodePCM } from './audioUtils';

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return sharedAudioCtx;
}

export const TTSService = {
  speak: async (text: string) => {
    // Try Web Speech fallback first if Google keys are exhausted
    if (ApiRouter.isOnFallback && WebSpeechFallback.hasTTS) {
      await WebSpeechFallback.speakAuraMessage(text);
      return;
    }

    try {
      const apiKey = ApiRouter.getGoogleKey();
      if (!apiKey) throw new Error("No Google API keys available");
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: MODEL_NAMES.TTS,
        contents: {
          parts: [{ text: text }]
        },
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' } // 'Kore' has a clear, slightly feminine assistant vibe suitable for Aura
            }
          }
        }
      });

      const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (audioData) {
        const audioCtx = getAudioContext();
        
        // Resume if suspended (browser autoplay policy)
        if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }

        const uint8 = base64ToUint8Array(audioData);
        // Use 24000Hz as standard for Gemini TTS output usually
        const audioBuffer = decodePCM(uint8, audioCtx, 24000);
        
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.start(0);
        
        return new Promise((resolve) => {
          source.onended = () => {
            resolve(true);
          };
          setTimeout(() => resolve(false), 10000);
        });
      }
    } catch (e) {
      console.error("TTS Error:", e);
      // Fall back to Web Speech on failure
      if (WebSpeechFallback.hasTTS) {
        await WebSpeechFallback.speakAuraMessage(text);
      }
    }
  }
};