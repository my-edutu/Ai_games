export type OutputFault = 'stale' | 'black' | 'frozen' | 'wrong-scene' | 'silent';

export interface HealthSample {
  nowMs: number;
  lastSnapshotMs: number;
  lastFrameChangeMs: number;
  luma: number;
  expectedScene: string;
  actualScene: string;
  lastAudioMs: number;
  intendedSilence: boolean;
}

export interface HealthResult {
  status: 'healthy' | 'degraded' | 'unsafe';
  reasons: OutputFault[];
  action: 'none' | 'rebuild' | 'safe-slate';
}

export interface OutputHealthLimits {
  staleAfterMs: number;
  frozenAfterMs: number;
  silenceAfterMs: number;
  blackLumaThreshold?: number;
}

export class OutputHealthMonitor {
  private result: HealthResult = { status: 'healthy', reasons: [], action: 'none' };

  constructor(private readonly limits: OutputHealthLimits) {
    for (const value of [limits.staleAfterMs, limits.frozenAfterMs, limits.silenceAfterMs]) {
      if (!Number.isFinite(value) || value <= 0) throw new RangeError('health limit');
    }
  }

  check(sample: HealthSample): HealthResult {
    const reasons: OutputFault[] = [];
    const blackThreshold = this.limits.blackLumaThreshold ?? 0.001;
    if (sample.nowMs - sample.lastSnapshotMs > this.limits.staleAfterMs) reasons.push('stale');
    if (sample.luma <= blackThreshold) reasons.push('black');
    if (sample.nowMs - sample.lastFrameChangeMs > this.limits.frozenAfterMs) reasons.push('frozen');
    if (sample.expectedScene !== sample.actualScene) reasons.push('wrong-scene');
    if (!sample.intendedSilence && sample.nowMs - sample.lastAudioMs > this.limits.silenceAfterMs) reasons.push('silent');

    this.result = {
      status: reasons.length >= 2 ? 'unsafe' : reasons.length === 1 ? 'degraded' : 'healthy',
      reasons,
      action: reasons.length >= 2 ? 'safe-slate' : reasons.length === 1 ? 'rebuild' : 'none',
    };
    return { ...this.result, reasons: [...this.result.reasons] };
  }

  last(): HealthResult {
    return { ...this.result, reasons: [...this.result.reasons] };
  }
}
