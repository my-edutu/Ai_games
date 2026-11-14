// Original synthesized garden ambience and semantic cues. No downloaded samples.
export function createGardenAudio() {
  let context, master, ambienceGain;
  let muted = true;
  let disposed = false;
  let lastRun = '', lastFoods = 0, lastScene = '';
  let lastDangerAt = 0;
  const voices = new Set();
  const ambience = [];
  const MAX_VOICES = 8;

  async function enable() {
    if (disposed) return false;
    try {
      if (!context) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return false;
        context = new Audio();
        master = context.createGain();
        master.gain.value = 0;
        const limiter = context.createDynamicsCompressor();
        limiter.threshold.value = -18;
        limiter.knee.value = 12;
        limiter.ratio.value = 8;
        limiter.attack.value = 0.005;
        limiter.release.value = 0.15;
        master.connect(limiter).connect(context.destination);
        ambienceGain = context.createGain();
        ambienceGain.gain.value = 0.018;
        ambienceGain.connect(master);
        // A quiet fifth under the garden; low-passed waves have no sharp peaks.
        for (const frequency of [130.8128, 196.0]) {
          const oscillator = context.createOscillator();
          oscillator.type = 'sine';
          oscillator.frequency.value = frequency;
          oscillator.connect(ambienceGain);
          oscillator.start();
          ambience.push(oscillator);
        }
      }
      await context.resume();
      return context.state === 'running';
    } catch { return false; }
  }

  async function setMuted(value) {
    if (!value && !await enable()) return true;
    muted = value;
    if (master) master.gain.setTargetAtTime(muted ? 0 : 0.32, context.currentTime, 0.035);
    return muted;
  }

  function note(frequency, duration = 0.32, volume = 0.14, delay = 0, kind = 'triangle') {
    if (muted || !context || context.state !== 'running' || voices.size >= MAX_VOICES) return;
    const voice = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime + delay;
    voice.type = kind;
    voice.frequency.setValueAtTime(frequency, now);
    voice.frequency.exponentialRampToValueAtTime(frequency * 0.996, now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    voice.connect(gain).connect(master);
    voices.add(voice);
    voice.onended = () => { voices.delete(voice); voice.disconnect(); gain.disconnect(); };
    voice.start(now);
    voice.stop(now + duration + 0.015);
  }

  function accept(frame) {
    const snapshot = frame?.snapshot;
    if (!snapshot) return;
    if (snapshot.runToken !== lastRun) {
      lastRun = snapshot.runToken;
      lastFoods = snapshot.foodsCollected;
      lastScene = '';
    }
    if (snapshot.foodsCollected > lastFoods) {
      note(523.25, 0.19, 0.16);
      note(783.99, 0.34, 0.1, 0.07);
    }
    if (frame.scene !== lastScene) {
      if (frame.scene === 'milestone') [523.25, 659.25, 783.99].forEach((f, i) => note(f, 0.55, 0.13, i * 0.08));
      if (frame.scene === 'result') {
        const won = snapshot.result?.reason === 'victory';
        (won ? [523.25, 659.25, 1046.5] : [261.63, 220, 164.81]).forEach((f, i) => note(f, 0.6, 0.12, i * 0.14));
      }
      if (frame.scene === 'danger' && performance.now() - lastDangerAt > 3500) {
        note(196, 0.28, 0.1, 0, 'sine');
        lastDangerAt = performance.now();
      }
    }
    lastFoods = snapshot.foodsCollected;
    lastScene = frame.scene;
  }

  function dispose() {
    disposed = true;
    for (const voice of voices) { try { voice.stop(); } catch {} }
    for (const voice of ambience) { voice.stop(); voice.disconnect(); }
    voices.clear();
    ambience.length = 0;
    context?.close().catch(() => {});
  }
  return { setMuted, accept, dispose, stats: () => ({ muted, voices: voices.size, ambience: ambience.length, context: context?.state || 'not-started' }) };
}
