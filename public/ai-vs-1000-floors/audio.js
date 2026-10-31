// Original synthesized sound; no downloaded assets, network requests or rule state.
export function createAscentAudio() {
  let context, master, compressor, ambience, enabled = false, hidden = false, paused = false, lastSeq = -1, primed = false;
  const voices = new Set();
  const lastCue = new Map();
  const notes = {
    jump: [310, 470, .09, .025, 'sine'], land: [125, 75, .12, .04, 'triangle'],
    collect: [740, 1110, .20, .035, 'sine'], hit: [150, 58, .20, .045, 'triangle'],
    checkpoint: [440, 880, .55, .045, 'sine'], floor: [330, 660, .33, .035, 'sine'],
    recover: [220, 330, .35, .03, 'sine'], complete: [523, 1046, .95, .05, 'sine']
  };
  function tone(start, end, duration, volume, type, delay = 0) {
    if (!context || !enabled || hidden || paused || voices.size >= 12) return;
    const osc = context.createOscillator(), gain = context.createGain();
    const now = context.currentTime + delay;
    osc.type = type; osc.frequency.setValueAtTime(start, now);
    osc.frequency.exponentialRampToValueAtTime(end, now + duration);
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    osc.connect(gain); gain.connect(master); voices.add(osc);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); voices.delete(osc); };
    osc.start(now); osc.stop(now + duration + .03);
  }
  function stopVoices() { for (const voice of voices) { try { voice.stop(); } catch {} } }
  function background() {
    if (!context || ambience) return;
    const osc = context.createOscillator(), gain = context.createGain();
    osc.type = 'sine'; osc.frequency.value = 110; gain.gain.value = .004;
    osc.connect(gain); gain.connect(master); osc.start(); ambience = {osc, gain};
  }
  async function toggle() {
    if (enabled) { enabled = false; stopVoices(); await context?.suspend(); return false; }
    try {
      if (!context) {
        const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!Audio) return false;
        context = new Audio(); master = context.createGain(); master.gain.value = .48;
        compressor = context.createDynamicsCompressor(); compressor.threshold.value = -18;
        compressor.knee.value = 10; compressor.ratio.value = 5;
        master.connect(compressor); compressor.connect(context.destination);
      }
      enabled = true;
      if (!hidden && !paused) await context.resume();
      background(); return true;
    } catch { enabled = false; return false; }
  }
  function consume(events = []) {
    const fresh = events.filter(event => Number.isSafeInteger(event.seq) && event.seq > lastSeq);
    if (fresh.length) lastSeq = Math.max(lastSeq, ...fresh.map(event => event.seq));
    if (!primed) { primed = true; return; }
    if (!enabled || paused || hidden) return;
    // A catch-up snapshot plays only the most meaningful recent outcome.
    const priority = ['complete', 'hit', 'checkpoint', 'recover', 'floor', 'collect', 'land', 'jump'];
    fresh.sort((a, b) => priority.indexOf(a.type) - priority.indexOf(b.type));
    for (const event of fresh.slice(0, 2)) {
      const cue = notes[event.type]; if (!cue) continue;
      const time = context.currentTime;
      if (time - (lastCue.get(event.type) ?? -100) < (event.type === 'jump' || event.type === 'land' ? .18 : .30)) continue;
      lastCue.set(event.type, time); tone(...cue);
      if (event.type === 'checkpoint' || event.type === 'complete') { tone(660, 990, .45, .025, 'sine', .15); }
    }
  }
  function activity() {
    if (!context) return;
    if (hidden || paused || !enabled) { stopVoices(); context.suspend().catch(() => {}); }
    else context.resume().catch(() => {});
  }
  return {toggle, consume, reset() {lastSeq = -1; primed = false; lastCue.clear(); stopVoices();},
    setHidden(value) {hidden = value; activity();}, setPaused(value) {paused = value; activity();},
    dispose() { enabled = false; stopVoices(); if (ambience) {ambience.osc.stop(); ambience.osc.disconnect(); ambience.gain.disconnect();} context?.close().catch(() => {}); },
    getDiagnostics() {return {enabled, voices:voices.size, context:context?.state ?? 'uninitialized'};}
  };
}
