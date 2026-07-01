type SoundType = "vote" | "next" | "winner" | "tick";

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

/**
 * Play a simple synthesized sound effect.
 * No external files needed — uses Web Audio API oscillators.
 */
export function playSound(type: SoundType): void {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    switch (type) {
      case "vote": {
        // Short rising blip
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(660, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.12);
        break;
      }
      case "next": {
        // Two-note ascending
        [523, 659].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          osc.type = "triangle";
          const t = now + i * 0.08;
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.15, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
          osc.connect(gain);
          osc.start(t);
          osc.stop(t + 0.1);
        });
        break;
      }
      case "winner": {
        // Triumphant ascending arpeggio
        [523, 659, 784, 1047].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          const t = now + i * 0.12;
          osc.frequency.setValueAtTime(freq, t);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.2, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.3);
        });
        break;
      }
      case "tick": {
        // Subtle tick for timer
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.03);
        break;
      }
    }
  } catch {
    // Audio not available — silently ignore
  }
}
