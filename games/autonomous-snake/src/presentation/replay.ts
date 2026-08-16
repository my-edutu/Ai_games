export interface ReplayFrame {
  tick: number;
  scene: string;
  checksum: string;
  [key: string]: unknown;
}

function cloneFrame<T extends ReplayFrame>(frame: T): T {
  return JSON.parse(JSON.stringify(frame)) as T;
}

export class ReplayBuffer {
  private frames: ReplayFrame[] = [];

  constructor(private readonly capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 10000) throw new RangeError('capacity');
  }

  push(frame: ReplayFrame): void {
    const copy = cloneFrame(frame);
    const previous = this.frames.at(-1);
    if (previous && copy.tick < previous.tick) throw new RangeError('replay tick order');
    this.frames.push(copy);
    if (this.frames.length > this.capacity) this.frames.splice(0, this.frames.length - this.capacity);
  }

  size(): number {
    return this.frames.length;
  }

  windowAround(tick: number, count: number): ReplayFrame[] {
    if (!Number.isInteger(count) || count < 1) throw new RangeError('count');
    return this.frames
      .filter(frame => frame.tick <= tick)
      .slice(-count)
      .map(frame => cloneFrame(frame));
  }

  latest(): ReplayFrame | undefined {
    const frame = this.frames.at(-1);
    return frame ? cloneFrame(frame) : undefined;
  }

  clear(): void {
    this.frames = [];
  }
}
