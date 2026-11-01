// A bounded synthesized soundscape. No audio is started until a viewer enables it.
export function createTowerAudio() {
  let context = null, master = null, bed = null, enabled = false, token = '', last = null;
  let disposed = false, lastAmbient = 0, enableRequest = 0, enablePending = false;
  const voices = new Set(), heard = new Set();
  async function setEnabled(value) {
    const operation = ++enableRequest;
    if (disposed) return false;
    enablePending = false;
    if (!value) { enabled = false; if (master) master.gain.setTargetAtTime(0, context.currentTime, .08); return false; }
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return false;
    if (!context) {
      context = new Audio();
      const compressor = context.createDynamicsCompressor(); compressor.threshold.value = -12;
      compressor.ratio.value = 5; compressor.connect(context.destination);
      master = context.createGain(); master.gain.value = 0; master.connect(compressor);
      bed = context.createGain(); bed.gain.value = .025; bed.connect(master);
      for (const frequency of [55, 82.41, 110]) {
        const oscillator = context.createOscillator(); oscillator.type = 'sine'; oscillator.frequency.value = frequency;
        oscillator.connect(bed); oscillator.start(); voices.add(oscillator);
      }
    }
    enablePending = true;
    let active = false;
    try { await context.resume(); active = context.state === 'running'; } catch {}
    // A late resume or rejection cannot override a newer mute/enable or disposal.
    if (disposed || operation !== enableRequest) return enabled;
    enablePending = false;
    enabled = active;
    master.gain.setTargetAtTime(enabled ? .55 : 0, context.currentTime, .12);
    return enabled;
  }
  function tone(frequency, end, duration, type = 'sine', volume = .11) {
    if (!enabled || disposed || voices.size >= 12) return;
    const now = context.currentTime, osc = context.createOscillator(), gain = context.createGain();
    osc.type = type; osc.frequency.setValueAtTime(frequency, now); osc.frequency.exponentialRampToValueAtTime(Math.max(20, end), now + duration);
    gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(volume, now + .012); gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    osc.connect(gain); gain.connect(master); voices.add(osc);
    osc.onended = () => { voices.delete(osc); osc.disconnect(); gain.disconnect(); };
    osc.start(now); osc.stop(now + duration + .02);
  }
  const cue = name => {
    if (name === 'impact' || name === 'fall-end') tone(130, 38, .32, 'triangle', .2);
    else if (name === 'warning') tone(320, 170, .19, 'triangle', .08);
    else if (name === 'floor-rise' || name === 'upgrade') { tone(330, 660, .3, 'sine', .13); tone(495, 990, .48, 'sine', .07); }
    else if (name === 'enemy-break') tone(190, 48, .19, 'triangle', .13);
    else tone(210, 280, .1, 'sine', .06);
  };
  function accept(frame) {
    if (!frame?.snapshot || disposed) return;
    const snapshot = frame.snapshot;
    if (snapshot.runToken !== token) { heard.clear(); last = null; token = snapshot.runToken; }
    for (const voice of frame.audio?.voices || []) if (!heard.has(voice.id)) {
      heard.add(voice.id); cue(voice.cue);
      if (heard.size > 128) heard.delete(heard.values().next().value);
    }
    if (last && snapshot.player.state === 'airborne' && last.state === 'standing') tone(180, 410, .13, 'sine', .075);
    if (last && snapshot.player.state === 'standing' && last.state === 'airborne') tone(94, 48, .1, 'triangle', .1);
    if (last && snapshot.player.score > last.score) tone(700, 1150, .12, 'sine', .075);
    last = snapshot.player;
    if (enabled && context.currentTime - lastAmbient > 3) {
      lastAmbient = context.currentTime;
      bed.gain.setTargetAtTime(frame.scene === 'guardian' ? .05 : .025, context.currentTime, 1);
      const notes = { foundry: 220, ruins: 293.66, storm: 246.94, clockwork: 329.63, void: 196 };
      tone(notes[snapshot.theme] || 220, notes[snapshot.theme] || 220, 1.5, 'sine', .025);
    }
  }
  function dispose() {
    if (disposed) return;
    disposed = true; enabled = false; enablePending = false; enableRequest++;
    for (const voice of voices) { try { voice.stop(); voice.disconnect(); } catch {} }
    voices.clear(); heard.clear(); if (context) context.close().catch(() => {});
  }
  return { setEnabled, accept, dispose, diagnostics: () => ({ soundEnabled: enabled, soundPending: enablePending, voices: voices.size, context: context?.state || 'not-started' }) };
}
