export interface StoredDecision<T> {
  decision: T;
  idempotencyKey: string;
  providerEventKey: string;
  recordedAtMs: number;
}

export class BoundedDecisionStore<T> {
  private readonly records = new Map<string, StoredDecision<T>>();
  private readonly byProviderEvent = new Map<string, string>();

  constructor(private readonly capacity: number, private readonly retentionMs: number) {
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100_000) throw new RangeError('decisionCapacity');
    if (!Number.isFinite(retentionMs) || retentionMs < 1) throw new RangeError('retentionMs');
  }

  getByIdempotencyKey(idempotencyKey: string): T | undefined {
    return this.records.get(idempotencyKey)?.decision;
  }

  getByProviderEvent(providerEventKey: string): T | undefined {
    const idempotencyKey = this.byProviderEvent.get(providerEventKey);
    return idempotencyKey ? this.records.get(idempotencyKey)?.decision : undefined;
  }

  find(idempotencyKey: string, providerEventKey: string): T | undefined {
    return this.getByIdempotencyKey(idempotencyKey) ?? this.getByProviderEvent(providerEventKey);
  }

  put(record: StoredDecision<T>): void {
    if (this.records.has(record.idempotencyKey)) return;
    this.records.set(record.idempotencyKey, record);
    this.byProviderEvent.set(record.providerEventKey, record.idempotencyKey);
    this.enforceCapacity();
  }

  prune(nowMs: number): void {
    const cutoff = nowMs - this.retentionMs;
    for (const [key, record] of this.records) {
      if (record.recordedAtMs >= cutoff) continue;
      this.delete(key, record);
    }
    this.enforceCapacity();
  }

  size(): number {
    return this.records.size;
  }

  recent(limit = this.capacity): StoredDecision<T>[] {
    return [...this.records.values()].slice(-Math.max(0, limit));
  }

  private enforceCapacity(): void {
    while (this.records.size > this.capacity) {
      const first = this.records.entries().next().value as [string, StoredDecision<T>] | undefined;
      if (!first) break;
      this.delete(first[0], first[1]);
    }
  }

  private delete(key: string, record: StoredDecision<T>): void {
    this.records.delete(key);
    if (this.byProviderEvent.get(record.providerEventKey) === key) this.byProviderEvent.delete(record.providerEventKey);
  }
}
