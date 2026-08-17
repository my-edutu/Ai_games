import { InMemoryDurableStore } from '../../../../packages/durable-store/src/index';
import { RunLeaseStore } from '../../../../packages/operations-core/src/lease';
import { checksum } from '../../../../packages/replay/src/index';
import { AntColonyChannelService } from '../../../../services/ant-colony-channel/src/index';
import { createAntInfluenceCommand } from '../influence/apply';
import { runPhase5AntColonyDrills } from './drills';
import { AntColonyOperationsMonitor } from './health';

export interface AntColonyPhase5ChaosSummary {
  status: 'pass' | 'fail';
  seed: string;
  commands: number;
  events: number;
  snapshots: number;
  auditEntries: number;
  dedupeEntries: number;
  appliedInfluence: number;
  duplicateApplications: number;
  duplicateEventIds: number;
  eventSequenceContiguous: boolean;
  integrityFailures: number;
  recoveryVerified: boolean;
  oldWriterFenced: boolean;
  interactionsDegradedSafely: boolean;
  outputProtected: boolean;
  drillsCompleted: number;
  finalTick: number;
  finalAuthorityChecksum: string;
  checksum: string;
}

export function runAntColonyPhase5Chaos(seed = 'ant-phase5-chaos'): AntColonyPhase5ChaosSummary {
  const store = new InMemoryDurableStore({
    eventCapacity: 5000,
    snapshotCapacity: 4,
    auditCapacity: 100,
  });
  const leases = new RunLeaseStore();
  const base = {
    channelId: 'ant-chaos',
    seed,
    config: {
      width: 32,
      height: 24,
      targetPopulation: 72,
      initialWorkers: 18,
      maxAnts: 144,
      profile: 'forest' as const,
      predatorSpawnInterval: 1000,
      noProgressTicks: 20_000,
    },
    store,
    leases,
    leaseTtlMs: 1000,
    snapshotEveryCommands: 8,
    compatibility: {
      gameVersion: 'ant-0.5.0',
      deterministicVersion: 'ant-colony-v1',
      configHash: 'ant-chaos-config',
      contentHash: 'ant-chaos-content',
    },
    commandDedupeCapacity: 32,
    environment: 'production',
  };

  const primary = new AntColonyChannelService({ ...base, workerId: 'worker-primary' });
  primary.start(0);
  for (let i = 1; i <= 16; i += 1) primary.tick(`tick-${i}`, i * 10);

  const command = createAntInfluenceCommand({
    id: 'chaos-gentle-rain',
    effectId: 'gentle-rain',
    scheduledTick: primary.runtime.state.tick + 1,
    expiresTick: primary.runtime.state.tick + 30,
    magnitude: 1,
    source: 'campaign',
  });
  primary.enqueueInfluence('reserve-chaos-effect', command, 200);
  primary.enqueueInfluence('reserve-chaos-effect', command, 201);

  primary.setDependencyHealth({ gateway: false, moderation: false });
  const degraded = primary.status();
  for (let i = 17; i <= 40; i += 1) primary.tick(`tick-${i}`, 300 + i * 10);
  primary.setDependencyHealth({ gateway: true, moderation: true });

  const expectedChecksum = primary.status().lastChecksum;
  const snapshots = store.snapshots('ant-chaos');
  if (snapshots.length) {
    const corrupt = structuredClone(snapshots[0]) as unknown as {
      envelope: { payload: { tick: number } };
    } & typeof snapshots[number];
    corrupt.envelope.payload.tick += 1;
    store.putSnapshot(corrupt);
  }

  leases.fence('ant-chaos', 'worker-replacement');
  const replacement = new AntColonyChannelService({ ...base, workerId: 'worker-replacement' });
  const restored = replacement.start(5000);
  const recoveryVerified = restored.lastChecksum === expectedChecksum;

  let oldWriterFenced = false;
  try {
    primary.tick('old-writer-after-recovery', 5010);
  } catch (error) {
    oldWriterFenced = (error as { code?: string }).code === 'LEASE_FENCED';
  }

  const duplicateBefore = checksum(replacement.runtime.state);
  const duplicate = replacement.tick('tick-40', 5020);
  const duplicateStable = duplicate.status === 'duplicate'
    && checksum(replacement.runtime.state) === duplicateBefore;

  const monitor = new AntColonyOperationsMonitor();
  const output = monitor.observe({
    nowMs: 20_000,
    simulationProgressSeq: replacement.runtime.state.tick,
    lastMeaningfulEventMs: 19_000,
    lastSnapshotMs: 1000,
    lastFrameChangeMs: 1000,
    lastAudioMs: 1000,
    intendedSilence: false,
    luma: 0,
    expectedScene: 'active',
    actualScene: 'error',
    queueUtilization: 0.92,
    memorySlopeMbPerHour: 40,
    resourcePressure: 0.4,
  });
  const drills = runPhase5AntColonyDrills();

  const appliedRecords = replacement.runtime.state.influence.records
    .filter(record => record.status === 'applied');
  const applicationCounts = new Map<string, number>();
  for (const record of appliedRecords) {
    applicationCounts.set(record.id, (applicationCounts.get(record.id) ?? 0) + 1);
  }
  const duplicateApplications = [...applicationCounts.values()]
    .reduce((sum, count) => sum + Math.max(0, count - 1), 0);

  const durableEvents = store.events('ant-chaos');
  const duplicateEventIds = durableEvents.length - new Set(durableEvents.map(event => event.eventId)).size;
  const eventSequenceContiguous = durableEvents.every((event, index) => event.seq === index);
  const stats = store.stats();
  const outputProtected = output.status === 'unsafe'
    && output.actions.some(action => action.type === 'safe-scene');
  const integrityFailures = [
    recoveryVerified,
    oldWriterFenced,
    duplicateStable,
    drills.status === 'pass',
    outputProtected,
    eventSequenceContiguous,
    duplicateEventIds === 0,
  ].filter(value => !value).length;

  const body = {
    status: integrityFailures === 0 && duplicateApplications === 0 ? 'pass' as const : 'fail' as const,
    seed,
    commands: replacement.status().commandSeq,
    events: stats.events,
    snapshots: stats.snapshots,
    auditEntries: stats.auditEntries,
    dedupeEntries: replacement.status().commandDedupeEntries,
    appliedInfluence: appliedRecords.length,
    duplicateApplications,
    duplicateEventIds,
    eventSequenceContiguous,
    integrityFailures,
    recoveryVerified,
    oldWriterFenced,
    interactionsDegradedSafely: !degraded.interactionsEnabled && degraded.simulationEnabled,
    outputProtected,
    drillsCompleted: drills.completed,
    finalTick: replacement.runtime.state.tick,
    finalAuthorityChecksum: checksum(replacement.runtime.state),
  };
  return { ...body, checksum: checksum(body) };
}
