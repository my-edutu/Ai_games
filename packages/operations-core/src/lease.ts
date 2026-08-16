import { checksum } from '../../replay/src/index';

export interface RunLease {
  channelId: string;
  ownerId: string;
  generation: number;
  token: string;
  expiresAtMs: number;
  status: 'active' | 'fenced' | 'released';
}

export type AcquireResult =
  | ({ status: 'acquired' } & RunLease)
  | { status: 'conflict'; current: RunLease };

export class RunLeaseStore {
  private readonly leases = new Map<string, RunLease>();
  private readonly generations = new Map<string, number>();

  acquire(channelId: string, ownerId: string, ttlMs: number, nowMs: number): AcquireResult {
    this.validate(channelId, ownerId, ttlMs, nowMs);
    const current = this.leases.get(channelId);
    if (current && current.status === 'active' && current.expiresAtMs > nowMs) {
      return { status: 'conflict', current: structuredClone(current) };
    }
    if (current) current.status = 'fenced';
    const generation = (this.generations.get(channelId) ?? 0) + 1;
    this.generations.set(channelId, generation);
    const token = `lease_${checksum({ channelId, ownerId, generation, acquiredAtMs: nowMs }).slice(0, 24)}`;
    const lease: RunLease = { channelId, ownerId, generation, token, expiresAtMs: nowMs + ttlMs, status: 'active' };
    this.leases.set(channelId, lease);
    return { status: 'acquired', ...structuredClone(lease) };
  }

  renew(channelId: string, token: string, ttlMs: number, nowMs: number): { status: 'renewed' | 'fenced'; lease?: RunLease } {
    if (!Number.isInteger(ttlMs) || ttlMs < 1 || !Number.isFinite(nowMs)) throw new RangeError('lease timing');
    const current = this.leases.get(channelId);
    if (!current || current.token !== token || current.status !== 'active' || current.expiresAtMs <= nowMs) return { status: 'fenced' };
    current.expiresAtMs = nowMs + ttlMs;
    return { status: 'renewed', lease: structuredClone(current) };
  }

  release(channelId: string, token: string): { status: 'released' | 'fenced' } {
    const current = this.leases.get(channelId);
    if (!current || current.token !== token || current.status !== 'active') return { status: 'fenced' };
    current.status = 'released';
    return { status: 'released' };
  }

  fence(channelId: string, reason = 'recovery'): RunLease | undefined {
    const current = this.leases.get(channelId);
    if (!current) return undefined;
    current.status = 'fenced';
    current.expiresAtMs = 0;
    void reason;
    return structuredClone(current);
  }

  assertWriter(channelId: string, token: string, nowMs: number): RunLease {
    const current = this.leases.get(channelId);
    if (!current || current.token !== token || current.status !== 'active' || current.expiresAtMs <= nowMs) {
      const error = new Error('writer lease is fenced');
      Object.assign(error, { code: 'LEASE_FENCED' });
      throw error;
    }
    return structuredClone(current);
  }

  current(channelId: string): RunLease | undefined {
    const current = this.leases.get(channelId);
    return current ? structuredClone(current) : undefined;
  }

  private validate(channelId: string, ownerId: string, ttlMs: number, nowMs: number): void {
    if (!channelId || !ownerId) throw new RangeError('lease identity');
    if (!Number.isInteger(ttlMs) || ttlMs < 1) throw new RangeError('ttlMs');
    if (!Number.isFinite(nowMs)) throw new RangeError('nowMs');
  }
}
