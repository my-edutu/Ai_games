export type SoundscapeInput = {
  active: boolean;
  weather: 'clear' | 'cloudy' | 'rain';
  truck: 'scheduled' | 'arrived' | 'waiting' | 'released';
};

export type SoundscapeLayers = {
  machinery: boolean;
  impacts: boolean;
  reversing: boolean;
  rain: boolean;
};

export function deriveSoundscape(input: SoundscapeInput): SoundscapeLayers {
  if (!input.active) return { machinery: false, impacts: false, reversing: false, rain: false };
  return {
    machinery: true,
    impacts: true,
    reversing: input.truck === 'waiting',
    rain: input.weather === 'rain',
  };
}

type AudioRuntime = {
  context: AudioContext;
  master: GainNode;
  machinery: GainNode;
  rain: GainNode;
  layers: SoundscapeLayers;
  sources: AudioScheduledSourceNode[];
  timers: number[];
};

let runtime: AudioRuntime | null = null;

function ramp(gain: GainNode, value: number, context: AudioContext, seconds = 0.15) {
  gain.gain.cancelScheduledValues(context.currentTime);
  gain.gain.setTargetAtTime(value, context.currentTime, seconds);
}

function noiseBuffer(context: AudioContext, seconds = 2) {
  const buffer = context.createBuffer(1, Math.floor(context.sampleRate * seconds), context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function playBeep(audio: AudioRuntime) {
  if (!audio.layers.reversing || audio.context.state !== 'running') return;
  const oscillator = audio.context.createOscillator();
  const gain = audio.context.createGain();
  oscillator.type = 'square';
  oscillator.frequency.value = 880;
  gain.gain.setValueAtTime(0.0001, audio.context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.07, audio.context.currentTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.context.currentTime + 0.16);
  oscillator.connect(gain).connect(audio.master);
  oscillator.start();
  oscillator.stop(audio.context.currentTime + 0.18);
}

function playImpact(audio: AudioRuntime) {
  if (!audio.layers.impacts || audio.context.state !== 'running') return;
  const oscillator = audio.context.createOscillator();
  const gain = audio.context.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(310, audio.context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(115, audio.context.currentTime + 0.09);
  gain.gain.setValueAtTime(0.05, audio.context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.context.currentTime + 0.12);
  oscillator.connect(gain).connect(audio.master);
  oscillator.start();
  oscillator.stop(audio.context.currentTime + 0.13);
}

export async function unlockConstructionAudio() {
  if (typeof window === 'undefined') return false;
  if (runtime) {
    if (runtime.context.state !== 'running') await runtime.context.resume();
    ramp(runtime.master, 0.85, runtime.context, 0.05);
    return true;
  }

  const AudioCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return false;
  const context = new AudioCtor();
  const master = context.createGain();
  master.gain.value = 0.85;
  master.connect(context.destination);

  const machinery = context.createGain();
  machinery.gain.value = 0;
  machinery.connect(master);
  const lowpass = context.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 240;
  lowpass.connect(machinery);

  const humA = context.createOscillator();
  humA.type = 'sawtooth';
  humA.frequency.value = 54;
  const humAGain = context.createGain();
  humAGain.gain.value = 0.025;
  humA.connect(humAGain).connect(lowpass);
  humA.start();

  const humB = context.createOscillator();
  humB.type = 'sine';
  humB.frequency.value = 91;
  const humBGain = context.createGain();
  humBGain.gain.value = 0.018;
  humB.connect(humBGain).connect(lowpass);
  humB.start();

  const rain = context.createGain();
  rain.gain.value = 0;
  rain.connect(master);
  const rainFilter = context.createBiquadFilter();
  rainFilter.type = 'bandpass';
  rainFilter.frequency.value = 1600;
  rainFilter.Q.value = 0.6;
  rainFilter.connect(rain);
  const rainSource = context.createBufferSource();
  rainSource.buffer = noiseBuffer(context);
  rainSource.loop = true;
  rainSource.connect(rainFilter);
  rainSource.start();

  runtime = {
    context,
    master,
    machinery,
    rain,
    layers: { machinery: false, impacts: false, reversing: false, rain: false },
    sources: [humA, humB, rainSource],
    timers: [],
  };
  runtime.timers.push(window.setInterval(() => runtime && playBeep(runtime), 1050));
  runtime.timers.push(window.setInterval(() => runtime && playImpact(runtime), 2350));
  await context.resume();
  return true;
}

export function setConstructionAudioEnabled(enabled: boolean) {
  if (!runtime) return;
  ramp(runtime.master, enabled ? 0.85 : 0.0001, runtime.context, 0.05);
}

export function updateConstructionAudio(layers: SoundscapeLayers) {
  if (!runtime) return;
  runtime.layers = layers;
  ramp(runtime.machinery, layers.machinery ? 1 : 0.0001, runtime.context, 0.2);
  ramp(runtime.rain, layers.rain ? 0.055 : 0.0001, runtime.context, 0.25);
}

export async function shutdownConstructionAudio() {
  if (!runtime) return;
  runtime.timers.forEach((timer) => window.clearInterval(timer));
  runtime.sources.forEach((source) => { try { source.stop(); } catch { /* already stopped */ } });
  const context = runtime.context;
  runtime = null;
  await context.close();
}
