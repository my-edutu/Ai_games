import { checksum } from '../../../packages/replay/src/index';
import { createStoredEvent, type DurableStore } from '../../../packages/durable-store/src/index';
import type {
  AuditEntry,
  CompatibilityKey,
  SnapshotRecord,
  StoredEvent,
} from '../../../packages/ops-contracts/src/index';
import { RunLeaseStore, type RunLease } from '../../../packages/operations-core/src/lease';
import { OperatorControlPlane, type ControlCommand } from '../../../packages/operator-control/src/index';
import type { AntColonyConfigInput } from '../../../games/ai-ant-colony/src/config/schema';
import {
  createAntSnapshot,
  restoreAntSnapshot,
  type AntRuntimeSnapshot,
} from '../../../games/ai-ant-colony/src/persistence/snapshot';
import { scheduleAntInfluence } from '../../../games/ai-ant-colony/src/influence/apply';
import type { AntInfluenceCommand } from '../../../games/ai-ant-colony/src/state/types';
import { AntColonyRuntime } from '../../../games/ai-ant-colony/src/runtime/run';

export interface AntColonyChannelOptions {
  channelId: string;
  workerId: string;
  seed: string;
  config: AntColonyConfigInput;
  store: DurableStore;
  leases: RunLeaseStore;
  leaseTtlMs: number;
  snapshotEveryCommands: number;
  compatibility: CompatibilityKey;
  commandDedupeCapacity?: number;
  environment?: string;
}

export interface AntColonyDependencyHealth {
  gateway: boolean;
  moderation: boolean;
  entitlement: boolean;
  audit: boolean;
  persistence: boolean;
  renderer: boolean;
  capture: boolean;
}

export interface AntColonyChannelStatus {
  started: boolean;
  leaseGeneration: number;
  interactionsEnabled: boolean;
  simulationEnabled: boolean;
  publicOutputProtected: boolean;
  commandSeq: number;
  commandDedupeEntries: number;
  queuedInfluence: number;
  dependencies: AntColonyDependencyHealth;
  store: { events: number; snapshots: number; auditEntries: number };
  lastChecksum: string;
  runId: string;
  tick: number;
}

export interface AntRecoveryCheckpoint extends Omit<SnapshotRecord, 'envelope'> {
  envelope: AntRuntimeSnapshot;
}

export type AntRuntimeCommand =
  | { schemaVersion: 1; id: string; seq: number; kind: 'step' }
  | { schemaVersion: 1; id: string; seq: number; kind: 'restart'; seed: string }
  | { schemaVersion: 1; id: string; seq: number; kind: 'influence'; command: AntInfluenceCommand };

export type AntRecoveryResult =
  | {
      status: 'restored';
      runtime: AntColonyRuntime;
      snapshotId: string;
      appliedCommands: number;
      rejected: string[];
      lease?: RunLease;
    }
  | {
      status: 'quarantined';
      reason:
        | 'no-compatible-snapshot'
        | 'command-sequence-gap'
        | 'command-rejected'
        | 'replay-divergence'
        | 'lease-conflict';
      rejected: string[];
    };

function operationalError(code: string, message: string): Error {
  const error = new Error(message);
  Object.assign(error, { code });
  return error;
}

function checkpointBase(record: AntRecoveryCheckpoint) {
  const { checksum: _, ...base } = record;
  return base;
}

function validCheckpoint(record: AntRecoveryCheckpoint): boolean {
  return checksum(checkpointBase(record)) === record.checksum;
}

function sameCompatibility(a: CompatibilityKey, b: CompatibilityKey): boolean {
  return a.gameVersion === b.gameVersion
    && a.deterministicVersion === b.deterministicVersion
    && a.configHash === b.configHash
    && a.contentHash === b.contentHash;
}

export function createAntRecoveryCheckpoint(
  runtime: AntColonyRuntime,
  options: {
    streamId: string;
    id: string;
    commandSeq: number;
    createdAtMs: number;
    compatibility: CompatibilityKey;
  },
): AntRecoveryCheckpoint {
  const envelope = createAntSnapshot(runtime);
  const base = {
    schemaVersion: 1 as const,
    id: options.id,
    streamId: options.streamId,
    runId: runtime.state.runId,
    eventSeq: runtime.getNextEventSequence() - 1,
    commandSeq: options.commandSeq,
    createdAtMs: options.createdAtMs,
    compatibility: structuredClone(options.compatibility),
    envelope,
  };
  return { ...base, checksum: checksum(base) };
}

export function recoverAntFromEvidence(input: {
  snapshots: ReadonlyArray<AntRecoveryCheckpoint>;
  commands: ReadonlyArray<AntRuntimeCommand>;
  compatibility: CompatibilityKey;
  expectedChecksum?: string;
  lease?: {
    store: RunLeaseStore;
    channelId: string;
    newOwnerId: string;
    ttlMs: number;
    nowMs: number;
  };
}): AntRecoveryResult {
  const rejected: string[] = [];
  let lease: RunLease | undefined;

  if (input.lease) {
    input.lease.store.fence(input.lease.channelId, 'verified-recovery');
    const acquired = input.lease.store.acquire(
      input.lease.channelId,
      input.lease.newOwnerId,
      input.lease.ttlMs,
      input.lease.nowMs,
    );
    if (acquired.status !== 'acquired') {
      return { status: 'quarantined', reason: 'lease-conflict', rejected };
    }
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

    let runtime: AntColonyRuntime;
    try {
      runtime = restoreAntSnapshot(structuredClone(snapshot.envelope));
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
        return {
          status: 'quarantined',
          reason: 'command-sequence-gap',
          rejected: [...rejected, `${command.id}:expected-${expected}`],
        };
      }
      if (command.kind === 'step') runtime.step();
      else if (command.kind === 'restart') runtime.restart(command.seed);
      else {
        const queued = scheduleAntInfluence(runtime.state, command.command);
        if (queued.status !== 'scheduled' && queued.status !== 'duplicate') {
          return {
            status: 'quarantined',
            reason: 'command-rejected',
            rejected: [...rejected, `${command.id}:${queued.reason}`],
          };
        }
      }
      expected += 1;
      applied += 1;
    }

    if (input.expectedChecksum && checksum(runtime.state) !== input.expectedChecksum) {
      return {
        status: 'quarantined',
        reason: 'replay-divergence',
        rejected: [...rejected, `${snapshot.id}:final-checksum`],
      };
    }

    return {
      status: 'restored',
      runtime,
      snapshotId: snapshot.id,
      appliedCommands: applied,
      rejected,
      ...(lease ? { lease } : {}),
    };
  }

  return { status: 'quarantined', reason: 'no-compatible-snapshot', rejected };
}

export class AntColonyChannelService {
  public runtime: AntColonyRuntime;
  public readonly store: DurableStore;
  public readonly leases: RunLeaseStore;
  public readonly controls: OperatorControlPlane;

  private lease: RunLease | undefined;
  private started = false;
  private nextStoreSeq = 0;
  private commandSeq = 0;
  private readonly decisions = new Map<string, { status: 'applied'; checksum: string }>();
  private dependencies: AntColonyDependencyHealth = {
    gateway: true,
    moderation: true,
    entitlement: true,
    audit: true,
    persistence: true,
    renderer: true,
    capture: true,
  };
  private readonly dedupeCapacity: number;
  private readonly hadDurableHistory: boolean;

  constructor(private readonly options: AntColonyChannelOptions) {
    if (!options.channelId || !options.workerId) throw new RangeError('channel options');
    if (!Number.isInteger(options.leaseTtlMs) || options.leaseTtlMs < 1) throw new RangeError('leaseTtlMs');
    if (!Number.isInteger(options.snapshotEveryCommands) || options.snapshotEveryCommands < 1) {
      throw new RangeError('snapshotEveryCommands');
    }

    this.store = options.store;
    this.leases = options.leases;
    this.controls = new OperatorControlPlane({
      environment: options.environment ?? 'production',
      auditCapacity: 2000,
    });
    this.runtime = AntColonyRuntime.create(options.config, options.seed);
    this.dedupeCapacity = options.commandDedupeCapacity ?? 1000;

    const existing = this.store.events(options.channelId);
    this.hadDurableHistory = existing.length > 0;
    this.nextStoreSeq = existing.length ? existing.at(-1)!.seq + 1 : 0;
    for (const event of existing.filter(item => item.type === 'runtime-command')) {
      const id = String(event.payload.commandId ?? '');
      if (id) this.decisions.set(id, { status: 'applied', checksum: '' });
      this.commandSeq = Math.max(this.commandSeq, Number(event.payload.commandSeq) || 0);
    }
    this.boundDecisions();
  }

  start(nowMs: number): AntColonyChannelStatus {
    if (this.started) return this.status();
    const acquired = this.leases.acquire(
      this.options.channelId,
      this.options.workerId,
      this.options.leaseTtlMs,
      nowMs,
    );
    if (acquired.status !== 'acquired') {
      throw operationalError('LEASE_CONFLICT', 'channel already has an active writer');
    }
    this.lease = acquired.lease;
    this.started = true;

    if (this.hadDurableHistory) {
      const persisted = this.store.compatibleSnapshots(
        this.options.channelId,
        this.options.compatibility,
      ) as AntRecoveryCheckpoint[];
      const synthetic = createAntRecoveryCheckpoint(this.runtime, {
        streamId: this.options.channelId,
        id: 'synthetic-initial',
        commandSeq: 0,
        createdAtMs: 0,
        compatibility: this.options.compatibility,
      });
      const commands = this.commandsFromStore();
      const result = recoverAntFromEvidence({
        snapshots: persisted.length ? persisted : [synthetic],
        commands,
        compatibility: this.options.compatibility,
      });
      if (result.status !== 'restored') {
        this.appendAudit('startup-quarantine', this.options.workerId, nowMs, result.reason);
        this.leases.fence(this.options.channelId, 'startup-recovery-failed');
        this.started = false;
        throw operationalError('RECOVERY_QUARANTINED', `startup recovery failed: ${result.reason}`);
      }
      this.runtime = result.runtime;
      this.commandSeq = commands.reduce((max, item) => Math.max(max, item.seq), 0);
      this.runtime.drainEvents();
      this.appendAudit('startup-recovery', this.options.workerId, nowMs, checksum(this.runtime.state));
      return this.status();
    }

    this.persistSemanticEvents(this.runtime.drainEvents(), nowMs);
    return this.status();
  }

  tick(commandId: string, nowMs: number) {
    return this.applyCommand(commandId, nowMs, { kind: 'step' });
  }

  enqueueInfluence(commandId: string, command: AntInfluenceCommand, nowMs: number) {
    return this.applyCommand(commandId, nowMs, { kind: 'influence', command });
  }

  restart(commandId: string, seed: string, nowMs: number) {
    return this.applyCommand(commandId, nowMs, { kind: 'restart', seed });
  }

  captureSnapshot(nowMs: number): AntRecoveryCheckpoint {
    this.requireStarted();
    const record = createAntRecoveryCheckpoint(this.runtime, {
      streamId: this.options.channelId,
      id: `snapshot-${this.commandSeq}-${nowMs}`,
      commandSeq: this.commandSeq,
      createdAtMs: nowMs,
      compatibility: this.options.compatibility,
    });
    this.store.putSnapshot(record);
    return record;
  }

  recover(input: { nowMs: number; newOwnerId: string; expectedChecksum?: string }): AntRecoveryResult {
    this.requireStarted();
    const snapshots = this.store.compatibleSnapshots(
      this.options.channelId,
      this.options.compatibility,
    ) as AntRecoveryCheckpoint[];
    const commands = this.commandsFromStore();
    const result = recoverAntFromEvidence({
      snapshots,
      commands,
      compatibility: this.options.compatibility,
      expectedChecksum: input.expectedChecksum,
      lease: {
        store: this.leases,
        channelId: this.options.channelId,
        newOwnerId: input.newOwnerId,
        ttlMs: this.options.leaseTtlMs,
        nowMs: input.nowMs,
      },
    });
    if (result.status === 'restored') {
      this.runtime = result.runtime;
      this.lease = result.lease;
      this.commandSeq = commands.reduce((max, item) => Math.max(max, item.seq), 0);
      this.runtime.drainEvents();
      this.appendAudit('verified-recovery', input.newOwnerId, input.nowMs, checksum(this.runtime.state));
    } else {
      this.appendAudit('quarantine', 'system', input.nowMs, result.reason);
    }
    return result;
  }

  setDependencyHealth(next: Partial<AntColonyDependencyHealth>): void {
    this.dependencies = { ...this.dependencies, ...next };
  }

  executeControl(command: ControlCommand, nowMs: number) {
    if (!this.dependencies.audit || !this.dependencies.persistence) {
      throw operationalError('AUDIT_UNAVAILABLE', 'operator control requires durable audit availability');
    }

    this.appendAudit(
      `operator-request-${command.action}`,
      command.actor,
      nowMs,
      checksum({ command, phase: 'requested' }),
    );
    const decision = this.controls.execute(command, nowMs);
    this.appendAudit(
      `operator-${command.action}-${decision.status}`,
      command.actor,
      nowMs,
      checksum({ command, decision }),
    );
    return decision;
  }

  status(): AntColonyChannelStatus {
    const control = this.controls.state();
    const stats = this.store.stats();
    return {
      started: this.started,
      leaseGeneration: this.lease?.generation ?? 0,
      interactionsEnabled: control.interactionsEnabled && this.interactionDependenciesHealthy(),
      simulationEnabled: this.started && control.simulationEnabled,
      publicOutputProtected: control.safeScene || !this.dependencies.renderer || !this.dependencies.capture,
      commandSeq: this.commandSeq,
      commandDedupeEntries: this.decisions.size,
      queuedInfluence: this.runtime.state.influence.scheduled.length,
      dependencies: { ...this.dependencies },
      store: { events: stats.events, snapshots: stats.snapshots, auditEntries: stats.auditEntries },
      lastChecksum: checksum(this.runtime.state),
      runId: this.runtime.state.runId,
      tick: this.runtime.state.tick,
    };
  }

  private applyCommand(
    commandId: string,
    nowMs: number,
    input:
      | { kind: 'step' }
      | { kind: 'restart'; seed: string }
      | { kind: 'influence'; command: AntInfluenceCommand },
  ) {
    this.requireStarted();
    this.assertLease(nowMs);
    if (!commandId) throw new RangeError('commandId');

    const existing = this.decisions.get(commandId);
    if (existing) {
      return { status: 'duplicate' as const, checksum: existing.checksum || checksum(this.runtime.state) };
    }

    let preparedInfluenceState: typeof this.runtime.state | undefined;
    if (input.kind === 'influence') {
      if (!this.controls.state().interactionsEnabled || !this.interactionDependenciesHealthy()) {
        throw operationalError('INTERACTIONS_UNAVAILABLE', 'audience influence is disabled or unavailable');
      }
      preparedInfluenceState = structuredClone(this.runtime.state);
      const queued = scheduleAntInfluence(preparedInfluenceState, input.command);
      if (queued.status === 'duplicate') {
        return { status: 'duplicate' as const, checksum: checksum(this.runtime.state) };
      }
      if (queued.status !== 'scheduled') {
        throw operationalError('COMMAND_REJECTED', queued.reason);
      }
    }

    if (!this.dependencies.persistence) {
      throw operationalError('PERSISTENCE_UNAVAILABLE', 'authoritative command cannot be durably reserved');
    }

    const next = this.commandSeq + 1;
    const payload: Record<string, unknown> = { commandSeq: next, kind: input.kind, commandId };
    if (input.kind === 'restart') payload.seed = input.seed;
    if (input.kind === 'influence') payload.command = input.command;

    this.append('runtime-command', payload, this.runtime.state.tick, nowMs);
    this.commandSeq = next;

    if (input.kind === 'step') this.runtime.step();
    else if (input.kind === 'restart') this.runtime.restart(input.seed);
    else this.runtime.state = preparedInfluenceState!;

    this.persistSemanticEvents(this.runtime.drainEvents(), nowMs);
    const stateChecksum = checksum(this.runtime.state);
    this.decisions.set(commandId, { status: 'applied', checksum: stateChecksum });
    this.boundDecisions();

    if (this.commandSeq % this.options.snapshotEveryCommands === 0) this.captureSnapshot(nowMs);
    if (!this.lease) throw operationalError('LEASE_FENCED', 'missing writer lease');
    const renewed = this.leases.renew(
      this.options.channelId,
      this.lease.token,
      this.options.leaseTtlMs,
      nowMs,
    );
    if (renewed.status !== 'renewed' || !renewed.lease) {
      throw operationalError('LEASE_FENCED', 'writer lease could not be renewed');
    }
    this.lease = renewed.lease;
    return { status: 'applied' as const, checksum: stateChecksum };
  }

  private interactionDependenciesHealthy(): boolean {
    return this.dependencies.gateway
      && this.dependencies.moderation
      && this.dependencies.entitlement
      && this.dependencies.audit
      && this.dependencies.persistence;
  }

  private commandsFromStore(): AntRuntimeCommand[] {
    return this.store.events(this.options.channelId)
      .filter(item => item.type === 'runtime-command')
      .map(item => {
        const base = {
          schemaVersion: 1 as const,
          id: String(item.payload.commandId),
          seq: Number(item.payload.commandSeq),
        };
        if (item.payload.kind === 'restart') {
          return { ...base, kind: 'restart' as const, seed: String(item.payload.seed) };
        }
        if (item.payload.kind === 'influence') {
          return {
            ...base,
            kind: 'influence' as const,
            command: structuredClone(item.payload.command) as AntInfluenceCommand,
          };
        }
        return { ...base, kind: 'step' as const };
      });
  }

  private persistSemanticEvents(events: ReturnType<AntColonyRuntime['drainEvents']>, nowMs: number): void {
    for (const event of events) {
      const payload = { ...(event.data ?? {}), semanticSeq: event.seq };
      if (event.type === 'result') {
        Object.assign(payload, {
          population: this.runtime.state.result?.population ?? this.runtime.state.ants.length,
          foodStore: this.runtime.state.result?.foodStore ?? this.runtime.state.colony.foodStore,
          tunnelsDug: this.runtime.state.result?.tunnelsDug ?? this.runtime.state.colony.tunnelsDug,
          score: this.runtime.state.result?.score ?? 0,
          finalChecksum: this.runtime.state.result?.finalChecksum ?? checksum(this.runtime.state),
        });
      }
      this.append(event.type, payload, event.tick, nowMs);
    }
  }

  private append(
    type: string,
    payload: Record<string, unknown>,
    tick: number,
    createdAtMs: number,
  ): StoredEvent {
    const seq = this.nextStoreSeq;
    const event = createStoredEvent({
      streamId: this.options.channelId,
      runId: this.runtime.state.runId,
      eventId: `${this.options.channelId}:event:${seq}`,
      seq,
      tick,
      type,
      payload,
      createdAtMs,
    });
    this.store.appendEvent(event);
    this.nextStoreSeq += 1;
    return event;
  }

  private appendAudit(action: string, actorRef: string, occurredAtMs: number, payloadDigest: string): void {
    if (!this.dependencies.audit && action.startsWith('operator-')) {
      throw operationalError('AUDIT_UNAVAILABLE', 'operator action cannot be audited');
    }
    const entry: AuditEntry = {
      schemaVersion: 1,
      id: `audit-${checksum({ action, actorRef, occurredAtMs, generation: this.lease?.generation ?? 0 })}`,
      kind: action.startsWith('operator-') ? 'operator' : 'recovery',
      actorRef,
      action,
      targetRef: this.options.channelId,
      occurredAtMs,
      payloadDigest,
    };
    this.store.appendAudit(entry);
  }

  private assertLease(nowMs: number): void {
    if (!this.lease) throw operationalError('LEASE_FENCED', 'missing writer lease');
    this.leases.assertWriter(this.options.channelId, this.lease.token, nowMs);
  }

  private requireStarted(): void {
    if (!this.started) throw operationalError('NOT_STARTED', 'channel service is not started');
  }

  private boundDecisions(): void {
    while (this.decisions.size > this.dedupeCapacity) {
      const first = this.decisions.keys().next().value as string | undefined;
      if (first === undefined) break;
      this.decisions.delete(first);
    }
  }
}
