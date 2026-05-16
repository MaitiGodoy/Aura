import { GoogleGenAI } from '@google/genai';
import { MODEL_NAMES } from '../constants';
import { base64ToUint8Array, decodePCM } from './audioUtils';
import { ApiKeyManager } from './apiKeyManager';

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return sharedAudioCtx;
}

export const TTSService = {
  speak: async (text: string) => {
    try {
      const apiKey = ApiKeyManager.getValidKey();
      if (!apiKey) throw new Error("API Key missing");
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
            // Do not close the shared context
            resolve(true);
          };
        });
      }
    } catch (e) {
      console.error("TTS Error:", e);
    }
  }
};