import { fnv1aHex, stableStringify } from '../rules/checksum';
import type { BattleSnapshotEnvelope } from './snapshot';

export interface BattleReplayEntry {
  id: string;
  tick: number;
  kind: 'audience-input' | 'operator-command' | 'runtime-event';
  digest: string;
}

export interface BattleReplaySnapshot {
  schemaVersion: 1;
  entries: BattleReplayEntry[];
}

export interface BattleReplayManifest {
  schemaVersion: 1;
  gameId: 'ai-battle-royale';
  deterministicVersion: string;
  stateChecksum: string;
  envelopeChecksum: string;
  entries: BattleReplayEntry[];
  manifestChecksum: string;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class BattleReplayJournal {
  private readonly maxEntries: number;
  private readonly entries: BattleReplayEntry[] = [];
  private readonly ids = new Set<string>();

  public constructor(maxEntries = 32) {
    if (!Number.isInteger(maxEntries) || maxEntries < 1 || maxEntries > 4_096) throw new RangeError('maxEntries');
    this.maxEntries = maxEntries;
  }

  public record(entry: BattleReplayEntry): { status: 'recorded' } | { status: 'duplicate'; reason: 'duplicate-id' } {
    if (!entry.id?.trim() || entry.id.length > 128) throw new RangeError('entry.id');
    if (!Number.isInteger(entry.tick) || entry.tick < 0) throw new RangeError('entry.tick');
    if (!['audience-input', 'operator-command', 'runtime-event'].includes(entry.kind)) throw new RangeError('entry.kind');
    if (!entry.digest?.trim() || entry.digest.length > 128) throw new RangeError('entry.digest');
    if (this.ids.has(entry.id)) return { status: 'duplicate', reason: 'duplicate-id' };

    const owned = clone(entry);
    this.entries.push(owned);
    this.ids.add(owned.id);
    while (this.entries.length > this.maxEntries) {
      const removed = this.entries.shift();
      if (removed) this.ids.delete(removed.id);
    }
    return { status: 'recorded' };
  }

  public snapshot(): BattleReplaySnapshot {
    return clone({ schemaVersion: 1, entries: this.entries });
  }

  public manifest(envelope: BattleSnapshotEnvelope): BattleReplayManifest {
    const base = {
      schemaVersion: 1 as const,
      gameId: 'ai-battle-royale' as const,
      deterministicVersion: envelope.deterministicVersion,
      stateChecksum: envelope.stateChecksum,
      envelopeChecksum: envelope.envelopeChecksum,
      entries: clone(this.entries),
    };
    return clone({ ...base, manifestChecksum: fnv1aHex(stableStringify(base)) });
  }
}
