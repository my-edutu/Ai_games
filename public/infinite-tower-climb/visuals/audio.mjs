// A bounded synthesized soundscape. No audio is started until a viewer enables it.
export function createTowerAudio() {
  let context = null, master = null, bed = null, wind = null, windFilter = null, windGain = null;
  let enabled = false, token = '', last = null, lastFloor = null, lastIntent = '', lastLifecycle = 'running', stride = 0, noiseIndex = 0;
  let disposed = false, lastAmbient = 0, enableRequest = 0, enablePending = false;
  const voices = new Set(), heard = new Set(), pads = [];
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
        oscillator.connect(bed); oscillator.start(); voices.add(oscillator); pads.push(oscillator);
      }
      // Original opt-in wind bed, generated once per audio context: a filtered
      // seamless looping sample instead of a continuous stream of new voices.
      // The same buffer supplies bounded gravel/cloth transients on real steps.
      // The ambient texture is optional; restricted and test AudioContexts may
      // support tonal audio and resume/mute but not sampled buffers/filters.
      if(typeof context.createBuffer==='function'&&typeof context.createBufferSource==='function'
        &&typeof context.createBiquadFilter==='function'&&Number.isFinite(context.sampleRate)&&context.sampleRate>0){
      const buffer = context.createBuffer(1, Math.max(256, Math.round(context.sampleRate)), context.sampleRate);
      const samples = buffer.getChannelData(0);
      let noiseSeed = 0x12345;
      for (let i = 0; i < samples.length; i++) {
        noiseSeed = (Math.imul(noiseSeed, 1664525) + 1013904223) >>> 0;
        samples[i] = (noiseSeed / 0x80000000 - 1) * .65;
      }
      wind = context.createBufferSource(); wind.buffer = buffer; wind.loop = true;
      windFilter = context.createBiquadFilter(); windFilter.type = 'lowpass'; windFilter.frequency.value = 260;
      windGain = context.createGain(); windGain.gain.value = .008;
      wind.connect(windFilter); windFilter.connect(windGain); windGain.connect(master);
      wind.start(); voices.add(wind);
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
  // On-demand sample transients use the owned wind buffer, a fixed voice cap,
  // and the same opt-in master/mute lifecycle as the pitched contact cues.
  function texture(cutoff = 320, duration = .12, volume = .05) {
    if (!enabled || disposed || !wind?.buffer || voices.size >= 12) return;
    const now = context.currentTime, source = context.createBufferSource();
    const filter = context.createBiquadFilter(), gain = context.createGain();
    filter.type = 'lowpass'; filter.frequency.value = cutoff;
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    source.buffer = wind.buffer;
    source.connect(filter); filter.connect(gain); gain.connect(master);
    voices.add(source);
    source.onended = () => { voices.delete(source); source.disconnect(); filter.disconnect(); gain.disconnect(); };
    source.start(now, (noiseIndex++ * .067) % Math.max(.1, wind.buffer.duration - duration));
    source.stop(now + duration + .01);
  }
  const cue = name => {
    if (name === 'impact' || name === 'fall-end') { texture(200, .22, .13); tone(130, 38, .32, 'triangle', .2); }
    else if (name === 'melee-hit') { texture(950, .11, .095); tone(220, 55, .17, 'triangle', .16); tone(780, 310, .085, 'square', .035); }
    else if (name === 'shield-block') { tone(690, 235, .25, 'sine', .105); tone(1040, 620, .14, 'triangle', .045); }
    else if (name === 'pickup') { tone(590, 880, .12, 'sine', .065); }
    else if (name === 'warning') { texture(1250, .13, .06); tone(320, 170, .19, 'triangle', .08); }
    else if (name === 'floor-rise' || name === 'upgrade') { tone(330, 660, .3, 'sine', .13); tone(495, 990, .48, 'sine', .07); }
    else if (name === 'enemy-break') { texture(360, .23, .09); tone(190, 48, .19, 'triangle', .13); }
    else if (name === 'projectile-fire') { texture(1800, .09, .10); tone(390, 125, .16, 'sawtooth', .07); }
    else tone(210, 280, .1, 'sine', .06);
  };
  function accept(frame) {
    if (!frame?.snapshot || disposed) return;
    const snapshot = frame.snapshot;
    if (snapshot.runToken !== token) { heard.clear(); last = null; lastFloor = null; lastIntent = ''; lastLifecycle = 'running'; stride = 0; token = snapshot.runToken; }
    for (const voice of frame.audio?.voices || []) if (!heard.has(voice.id)) {
      heard.add(voice.id); cue(voice.cue);
      if (heard.size > 128) heard.delete(heard.values().next().value);
    }
    // One understated, gesture-gated tonal closure on authentic result or
    // intermission. A skipped one-tick result still yields a single bookend;
    // authoritative cue events and mute remain otherwise unchanged.
    const lifecycle = snapshot.lifecycle || 'running';
    if (enabled && lastLifecycle === 'running' && snapshot.result
      && ['result', 'intermission'].includes(lifecycle)) {
      tone(270, 94, .46, 'sine', .072);
      if (bed) bed.gain.setTargetAtTime(.010, context.currentTime, .25);
      if (windGain) windGain.gain.setTargetAtTime(.006, context.currentTime, .28);
    }
    lastLifecycle = lifecycle;
    const actor = snapshot.player;
    const sameFloor = last && lastFloor === snapshot.floor;
    const intent = snapshot.intent?.mode || '';
    // Restrained opt-in cue on real defensive transition, deduped by intent.
    // The matching model pose remains visible when muted.
    if(sameFloor && intent!==lastIntent && intent==='bracing-telegraph')
      tone(235,360,.22,'triangle',.039);
    if(sameFloor && intent!==lastIntent && ['evading-projectile','evading-hazard','evading-telegraph'].includes(intent))
      tone(440,280,.12,'triangle',.038);
    lastIntent=intent;
    if (last && actor.state === 'airborne' && last.state === 'standing') {
      tone(180, 410, .13, 'sine', .055);
      texture(680, .08, .034);
    }
    if (sameFloor && actor.state === 'standing' && last.state === 'airborne') {
      texture(260, .17, .09);
      tone(94, 48, .1, 'triangle', .07);
      stride = 0;
    }
    // Stride is advanced only by actual same-floor authoritative displacement,
    // never wall-clock animation or the teleport to a new floor/checkpoint.
    // Skipped network frames cannot synthesize an uncontrolled footstep storm.
    if (sameFloor && actor.state === 'standing' && last.state === 'standing') {
      const distance = Math.abs(actor.x - last.x);
      if (distance > 800 && distance < 40000) {
        stride += Math.min(distance, 14000);
        if (stride >= 21000) {
          stride %= 21000;
          texture(snapshot.theme === 'ruins' ? 480 : 240, .095, .04);
          tone(75, 48, .075, 'triangle', .025);
        }
      }
    } else if (actor.state !== 'standing') stride = 0;
    if (last && actor.score > last.score) tone(700, 1150, .12, 'sine', .075);
    last = actor;
    lastFloor = snapshot.floor;
    if (enabled && context.currentTime - lastAmbient > 2) {
      lastAmbient = context.currentTime;
      const mood = frame.audio?.musicState || 'ascent';
      const intensity = mood === 'guardian' ? .052 : mood === 'danger' ? .042 : mood === 'result' ? .012 : .025;
      bed.gain.setTargetAtTime(intensity, context.currentTime, .65);
      if(windGain)windGain.gain.setTargetAtTime(mood === 'guardian' ? .022 : mood === 'danger' ? .016 : .008, context.currentTime, .75);
      const pitches = { foundry: 55, ruins: 65.41, storm: 61.74, clockwork: 82.41, void: 49 };
      const root = pitches[snapshot.theme] || 55;
      for (let index = 0; index < pads.length; index++) {
        pads[index].frequency.setTargetAtTime(root * [1, 1.5, 2][index], context.currentTime, .8);
      }
      const filters = { foundry: 200, ruins: 400, storm: 1050, clockwork: 300, void: 140 };
      if(windFilter)windFilter.frequency.setTargetAtTime(filters[snapshot.theme] || 260, context.currentTime, 1);
    }
  }
  function dispose() {
    if (disposed) return;
    disposed = true; enabled = false; enablePending = false; enableRequest++;
    for (const voice of voices) { try { voice.stop(); voice.disconnect(); } catch {} }
    voices.clear(); heard.clear(); pads.length = 0; last = null; lastFloor = null; lastIntent = ''; lastLifecycle = 'running'; stride = 0;
    if (context) context.close().catch(() => {});
  }
  return { setEnabled, accept, dispose, diagnostics: () => ({ soundEnabled: enabled, soundPending: enablePending, voices: voices.size, context: context?.state || 'not-started' }) };
}
