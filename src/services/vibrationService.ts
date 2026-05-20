
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

  pulse() {
    this.vibrate([30, 20, 30]);
  }

  success() {
    this.vibrate([80, 40, 80, 40, 150, 40, 150, 40, 400]);
  }

  error() {
    this.vibrate([500, 50, 500, 50, 800]);
  }

  modeSwitch() {
    this.vibrate([200, 50, 200, 50, 600]);
  }

  newVocab() {
    this.vibrate([15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 150]);
  }

  pronunciation(score: number) {
    if (score >= 95) {
      this.vibrate([40, 15, 40, 15, 40, 15, 40]);
    } else if (score >= 85) {
      this.vibrate([80, 30, 80]);
    } else if (score >= 70) {
      this.vibrate(120);
    } else {
      this.vibrate([250, 50, 250]);
    }
  }
}

export const Vibration = new VibrationService();
