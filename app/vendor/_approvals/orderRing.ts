/**
 * The new-order ring: a loud "trring-trring" made with Web Audio (no sound
 * file to load), like a shop phone. Browsers only allow sound after the
 * seller has touched the page once — unlock() is called on the first tap.
 */
let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

/** Call from a tap / key press: lets the page make sound from now on */
export function unlockRinger(): boolean {
  const c = context();
  if (!c) return false;
  if (c.state === 'suspended') void c.resume();
  // A silent blip — iOS needs something played inside the tap itself
  try {
    const g = c.createGain();
    g.gain.value = 0;
    g.connect(c.destination);
    const o = c.createOscillator();
    o.connect(g);
    o.start();
    o.stop(c.currentTime + 0.01);
  } catch {
    /* noop */
  }
  return true;
}

export function ringerReady(): boolean {
  return !!ctx && ctx.state === 'running';
}

/** One "trring-trring" (about 1.3 s) */
export function ringOnce(volume = 0.9) {
  const c = context();
  if (!c || c.state !== 'running') return false;
  const out = c.createDynamicsCompressor(); // loud but not clipping
  out.connect(c.destination);
  const master = c.createGain();
  master.gain.value = volume;
  master.connect(out);

  const burst = (start: number, length: number) => {
    // Two bell tones…
    const env = c.createGain();
    env.gain.setValueAtTime(0, start);
    env.gain.linearRampToValueAtTime(1, start + 0.02);
    env.gain.setValueAtTime(1, start + length - 0.05);
    env.gain.linearRampToValueAtTime(0, start + length);
    env.connect(master);
    // …switched on and off 20 times a second = the "trrr" of a phone bell
    const trill = c.createGain();
    trill.connect(env);
    const lfo = c.createOscillator();
    lfo.type = 'square';
    lfo.frequency.value = 20;
    const lfoDepth = c.createGain();
    lfoDepth.gain.value = 0.5;
    trill.gain.value = 0.5;
    lfo.connect(lfoDepth);
    lfoDepth.connect(trill.gain);
    for (const f of [1046.5, 1318.5]) {
      const o = c.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f;
      o.connect(trill);
      o.start(start);
      o.stop(start + length);
    }
    lfo.start(start);
    lfo.stop(start + length);
  };
  const t = c.currentTime + 0.02;
  burst(t, 0.5);
  burst(t + 0.75, 0.5);
  return true;
}
