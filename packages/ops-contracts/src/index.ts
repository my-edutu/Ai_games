export interface CompatibilityKey {
  gameVersion: string;
  deterministicVersion: string;
  configHash: string;
  contentHash: string;
}

export interface StoredEvent {
  schemaVersion: 1;
  streamId: string;
  runId: string;
  eventId: string;
  seq: number;
  tick: number;
  type: string;
  payload: Record<string, unknown>;
  createdAtMs: number;
  checksum: string;
}

export interface SnapshotRecord {
  schemaVersion: 1;
  id: string;
  streamId: string;
  runId: string;
  eventSeq: number;
  commandSeq: number;
  createdAtMs: number;
  compatibility: CompatibilityKey;
  envelope: unknown;
  checksum: string;
}

export type RunProjectionStatus = 'active' | 'completed' | 'technical' | 'quarantined';

export interface RunProjection {
  schemaVersion: 1;
  gameId: string;
  runId: string;
  status: RunProjectionStatus;
  terminalReason: string | null;
  score: number;
  length: number;
  finalChecksum: string | null;
  recordEligible: boolean;
  eventCount: number;
  lastSeq: number;
}

export interface AuditEntry {
  schemaVersion: 1;
  id: string;
  kind: 'operator' | 'audience' | 'recovery' | 'system';
  actorRef: string;
  action: string;
  targetRef: string;
  occurredAtMs: number;
  payloadDigest: string;
}

export class StoreError extends Error {
  constructor(
    public readonly code:
      | 'SEQUENCE_GAP'
      | 'EVENT_CONFLICT'
      | 'AUDIT_CONFLICT'
      | 'CAPACITY_EXCEEDED',
    message: string,
  ) {
    super(message);
    this.name = 'StoreError';
  }
}

export function sameCompatibility(a: CompatibilityKey, b: CompatibilityKey): boolean {
  return a.gameVersion === b.gameVersion
    && a.deterministicVersion === b.deterministicVersion
    && a.configHash === b.configHash
    && a.contentHash === b.contentHash;
}
