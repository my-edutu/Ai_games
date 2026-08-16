import { checksum } from '../../replay/src/index';
import {
  type AuditEntry,
  type CompatibilityKey,
  type RunProjection,
  type SnapshotRecord,
  type StoredEvent,
  StoreError,
  sameCompatibility,
} from '../../ops-contracts/src/index';

export interface DurableStoreOptions {
  eventCapacity?: number;
  snapshotCapacity?: number;
  auditCapacity?: number;
}

export interface AppendResult<T> {
  status: 'appended' | 'duplicate';
  value: Readonly<T>;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function freezeClone<T extends object>(value: T): Readonly<T> {
  return Object.freeze(clone(value));
}

export function createStoredEvent(input: Omit<StoredEvent, 'schemaVersion' | 'checksum'>): StoredEvent {
  const base = { schemaVersion: 1 as const, ...clone(input) };
  return { ...base, checksum: checksum(base) };
}

function verifyEvent(event: StoredEvent): string {
  const { checksum: supplied, ...base } = event;
  return checksum(base) === supplied ? supplied : '';
}

export function rebuildRunProjection(gameId: string, runId: string, events: ReadonlyArray<StoredEvent>): RunProjection {
  let status: RunProjection['status'] = 'active';
  let terminalReason: string | null = null;
  let score = 0;
  let length = 0;
  let finalChecksum: string | null = null;

  for (const event of events) {
    if (event.type === 'result') {
      status = 'completed';
      terminalReason = typeof event.payload.reason === 'string' ? event.payload.reason : 'unknown';
      score = Number.isFinite(event.payload.score) ? Number(event.payload.score) : score;
      length = Number.isFinite(event.payload.length) ? Number(event.payload.length) : length;
      finalChecksum = typeof event.payload.finalChecksum === 'string' ? event.payload.finalChecksum : finalChecksum;
    } else if (event.type === 'technical-abort') {
      status = 'technical';
      terminalReason = typeof event.payload.reason === 'string' ? event.payload.reason : 'technical-abort';
    } else if (event.type === 'quarantined') {
      status = 'quarantined';
      terminalReason = typeof event.payload.reason === 'string' ? event.payload.reason : 'quarantined';
    }
  }

  return {
    schemaVersion: 1,
    gameId,
    runId,
    status,
    terminalReason,
    score,
    length,
    finalChecksum,
    recordEligible: status === 'completed',
    eventCount: events.length,
    lastSeq: events.length ? events[events.length - 1]!.seq : -1,
  };
}

export class InMemoryDurableStore {
  private readonly eventCapacity: number;
  private readonly snapshotCapacity: number;
  private readonly auditCapacity: number;
  private readonly eventStreams = new Map<string, StoredEvent[]>();
  private readonly eventsById = new Map<string, StoredEvent>();
  private readonly snapshotStreams = new Map<string, SnapshotRecord[]>();
  private readonly auditEntries: AuditEntry[] = [];
  private readonly auditsById = new Map<string, AuditEntry>();

  constructor(options: DurableStoreOptions = {}) {
    this.eventCapacity = options.eventCapacity ?? 100_000;
    this.snapshotCapacity = options.snapshotCapacity ?? 8;
    this.auditCapacity = options.auditCapacity ?? 10_000;
    for (const [name, value] of Object.entries({ eventCapacity: this.eventCapacity, snapshotCapacity: this.snapshotCapacity, auditCapacity: this.auditCapacity })) {
      if (!Number.isInteger(value) || value < 1) throw new RangeError(name);
    }
  }

  appendEvent(event: StoredEvent): AppendResult<StoredEvent> {
    const existing = this.eventsById.get(event.eventId);
    if (existing) {
      if (checksum(existing) !== checksum(event) || !verifyEvent(event)) {
        throw new StoreError('EVENT_CONFLICT', `event ${event.eventId} conflicts with stored evidence`);
      }
      return { status: 'duplicate', value: freezeClone(existing) };
    }
    if (!verifyEvent(event)) throw new StoreError('EVENT_CONFLICT', `event ${event.eventId} checksum is invalid`);

    const stream = this.eventStreams.get(event.streamId) ?? [];
    const expected = stream.length ? stream[stream.length - 1]!.seq + 1 : 0;
    if (event.seq !== expected) throw new StoreError('SEQUENCE_GAP', `expected sequence ${expected}, received ${event.seq}`);
    if (stream.length >= this.eventCapacity) throw new StoreError('CAPACITY_EXCEEDED', `stream ${event.streamId} reached its bounded segment capacity`);

    const stored = clone(event);
    stream.push(stored);
    this.eventStreams.set(event.streamId, stream);
    this.eventsById.set(event.eventId, stored);
    return { status: 'appended', value: freezeClone(stored) };
  }

  events(streamId: string): StoredEvent[] {
    return clone(this.eventStreams.get(streamId) ?? []);
  }

  putSnapshot(record: SnapshotRecord): Readonly<SnapshotRecord> {
    const stream = this.snapshotStreams.get(record.streamId) ?? [];
    const existingIndex = stream.findIndex(item => item.id === record.id);
    if (existingIndex >= 0) stream.splice(existingIndex, 1);
    stream.push(clone(record));
    stream.sort((a, b) => b.createdAtMs - a.createdAtMs || b.commandSeq - a.commandSeq || a.id.localeCompare(b.id));
    while (stream.length > this.snapshotCapacity) stream.pop();
    this.snapshotStreams.set(record.streamId, stream);
    return freezeClone(record);
  }

  snapshots(streamId: string): SnapshotRecord[] {
    return clone(this.snapshotStreams.get(streamId) ?? []);
  }

  compatibleSnapshots(streamId: string, compatibility: CompatibilityKey): SnapshotRecord[] {
    return this.snapshots(streamId).filter(item => sameCompatibility(item.compatibility, compatibility));
  }

  appendAudit(entry: AuditEntry): AppendResult<AuditEntry> {
    const existing = this.auditsById.get(entry.id);
    if (existing) {
      if (checksum(existing) !== checksum(entry)) throw new StoreError('AUDIT_CONFLICT', `audit ${entry.id} conflicts with stored evidence`);
      return { status: 'duplicate', value: freezeClone(existing) };
    }
    const stored = clone(entry);
    this.auditEntries.push(stored);
    this.auditsById.set(stored.id, stored);
    while (this.auditEntries.length > this.auditCapacity) {
      const removed = this.auditEntries.shift();
      if (removed) this.auditsById.delete(removed.id);
    }
    return { status: 'appended', value: freezeClone(stored) };
  }

  audits(): AuditEntry[] {
    return clone(this.auditEntries);
  }

  stats(): { streams: number; events: number; snapshots: number; auditEntries: number } {
    let events = 0;
    let snapshots = 0;
    for (const stream of this.eventStreams.values()) events += stream.length;
    for (const stream of this.snapshotStreams.values()) snapshots += stream.length;
    return { streams: this.eventStreams.size, events, snapshots, auditEntries: this.auditEntries.length };
  }
}

export * from '../../ops-contracts/src/index';
export * from './file-store';
