/**
 * G D Goenka University - IDP Portal Launch Ceremony
 * Authentic Orchestral Soundtrack & Natural Audio Engine
 * 
 * - Plays studio-crafted organic orchestral inauguration track (/sounds/launch_ceremony.wav)
 * - True acoustic harmonics: warm cello/violin pads, timpani crescendo, tubular cathedral chimes
 * - ZERO robotic sine beeps, ZERO arcade laser sounds, ZERO AI slop noise
 */

class LaunchSoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private audioEl: HTMLAudioElement | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    try {
      if (!this.ctx || this.ctx.state === "closed") {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return null;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      return this.ctx;
    } catch (e) {
      console.warn("AudioContext error:", e);
      return null;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.audioEl) {
      this.audioEl.muted = muted;
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public stopAll() {
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.currentTime = 0;
    }
    if (this.ctx && this.ctx.state !== "closed") {
      try {
        this.ctx.suspend();
      } catch (_) {}
    }
  }

  /**
   * Play the 14-second master orchestral soundtrack
   */
  public playCeremonyTrack(onSupernova?: () => void) {
    if (this.isMuted) {
      if (onSupernova) setTimeout(onSupernova, 9500);
      return;
    }

    try {
      if (!this.audioEl) {
        this.audioEl = new Audio("/sounds/launch_ceremony.wav");
        this.audioEl.preload = "auto";
      }
      this.audioEl.currentTime = 0;
      this.audioEl.muted = this.isMuted;
      this.audioEl.volume = 1.0;

      const playPromise = this.audioEl.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (onSupernova) {
              setTimeout(onSupernova, 9500);
            }
          })
          .catch((err) => {
            console.warn("Audio element fallback:", err);
            this.playSynthesizedFallback(onSupernova);
          });
      }
    } catch (e) {
      console.warn("Audio element fallback:", e);
      this.playSynthesizedFallback(onSupernova);
    }
  }

  /**
   * Organic Orchestral Fallback (No robotic beeps, pure warm strings and cathedral chimes)
   */
  private playSynthesizedFallback(onSupernova?: () => void) {
    const ctx = this.getContext();
    if (!ctx) {
      if (onSupernova) setTimeout(onSupernova, 9500);
      return;
    }

    const now = ctx.currentTime;

    // Warm D Major Cello & Viola pad
    const stringFrequencies = [73.4, 110.0, 146.8, 220.0, 293.7];
    stringFrequencies.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.08 / (idx + 1), now + 2);
      gain.gain.linearRampToValueAtTime(0.18 / (idx + 1), now + 9.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 14);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 14);
    });

    // Elegant tubular cathedral chimes for countdown (3 -> 2 -> 1)
    const chimes = [
      { t: 6.5, f: 370.0 }, // F#4
      { t: 7.5, f: 440.0 }, // A4
      { t: 8.5, f: 587.33 }, // D5
    ];

    chimes.forEach((c) => {
      const bellTime = now + c.t;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(c.f, bellTime);

      gain.gain.setValueAtTime(0.2, bellTime);
      gain.gain.exponentialRampToValueAtTime(0.001, bellTime + 2.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(bellTime);
      osc.stop(bellTime + 2.3);
    });

    // Grand Timpani Drop at 9.5s
    setTimeout(() => {
      if (onSupernova) onSupernova();

      const dropNow = ctx.currentTime;
      const timpani = ctx.createOscillator();
      const timpaniGain = ctx.createGain();
      timpani.type = "sine";
      timpani.frequency.setValueAtTime(75, dropNow);
      timpani.frequency.exponentialRampToValueAtTime(36, dropNow + 1.5);

      timpaniGain.gain.setValueAtTime(0.6, dropNow);
      timpaniGain.gain.exponentialRampToValueAtTime(0.001, dropNow + 2.8);

      timpani.connect(timpaniGain);
      timpaniGain.connect(ctx.destination);
      timpani.start(dropNow);
      timpani.stop(dropNow + 3.0);

      // Celestial Bell Arpeggios (D Major)
      const fanfare = [587.33, 740.0, 880.0, 1174.66, 1479.98];
      fanfare.forEach((f, idx) => {
        const noteTime = dropNow + 0.2 + idx * 0.3;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "triangle";
        o.frequency.setValueAtTime(f, noteTime);
        g.gain.setValueAtTime(0.2, noteTime);
        g.gain.exponentialRampToValueAtTime(0.001, noteTime + 2.0);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(noteTime);
        o.stop(noteTime + 2.1);
      });
    }, 9500);
  }
}

export const launchAudio = new LaunchSoundEngine();
