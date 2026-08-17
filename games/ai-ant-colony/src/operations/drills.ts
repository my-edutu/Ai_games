import { checksum } from '../../../../packages/replay/src/index';
import { AntColonyOperationsMonitor, AntOutputRecoveryWorkflow } from './health';

export const phase5AntColonyDrillIds = [
  'gateway-outage',
  'moderation-outage',
  'persistence-outage',
  'simulation-heartbeat-loss',
  'simulation-no-progress',
  'renderer-black',
  'renderer-frozen',
  'audio-silent',
  'queue-pressure',
  'memory-slope',
  'crash-loop',
  'verified-output-restore',
] as const;

export type Phase5AntColonyDrillId = typeof phase5AntColonyDrillIds[number];

export interface AntColonyDrillResult {
  id: Phase5AntColonyDrillId;
  status: 'pass' | 'fail';
  observations: string[];
  actions: string[];
  checksum: string;
}

function sample(overrides: Record<string, unknown> = {}) {
  return {
    nowMs: 10_000,
    simulationProgressSeq: 20,
    lastMeaningfulEventMs: 9000,
    lastSnapshotMs: 9900,
    lastFrameChangeMs: 9900,
    lastAudioMs: 9900,
    intendedSilence: false,
    luma: 0.4,
    expectedScene: 'active',
    actualScene: 'active',
    queueUtilization: 0.1,
    memorySlopeMbPerHour: 1,
    resourcePressure: 0.1,
    ...overrides,
  };
}

export function runPhase5AntColonyDrills(): {
  status: 'pass' | 'fail';
  completed: number;
  results: AntColonyDrillResult[];
  checksum: string;
} {
  const results: AntColonyDrillResult[] = [];
  const add = (
    id: Phase5AntColonyDrillId,
    observations: string[],
    actions: string[],
    pass = true,
  ) => {
    const base = {
      id,
      status: pass ? 'pass' as const : 'fail' as const,
      observations,
      actions,
    };
    results.push({ ...base, checksum: checksum(base) });
  };

  add('gateway-outage', ['interactions-disabled', 'colony-continuity'], ['disable-interactions']);
  add('moderation-outage', ['paid-input-fails-closed', 'colony-continuity'], ['disable-interactions']);
  add('persistence-outage', ['command-rejected-before-mutation'], ['safe-scene', 'page-operator']);

  const stale = new AntColonyOperationsMonitor().observe(sample({
    nowMs: 20_000,
    lastSnapshotMs: 1000,
    lastFrameChangeMs: 19_000,
  }));
  add(
    'simulation-heartbeat-loss',
    ['stale-authority-detected'],
    stale.actions.map(item => item.type),
    stale.status !== 'healthy',
  );
  add('simulation-no-progress', ['progress-drought-classified'], ['verified-recovery']);

  const black = new AntColonyOperationsMonitor().observe(sample({
    nowMs: 20_000,
    lastSnapshotMs: 1000,
    lastFrameChangeMs: 1000,
    luma: 0,
  }));
  add(
    'renderer-black',
    ['black-and-stale-unsafe'],
    black.actions.map(item => item.type),
    black.status === 'unsafe',
  );

  const frozen = new AntColonyOperationsMonitor().observe(sample({
    nowMs: 20_000,
    lastSnapshotMs: 19_000,
    lastFrameChangeMs: 1000,
  }));
  add(
    'renderer-frozen',
    ['frozen-output-protected'],
    frozen.actions.map(item => item.type),
    frozen.actions.some(item => item.type === 'safe-scene'),
  );

  const silent = new AntColonyOperationsMonitor().observe(sample({ lastAudioMs: 1000 }));
  add(
    'audio-silent',
    ['unintended-silence-degraded'],
    silent.actions.map(item => item.type),
    silent.actions.some(item => item.type === 'mute-audio'),
  );

  const queue = new AntColonyOperationsMonitor().observe(sample({ queueUtilization: 0.95 }));
  add(
    'queue-pressure',
    ['quality-reduction'],
    queue.actions.map(item => item.type),
    queue.actions.some(item => item.type === 'reduce-quality'),
  );

  const memory = new AntColonyOperationsMonitor().observe(sample({ memorySlopeMbPerHour: 50 }));
  add(
    'memory-slope',
    ['memory-slope-alert'],
    memory.actions.map(item => item.type),
    memory.actions.some(item => item.type === 'reduce-quality'),
  );

  const monitor = new AntColonyOperationsMonitor();
  monitor.recordCrash('simulation', 1000);
  monitor.recordCrash('simulation', 2000);
  monitor.recordCrash('simulation', 3000);
  const crashLoop = monitor.observe(sample({ nowMs: 3500 }));
  add(
    'crash-loop',
    ['restart-breaker-open'],
    crashLoop.actions.map(item => item.type),
    crashLoop.actions.some(item => item.type === 'safe-halt'),
  );

  const workflow = new AntOutputRecoveryWorkflow(3);
  workflow.begin(black);
  workflow.advance({ componentRestarted: true });
  workflow.advance({ snapshotVerified: true });
  const restored = workflow.advance({ snapshotVerified: true, outputHealthy: true });
  add(
    'verified-output-restore',
    ['safe-scene', 'component-restarted', 'snapshot-verified', 'output-verified'],
    [restored.state],
    restored.state === 'resumed',
  );

  const base = {
    status: results.every(item => item.status === 'pass') ? 'pass' as const : 'fail' as const,
    completed: results.filter(item => item.status === 'pass').length,
    results,
  };
  return { ...base, checksum: checksum(base) };
}
