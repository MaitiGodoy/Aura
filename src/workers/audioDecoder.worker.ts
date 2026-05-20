/** Web Worker: decode PCM16 → Float32Array off main thread */

self.onmessage = (e) => {
  const { id, data, sampleRate } = e.data;
  if (!data) return;

  const pcmLength = data.byteLength / 2;
  const float32 = new Float32Array(pcmLength);
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  for (let i = 0; i < pcmLength; i++) {
    float32[i] = view.getInt16(i * 2, true) / 32768.0;
  }

  // @ts-ignore — transferable buffer for zero-copy
  self.postMessage({ id, float32: float32.buffer, sampleRate }, [float32.buffer]);
};
