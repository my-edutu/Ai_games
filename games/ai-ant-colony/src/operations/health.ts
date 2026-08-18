import { AlertEngine, MetricRegistry } from '../../../../packages/observability/src/index';
import { RunSupervisor, type RecoveryAction } from '../../../../packages/supervisor/src/index';

export interface AntColonyOperationalSample {
  nowMs: number;
  simulationProgressSeq: number;
  lastMeaningfulEventMs: number;
  lastSnapshotMs: number;
  lastFrameChangeMs: number;
  lastAudioMs: number;
  intendedSilence: boolean;
  luma: number;
  expectedScene: string;
  actualScene: string;
  queueUtilization: number;
  memorySlopeMbPerHour: number;
  resourcePressure: number;
}

export interface AntColonyOperationalHealth {
  status: 'healthy' | 'degraded' | 'unsafe';
  reasons: string[];
  actions: RecoveryAction[];
  publicCopy: string;
  alerts: Array<{ type: string; id: string; severity: string; runbook: string }>;
}

export class AntColonyOperationsMonitor {
  private supervisor = new RunSupervisor({
    heartbeatTimeoutMs: 3000,
    progressTimeoutMs: 8000,
    crashThreshold: 3,
    crashWindowMs: 60_000,
    breakerCooldownMs: 30_000,
    maxComponents: 8,
  });
  private metrics = new MetricRegistry({ maxSeries: 64, maxLabelLength: 40 });
  private alerts = new AlertEngine([
    {
      id: 'ant-output-unsafe',
      metric: 'ant_output_unsafe',
      operator: 'gte',
      threshold: 1,
      forSamples: 1,
      recoverSamples: 2,
      severity: 'page',
      runbook: 'docs/operations/ai-ant-colony-runbook.md',
    },
    {
      id: 'ant-queue-pressure',
      metric: 'ant_queue_utilization',
      operator: 'gte',
      threshold: 0.85,
      forSamples: 2,
      recoverSamples: 2,
      severity: 'ticket',
      runbook: 'docs/operations/ai-ant-colony-runbook.md',
    },
  ]);
  private lastProgressSeq = 0;
  private lastProgressMs = 0;

  heartbeat(
    component: 'simulation' | 'renderer' | 'audio' | 'gateway' | 'persistence' | 'capture',
    nowMs: number,
    progressSeq: number,
    resourcePressure = 0,
  ): void {
    this.supervisor.heartbeat({ component, nowMs, progressSeq, resourcePressure });
  }

  recordCrash(
    component: 'simulation' | 'renderer' | 'audio' | 'gateway' | 'persistence' | 'capture',
    nowMs: number,
  ): void {
    this.supervisor.recordCrash(component, nowMs);
  }

  canRestart(component: string, nowMs: number) {
    return this.supervisor.canRestart(component, nowMs);
  }

  recordRecoverySuccess(component: string): void {
    this.supervisor.recordRecoverySuccess(component);
  }

  observe(sample: AntColonyOperationalSample): AntColonyOperationalHealth {
    if (sample.simulationProgressSeq > this.lastProgressSeq) {
      this.lastProgressSeq = sample.simulationProgressSeq;
      this.lastProgressMs = sample.nowMs;
    }

    this.heartbeat('simulation', sample.nowMs, sample.simulationProgressSeq, sample.resourcePressure);
    this.heartbeat('renderer', sample.nowMs, sample.simulationProgressSeq, sample.resourcePressure);
    this.heartbeat('audio', sample.nowMs, sample.simulationProgressSeq, 0);

    const reasons: string[] = [];
    const actions: RecoveryAction[] = [];
    const frameAge = sample.nowMs - sample.lastFrameChangeMs;
    const snapshotAge = sample.nowMs - sample.lastSnapshotMs;
    const audioAge = sample.nowMs - sample.lastAudioMs;
    const meaningfulAge = sample.nowMs - sample.lastMeaningfulEventMs;

    if (snapshotAge > 1500) reasons.push('stale-public-snapshot');
    if (frameAge > 1500) reasons.push('frozen-output');
    if (sample.luma <= 0.02) reasons.push('black-output');
    if (sample.expectedScene !== sample.actualScene) reasons.push('wrong-scene');
    if (!sample.intendedSilence && audioAge > 5000) reasons.push('silent-output');
    if (sample.queueUtilization >= 0.8) reasons.push('queue-pressure');
    if (sample.memorySlopeMbPerHour >= 32) reasons.push('memory-slope');
    if (meaningfulAge > 120_000) reasons.push('long-progress-drought');

    const publicFaults = reasons.filter(reason =>
      ['black-output', 'frozen-output', 'wrong-scene', 'silent-output'].includes(reason),
    ).length;
    if (
      frameAge > 5000
      || snapshotAge > 5000
      || (sample.luma <= 0.02 && frameAge > 3000)
      || publicFaults >= 3
    ) {
      actions.push(
        { type: 'safe-scene', reason: 'unsafe-public-output' },
        { type: 'restart-component', component: 'renderer', reason: 'unsafe-public-output' },
        { type: 'verified-recovery', component: 'simulation', reason: 'unsafe-public-output' },
      );
    } else if (reasons.includes('stale-public-snapshot') || reasons.includes('frozen-output')) {
      actions.push({ type: 'restart-component', component: 'renderer', reason: 'degraded-output' });
    }
    if (reasons.includes('silent-output')) {
      actions.push({ type: 'mute-audio', component: 'audio', reason: 'audio-unavailable' });
    }
    if (reasons.includes('queue-pressure') || reasons.includes('memory-slope')) {
      actions.push({ type: 'reduce-quality', reason: 'resource-pressure' });
    }

    const supervisor = this.supervisor.evaluate(sample.nowMs);
    reasons.push(...supervisor.reasons);
    actions.push(...supervisor.actions);

    const unsafe = reasons.some(reason =>
      ['stale-public-snapshot', 'frozen-output', 'black-output', 'wrong-scene'].includes(reason)
      && frameAge > 5000,
    ) || supervisor.level === 'unsafe' || sample.queueUtilization >= 1 || sample.memorySlopeMbPerHour >= 64;

    this.metrics.observe('ant_output_unsafe', unsafe ? 1 : 0, { game: 'ant-colony' });
    this.metrics.observe('ant_queue_utilization', sample.queueUtilization, { game: 'ant-colony' });
    this.metrics.observe('ant_memory_slope_mb_hour', sample.memorySlopeMbPerHour, { game: 'ant-colony' });
    const alerts = this.alerts.evaluate({
      ant_output_unsafe: unsafe ? 1 : 0,
      ant_queue_utilization: sample.queueUtilization,
    }, sample.nowMs);
    const uniqueActions = [...new Map(actions.map(action => [
      `${action.type}:${action.component ?? ''}:${action.reason}`,
      action,
    ])).values()];
    const status = unsafe ? 'unsafe' : reasons.length ? 'degraded' : 'healthy';
    return {
      status,
      reasons: [...new Set(reasons)].sort(),
      actions: uniqueActions,
      publicCopy: status === 'healthy'
        ? 'Live colony'
        : status === 'degraded'
          ? 'Restoring live colony view'
          : 'Live colony output temporarily protected',
      alerts,
    };
  }

  snapshot() {
    return {
      metrics: this.metrics.snapshot(),
      supervisor: this.supervisor.snapshot(),
      activeAlerts: this.alerts.active(),
      lastProgressMs: this.lastProgressMs,
    };
  }
}

export type AntRecoveryWorkflowState =
  | 'monitoring'
  | 'safe-scene'
  | 'restarting'
  | 'restoring'
  | 'verifying'
  | 'resumed'
  | 'halted';

export class AntOutputRecoveryWorkflow {
  private stateValue: AntRecoveryWorkflowState = 'monitoring';
  private attempts = 0;
  private reasons: string[] = [];

  constructor(private maxAttempts = 3) {
    if (!Number.isInteger(maxAttempts) || maxAttempts < 1) throw new RangeError('maxAttempts');
  }

  begin(result: AntColonyOperationalHealth) {
    this.reasons = [...result.reasons];
    this.attempts = 0;
    this.stateValue = result.status === 'unsafe'
      ? 'safe-scene'
      : result.status === 'degraded'
        ? 'restarting'
        : 'resumed';
    return this.snapshot();
  }

  advance(signal: { componentRestarted?: boolean; snapshotVerified?: boolean; outputHealthy?: boolean }) {
    if (this.stateValue === 'halted' || this.stateValue === 'resumed') return this.snapshot();
    if (this.stateValue === 'safe-scene') {
      this.stateValue = signal.componentRestarted ? 'restoring' : 'restarting';
      return this.snapshot();
    }
    if (this.stateValue === 'restarting') {
      if (signal.componentRestarted) this.stateValue = 'restoring';
      return this.snapshot();
    }
    if (this.stateValue === 'restoring') {
      if (signal.snapshotVerified) this.stateValue = 'verifying';
      else {
        this.attempts += 1;
        if (this.attempts >= this.maxAttempts) this.stateValue = 'halted';
      }
      return this.snapshot();
    }
    if (this.stateValue === 'verifying') {
      if (signal.snapshotVerified && signal.outputHealthy) this.stateValue = 'resumed';
      else {
        this.attempts += 1;
        this.stateValue = this.attempts >= this.maxAttempts ? 'halted' : 'restoring';
      }
      return this.snapshot();
    }
    return this.snapshot();
  }

  snapshot() {
    return { state: this.stateValue, attempts: this.attempts, reasons: [...this.reasons] };
  }
}
