/** Original procedural sound palette. Presentation only; no assets or authoritative state. */
export function createMazeAudio() {
  const VOICE_LIMIT = 6;
  const SEEN_LIMIT = 512;
  let context = null, master = null, compressor = null;
  let enabled = false, disposed = false, runToken = null;
  let lastCell = null, nextAmbience = 0, lastStep = -Infinity;
  const active = new Set();
  const seen = new Set();
  const cooldowns = new Map();
  const buses = {};

  function release(voice, stop = false) {
    if (!active.delete(voice)) return;
    if (stop) { try { voice.source.stop(); } catch {} }
    voice.source.onended = null;
    try { voice.source.disconnect(); voice.gain.disconnect(); } catch {}
  }
  function silence() {
    for (const voice of [...active]) release(voice, true);
  }
  function initialize() {
    if (context || disposed) return;
    const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContext) return;
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = .32;
    compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 12;
    compressor.ratio.value = 4;
    compressor.attack.value = .008;
    compressor.release.value = .18;
    master.connect(compressor);
    compressor.connect(context.destination);
    for (const [name, gain] of Object.entries({ ambience: .20, foley: .35, cue: .60 })) {
      buses[name] = context.createGain();
      buses[name].gain.value = gain;
      buses[name].connect(master);
    }
  }
  function tone(frequency, duration, options = {}) {
    if (!enabled || !context || context.state !== 'running' || disposed) return;
    const { delay = 0, level = .16, priority = 2, bus = 'cue', type = 'sine', endFrequency = frequency } = options;
    if (active.size >= VOICE_LIMIT) {
      const lowest = [...active].sort((a, b) => a.priority - b.priority)[0];
      if (lowest.priority >= priority) return;
      release(lowest, true);
    }
    const start = context.currentTime + delay;
    const source = context.createOscillator(), gain = context.createGain();
    source.type = type;
    source.frequency.setValueAtTime(frequency, start);
    source.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0001, level), start + Math.min(.04, duration * .15));
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    source.connect(gain); gain.connect(buses[bus]);
    const voice = { source, gain, priority };
    active.add(voice);
    source.onended = () => release(voice);
    source.start(start); source.stop(start + duration + .015);
  }
  function remember(id) {
    if (seen.has(id)) return false;
    seen.add(id);
    if (seen.size > SEEN_LIMIT) seen.delete(seen.values().next().value);
    return true;
  }
  function cue(kind, priority = 3, result) {
    if (!context) return;
    const time = context.currentTime;
    const cooldown = kind === 'move' ? .22 : kind === 'threat-near' ? 2.4 : .6;
    if (time - (cooldowns.get(kind) ?? -Infinity) < cooldown) return;
    cooldowns.set(kind, time);
    if (kind === 'move') {
      tone(145, .075, { bus: 'foley', level: .14, priority: 1, endFrequency: 70 });
    } else if (kind === 'threat-near' || kind === 'trap-triggered') {
      tone(130.81, .48, { level: .2, priority, endFrequency: 103.83 });
      tone(196, .34, { delay: .13, level: .09, priority });
    } else if (kind === 'key-collected' || kind === 'door-opened') {
      [523.25, 659.25, 783.99].forEach((frequency, i) => tone(frequency, .65, { delay: i * .12, level: .14, priority }));
    } else if (kind === 'result') {
      const escaped = result?.reason === 'escape' || result?.kind === 'win';
      (escaped ? [392, 523.25, 659.25] : [261.63, 220, 174.61]).forEach((frequency, i) => tone(frequency, 1.05, { delay: i * .19, level: .15, priority }));
    } else if (['clue-discovered', 'checkpoint', 'restart'].includes(kind)) {
      tone(392, .55, { level: .13, priority });
      tone(587.33, .7, { delay: .15, level: .09, priority });
    }
  }
  function setEnabled(value) {
    if (disposed) return;
    enabled = Boolean(value);
    if (!enabled) {
      silence();
      if (context?.state === 'running') context.suspend().catch(() => {});
      return;
    }
    // This method must be called by the host's click/keyboard event handler.
    try {
      initialize();
      if (!context) throw new Error('Web Audio is unavailable');
      return context.resume().then(() => {
        if (context?.state !== 'running') throw new Error('Audio activation did not complete');
      }).catch(error => { enabled = false; silence(); throw error; });
    } catch (error) { enabled = false; silence(); return Promise.reject(error); }
  }
  function update(frame) {
    if (disposed || !frame) return;
    const snapshot = frame.snapshot || frame;
    const audio = frame.audio || frame;
    const token = snapshot.runToken ?? frame.runToken ?? 'current';
    if (token !== runToken) {
      runToken = token; seen.clear(); cooldowns.clear(); silence();
      lastCell = snapshot.currentCell ?? null; nextAmbience = (context?.currentTime || 0) + 2;
    }
    const candidates = Array.isArray(audio.voices) ? audio.voices.slice(0, 64).sort((a, b) => (b.priority || 0) - (a.priority || 0)) : [];
    for (const event of candidates) {
      if (event?.id == null || !remember(`${token}:${event.id}`)) continue;
      if (enabled) cue(String(event.cue), Math.max(1, Math.min(10, Number(event.priority) || 3)), snapshot.result);
    }
    if (!enabled || !context || context.state !== 'running') {
      lastCell = snapshot.currentCell ?? lastCell;
      return;
    }
    const time = context.currentTime;
    if (Number.isInteger(snapshot.currentCell) && lastCell !== null && snapshot.currentCell !== lastCell && time - lastStep > .22) {
      if (!candidates.some(event => event.cue === 'move')) cue('move', 1);
      lastStep = time;
    }
    lastCell = snapshot.currentCell ?? lastCell;
    // Quiet, breathing glass resonance; no loop, timer, asset or constant drone.
    if (time >= nextAmbience && active.size <= 2 && !snapshot.result) {
      const frequency = [196, 220, 261.63][Math.abs(Number(snapshot.currentCell) || 0) % 3];
      tone(frequency, 2.4, { bus: 'ambience', level: .075, priority: 0 });
      tone(frequency * 1.5, 2.8, { delay: .4, bus: 'ambience', level: .025, priority: 0 });
      nextAmbience = time + 8 + Math.abs(Number(snapshot.currentCell) || 0) % 5;
    }
  }
  function dispose() {
    if (disposed) return;
    disposed = true; enabled = false; silence(); seen.clear(); cooldowns.clear();
    for (const bus of Object.values(buses)) { try { bus.disconnect(); } catch {} }
    try { master?.disconnect(); compressor?.disconnect(); } catch {}
    if (context && context.state !== 'closed') context.close().catch(() => {});
    context = null;
  }
  return { setEnabled, update, dispose };
}
