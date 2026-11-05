/**
 * Original procedural city ambience. No network assets, music, or speech.
 * Presentation only: audio never dispatches simulation commands.
 * Four continuous sources, at most six short voices, and one master limiter.
 */
export function createCityAudio() {
  const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
  const VOICE_LIMIT = 6;
  let context = null;
  let enabled = false;
  let suspended = false;
  let disposed = false;
  let error = null;
  let master = null;
  let ambienceGain = null;
  let movementGain = null;
  let emergencyGain = null;
  let uiGain = null;
  let engine = null;
  let engineUpper = null;
  let siren = null;
  let analyser = null;
  let meterSamples = null;
  let lastCueAt = -10;
  let suspendTimer = 0;
  let toggleVersion = 0;
  let measuredPeak = 0;
  const continuousSources = [];
  const voices = new Set();

  function approach(parameter, value, duration = 0.15) {
    if (!context || context.state === 'closed') return;
    parameter.setTargetAtTime(value, context.currentTime, duration);
  }

  function initialize() {
    if (!Context) throw new Error('Web Audio is unavailable.');
    context = new Context({ latencyHint: 'interactive' });
    master = context.createGain();
    master.gain.value = 0;
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -14;
    limiter.knee.value = 9;
    limiter.ratio.value = 8;
    limiter.attack.value = 0.006;
    limiter.release.value = 0.25;
    analyser = context.createAnalyser();
    analyser.fftSize = 256;
    meterSamples = new Float32Array(analyser.fftSize);
    master.connect(limiter).connect(analyser).connect(context.destination);

    ambienceGain = context.createGain();
    movementGain = context.createGain();
    emergencyGain = context.createGain();
    uiGain = context.createGain();
    ambienceGain.gain.value = 0.035;
    movementGain.gain.value = 0.018;
    emergencyGain.gain.value = 0;
    uiGain.gain.value = 0.22;
    for (const bus of [ambienceGain, movementGain, emergencyGain, uiGain]) bus.connect(master);

    // A seeded, seamless low-frequency noise bed evokes wind and distant surf.
    // This seed is cosmetic and never enters the authoritative traffic model.
    const noiseBuffer = context.createBuffer(1, context.sampleRate * 5, context.sampleRate);
    const noise = noiseBuffer.getChannelData(0);
    let state = 118791;
    let brown = 0;
    for (let index = 0; index < noise.length; index += 1) {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      const white = ((state >>> 0) / 4294967296) * 2 - 1;
      brown = (brown + white * 0.025) / 1.025;
      noise[index] = brown * 3.5;
    }
    const crossfadeFrames = Math.min(2048, Math.floor(noise.length / 4));
    for (let index = 0; index < crossfadeFrames; index += 1) {
      const mix = index / crossfadeFrames;
      const endIndex = noise.length - crossfadeFrames + index;
      noise[endIndex] = noise[endIndex] * (1 - mix) + noise[index] * mix;
    }
    const surf = context.createBufferSource();
    surf.buffer = noiseBuffer;
    surf.loop = true;
    surf.loopStart = crossfadeFrames / context.sampleRate;
    surf.loopEnd = noiseBuffer.duration;
    const surfFilter = context.createBiquadFilter();
    surfFilter.type = 'lowpass';
    surfFilter.frequency.value = 620;
    surfFilter.Q.value = 0.5;
    const surfHighPass = context.createBiquadFilter();
    surfHighPass.type = 'highpass';
    surfHighPass.frequency.value = 85;
    surf.connect(surfFilter).connect(surfHighPass).connect(ambienceGain);
    surf.start();
    continuousSources.push(surf);

    engine = context.createOscillator();
    engine.type = 'triangle';
    engine.frequency.value = 52;
    const engineFilter = context.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.value = 200;
    engineFilter.Q.value = 0.4;
    engine.connect(engineFilter).connect(movementGain);
    engine.start();
    continuousSources.push(engine);

    engineUpper = context.createOscillator();
    engineUpper.type = 'sine';
    engineUpper.frequency.value = 81;
    const upperGain = context.createGain();
    upperGain.gain.value = 0.2;
    engineUpper.connect(upperGain).connect(movementGain);
    engineUpper.start();
    continuousSources.push(engineUpper);

    siren = context.createOscillator();
    siren.type = 'sine';
    siren.frequency.value = 780;
    siren.connect(emergencyGain);
    siren.start();
    continuousSources.push(siren);
  }

  async function setEnabled(value) {
    if (disposed) return false;
    const version = ++toggleVersion;
    clearTimeout(suspendTimer);
    if (!value) {
      enabled = false;
      if (master) approach(master.gain, 0, 0.035);
      suspendTimer = globalThis.setTimeout(() => {
        if (!enabled && context?.state === 'running') void context.suspend().catch(() => {});
      }, 180);
      return false;
    }
    try {
      if (!context) initialize();
      await context.resume();
      if (version !== toggleVersion || disposed) return enabled;
      enabled = true;
      error = null;
      approach(master.gain, suspended ? 0 : 0.48, 0.15);
      return true;
    } catch (cause) {
      enabled = false;
      error = cause instanceof Error ? cause.message : String(cause);
      console.warn('[City Flow] Optional city audio is unavailable', cause);
      return false;
    }
  }

  function setSuspended(value) {
    suspended = Boolean(value);
    clearTimeout(suspendTimer);
    if (!context || !enabled) return;
    approach(master.gain, suspended ? 0 : 0.48, 0.08);
    if (suspended) {
      suspendTimer = globalThis.setTimeout(() => {
        if (suspended && context?.state === 'running') void context.suspend().catch(() => {});
      }, 240);
    } else if (context.state === 'suspended') {
      void context.resume().catch((cause) => { error = String(cause); });
    }
  }

  function cue(kind = 'toggle') {
    if (!enabled || suspended || !context || context.state !== 'running' || voices.size >= VOICE_LIMIT) return;
    const now = context.currentTime;
    const cooldown = kind === 'incident' ? 0.8 : 0.1;
    if (now - lastCueAt < cooldown) return;
    lastCueAt = now;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const duration = kind === 'incident' ? 0.35 : 0.12;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(kind === 'incident' ? 290 : 720, now);
    oscillator.frequency.exponentialRampToValueAtTime(kind === 'incident' ? 390 : 510, now + duration);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(kind === 'incident' ? 0.1 : 0.055, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(uiGain);
    voices.add(oscillator);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
      voices.delete(oscillator);
    };
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  function update(snapshot, presentation) {
    if (!enabled || !context || context.state !== 'running' || disposed) return;
    const moving = snapshot.metrics.meanSpeed;
    const selected = presentation.selectedVehicleId == null ? null : snapshot.vehicles.find((vehicle) => vehicle.id === presentation.selectedVehicleId);
    const closeView = presentation.cameraMode !== 'aerial';
    const audibleSpeed = selected && presentation.cameraMode === 'follow' ? selected.speed : moving;
    const trafficIntensity = Math.min(snapshot.metrics.active / 100, 1);
    approach(engine.frequency, 42 + Math.min(audibleSpeed, 18) * 3.5, 0.3);
    approach(engineUpper.frequency, 78 + Math.min(audibleSpeed, 18) * 5, 0.3);
    approach(movementGain.gain, (0.009 + trafficIntensity * 0.014) * (closeView ? 1.35 : 0.65), 0.4);
    approach(ambienceGain.gain, presentation.night ? 0.024 : 0.035, 0.8);

    // Sirens represent actual emergency vehicles; distance bounds their salience.
    let nearestEmergency = Infinity;
    for (const vehicle of snapshot.vehicles) {
      if (vehicle.kind !== 'emergency') continue;
      const distance = Math.hypot(vehicle.x - presentation.cameraPosition.x, vehicle.z - presentation.cameraPosition.z);
      nearestEmergency = Math.min(nearestEmergency, distance);
    }
    const sirenIntensity = closeView ? Math.max(0, 1 - nearestEmergency / 80) : 0;
    approach(siren.frequency, 800 + Math.sin(context.currentTime * 2.3) * 175, 0.15);
    approach(emergencyGain.gain, sirenIntensity * 0.012, 0.3);
    analyser.getFloatTimeDomainData(meterSamples);
    let peak = 0;
    for (const sample of meterSamples) peak = Math.max(peak, Math.abs(sample));
    measuredPeak = peak;
  }

  function getDiagnostics() {
    return {
      supported: Boolean(Context), enabled, suspended,
      state: context?.state || 'not-started',
      activeVoices: voices.size,
      continuousSources: continuousSources.length,
      voiceLimit: VOICE_LIMIT,
      outputPeak: Number(measuredPeak.toFixed(5)),
      error,
    };
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    enabled = false;
    toggleVersion += 1;
    clearTimeout(suspendTimer);
    for (const source of [...continuousSources, ...voices]) {
      try { source.stop(); source.disconnect(); } catch { /* Already stopped. */ }
    }
    voices.clear();
    continuousSources.length = 0;
    if (context && context.state !== 'closed') void context.close().catch(() => {});
  }

  function optional(callback) {
    return (...args) => {
      try { return callback(...args); }
      catch (cause) {
        enabled = false;
        error = cause instanceof Error ? cause.message : String(cause);
        try { if (master) master.gain.value = 0; } catch { /* A closed device is already silent. */ }
        if (context?.state === 'running') void context.suspend().catch(() => {});
        console.warn('[City Flow] Optional city audio stopped; traffic continues', cause);
        return undefined;
      }
    };
  }

  return Object.freeze({ setEnabled, setSuspended: optional(setSuspended), cue: optional(cue), update: optional(update), getDiagnostics, dispose });
}
