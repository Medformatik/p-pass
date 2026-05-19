let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const W = window as Window & { webkitAudioContext?: typeof AudioContext };
    const Ctx = window.AudioContext || W.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  return audioCtx;
}

/**
 * Single short marimba-like ping.
 * Three slightly detuned sine partials with fast exponential decay.
 */
export function playCorrectChime(): void {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const base = 660; // E5
  const harmonics = [1, 2.01, 3.02];
  for (const h of harmonics) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = base * h;
    gain.gain.setValueAtTime(0.12 / h, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);
  }
}
