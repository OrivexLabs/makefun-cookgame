// Tiny synthesised sound effects: no audio files, just the Web Audio API.
// Every call is safe before the first user gesture (the context stays suspended
// until then) and safe when the browser has no audio at all.

export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (context !== null) return context;
    try {
      const Ctor = window.AudioContext ?? window.webkitAudioContext;
      if (!Ctor) return null;
      context = new Ctor();
    } catch {
      context = null;
    }
    return context;
  }

  function tone(freq, dur, type, gain, when = 0) {
    const ctx = ensure();
    if (ctx === null || muted) return;
    try {
      if (ctx.state === 'suspended') void ctx.resume();
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      amp.gain.setValueAtTime(gain, ctx.currentTime + when);
      amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + dur);
      osc.connect(amp).connect(ctx.destination);
      osc.start(ctx.currentTime + when);
      osc.stop(ctx.currentTime + when + dur + 0.02);
    } catch {
      // Sound is garnish; a failure here must never break the game.
    }
  }

  function noise(dur, gain, freq) {
    const ctx = ensure();
    if (ctx === null || muted) return;
    try {
      if (ctx.state === 'suspended') void ctx.resume();
      const len = Math.floor(ctx.sampleRate * dur);
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = freq;
      const amp = ctx.createGain();
      amp.gain.value = gain;
      src.connect(filter).connect(amp).connect(ctx.destination);
      src.start();
    } catch {
      // See tone(): sound never breaks the game.
    }
  }

  return {
    toggleMute() {
      muted = !muted;
      return muted;
    },
    get muted() {
      return muted;
    },
    pick() { tone(520, 0.07, 'triangle', 0.12); },
    chop() { noise(0.09, 0.25, 900); tone(180, 0.06, 'square', 0.08); },
    chopDone() { tone(660, 0.09, 'triangle', 0.14); tone(880, 0.12, 'triangle', 0.12, 0.08); },
    sizzle() { noise(0.5, 0.08, 3200); },
    grillDone() { tone(740, 0.1, 'sine', 0.14); tone(988, 0.14, 'sine', 0.12, 0.09); },
    plate() { tone(440, 0.06, 'triangle', 0.1); },
    serve() {
      tone(523, 0.1, 'triangle', 0.14);
      tone(659, 0.1, 'triangle', 0.14, 0.09);
      tone(784, 0.18, 'triangle', 0.16, 0.18);
    },
    error() { tone(160, 0.18, 'sawtooth', 0.1); },
    expire() { tone(220, 0.25, 'sawtooth', 0.12); tone(174, 0.3, 'sawtooth', 0.12, 0.2); },
    tick() { tone(880, 0.05, 'square', 0.06); },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.14, i * 0.12));
    },
  };
}
