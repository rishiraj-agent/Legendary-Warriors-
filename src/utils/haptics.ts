// Android Mobile Haptic Engine Utility for High-Performance Touch Action Pulses

class MobileHapticEngine {
  private enabled: boolean = true;
  private intensity: 'soft' | 'medium' | 'heavy' = 'medium';

  public configure(enabled: boolean, intensity: 'soft' | 'medium' | 'heavy' = 'medium') {
    this.enabled = enabled;
    this.intensity = intensity;
  }

  // Trigger weapon shot vibration pulse
  public triggerFire() {
    if (!this.enabled || !navigator.vibrate) return;
    try {
      if (this.intensity === 'soft') {
        navigator.vibrate(8);
      } else if (this.intensity === 'medium') {
        navigator.vibrate(15);
      } else {
        navigator.vibrate([22, 10, 15]);
      }
    } catch {
      // Ignore vibration errors on unsupported browsers
    }
  }

  // Damage impact haptic kick
  public triggerImpact() {
    if (!this.enabled || !navigator.vibrate) return;
    try {
      if (this.intensity === 'soft') {
        navigator.vibrate(25);
      } else if (this.intensity === 'medium') {
        navigator.vibrate([40, 20, 30]);
      } else {
        navigator.vibrate([60, 25, 50, 25, 40]);
      }
    } catch {
      // Ignore
    }
  }

  // Super shield activation or heavy burst
  public triggerSuperShield() {
    if (!this.enabled || !navigator.vibrate) return;
    try {
      navigator.vibrate([30, 40, 50, 40, 60]);
    } catch {
      // Ignore
    }
  }

  // Low HP danger pulse
  public triggerLowHp() {
    if (!this.enabled || !navigator.vibrate) return;
    try {
      navigator.vibrate([15, 30, 15]);
    } catch {
      // Ignore
    }
  }

  // Tap button confirmation
  public triggerLightTap() {
    if (!this.enabled || !navigator.vibrate) return;
    try {
      navigator.vibrate(6);
    } catch {
      // Ignore
    }
  }
}

export const mobileHaptic = new MobileHapticEngine();
