class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private soundVolume: number = 0.7;
  private musicVolume: number = 0.4;
  private musicGainNode: GainNode | null = null;
  private isMusicPlaying: boolean = false;
  private musicInterval: any = null;

  constructor() {
    // Lazy AudioContext initialization
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolumes(soundVol: number, musicVol: number) {
    this.soundVolume = Math.max(0, Math.min(1, soundVol));
    this.musicVolume = Math.max(0, Math.min(1, musicVol));
    if (this.musicGainNode && this.ctx) {
      this.musicGainNode.gain.setValueAtTime(this.musicVolume * (this.isMuted ? 0 : 0.35), this.ctx.currentTime);
    }
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    this.setVolumes(this.soundVolume, this.musicVolume);
    return this.isMuted;
  }

  // UI Sound Effects
  public playUiClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.04);

    gain.gain.setValueAtTime(0.25 * this.soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playUiReward() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + i * 0.07;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.3 * this.soundVolume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.28);
    });
  }

  public playUiPurchase() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

    gain.gain.setValueAtTime(0.3 * this.soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playUiEquip() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);

    gain.gain.setValueAtTime(0.35 * this.soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Gunshot - Desert Falcon Pistol
  public playPistolShot() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const noise = this.createNoiseBuffer();
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noise;

    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.14);

    gain.gain.setValueAtTime(0.75 * this.soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.13);

    osc.connect(filter);
    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    noiseNode.start(now);
    osc.stop(now + 0.14);
    noiseNode.stop(now + 0.14);
  }

  // Gunshot - Plasma Launcher (Sci-Fi Explosive Heavy Mortar)
  public playPlasmaShot() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.28);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3500, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.3);

    gain.gain.setValueAtTime(0.9 * this.soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.32);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  // Shield Hit (Electric Blue Deflection Ping)
  public playShieldHit() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);

    gain.gain.setValueAtTime(0.5 * this.soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  // Shield Break (High Energy Overload Shatter)
  public playShieldBreak() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const noise = this.createNoiseBuffer();
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noise;
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.22);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1600, now);

    gain.gain.setValueAtTime(0.85 * this.soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    noiseNode.start(now);
    osc.stop(now + 0.26);
    noiseNode.stop(now + 0.26);
  }

  // Shield Recharged / Battery Pickup
  public playShieldRecharge() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [440, 660, 880, 1320].forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);
      gain.gain.setValueAtTime(0.35 * this.soundVolume, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.18);
    });
  }

  // Gunshot - AK47 / AR
  public playAKShot() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const noise = this.createNoiseBuffer();
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noise;

    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2800, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.15);

    gain.gain.setValueAtTime(0.8 * this.soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

    osc.connect(filter);
    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    noiseNode.start(now);
    osc.stop(now + 0.15);
    noiseNode.stop(now + 0.15);
  }

  // Gunshot - MP40 SMG
  public playSMGShot() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'square';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.08);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.Q.setValueAtTime(2, now);

    gain.gain.setValueAtTime(0.55 * this.soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  // Gunshot - Shotgun M1887 Blast
  public playShotgunBlast() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const noise = this.createNoiseBuffer();
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noise;

    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.25);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(4000, now);
    filter.frequency.exponentialRampToValueAtTime(150, now + 0.28);

    gain.gain.setValueAtTime(1.0 * this.soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

    osc.connect(filter);
    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    noiseNode.start(now);
    osc.stop(now + 0.3);
    noiseNode.stop(now + 0.3);
  }

  // Gunshot - AWM Sniper Heavy Crack & Echo
  public playSniperShot() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const noise = this.createNoiseBuffer();
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noise;

    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.45);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(5000, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.5);

    gain.gain.setValueAtTime(1.2 * this.soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.connect(filter);
    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    noiseNode.start(now);
    osc.stop(now + 0.6);
    noiseNode.stop(now + 0.6);
  }

  // Katana Slash
  public playKatanaSlash() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.18);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);

    gain.gain.setValueAtTime(0.6 * this.soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Body Hit Marker (Crisp tick)
  public playHitMarker() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(950, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

    gain.gain.setValueAtTime(0.4 * this.soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  // Headshot "CRUNCH + BELL DING" (Iconic Free Fire Headshot)
  public playHeadshotSound() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // High pitched metallic chime
    const bell = this.ctx.createOscillator();
    const bellGain = this.ctx.createGain();
    bell.type = 'sine';
    bell.frequency.setValueAtTime(1760, now); // A6
    bell.frequency.setValueAtTime(2349, now + 0.04); // D7

    bellGain.gain.setValueAtTime(0.7 * this.soundVolume, now);
    bellGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    bell.connect(bellGain);
    bellGain.connect(this.ctx.destination);
    bell.start(now);
    bell.stop(now + 0.35);

    // Crunch bass pop
    const crunch = this.ctx.createOscillator();
    const crunchGain = this.ctx.createGain();
    crunch.type = 'triangle';
    crunch.frequency.setValueAtTime(300, now);
    crunch.frequency.exponentialRampToValueAtTime(60, now + 0.12);

    crunchGain.gain.setValueAtTime(0.8 * this.soundVolume, now);
    crunchGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    crunch.connect(crunchGain);
    crunchGain.connect(this.ctx.destination);
    crunch.start(now);
    crunch.stop(now + 0.15);
  }

  // Deploy Gloo Wall (Ice frost sound)
  public playGlooWallDeploy() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const noise = this.createNoiseBuffer();
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noise;

    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.25);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1400, now);

    gain.gain.setValueAtTime(0.7 * this.soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    noiseNode.connect(filter);
    osc.connect(gain);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    noiseNode.start(now);
    osc.stop(now + 0.3);
    noiseNode.stop(now + 0.3);
  }

  // Medkit Healing Chime
  public playHealSound() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0.25 * this.soundVolume, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.25);
    });
  }

  // Hero Skill Surge
  public playSkillActive() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);

    gain.gain.setValueAtTime(0.5 * this.soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.36);
  }

  // Reload sound
  public playReload() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Click 1 (Mag eject)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(700, now);
    gain1.gain.setValueAtTime(0.3 * this.soundVolume, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.07);

    // Click 2 (Mag insert)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(900, now + 0.35);
    gain2.gain.setValueAtTime(0.4 * this.soundVolume, now + 0.35);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.42);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.35);
    osc2.stop(now + 0.43);
  }

  // Loot Pickup
  public playLootPickup() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

    gain.gain.setValueAtTime(0.3 * this.soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.13);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  // Player Jump
  public playJump() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);

    gain.gain.setValueAtTime(0.25 * this.soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  // Explosion (Grenade / Airdrop)
  public playExplosion() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const noise = this.createNoiseBuffer();
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noise;

    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.6);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(60, now + 0.7);

    gain.gain.setValueAtTime(1.1 * this.soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

    osc.connect(filter);
    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    noiseNode.start(now);
    osc.stop(now + 0.75);
    noiseNode.stop(now + 0.75);
  }

  // BOOYAH! Victory fanfare
  public playBooyah() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [
      { f: 523.25, t: 0.0, d: 0.15 }, // C5
      { f: 659.25, t: 0.15, d: 0.15 }, // E5
      { f: 783.99, t: 0.3, d: 0.18 }, // G5
      { f: 1046.5, t: 0.48, d: 0.45 }, // C6
      { f: 1318.5, t: 0.95, d: 0.7 }, // E6
    ];

    const now = this.ctx.currentTime;
    notes.forEach(n => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, now + n.t);

      gain.gain.setValueAtTime(0.6 * this.soundVolume, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.01, now + n.t + n.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.05);
    });
  }

  // Defeat tone
  public playDefeat() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [
      { f: 392.0, t: 0.0, d: 0.3 }, // G4
      { f: 349.23, t: 0.32, d: 0.3 }, // F4
      { f: 311.13, t: 0.64, d: 0.3 }, // Eb4
      { f: 261.63, t: 0.96, d: 0.7 }, // C4
    ];

    const now = this.ctx.currentTime;
    notes.forEach(n => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(n.f, now + n.t);

      gain.gain.setValueAtTime(0.4 * this.soundVolume, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.01, now + n.t + n.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.05);
    });
  }

  // Background dynamic battle music
  public startBattleMusic() {
    if (this.isMusicPlaying) return;
    this.initCtx();
    if (!this.ctx) return;

    this.isMusicPlaying = true;
    let step = 0;
    const bassline = [65.41, 65.41, 77.78, 65.41, 87.31, 77.78, 65.41, 58.27]; // C2 scale

    this.musicInterval = setInterval(() => {
      if (!this.ctx || this.isMuted || this.musicVolume <= 0.01) return;
      const now = this.ctx.currentTime;

      // Pulse bass
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(bassline[step % bassline.length], now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, now);

      gain.gain.setValueAtTime(0.18 * this.musicVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);

      // Hi-hat pulse on alternate beats
      if (step % 2 === 1) {
        const noise = this.createNoiseBuffer(0.04);
        const nh = this.ctx.createBufferSource();
        nh.buffer = noise;
        const hg = this.ctx.createGain();
        const hf = this.ctx.createBiquadFilter();
        hf.type = 'highpass';
        hf.frequency.setValueAtTime(7000, now);
        hg.gain.setValueAtTime(0.07 * this.musicVolume, now);
        hg.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        nh.connect(hf);
        hf.connect(hg);
        hg.connect(this.ctx.destination);
        nh.start(now);
        nh.stop(now + 0.04);
      }

      step++;
    }, 240); // ~125 BPM
  }

  public stopBattleMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  // Emote Wheel & Social Audio Feedback
  public playEmoteHover() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.03);

    gain.gain.setValueAtTime(0.12 * this.soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  public playEmoteSound(soundType: string) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    switch (soundType) {
      case 'booyah': {
        // Grand victory Booyah chord fanfare (C5, G5, C6)
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        notes.forEach((freq, idx) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const delay = idx * 0.06;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + delay);
          gain.gain.setValueAtTime(0.35 * this.soundVolume, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.5);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now + delay);
          osc.stop(now + delay + 0.55);
        });
        break;
      }
      case 'applause': {
        // Rapid rhythmic clapping bursts
        for (let i = 0; i < 5; i++) {
          const delay = i * 0.08;
          const noise = this.createNoiseBuffer(0.05);
          const source = this.ctx.createBufferSource();
          source.buffer = noise;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(1200 + i * 80, now + delay);
          filter.Q.setValueAtTime(3.0, now + delay);
          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.25 * this.soundVolume, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.05);

          source.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);

          source.start(now + delay);
          source.stop(now + delay + 0.06);
        }
        break;
      }
      case 'flex': {
        // Power surge bass riser with lightning crackle
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.45);

        gain.gain.setValueAtTime(0.3 * this.soundVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.52);
        break;
      }
      case 'wave': {
        // Friendly playful whistle
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1100, now);
        osc.frequency.linearRampToValueAtTime(1650, now + 0.15);
        osc.frequency.linearRampToValueAtTime(1320, now + 0.3);

        gain.gain.setValueAtTime(0.25 * this.soundVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.38);
        break;
      }
      case 'laugh': {
        // Playful giggles (staccato ascending chimes)
        [880, 987, 880, 1174, 1318].forEach((f, idx) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const delay = idx * 0.07;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + delay);

          gain.gain.setValueAtTime(0.25 * this.soundVolume, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.06);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now + delay);
          osc.stop(now + delay + 0.07);
        });
        break;
      }
      case 'dab': {
        // Synth wave sub-bass drop & metallic tap
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.38);

        gain.gain.setValueAtTime(0.4 * this.soundVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.45);
        break;
      }
      case 'heart': {
        // Warm harmonic heart sparkle
        [659.25, 783.99, 987.77, 1318.51].forEach((freq, idx) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const delay = idx * 0.05;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + delay);
          gain.gain.setValueAtTime(0.28 * this.soundVolume, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now + delay);
          osc.stop(now + delay + 0.45);
        });
        break;
      }
      case 'roar': {
        // Blazing dragon battle roar / fire burst
        const noise = this.createNoiseBuffer(0.5);
        const source = this.ctx.createBufferSource();
        source.buffer = noise;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(2400, now + 0.25);
        filter.frequency.exponentialRampToValueAtTime(300, now + 0.5);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.35 * this.soundVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.52);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        source.start(now);
        source.stop(now + 0.55);
        break;
      }
      default:
        this.playUiReward();
        break;
    }
  }

  // Tactical Radio Click & Beep for Voice Comms / UI
  public playClickSound() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

    gain.gain.setValueAtTime(0.2 * this.soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playSosRadioCallout() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    // Dual-tone urgent distress radio beacon
    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.setValueAtTime(1320, now + 0.12);
    osc1.frequency.setValueAtTime(880, now + 0.24);
    osc1.frequency.setValueAtTime(1760, now + 0.36);

    osc2.frequency.setValueAtTime(440, now);
    osc2.frequency.setValueAtTime(660, now + 0.12);
    osc2.frequency.setValueAtTime(440, now + 0.24);
    osc2.frequency.setValueAtTime(880, now + 0.36);

    gain.gain.setValueAtTime(0.35 * this.soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.6);
    osc2.stop(now + 0.6);

    // Browser Speech Synthesis for tactical voice line if available
    try {
      if ('speechSynthesis' in window && !window.speechSynthesis.speaking) {
        const utter = new SpeechSynthesisUtterance("Need backup! I'm down!");
        utter.rate = 1.3;
        utter.pitch = 1.1;
        utter.volume = 0.8 * this.soundVolume;
        window.speechSynthesis.speak(utter);
      }
    } catch {
      // Ignore
    }
  }

  public playReviveCompleted() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);

    gain.gain.setValueAtTime(0.3 * this.soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  private createNoiseBuffer(duration: number = 0.5): AudioBuffer {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }
}

export const soundEngine = new SoundEngine();
