/** Global amplitude store — feeds GeometricOrb without main-thread blockage */

class AmplitudeStore {
  micInputVolume = 0;
  audioOutVolume = 0;
  private listeners: Set<() => void> = new Set();

  setMic(v: number) {
    this.micInputVolume = v;
    this.notify();
  }

  setAudioOut(v: number) {
    this.audioOutVolume = v;
    this.notify();
  }

  subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    for (const cb of this.listeners) cb();
  }
}

export const Amplitude = new AmplitudeStore();
