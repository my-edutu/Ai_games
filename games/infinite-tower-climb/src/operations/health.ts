export interface TowerOperationsProbe {
  simulationAgeMs: number;
  progressAgeTicks: number;
  rendererAgeMs: number;
  captureAgeMs: number;
  audioAgeMs: number;
  intendedSilence: boolean;
  queueRatio: number;
  memoryRatio: number;
  crashCount: number;
}

export interface TowerOperationsHealth {
  status: 'healthy' | 'degraded' | 'unsafe';
  reasons: string[];
  safeScene: boolean;
  halt: boolean;
  qualityPreset: 'normal' | 'reduced' | 'safe';
  actions: string[];
}

function ratio(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new RangeError(name);
}

export function evaluateTowerOperationsHealth(probe: TowerOperationsProbe): TowerOperationsHealth {
  for (const [name, value] of Object.entries(probe)) {
    if (name === 'intendedSilence') continue;
    if (!Number.isFinite(value) || value < 0) throw new RangeError(name);
  }
  ratio('queueRatio', probe.queueRatio);
  ratio('memoryRatio', probe.memoryRatio);
  const reasons: string[] = [];
  if (probe.simulationAgeMs > 1500) reasons.push('stale-simulation');
  if (probe.progressAgeTicks > 600) reasons.push('no-progress');
  if (probe.rendererAgeMs > 1500) reasons.push('stale-renderer');
  if (probe.captureAgeMs > 1500) reasons.push('stale-capture');
  if (!probe.intendedSilence && probe.audioAgeMs > 5000) reasons.push('silent-audio');
  if (probe.queueRatio > .8) reasons.push('queue-pressure');
  if (probe.memoryRatio > .8) reasons.push('memory-pressure');
  if (probe.crashCount > 0) reasons.push('component-crashes');

  const halt = probe.crashCount >= 3;
  const unsafe = halt
    || probe.simulationAgeMs > 5000
    || probe.rendererAgeMs > 5000
    || probe.captureAgeMs > 5000
    || probe.queueRatio > .95
    || probe.memoryRatio > .95
    || reasons.length >= 5;
  if (unsafe) {
    const actions = ['activate-safe-scene', 'disable-interactions', 'fence-writer', 'verify-snapshot', 'verify-output'];
    if (halt) actions.push('open-crash-loop-breaker');
    return { status: 'unsafe', reasons: [...new Set(reasons)].sort(), safeScene: true, halt, qualityPreset: 'safe', actions };
  }
  if (reasons.length) {
    return {
      status: 'degraded',
      reasons: [...new Set(reasons)].sort(),
      safeScene: false,
      halt: false,
      qualityPreset: probe.queueRatio > .8 || probe.memoryRatio > .8 ? 'reduced' : 'normal',
      actions: ['observe', ...(probe.queueRatio > .8 || probe.memoryRatio > .8 ? ['reduce-cosmetic-quality'] : [])],
    };
  }
  return { status: 'healthy', reasons: [], safeScene: false, halt: false, qualityPreset: 'normal', actions: [] };
}
