(function installMarbleContactAudio() {
  'use strict';

  const policy = globalThis.MarbleAudioPolicy;
  const soundToggle = document.getElementById('sound-toggle');
  if (!policy || !soundToggle) return;

  const activeVoices = new Set();
  const cueState = policy.createState();
  const SNAPSHOT_INTERVAL_MS = 120;
  const MAX_ROLLING_GAIN = 0.018;

  let context = null;
  let masterGain = null;
  let impactBus = null;
  let motionBus = null;
  let compressor = null;
  let rollingSource = null;
  let rollingGain = null;
  let timer = null;
  let enabled = soundToggle.getAttribute('aria-pressed') === 'true';

  function createNoiseBuffer(audioContext) {
    const frameCount = Math.max(1, Math.floor(audioContext.sampleRate * 0.9));
    const buffer = audioContext.createBuffer(1, frameCount, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    let value = 0x13579bdf;
    for (let index = 0; index < data.length; index += 1) {
      value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
      data[index] = ((value / 0xffffffff) * 2 - 1) * 0.32;
    }
    return buffer;
  }

  function ensureContext() {
    if (context) {
      if (context.state === 'suspended') context.resume().catch(() => {});
      return context;
    }
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return null;

    context = new AudioCtor();
    masterGain = context.createGain();
    impactBus = context.createGain();
    motionBus = context.createGain();
    compressor = context.createDynamicsCompressor();

    masterGain.gain.value = 0.78;
    impactBus.gain.value = 0.82;
    motionBus.gain.value = 0.72;
    compressor.threshold.value = -15;
    compressor.knee.value = 18;
    compressor.ratio.value = 8;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.14;

    impactBus.connect(masterGain);
    motionBus.connect(masterGain);
    masterGain.connect(compressor);
    compressor.connect(context.destination);

    rollingGain = context.createGain();
    rollingGain.gain.value = 0;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 520;
    filter.Q.value = 0.7;
    rollingSource = context.createBufferSource();
    rollingSource.buffer = createNoiseBuffer(context);
    rollingSource.loop = true;
    rollingSource.connect(filter).connect(rollingGain).connect(motionBus);
    rollingSource.start();
    return context;
  }

  function setRollingLevel(snapshot) {
    if (!context || !rollingGain || !snapshot?.marbles) return;
    const active = snapshot.marbles.filter((marble) => ['racing', 'near-finish', 'threatened', 'recovering'].includes(marble.status));
    const averageSpeed = active.length === 0
      ? 0
      : active.reduce((sum, marble) => sum + Math.hypot(Number(marble.velocityX) || 0, Number(marble.velocityY) || 0), 0) / active.length;
    const normalized = Math.max(0, Math.min(1, averageSpeed / 360));
    const target = enabled ? normalized * MAX_ROLLING_GAIN : 0;
    rollingGain.gain.setTargetAtTime(target, context.currentTime, enabled ? 0.09 : 0.025);
  }

  function playContactCue(cue) {
    const audioContext = ensureContext();
    if (!audioContext || !enabled || activeVoices.size >= policy.MAX_VOICES) return;

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    const voice = { oscillator, gain, filter };
    activeVoices.add(voice);

    oscillator.type = cue.kind === 'sweeper' ? 'sawtooth' : cue.kind === 'marble' ? 'sine' : 'triangle';
    oscillator.frequency.value = cue.frequency;
    filter.type = 'bandpass';
    filter.frequency.value = cue.kind === 'marble' ? 1100 : 720;
    filter.Q.value = cue.kind === 'marble' ? 1.1 : 0.8;

    const start = audioContext.currentTime;
    const end = start + cue.duration;
    gain.gain.setValueAtTime(Math.max(0.0001, cue.gain), start);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(filter).connect(gain).connect(impactBus);
    oscillator.start(start);
    oscillator.stop(end + 0.015);
    oscillator.addEventListener('ended', () => {
      activeVoices.delete(voice);
      oscillator.disconnect();
      filter.disconnect();
      gain.disconnect();
    }, { once: true });
  }

  async function refreshAudioState() {
    try {
      const response = await fetch('/api/snapshot', { cache: 'no-store' });
      if (!response.ok) return;
      const snapshot = await response.json();
      const cues = policy.selectCues(snapshot.events || [], cueState, performance.now());
      if (enabled) {
        ensureContext();
        for (const cue of cues) playContactCue(cue);
      }
      setRollingLevel(snapshot);
    } catch {
      // Presentation audio may degrade silently; authority and visual cues continue.
    }
  }

  function syncEnabledState() {
    enabled = soundToggle.getAttribute('aria-pressed') === 'true';
    if (enabled) ensureContext();
    if (context && rollingGain && !enabled) rollingGain.gain.setTargetAtTime(0, context.currentTime, 0.02);
  }

  soundToggle.addEventListener('click', () => queueMicrotask(syncEnabledState));
  refreshAudioState();
  timer = window.setInterval(refreshAudioState, SNAPSHOT_INTERVAL_MS);

  window.addEventListener('pagehide', () => {
    if (timer !== null) window.clearInterval(timer);
    if (rollingGain && context) rollingGain.gain.setValueAtTime(0, context.currentTime);
    try { rollingSource?.stop(); } catch {}
    for (const voice of activeVoices) {
      try { voice.oscillator.stop(); } catch {}
    }
    activeVoices.clear();
    context?.close?.().catch(() => {});
  }, { once: true });
})();
