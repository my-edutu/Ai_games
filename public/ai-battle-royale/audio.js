// Synthesized original event cues. Audio is optional and never touches simulation.
export function createAudio() {
  let context, master, enabled = false, voices = 0, lastEvent = 0;
  function tone(frequency, duration, type, gain, endFrequency) {
    if (!enabled || !context || voices >= 10) return;
    const oscillator = context.createOscillator(), envelope = context.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, context.currentTime + duration);
    envelope.gain.setValueAtTime(0.001, context.currentTime);
    envelope.gain.exponentialRampToValueAtTime(gain, context.currentTime + .008);
    envelope.gain.exponentialRampToValueAtTime(.001, context.currentTime + duration);
    oscillator.connect(envelope); envelope.connect(master); oscillator.start(); oscillator.stop(context.currentTime + duration + .03);
    voices++;
    oscillator.onended = () => {voices--; oscillator.disconnect(); envelope.disconnect();};
  }
  return {
    async toggle() {
      try {
        if (!context) {
          context = new (window.AudioContext || window.webkitAudioContext)();
          master = context.createGain(); master.gain.value = .22;
          const limiter = context.createDynamicsCompressor(); limiter.threshold.value = -16; limiter.ratio.value = 12;
          master.connect(limiter); limiter.connect(context.destination);
        }
        await context.resume(); enabled = !enabled;
        if (enabled) tone(500, .12, 'sine', .12, 700);
        return enabled;
      } catch { enabled = false; return false; }
    },
    accept(events, focusedId) {
      for (const event of events) {
        if (event.id <= lastEvent) continue;
        lastEvent = event.id;
        if (event.kind === 'shot' && (event.actor === focusedId || event.target === focusedId)) tone(170, .085, 'triangle', .15, 40);
        else if (['elimination', 'eliminated'].includes(event.kind)) {tone(620, .18, 'sine', .1, 300);}
        else if (['zone','storm'].includes(event.kind)) {tone(220, .7, 'sine', .09, 120);}
        else if (['victory','winner','result'].includes(event.kind)) {tone(440, .8, 'sine', .08, 880);}
        else if (event.kind === 'loot' && event.actor === focusedId) tone(780, .12, 'sine', .08, 1100);
      }
    },
    reset() { lastEvent = 0; },
    dispose() { enabled = false; context?.close(); },
  };
}
