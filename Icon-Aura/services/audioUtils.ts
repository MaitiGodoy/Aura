
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decodePCM(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000
): AudioBuffer {
  // PCM16 is 2 bytes per sample
  const pcmLength = data.length / 2;
  const audioBuffer = ctx.createBuffer(1, pcmLength, sampleRate);
  const channelData = audioBuffer.getChannelData(0);
  
  // Directly read from the view to avoid intermediate Int16Array overhead
  const dataView = new DataView(data.buffer, data.byteOffset, data.length);
  for (let i = 0; i < pcmLength; i++) {
    channelData[i] = dataView.getInt16(i * 2, true) / 32768.0;
  }
  return audioBuffer;
}

export function float32ToPCM16(float32Arr: Float32Array): Int16Array {
  const pcm16 = new Int16Array(float32Arr.length);
  for (let i = 0; i < float32Arr.length; i++) {
    let s = Math.max(-1, Math.min(1, float32Arr[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return pcm16;
}
