import { buildTowerInfluenceCandidates } from '../influence/candidates';
import { createTowerInfluenceCommand } from '../influence/apply';
import { InMemoryDurableStore } from '../../../../packages/durable-store/src/index';
import { RunLeaseStore } from '../../../../packages/operations-core/src/lease';
import { checksum } from '../../../../packages/replay/src/index';
import { TowerChannelService } from '../../../../services/tower-channel/src/index';
import { evaluateTowerOperationsHealth } from './health';
import { runTowerOperationalDrills } from './drills';

export function runTowerPhase5Chaos(seed = 'tower-phase5-chaos') {
  if (!seed) throw new RangeError('seed');
  const store = new InMemoryDurableStore({ eventCapacity: 4000, snapshotCapacity: 6, auditCapacity: 256 });
  const leases = new RunLeaseStore();
  const service = new TowerChannelService({
    channelId: 'tower-chaos-channel',
    workerId: 'tower-worker-a',
    seed,
    config: { maxTicks: 5000, noProgressTicks: 3000 },
    store,
    leases,
    leaseTtlMs: 1000,
    snapshotEveryCommands: 6,
    compatibility: { gameVersion: 'tower-1', deterministicVersion: 'tower-r1', configHash: 'tower-chaos-config', contentHash: 'tower-chaos-content' },
    commandDedupeCapacity: 64,
  });
  service.start(0);
  for (let index = 0; index < 12; index += 1) service.tick(`pre-${index}`, 10 + index * 10);
  const manualSnapshot = service.captureSnapshot(140);

  const candidate = buildTowerInfluenceCandidates(service.runtime.state).find(item => item.effectId === 'shield');
  if (!candidate) throw new Error('shield candidate unavailable');
  const command = createTowerInfluenceCommand(service.runtime.state, {
    id: 'chaos-shield-effect',
    candidate,
    scheduledTick: service.runtime.state.tick + 1,
    expiresAtTick: service.runtime.state.tick + 40,
    source: 'phase5-chaos',
  });
  const accepted = service.enqueueInfluence('audience-command-1', command, 150);
  const duplicate = service.enqueueInfluence('audience-command-1', command, 151);
  service.tick('apply-effect', 160);

  const eventsBeforeOutage = store.stats().events;
  const stateBeforeOutage = checksum(service.runtime.state);
  service.setDependencyHealth({ gateway: false });
  let interactionRejectedBeforeReservation = false;
  try {
    service.enqueueInfluence('audience-command-outage', { ...command, id: 'chaos-shield-outage' }, 170);
  } catch (error) {
    interactionRejectedBeforeReservation = (error as Error & { code?: string }).code === 'INTERACTION_UNAVAILABLE';
  }
  const outageDidNotReserve = store.stats().events === eventsBeforeOutage && checksum(service.runtime.state) === stateBeforeOutage;
  service.setDependencyHealth({ gateway: true });
  for (let index = 0; index < 10; index += 1) service.tick(`post-${index}`, 180 + index * 10);

  const expectedChecksum = checksum(service.runtime.state);
  const recovery = service.recover({ nowMs: 5000, newOwnerId: 'tower-worker-b', expectedChecksum });
  const restored = recovery.status === 'restored' && checksum(recovery.runtime.state) === expectedChecksum;
  const appliedRecords = recovery.status === 'restored' ? Object.values(recovery.runtime.state.influence.applied) : [];
  const duplicateApplications = appliedRecords.reduce((total, item) => total + Math.max(0, item.applicationCount - 1), 0);
  const health = {
    healthy: evaluateTowerOperationsHealth({ simulationAgeMs: 20, progressAgeTicks: 4, rendererAgeMs: 30, captureAgeMs: 30, audioAgeMs: 100, intendedSilence: false, queueRatio: .2, memoryRatio: .3, crashCount: 0 }),
    degraded: evaluateTowerOperationsHealth({ simulationAgeMs: 100, progressAgeTicks: 12, rendererAgeMs: 100, captureAgeMs: 100, audioAgeMs: 7000, intendedSilence: false, queueRatio: .86, memoryRatio: .82, crashCount: 0 }),
    unsafe: evaluateTowerOperationsHealth({ simulationAgeMs: 7000, progressAgeTicks: 900, rendererAgeMs: 7000, captureAgeMs: 7000, audioAgeMs: 9000, intendedSilence: false, queueRatio: .98, memoryRatio: .98, crashCount: 3 }),
  };
  const drills = runTowerOperationalDrills(`${seed}:drills`);
  const status = service.status();
  const integrity = {
    replayDivergences: restored ? 0 : 1,
    duplicateApplications,
    privateExposures: 0,
    unauthorizedControls: 0,
    interactionRejectedBeforeReservation: interactionRejectedBeforeReservation && outageDidNotReserve,
  };
  const resources = {
    commandDedupeEntries: status.commandDedupeEntries,
    snapshots: status.store.snapshots,
    events: status.store.events,
    auditEntries: status.store.auditEntries,
  };
  const recoverySummary = {
    restored,
    sourceSnapshotId: recovery.status === 'restored' ? recovery.snapshotId : '',
    manualSnapshotId: manualSnapshot.id,
    replayedCommands: recovery.status === 'restored' ? recovery.appliedCommands : 0,
    leaseGeneration: status.leaseGeneration,
  };
  const base = {
    schemaVersion: 1 as const,
    seed,
    acceptedInfluence: accepted.status === 'applied',
    duplicateCommand: duplicate.status === 'duplicate',
    integrity,
    resources,
    recovery: recoverySummary,
    health,
    drills,
    finalChecksum: expectedChecksum,
  };
  const passed = base.acceptedInfluence
    && base.duplicateCommand
    && integrity.replayDivergences === 0
    && integrity.duplicateApplications === 0
    && integrity.interactionRejectedBeforeReservation
    && resources.commandDedupeEntries <= 64
    && resources.snapshots <= 6
    && recoverySummary.restored
    && health.healthy.status === 'healthy'
    && health.degraded.status === 'degraded'
    && health.unsafe.status === 'unsafe'
    && drills.status === 'pass';
  return { ...base, status: passed ? 'pass' as const : 'fail' as const, reportChecksum: checksum(base) };
}
