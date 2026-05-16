
class VibrationService {
  vibrate(pattern: number | number[]) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        console.warn("Vibration failed", e);
      }
    }
  }

  // "HAPTIC CLICK" - Sharp, precise double-tap (PS5 UI feel)
  pulse() {
    this.vibrate([30, 20, 30]);
  }

  // "OVERDRIVE ENGINE" - Rapidly accelerating pulses with texture
  overdrive() {
    this.vibrate([40, 20, 40, 20, 60, 20, 80, 20, 100, 20, 150, 20, 300]);
  }

  // "VICTORY FANFARE" - Rhythmic, celebratory sequence with "shimmer"
  success() {
    this.vibrate([80, 40, 80, 40, 150, 40, 150, 40, 400]);
  }

  // "SYSTEM CRASH" - Heavy, dissonant, and jarring for errors
  error() {
    this.vibrate([500, 50, 500, 50, 800]);
  }

  // "JACKPOT RAIN" - Machine-gun style rapid pulses followed by a massive thump
  jackpot() {
    const rapid = Array(15).fill([20, 15]).flat();
    this.vibrate([...rapid, 1000]);
  }

  // "NEURAL SHIFT" - Deep, resonant double-thump for mode changes
  modeSwitch() {
    this.vibrate([200, 50, 200, 50, 600]);
  }

  // "DATA SCAN" - High-frequency "tick-tick-tick" for new vocab
  newVocab() {
    this.vibrate([15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 150]);
  }

  // "PRECISION FEEDBACK" - Dynamic based on score
  pronunciation(score: number) {
    if (score >= 95) {
      // Perfect: Triple rapid success "shimmer"
      this.vibrate([40, 15, 40, 15, 40, 15, 40]);
    } else if (score >= 85) {
      // Great: Solid double pulse
      this.vibrate([80, 30, 80]);
    } else if (score >= 70) {
      // Good: Single medium pulse
      this.vibrate(120);
    } else {
      // Poor: Heavy warning pulse
      this.vibrate([250, 50, 250]);
    }
  }

  // "HEAVY IMPACT" - For major events
  heavy() {
    this.vibrate(1200);
  }
}

export const Vibration = new VibrationService();
