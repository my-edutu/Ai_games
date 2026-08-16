export interface CircuitBreakerOptions { failureThreshold: number; cooldownMs: number; }
export type BreakerState = 'closed' | 'open' | 'half-open';

export class CircuitBreaker {
  private failures = 0;
  private openedAtMs: number | null = null;
  private current: BreakerState = 'closed';

  constructor(private readonly options: CircuitBreakerOptions) {
    if (!Number.isInteger(options.failureThreshold) || options.failureThreshold < 1) throw new RangeError('failureThreshold');
    if (!Number.isInteger(options.cooldownMs) || options.cooldownMs < 1) throw new RangeError('cooldownMs');
  }

  allow(nowMs: number): boolean {
    if (!Number.isFinite(nowMs)) throw new RangeError('nowMs');
    if (this.current === 'closed') return true;
    if (this.current === 'open' && this.openedAtMs !== null && nowMs - this.openedAtMs >= this.options.cooldownMs) {
      this.current = 'half-open';
      return true;
    }
    return this.current === 'half-open';
  }

  failure(nowMs: number): void {
    if (!Number.isFinite(nowMs)) throw new RangeError('nowMs');
    this.failures++;
    if (this.current === 'half-open' || this.failures >= this.options.failureThreshold) {
      this.current = 'open';
      this.openedAtMs = nowMs;
    }
  }

  success(): void {
    this.failures = 0;
    this.openedAtMs = null;
    this.current = 'closed';
  }

  state(): BreakerState { return this.current; }
  failureCount(): number { return this.failures; }
}
