import type { TowerConfig } from '../../../games/infinite-tower-climb/src/config/schema';
import { createTowerSnapshot, restoreTowerSnapshot, type TowerSnapshot } from '../../../games/infinite-tower-climb/src/persistence/snapshot';
import type { TowerPolicyMode } from '../../../games/infinite-tower-climb/src/index';
import type { TowerInfluenceCommand } from '../../../games/infinite-tower-climb/src/influence/types';
import { TowerRuntime } from '../../../games/infinite-tower-climb/src/runtime/run';
import { createStoredEvent, type DurableStore } from '../../../packages/durable-store/src/index';
import type { AuditEntry, CompatibilityKey, SnapshotRecord } from '../../../packages/ops-contracts/src/index';
import { RunLeaseStore, type RunLease } from '../../../packages/operations-core/src/lease';
import { OperatorControlPlane, type ControlCommand } from '../../../packages/operator-control/src/index';
import { checksum } from '../../../packages/replay/src/index';

export interface TowerChannelOptions {
  channelId: string;
  workerId: string;
  seed: string;
  config: Partial<TowerConfig>;
  policy?: TowerPolicyMode;
  store: DurableStore;
  leases: RunLeaseStore;
  leaseTtlMs: number;
  snapshotEveryCommands: number;
  compatibility: CompatibilityKey;
  commandDedupeCapacity?: number;
  environment?: string;
}

export interface TowerDependencyHealth {
  gateway: boolean;
  moderation: boolean;
  entitlement: boolean;
  audit: boolean;
  persistence: boolean;
  renderer: boolean;
  capture: boolean;
  audio: boolean;
}

export interface TowerChannelStatus {
  started: boolean;
  leaseGeneration: number;
  interactionsEnabled: boolean;
  simulationEnabled: boolean;
  publicOutputProtected: boolean;
  commandSeq: number;
  commandDedupeEntries: number;
  queuedInfluence: number;
  dependencies: TowerDependencyHealth;
  store: { events: number; snapshots: number; auditEntries: number };
  lastChecksum: string;
  runId: string;
  tick: number;
}

export interface TowerRecoveryCheckpoint extends Omit<SnapshotRecord, 'envelope'> {
  envelope: TowerSnapshot;
}

export type TowerRuntimeCommand =
  | { schemaVersion: 1; id: string; seq: number; kind: 'step' }
  | { schemaVersion: 1; id: string; seq: number; kind: 'restart'; seed: string }
  | { schemaVersion: 1; id: string; seq: number; kind: 'influence'; command: TowerInfluenceCommand };

export type TowerRecoveryResult =
  | { status: 'restored'; runtime: TowerRuntime; snapshotId: string; appliedCommands: number; rejected: string[]; lease?: RunLease }
  | { status: 'quarantined'; reason: 'no-compatible-snapshot' | 'command-sequence-gap' | 'command-rejected' | 'replay-divergence' | 'lease-conflict'; rejected: string[] };

function operationalError(code: string, message: string): Error {
  const error = new Error(message);
  Object.assign(error, { code });
  return error;
}

function checkpointBase(record: TowerRecoveryCheckpoint) {
  const { checksum: _ignored, ...base } = record;
  return base;
}

function validCheckpoint(record: TowerRecoveryCheckpoint): boolean {
  return checksum(checkpointBase(record)) === record.checksum;
}

function sameCompatibility(a: CompatibilityKey, b: CompatibilityKey): boolean {
  return a.gameVersion === b.gameVersion
    && a.deterministicVersion === b.deterministicVersion
    && a.configHash === b.configHash
    && a.contentHash === b.contentHash;
}

export function createTowerRecoveryCheckpoint(
  runtime: TowerRuntime,
  options: { streamId: string; id: string; commandSeq: number; createdAtMs: number; compatibility: CompatibilityKey },
): TowerRecoveryCheckpoint {
  const base = {
    schemaVersion: 1 as const,
    id: options.id,
    streamId: options.streamId,
    runId: runtime.state.runId,
    eventSeq: runtime.getNextEventSequence() - 1,
    commandSeq: options.commandSeq,
    createdAtMs: options.createdAtMs,
    compatibility: structuredClone(options.compatibility),
    envelope: createTowerSnapshot(runtime),
  };
  return { ...base, checksum: checksum(base) };
}

export function recoverTowerFromEvidence(input: {
  snapshots: ReadonlyArray<TowerRecoveryCheckpoint>;
  commands: ReadonlyArray<TowerRuntimeCommand>;
  compatibility: CompatibilityKey;
  expectedChecksum?: string;
  lease?: { store: RunLeaseStore; channelId: string; newOwnerId: string; ttlMs: number; nowMs: number };
}): TowerRecoveryResult {
  const rejected: string[] = [];
  let lease: RunLease | undefined;
  if (input.lease) {
    input.lease.store.fence(input.lease.channelId, 'verified-recovery');
    const acquired = input.lease.store.acquire(input.lease.channelId, input.lease.newOwnerId, input.lease.ttlMs, input.lease.nowMs);
    if (acquired.status !== 'acquired') return { status: 'quarantined', reason: 'lease-conflict', rejected };
    lease = acquired.lease;
  }

  const candidates = [...input.snapshots]
    .filter(item => sameCompatibility(item.compatibility, input.compatibility))
    .sort((a, b) => b.createdAtMs - a.createdAtMs || b.commandSeq - a.commandSeq || a.id.localeCompare(b.id));

  for (const snapshot of candidates) {
    if (!validCheckpoint(snapshot)) {
      rejected.push(`${snapshot.id}:record-checksum`);
      continue;
    }
    let runtime: TowerRuntime;
    try {
      runtime = restoreTowerSnapshot(structuredClone(snapshot.envelope));
    } catch (error) {
      rejected.push(`${snapshot.id}:${error instanceof Error ? error.name : 'restore-error'}`);
      continue;
    }
    const commands = [...input.commands]
      .filter(command => command.seq > snapshot.commandSeq)
      .sort((a, b) => a.seq - b.seq || a.id.localeCompare(b.id));
    let expected = snapshot.commandSeq + 1;
    let applied = 0;
    for (const command of commands) {
      if (command.seq !== expected) {
        return { status: 'quarantined', reason: 'command-sequence-gap', rejected: [...rejected, `${command.id}:expected-${expected}`] };
      }
      if (command.kind === 'step') runtime.step();
      else if (command.kind === 'restart') runtime.restart(command.seed);
      else {
        const queued = runtime.queueInfluence(command.command);
        if (queued.status !== 'queued' && queued.status !== 'duplicate') {
          return { status: 'quarantined', reason: 'command-rejected', rejected: [...rejected, `${command.id}:${queued.reason}`] };
        }
      }
      expected += 1;
      applied += 1;
    }
    if (input.expectedChecksum && checksum(runtime.state) !== input.expectedChecksum) {
      return { status: 'quarantined', reason: 'replay-divergence', rejected: [...rejected, `${snapshot.id}:final-checksum`] };
    }
    return { status: 'restored', runtime, snapshotId: snapshot.id, appliedCommands: applied, rejected, ...(lease ? { lease } : {}) };
  }
  return { status: 'quarantined', reason: 'no-compatible-snapshot', rejected };
}

export class TowerChannelService {
  public runtime: TowerRuntime;
  public readonly store: DurableStore;
  public readonly leases: RunLeaseStore;
  public readonly controls: OperatorControlPlane;

  private lease: RunLease | undefined;
  private started = false;
  private nextStoreSeq = 0;
  private commandSeq = 0;
  private readonly decisions = new Map<string, { status: 'applied'; checksum: string; commandSeq: number }>();
  private dependencies: TowerDependencyHealth = {
    gateway: true,
    moderation: true,
    entitlement: true,
    audit: true,
    persistence: true,
    renderer: true,
    capture: true,
    audio: true,
  };
  private readonly dedupeCapacity: number;
  private readonly hadDurableHistory: boolean;

  constructor(private readonly options: TowerChannelOptions) {
    if (!options.channelId || !options.workerId) throw new RangeError('channel options');
    if (!Number.isInteger(options.leaseTtlMs) || options.leaseTtlMs < 1) throw new RangeError('leaseTtlMs');
    if (!Number.isInteger(options.snapshotEveryCommands) || options.snapshotEveryCommands < 1) throw new RangeError('snapshotEveryCommands');
    this.store = options.store;
    this.leases = options.leases;
    this.controls = new OperatorControlPlane({ environment: options.environment ?? 'production', auditCapacity: 2000 });
    this.runtime = TowerRuntime.create(options.config, options.seed, { policy: options.policy });
    this.dedupeCapacity = options.commandDedupeCapacity ?? 1000;
    const existing = this.store.events(options.channelId);
    this.hadDurableHistory = existing.length > 0;
    this.nextStoreSeq = existing.length ? existing.at(-1)!.seq + 1 : 0;
    for (const event of existing.filter(item => item.type === 'runtime-command')) {
      const id = String(event.payload.commandId ?? '');
      const seq = Number(event.payload.commandSeq) || 0;
      if (id) this.decisions.set(id, { status: 'applied', checksum: String(event.payload.resultChecksum ?? ''), commandSeq: seq });
      this.commandSeq = Math.max(this.commandSeq, seq);
    }
    this.boundDecisions();
  }

  start(nowMs: number): TowerChannelStatus {
    if (this.started) return this.status();
    const acquired = this.leases.acquire(this.options.channelId, this.options.workerId, this.options.leaseTtlMs, nowMs);
    if (acquired.status !== 'acquired') throw operationalError('LEASE_CONFLICT', 'channel already has an active writer');
    this.lease = acquired.lease;
    this.started = true;
    if (this.hadDurableHistory) {
      const persisted = this.store.compatibleSnapshots(this.options.channelId, this.options.compatibility) as TowerRecoveryCheckpoint[];
      const synthetic = createTowerRecoveryCheckpoint(this.runtime, { streamId: this.options.channelId, id: 'synthetic-initial', commandSeq: 0, createdAtMs: 0, compatibility: this.options.compatibility });
      const commands = this.commandsFromStore();
      const result = recoverTowerFromEvidence({ snapshots: persisted.length ? persisted : [synthetic], commands, compatibility: this.options.compatibility });
      if (result.status !== 'restored') {
        this.appendAudit('startup-quarantine', 'system', nowMs, result.reason, 'recovery');
        this.leases.fence(this.options.channelId, 'startup-recovery-failed');
        this.started = false;
        throw operationalError('RECOVERY_QUARANTINED', `startup recovery failed: ${result.reason}`);
      }
      this.runtime = result.runtime;
      this.commandSeq = commands.reduce((maximum, item) => Math.max(maximum, item.seq), 0);
      this.runtime.drainEvents();
      this.appendAudit('startup-recovery', this.options.workerId, nowMs, checksum(this.runtime.state), 'recovery');
      return this.status();
    }
    this.persistSemanticEvents(this.runtime.drainEvents(), nowMs);
    return this.status();
  }

  tick(commandId: string, nowMs: number) {
    return this.applyCommand(commandId, nowMs, { kind: 'step' });
  }

  enqueueInfluence(commandId: string, command: TowerInfluenceCommand, nowMs: number) {
    return this.applyCommand(commandId, nowMs, { kind: 'influence', command });
  }

  restart(commandId: string, seed: string, nowMs: number) {
    return this.applyCommand(commandId, nowMs, { kind: 'restart', seed });
  }

  captureSnapshot(nowMs: number): TowerRecoveryCheckpoint {
    this.requireStarted();
    if (!this.dependencies.persistence) throw operationalError('PERSISTENCE_UNAVAILABLE', 'snapshot persistence is unavailable');
    const record = createTowerRecoveryCheckpoint(this.runtime, {
      streamId: this.options.channelId,
      id: `snapshot-${this.commandSeq}-${nowMs}`,
      commandSeq: this.commandSeq,
      createdAtMs: nowMs,
      compatibility: this.options.compatibility,
    });
    this.store.putSnapshot(record);
    return record;
  }

  recover(input: { nowMs: number; newOwnerId: string; expectedChecksum?: string }): TowerRecoveryResult {
    this.requireStarted();
    const result = recoverTowerFromEvidence({
      snapshots: this.store.compatibleSnapshots(this.options.channelId, this.options.compatibility) as TowerRecoveryCheckpoint[],
      commands: this.commandsFromStore(),
      compatibility: this.options.compatibility,
      expectedChecksum: input.expectedChecksum,
      lease: { store: this.leases, channelId: this.options.channelId, newOwnerId: input.newOwnerId, ttlMs: this.options.leaseTtlMs, nowMs: input.nowMs },
    });
    if (result.status === 'restored') {
      this.runtime = result.runtime;
      this.lease = result.lease;
      this.commandSeq = this.commandsFromStore().reduce((maximum, item) => Math.max(maximum, item.seq), 0);
      this.runtime.drainEvents();
      this.appendAudit('verified-recovery', input.newOwnerId, input.nowMs, checksum(this.runtime.state), 'recovery');
    } else {
      this.appendAudit('quarantine', 'system', input.nowMs, result.reason, 'recovery');
    }
    return result;
  }

  setDependencyHealth(next: Partial<TowerDependencyHealth>): void {
    this.dependencies = { ...this.dependencies, ...next };
  }

  executeControl(command: ControlCommand, nowMs: number) {
    if (!this.dependencies.audit || !this.dependencies.persistence) throw operationalError('AUDIT_UNAVAILABLE', 'operator control requires durable audit availability');
    this.appendAudit(`operator-request-${command.id}`, command.actor, nowMs, checksum({ command, phase: 'requested' }), 'operator');
    const decision = this.controls.execute(command, nowMs);
    this.appendAudit(`operator-result-${command.id}`, command.actor, nowMs, checksum({ command, decision }), 'operator');
    return decision;
  }

  status(): TowerChannelStatus {
    const control = this.controls.state();
    const stats = this.store.stats();
    return {
      started: this.started,
      leaseGeneration: this.lease?.generation ?? 0,
      interactionsEnabled: control.interactionsEnabled && this.interactionDependenciesHealthy() && this.dependencies.persistence,
      simulationEnabled: this.started && control.simulationEnabled && this.dependencies.persistence,
      publicOutputProtected: control.safeScene || !this.dependencies.persistence || !this.dependencies.renderer || !this.dependencies.capture,
      commandSeq: this.commandSeq,
      commandDedupeEntries: this.decisions.size,
      queuedInfluence: this.runtime.state.influence.queued.length,
      dependencies: { ...this.dependencies },
      store: { events: stats.events, snapshots: stats.snapshots, auditEntries: stats.auditEntries },
      lastChecksum: checksum(this.runtime.state),
      runId: this.runtime.state.runId,
      tick: this.runtime.state.tick,
    };
  }

  private applyCommand(commandId: string, nowMs: number, command: { kind: 'step' } | { kind: 'restart'; seed: string } | { kind: 'influence'; command: TowerInfluenceCommand }) {
    this.requireStarted();
    if (!commandId || !Number.isFinite(nowMs)) throw new RangeError('runtime command');
    const cached = this.decisions.get(commandId);
    if (cached?.checksum) return { status: 'duplicate' as const, commandId, commandSeq: cached.commandSeq, checksum: cached.checksum };
    const durableDuplicate = this.resolveDurableDecision(commandId);
    if (durableDuplicate) {
      this.decisions.set(commandId, durableDuplicate);
      this.boundDecisions();
      return { status: 'duplicate' as const, commandId, commandSeq: durableDuplicate.commandSeq, checksum: durableDuplicate.checksum };
    }
    if (!this.dependencies.persistence) throw operationalError('PERSISTENCE_UNAVAILABLE', 'authoritative command persistence is unavailable');
    if (command.kind === 'influence') {
      if (!this.interactionDependenciesHealthy()) throw operationalError('INTERACTION_UNAVAILABLE', 'audience interaction dependencies are unavailable');
      const probe = restoreTowerSnapshot(createTowerSnapshot(this.runtime));
      const validation = probe.queueInfluence(command.command);
      if (validation.status !== 'queued' && validation.status !== 'duplicate') throw operationalError('COMMAND_REJECTED', `influence rejected: ${validation.reason}`);
    }
    const lease = this.requireWriter(nowMs);
    const nextCommandSeq = this.commandSeq + 1;
    const durable: TowerRuntimeCommand = command.kind === 'step'
      ? { schemaVersion: 1, id: commandId, seq: nextCommandSeq, kind: 'step' }
      : command.kind === 'restart'
        ? { schemaVersion: 1, id: commandId, seq: nextCommandSeq, kind: 'restart', seed: command.seed }
        : { schemaVersion: 1, id: commandId, seq: nextCommandSeq, kind: 'influence', command: structuredClone(command.command) };
    this.appendRuntimeCommand(durable, nowMs);
    if (durable.kind === 'step') this.runtime.step();
    else if (durable.kind === 'restart') this.runtime.restart(durable.seed);
    else {
      const queued = this.runtime.queueInfluence(durable.command);
      if (queued.status !== 'queued' && queued.status !== 'duplicate') throw operationalError('COMMAND_REJECTED', `reserved influence rejected: ${queued.reason}`);
    }
    this.commandSeq = nextCommandSeq;
    this.persistSemanticEvents(this.runtime.drainEvents(), nowMs);
    const resultChecksum = checksum(this.runtime.state);
    this.decisions.set(commandId, { status: 'applied', checksum: resultChecksum, commandSeq: nextCommandSeq });
    this.boundDecisions();
    const renewed = this.leases.renew(this.options.channelId, lease.token, this.options.leaseTtlMs, nowMs);
    if (renewed.status !== 'renewed' || !renewed.lease) throw operationalError('LEASE_FENCED', 'writer lease was fenced during command application');
    this.lease = renewed.lease;
    const latest = this.store.snapshots(this.options.channelId)[0];
    if (!latest || this.commandSeq - latest.commandSeq >= this.options.snapshotEveryCommands) this.captureSnapshot(nowMs);
    return { status: 'applied' as const, commandId, commandSeq: nextCommandSeq, checksum: resultChecksum };
  }

  private resolveDurableDecision(commandId: string): { status: 'applied'; checksum: string; commandSeq: number } | undefined {
    const event = this.store.runtimeCommand(this.options.channelId, commandId);
    if (!event) return undefined;
    const commandSeq = Number(event.payload.commandSeq);
    if (!Number.isInteger(commandSeq) || commandSeq < 1) throw operationalError('CORRUPT_STORE', `runtime command ${commandId} has an invalid sequence`);
    const storedChecksum = String(event.payload.resultChecksum ?? '');
    if (storedChecksum) return { status: 'applied', checksum: storedChecksum, commandSeq };

    const replay = TowerRuntime.create(this.options.config, this.options.seed, { policy: this.options.policy });
    replay.drainEvents();
    const commands = this.commandsFromStore()
      .filter(item => item.seq <= commandSeq)
      .sort((a, b) => a.seq - b.seq || a.id.localeCompare(b.id));
    let expected = 1;
    for (const item of commands) {
      if (item.seq !== expected) throw operationalError('CORRUPT_STORE', `runtime command sequence gap before ${commandId}`);
      if (item.kind === 'step') replay.step();
      else if (item.kind === 'restart') replay.restart(item.seed);
      else {
        const queued = replay.queueInfluence(item.command);
        if (queued.status !== 'queued' && queued.status !== 'duplicate') throw operationalError('CORRUPT_STORE', `runtime command ${item.id} cannot be replayed`);
      }
      if (item.seq === commandSeq) return { status: 'applied', checksum: checksum(replay.state), commandSeq };
      expected += 1;
    }
    throw operationalError('CORRUPT_STORE', `runtime command ${commandId} is indexed but missing from replay evidence`);
  }

  private appendRuntimeCommand(command: TowerRuntimeCommand, nowMs: number): void {
    const seq = this.nextStoreSeq;
    const event = createStoredEvent({
      streamId: this.options.channelId,
      runId: this.runtime.state.runId,
      eventId: `command:${command.id}`,
      seq,
      tick: this.runtime.state.tick,
      type: 'runtime-command',
      payload: { commandId: command.id, commandSeq: command.seq, command: structuredClone(command), resultChecksum: '' },
      createdAtMs: nowMs,
    });
    this.store.appendEvent(event);
    this.nextStoreSeq = seq + 1;
  }

  private persistSemanticEvents(events: ReadonlyArray<{ seq: number; tick: number; type: string; data?: Record<string, unknown> }>, nowMs: number): void {
    for (const event of events) {
      const seq = this.nextStoreSeq;
      const stored = createStoredEvent({
        streamId: this.options.channelId,
        runId: this.runtime.state.runId,
        eventId: `semantic:${seq}:${event.seq}:${event.type}`,
        seq,
        tick: event.tick,
        type: event.type,
        payload: structuredClone(event.data ?? {}),
        createdAtMs: nowMs,
      });
      this.store.appendEvent(stored);
      this.nextStoreSeq = seq + 1;
    }
  }

  private commandsFromStore(): TowerRuntimeCommand[] {
    return this.store.events(this.options.channelId)
      .filter(item => item.type === 'runtime-command')
      .map(item => structuredClone(item.payload.command) as TowerRuntimeCommand)
      .filter(item => item && item.schemaVersion === 1 && Number.isInteger(item.seq));
  }

  private appendAudit(id: string, actorRef: string, occurredAtMs: number, payloadDigest: string, kind: AuditEntry['kind']): void {
    const entry: AuditEntry = {
      schemaVersion: 1,
      id: `${this.options.channelId}:${id}`,
      kind,
      actorRef: actorRef.slice(0, 120),
      action: id.slice(0, 120),
      targetRef: this.options.channelId.slice(0, 120),
      occurredAtMs,
      payloadDigest,
    };
    this.store.appendAudit(entry);
  }

  private interactionDependenciesHealthy(): boolean {
    return this.dependencies.gateway && this.dependencies.moderation && this.dependencies.entitlement && this.dependencies.audit;
  }

  private requireStarted(): void {
    if (!this.started || !this.lease) throw operationalError('NOT_STARTED', 'tower channel has not started');
  }

  private requireWriter(nowMs: number): RunLease {
    this.requireStarted();
    return this.leases.assertWriter(this.options.channelId, this.lease!.token, nowMs);
  }

  private boundDecisions(): void {
    while (this.decisions.size > this.dedupeCapacity) this.decisions.delete(this.decisions.keys().next().value as string);
  }
}
