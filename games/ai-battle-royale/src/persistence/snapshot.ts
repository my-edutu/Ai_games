import { fnv1aHex, stableStringify } from '../rules/checksum';
import { BattleRoyaleRuntime } from '../runtime/runtime';
import type { BattleRuntimeSnapshot } from '../state/types';

const SUPPORTED_DETERMINISTIC_VERSION = 'battle-r2-v1';

export interface BattleSnapshotEnvelope {
  schemaVersion: 1;
  gameId: 'ai-battle-royale';
  deterministicVersion: string;
  stateChecksum: string;
  runtimeSnapshot: BattleRuntimeSnapshot;
  envelopeChecksum: string;
}

export type BattleSnapshotRestoreResult =
  | { status: 'restored'; runtime: BattleRoyaleRuntime }
  | { status: 'quarantined'; reason: 'schema' | 'game-id' | 'snapshot-version' | 'envelope-checksum' | 'state-checksum' | 'runtime-restore' };

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checksumPayload(envelope: Omit<BattleSnapshotEnvelope, 'envelopeChecksum'>): string {
  return fnv1aHex(stableStringify(envelope));
}

export function createBattleSnapshotEnvelope(runtime: BattleRoyaleRuntime): BattleSnapshotEnvelope {
  const runtimeSnapshot = runtime.snapshot();
  const base: Omit<BattleSnapshotEnvelope, 'envelopeChecksum'> = {
    schemaVersion: 1,
    gameId: 'ai-battle-royale',
    deterministicVersion: runtimeSnapshot.deterministicVersion,
    stateChecksum: runtimeSnapshot.stateChecksum,
    runtimeSnapshot,
  };
  return clone({ ...base, envelopeChecksum: checksumPayload(base) });
}

export function restoreBattleSnapshotEnvelope(envelope: BattleSnapshotEnvelope): BattleSnapshotRestoreResult {
  if (!envelope || envelope.schemaVersion !== 1) return { status: 'quarantined', reason: 'schema' };
  if (envelope.gameId !== 'ai-battle-royale') return { status: 'quarantined', reason: 'game-id' };
  if (
    envelope.deterministicVersion !== SUPPORTED_DETERMINISTIC_VERSION
    || envelope.runtimeSnapshot?.deterministicVersion !== envelope.deterministicVersion
    || envelope.runtimeSnapshot?.state?.deterministicVersion !== envelope.deterministicVersion
  ) return { status: 'quarantined', reason: 'snapshot-version' };

  const { envelopeChecksum, ...base } = envelope;
  if (!/^[a-f0-9]{8}$/.test(envelopeChecksum) || checksumPayload(base) !== envelopeChecksum) {
    return { status: 'quarantined', reason: 'envelope-checksum' };
  }
  if (envelope.stateChecksum !== envelope.runtimeSnapshot.stateChecksum) {
    return { status: 'quarantined', reason: 'state-checksum' };
  }

  try {
    return { status: 'restored', runtime: BattleRoyaleRuntime.restore(clone(envelope.runtimeSnapshot)) };
  } catch {
    return { status: 'quarantined', reason: 'runtime-restore' };
  }
}
