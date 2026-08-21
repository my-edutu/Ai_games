import { createBattleConfig } from '../config/index';
import { assertBattleInvariants } from '../rules/invariants';
import { BattleRoyaleRuntime } from '../runtime/runtime';
import { BattleReplayJournal } from '../persistence/replay';
import { createBattleSnapshotEnvelope, restoreBattleSnapshotEnvelope } from '../persistence/snapshot';

export type BattleOperationsStatus = 'healthy' | 'degraded' | 'unsafe';
export type BattleOperationsActionType = 'disable-interactions' | 'mute-audio' | 'reduce-quality' | 'safe-scene' | 'verified-recovery';

export interface BattleOperationsSample {
  nowMs: number;
  tick: number;
  lastTickProgressMs: number;
  lastRenderChangeMs: number;
  lastAudioMs: number;
  audioExpected: boolean;
  lastPersistenceMs: number;
  providerStatus: string;
  queueUtilization: number;
  memorySlopeMbPerHour: number;
  resourcePressure: number;
}

export interface BattleOperationsAction {
  type: BattleOperationsActionType;
  reason: string;
}

export interface BattleOperationsHealth {
  status: BattleOperationsStatus;
  publicScene: 'battle' | 'recovery';
  reasons: string[];
  actions: BattleOperationsAction[];
}

const STALE_TICK_MS = 5_000;
const STALE_RENDER_MS = 5_000;
const STALE_AUDIO_MS = 5_000;
const STALE_PERSISTENCE_MS = 5_000;

function age(nowMs: number, timestampMs: number): number {
  return Math.max(0, nowMs - timestampMs);
}

function pushAction(actions: BattleOperationsAction[], type: BattleOperationsActionType, reason: string): void {
  if (!actions.some((action) => action.type === type)) actions.push({ type, reason });
}

export class BattleOperationsSupervisor {
  public observe(sample: BattleOperationsSample): BattleOperationsHealth {
    const reasons: string[] = [];
    const actions: BattleOperationsAction[] = [];
    let unsafe = false;

    if (age(sample.nowMs, sample.lastTickProgressMs) > STALE_TICK_MS) {
      unsafe = true;
      reasons.push('simulation-no-progress');
      pushAction(actions, 'safe-scene', 'simulation-no-progress');
      pushAction(actions, 'verified-recovery', 'simulation-no-progress');
    }
    if (age(sample.nowMs, sample.lastRenderChangeMs) > STALE_RENDER_MS) {
      unsafe = true;
      reasons.push('render-stale');
      pushAction(actions, 'safe-scene', 'render-stale');
    }
    if (age(sample.nowMs, sample.lastPersistenceMs) > STALE_PERSISTENCE_MS) {
      unsafe = true;
      reasons.push('persistence-stale');
      pushAction(actions, 'verified-recovery', 'persistence-stale');
      pushAction(actions, 'safe-scene', 'persistence-stale');
    }
    if (sample.audioExpected && age(sample.nowMs, sample.lastAudioMs) > STALE_AUDIO_MS) {
      reasons.push('audio-stale');
      pushAction(actions, 'mute-audio', 'audio-stale');
    }
    if (sample.providerStatus !== 'online') {
      reasons.push('provider-unavailable');
      pushAction(actions, 'disable-interactions', 'provider-unavailable');
    }
    if (sample.queueUtilization > 0.85 || sample.resourcePressure > 0.9 || sample.memorySlopeMbPerHour > 32) {
      reasons.push('resource-pressure');
      pushAction(actions, 'reduce-quality', 'resource-pressure');
    }

    const status: BattleOperationsStatus = unsafe ? 'unsafe' : reasons.length > 0 ? 'degraded' : 'healthy';
    return {
      status,
      publicScene: unsafe ? 'recovery' : 'battle',
      reasons: [...reasons],
      actions: actions.map((action) => ({ ...action })),
    };
  }
}

export type BattleRecoveryState = 'idle' | 'safe-scene' | 'restoring' | 'verifying' | 'resumed' | 'halted';

export interface BattleRecoveryEvidence {
  componentRestarted?: boolean;
  snapshotVerified?: boolean;
  outputHealthy?: boolean;
}

export class BattleOutputRecoveryWorkflow {
  private state: BattleRecoveryState = 'idle';
  private attempts = 0;
  private readonly maxAttempts: number;

  public constructor(maxAttempts = 3) {
    if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 10) throw new RangeError('maxAttempts');
    this.maxAttempts = maxAttempts;
  }

  public begin(health: BattleOperationsHealth) {
    if (this.state === 'halted' || this.state === 'resumed') return this.snapshot();
    this.state = health.status === 'unsafe' ? 'safe-scene' : 'resumed';
    return this.snapshot();
  }

  public advance(evidence: BattleRecoveryEvidence) {
    if (this.state === 'halted' || this.state === 'resumed') return this.snapshot();
    if (this.state === 'safe-scene') {
      if (evidence.componentRestarted) this.state = 'restoring';
      return this.snapshot();
    }
    if (this.state === 'restoring') {
      if (evidence.snapshotVerified === true) this.state = 'verifying';
      else if (evidence.snapshotVerified === false) {
        this.attempts += 1;
        if (this.attempts >= this.maxAttempts) this.state = 'halted';
      }
      return this.snapshot();
    }
    if (this.state === 'verifying') {
      if (evidence.snapshotVerified === true && evidence.outputHealthy === true) this.state = 'resumed';
      else if (evidence.outputHealthy === false) {
        this.attempts += 1;
        this.state = this.attempts >= this.maxAttempts ? 'halted' : 'restoring';
      }
      return this.snapshot();
    }
    return this.snapshot();
  }

  public snapshot() {
    return { state: this.state, attempts: this.attempts, maxAttempts: this.maxAttempts };
  }
}

function chaosConfig() {
  return createBattleConfig({
    width: 24,
    height: 18,
    combatantCount: 12,
    lootCount: 24,
    maxTicks: 360,
    intermissionTicks: 8,
    startingHealth: 500,
    startingShield: 250,
    zoneFirstShrinkTick: 140,
    zoneShrinkInterval: 70,
    supplyDropEvery: 80,
    noProgressTicks: 180,
    voteWindowEvery: 80,
    voteWindowTicks: 20,
    maxProcessedInfluence: 64,
    maxAuditEntries: 64,
    maxScheduledEffects: 8,
  });
}

export function runBattleRoyalePhase5Chaos(seed = 'battle-phase5-chaos') {
  const runtime = new BattleRoyaleRuntime(chaosConfig(), seed, `chaos-${seed}`);
  for (let index = 0; index < 48; index += 1) runtime.step();

  const envelope = createBattleSnapshotEnvelope(runtime);
  const restored = restoreBattleSnapshotEnvelope(envelope);
  let restoreVerified = restored.status === 'restored' && restored.runtime.checksum() === runtime.checksum();
  if (restored.status === 'restored') {
    for (let index = 0; index < 24; index += 1) {
      runtime.step();
      restored.runtime.step();
    }
    restoreVerified = restoreVerified && restored.runtime.checksum() === runtime.checksum();
  }

  const corrupted = JSON.parse(JSON.stringify(envelope)) as typeof envelope;
  corrupted.runtimeSnapshot.state.combatants[0].health = Math.max(0, corrupted.runtimeSnapshot.state.combatants[0].health - 3);
  const corruptionQuarantined = restoreBattleSnapshotEnvelope(corrupted).status === 'quarantined';
  const incompatible = JSON.parse(JSON.stringify(envelope)) as typeof envelope;
  incompatible.deterministicVersion = 'battle-future-v99';
  const incompatibleQuarantined = restoreBattleSnapshotEnvelope(incompatible).status === 'quarantined';

  const journal = new BattleReplayJournal(32);
  journal.record({ id: 'provider:event-1', tick: 1, kind: 'audience-input', digest: 'checksum:00000001' });
  const duplicateReplayRejected = journal.record({ id: 'provider:event-1', tick: 1, kind: 'audience-input', digest: 'checksum:00000001' }).status === 'duplicate';
  for (let index = 2; index <= 48; index += 1) {
    journal.record({ id: `provider:event-${index}`, tick: index, kind: 'audience-input', digest: `checksum:${index.toString(16).padStart(8, '0')}` });
  }

  const supervisor = new BattleOperationsSupervisor();
  const providerHealth = supervisor.observe({
    nowMs: 20_000,
    tick: runtime.state.tick,
    lastTickProgressMs: 19_900,
    lastRenderChangeMs: 19_900,
    lastAudioMs: 19_900,
    audioExpected: true,
    lastPersistenceMs: 19_900,
    providerStatus: 'disabled',
    queueUtilization: 0.2,
    memorySlopeMbPerHour: 1,
    resourcePressure: 0.2,
  });
  const interactionsDegradedSafely = providerHealth.status === 'degraded' && providerHealth.actions.some((action) => action.type === 'disable-interactions');

  const unsafeHealth = supervisor.observe({
    nowMs: 20_000,
    tick: runtime.state.tick,
    lastTickProgressMs: 10_000,
    lastRenderChangeMs: 19_900,
    lastAudioMs: 19_900,
    audioExpected: true,
    lastPersistenceMs: 19_900,
    providerStatus: 'online',
    queueUtilization: 0.2,
    memorySlopeMbPerHour: 1,
    resourcePressure: 0.2,
  });
  const breaker = new BattleOutputRecoveryWorkflow(2);
  breaker.begin(unsafeHealth);
  breaker.advance({ componentRestarted: true });
  breaker.advance({ snapshotVerified: false });
  breaker.advance({ snapshotVerified: false });
  const breakerBounded = breaker.snapshot().state === 'halted' && breaker.snapshot().attempts === 2;

  const integrityFailures = assertBattleInvariants(runtime.state).length;
  const journalEntries = journal.snapshot().entries.length;
  const status = restoreVerified && corruptionQuarantined && incompatibleQuarantined && duplicateReplayRejected && breakerBounded && interactionsDegradedSafely && integrityFailures === 0 && journalEntries <= 32 ? 'pass' : 'fail';
  return {
    status,
    restoreVerified,
    corruptionQuarantined,
    incompatibleQuarantined,
    duplicateReplayRejected,
    breakerBounded,
    interactionsDegradedSafely,
    integrityFailures,
    journalEntries,
    checksum: runtime.checksum(),
  };
}
