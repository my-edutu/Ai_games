export interface CueInput {
  id: string;
  kind: string;
  priority: number;
  tick: number;
  durationTicks?: number;
}

export interface ActiveCue extends CueInput {
  durationTicks: number;
  expiresAtTick: number;
  motionScale: number;
  flashScale: number;
}

export interface CueSchedulerOptions {
  maxActive: number;
  reducedMotion?: boolean;
  reducedFlash?: boolean;
}

export class CueScheduler {
  private items = new Map<string, ActiveCue>();

  constructor(private readonly options: CueSchedulerOptions) {
    if (!Number.isInteger(options.maxActive) || options.maxActive < 1 || options.maxActive > 256) {
      throw new RangeError('maxActive');
    }
  }

  push(cue: CueInput): boolean {
    this.expire(cue.tick);
    if (this.items.has(cue.id)) return false;
    const durationTicks = Math.max(1, Math.min(600, cue.durationTicks ?? 12));
    const active: ActiveCue = {
      ...cue,
      priority: Math.max(0, Math.min(1000, Math.round(cue.priority))),
      durationTicks,
      expiresAtTick: cue.tick + durationTicks,
      motionScale: this.options.reducedMotion ? 0.35 : 1,
      flashScale: this.options.reducedFlash ? 0.25 : 1,
    };
    this.items.set(active.id, active);
    this.trim();
    return this.items.has(active.id);
  }

  active(tick = Number.MAX_SAFE_INTEGER): ActiveCue[] {
    this.expire(tick);
    return [...this.items.values()]
      .sort((a, b) => b.priority - a.priority || a.tick - b.tick || a.id.localeCompare(b.id))
      .map(cue => ({ ...cue }));
  }

  clear(): void {
    this.items.clear();
  }

  size(tick: number): number {
    return this.active(tick).length;
  }

  private expire(tick: number): void {
    for (const [id, cue] of this.items) {
      if (cue.expiresAtTick <= tick) this.items.delete(id);
    }
  }

  private trim(): void {
    const ranked = [...this.items.values()].sort(
      (a, b) => b.priority - a.priority || a.tick - b.tick || a.id.localeCompare(b.id),
    );
    this.items = new Map(ranked.slice(0, this.options.maxActive).map(cue => [cue.id, cue]));
  }
}
