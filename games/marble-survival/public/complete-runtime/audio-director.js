'use strict';

(() => {
  const shell = document.querySelector('.broadcast-shell');
  const soundToggle = document.getElementById('sound-toggle');
  if (!shell || !soundToggle) return;

  const MAX_VOICES = 12;
  const POLL_MS = 120;
  const CONTACT_COOLDOWN_MS = 95;
  let enabled = false;
  let audioContext = null;
  let compressor = null;
  let master = null;
  let ambienceOscillator = null;
  let ambienceGain = null;
  let requestInFlight = false;
  let lastEventSeq = -1;
  let lastContactAt = -Infinity;
  let latestSnapshot = null;
  const voices = new Set();

  function ensureGraph() {
    if (audioContext) {
      if (audioContext.state === 'suspended') audioContext.resume();
      return;
    }
    audioContext = new AudioContext();
    compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 16;
    compressor.ratio.value = 5;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.18;
    master = audioContext.createGain();
    master.gain.value = 0.58;
    compressor.connect(master).connect(audioContext.destination);
  }

  function voiceAvailable() {
    return voices.size < MAX_VOICES;
  }

  function panForMarble(marbleId) {
    const marble = latestSnapshot?.marbles?.find((candidate) => candidate.id === marbleId);
    if (!marble || !latestSnapshot?.arena?.width) return 0;
    return Math.max(-0.78, Math.min(0.78, (marble.x / latestSnapshot.arena.width - 0.5) * 1.56));
  }

  function connectVoice(source, gain, pan = 0) {
    if (!audioContext || !compressor) return null;
    const panner = typeof audioContext.createStereoPanner === 'function' ? audioContext.createStereoPanner() : null;
    if (panner) {
      panner.pan.value = pan;
      source.connect(gain).connect(panner).connect(compressor);
    } else {
      source.connect(gain).connect(compressor);
    }
    const token = { source, gain, panner };
    voices.add(token);
    source.addEventListener('ended', () => voices.delete(token), { once: true });
    return token;
  }

  function tone({ frequency, duration = 0.15, gain = 0.025, type = 'sine', offset = 0, pan = 0, glideTo = null }) {
    if (!enabled || !voiceAvailable()) return;
    ensureGraph();
    const start = audioContext.currentTime + offset;
    const oscillator = audioContext.createOscillator();
    const volume = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (glideTo !== null) oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, glideTo), start + duration);
    volume.gain.setValueAtTime(0.0001, start);
    volume.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), start + Math.min(0.025, duration * 0.2));
    volume.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    connectVoice(oscillator, volume, pan);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  function deterministicNoiseBuffer(seed, duration = 0.12) {
    ensureGraph();
    const length = Math.max(32, Math.floor(audioContext.sampleRate * duration));
    const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    let value = (seed | 0) || 1;
    for (let index = 0; index < length; index += 1) {
      value ^= value << 13;
      value ^= value >>> 17;
      value ^= value << 5;
      data[index] = ((value >>> 0) / 0xffffffff) * 2 - 1;
    }
    return buffer;
  }

  function noiseHit(seed, pan = 0, gain = 0.018) {
    if (!enabled || !voiceAvailable()) return;
    ensureGraph();
    const source = audioContext.createBufferSource();
    source.buffer = deterministicNoiseBuffer(seed);
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 780;
    filter.Q.value = 0.8;
    const volume = audioContext.createGain();
    const panner = typeof audioContext.createStereoPanner === 'function' ? audioContext.createStereoPanner() : null;
    const now = audioContext.currentTime;
    volume.gain.setValueAtTime(gain, now);
    volume.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
    source.connect(filter).connect(volume);
    if (panner) {
      panner.pan.value = pan;
      volume.connect(panner).connect(compressor);
    } else {
      volume.connect(compressor);
    }
    const token = { source, volume, panner };
    voices.add(token);
    source.addEventListener('ended', () => voices.delete(token), { once: true });
    source.start(now);
    source.stop(now + 0.14);
  }

  function setAmbience(roundIndex = 0) {
    if (!enabled) return;
    ensureGraph();
    const targetFrequency = 43 + Math.max(0, Math.min(4, roundIndex)) * 6;
    const targetGain = 0.006 + Math.max(0, Math.min(4, roundIndex)) * 0.0015;
    if (!ambienceOscillator) {
      ambienceOscillator = audioContext.createOscillator();
      ambienceGain = audioContext.createGain();
      ambienceOscillator.type = 'triangle';
      ambienceOscillator.frequency.value = targetFrequency;
      ambienceGain.gain.value = 0.0001;
      ambienceOscillator.connect(ambienceGain).connect(compressor);
      ambienceOscillator.start();
    }
    const now = audioContext.currentTime;
    ambienceOscillator.frequency.cancelScheduledValues(now);
    ambienceOscillator.frequency.linearRampToValueAtTime(targetFrequency, now + 0.35);
    ambienceGain.gain.cancelScheduledValues(now);
    ambienceGain.gain.linearRampToValueAtTime(targetGain, now + 0.4);
  }

  function stopAmbience() {
    if (!audioContext || !ambienceOscillator || !ambienceGain) return;
    const oscillator = ambienceOscillator;
    const gain = ambienceGain;
    ambienceOscillator = null;
    ambienceGain = null;
    const now = audioContext.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    oscillator.stop(now + 0.2);
  }

  function cue(event) {
    if (!enabled || !event) return;
    const marbleId = Number(event.data?.marbleId ?? event.data?.championId);
    const pan = Number.isInteger(marbleId) ? panForMarble(marbleId) : 0;

    if (event.type === 'physics-contact') {
      const impulse = Number(event.data?.impulse || 0);
      const now = performance.now();
      if (impulse < 220 || now - lastContactAt < CONTACT_COOLDOWN_MS) return;
      lastContactAt = now;
      tone({ frequency: 125 + Math.min(180, impulse * 0.11), duration: 0.055, gain: 0.008 + Math.min(0.014, impulse / 90000), type: 'triangle', pan, glideTo: 92 });
      return;
    }

    if (event.type === 'marble-qualified') {
      tone({ frequency: 660, duration: 0.13, gain: 0.026, type: 'sine', pan });
      tone({ frequency: 990, duration: 0.18, gain: 0.018, type: 'sine', offset: 0.07, pan });
      return;
    }

    if (event.type === 'marble-eliminated') {
      noiseHit(event.seq * 7919, pan, 0.017);
      tone({ frequency: 185, duration: 0.24, gain: 0.031, type: 'triangle', pan, glideTo: 92 });
      return;
    }

    if (event.type === 'shield-recovery') {
      tone({ frequency: 330, duration: 0.11, gain: 0.018, type: 'sine', pan });
      tone({ frequency: 495, duration: 0.15, gain: 0.021, type: 'sine', offset: 0.07, pan });
      tone({ frequency: 660, duration: 0.17, gain: 0.015, type: 'sine', offset: 0.14, pan });
      return;
    }

    if (event.type === 'round-started') {
      tone({ frequency: 245, duration: 0.10, gain: 0.014, type: 'square' });
      tone({ frequency: 370, duration: 0.14, gain: 0.012, type: 'square', offset: 0.08 });
      return;
    }

    if (event.type === 'round-resolved') {
      tone({ frequency: 392, duration: 0.16, gain: 0.016, type: 'triangle' });
      tone({ frequency: 494, duration: 0.18, gain: 0.013, type: 'triangle', offset: 0.06 });
      return;
    }

    if (event.type === 'tournament-champion') {
      stopAmbience();
      for (const [index, frequency] of [523.25, 659.25, 783.99, 1046.5].entries()) {
        tone({ frequency, duration: 0.30 + index * 0.04, gain: 0.026 - index * 0.002, type: 'sine', offset: index * 0.11, pan: 0 });
      }
    }
  }

  function acceptSnapshot(next) {
    if (!next || next.version !== 1 || !Array.isArray(next.events)) return;
    latestSnapshot = next;
    setAmbience(next.round?.index || 0);
    for (const event of next.events) {
      if (!Number.isInteger(event.seq) || event.seq <= lastEventSeq) continue;
      lastEventSeq = Math.max(lastEventSeq, event.seq);
      cue(event);
    }
  }

  async function refresh() {
    if (!enabled || requestInFlight || document.hidden) return;
    requestInFlight = true;
    try {
      const response = await fetch('/api/snapshot', { cache: 'no-store' });
      if (!response.ok) throw new Error(`audio snapshot ${response.status}`);
      acceptSnapshot(await response.json());
    } catch {
      // The primary runtime owns visible connection state; audio fails closed.
    } finally {
      requestInFlight = false;
    }
  }

  soundToggle.addEventListener('click', (event) => {
    event.stopImmediatePropagation();
    enabled = !enabled;
    soundToggle.setAttribute('aria-pressed', String(enabled));
    soundToggle.textContent = enabled ? 'Sound on' : 'Sound off';
    shell.dataset.audio = enabled ? 'semantic' : 'off';
    if (enabled) {
      ensureGraph();
      master.gain.cancelScheduledValues(audioContext.currentTime);
      master.gain.setTargetAtTime(0.58, audioContext.currentTime, 0.035);
      lastEventSeq = -1;
      refresh();
    } else {
      stopAmbience();
      if (master && audioContext) master.gain.setTargetAtTime(0.0001, audioContext.currentTime, 0.04);
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && enabled) refresh();
  });
  shell.dataset.audio = 'off';
  setInterval(refresh, POLL_MS);
})();
