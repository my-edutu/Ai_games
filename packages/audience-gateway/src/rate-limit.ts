export interface RateLimitOptions {
  windowMs: number;
  viewerLimit: number;
  channelLimit: number;
  globalLimit: number;
}

interface Bucket {
  window: number;
  count: number;
}

export interface RateLimitIdentity {
  viewerRef: string | null;
  channelRef: string;
}

export class FixedWindowRateLimiter {
  private readonly viewerBuckets = new Map<string, Bucket>();
  private readonly channelBuckets = new Map<string, Bucket>();
  private globalBucket: Bucket = { window: -1, count: 0 };

  constructor(private readonly options: RateLimitOptions) {
    for (const [name, value] of Object.entries(options)) {
      if (!Number.isInteger(value) || value < 1) throw new RangeError(name);
    }
  }

  consume(identity: RateLimitIdentity, nowMs: number): boolean {
    if (!Number.isFinite(nowMs)) throw new RangeError('nowMs');
    if (!identity.channelRef) throw new RangeError('channelRef');
    const window = Math.floor(nowMs / this.options.windowMs);
    this.pruneToWindow(window);

    const viewer = identity.viewerRef ? this.bucket(this.viewerBuckets, identity.viewerRef, window) : undefined;
    const channel = this.bucket(this.channelBuckets, identity.channelRef, window);
    const global = this.globalBucket.window === window ? this.globalBucket : { window, count: 0 };

    if (viewer && viewer.count >= this.options.viewerLimit) return false;
    if (channel.count >= this.options.channelLimit) return false;
    if (global.count >= this.options.globalLimit) return false;

    if (viewer) viewer.count++;
    channel.count++;
    global.count++;
    this.globalBucket = global;
    return true;
  }

  prune(nowMs: number): void {
    if (!Number.isFinite(nowMs)) return;
    this.pruneToWindow(Math.floor(nowMs / this.options.windowMs));
  }

  entryCount(): number {
    return this.viewerBuckets.size + this.channelBuckets.size + (this.globalBucket.window >= 0 ? 1 : 0);
  }

  private bucket(map: Map<string, Bucket>, key: string, window: number): Bucket {
    const existing = map.get(key);
    if (existing?.window === window) return existing;
    const next = { window, count: 0 };
    map.set(key, next);
    return next;
  }

  private pruneToWindow(window: number): void {
    for (const [key, bucket] of this.viewerBuckets) if (bucket.window !== window) this.viewerBuckets.delete(key);
    for (const [key, bucket] of this.channelBuckets) if (bucket.window !== window) this.channelBuckets.delete(key);
    // Pruning must not create rate-limit state. A global bucket becomes active only
    // after a successfully admitted input increments it in consume().
    if (this.globalBucket.window !== window) this.globalBucket = { window: -1, count: 0 };
  }
}