/** Tiny silent output so mobile/desktop browsers do not suspend the tab while a track is playing. */

let ctx: AudioContext | null = null;
let osc: OscillatorNode | null = null;
let gain: GainNode | null = null;
let wanted = false;

export function startKeepAlive() {
  wanted = true;
  if (typeof window === "undefined") return;
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
    }
    void ctx.resume();
    if (!gain) {
      gain = ctx.createGain();
      gain.gain.value = 0.00008;
      gain.connect(ctx.destination);
    }
    if (!osc) {
      osc = ctx.createOscillator();
      osc.frequency.value = 20;
      osc.connect(gain);
      osc.start();
    }
  } catch {
    /* autoplay policy — retry on next user gesture */
  }
}

export function stopKeepAlive() {
  wanted = false;
  try {
    osc?.stop();
  } catch {
    /* already stopped */
  }
  osc = null;
  try {
    void ctx?.suspend();
  } catch {
    /* ignore */
  }
}

export function resumeKeepAliveIfNeeded() {
  if (wanted) startKeepAlive();
}
