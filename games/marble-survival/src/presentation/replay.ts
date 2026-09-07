import type { MarblePresentationEvent, MarblePublicSnapshot } from './camera';

export interface MarbleReplayFrame {
  snapshot: MarblePublicSnapshot;
  events: MarblePresentationEvent[];
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class MarbleReplayBuffer {
  private readonly capacity: number;
  private readonly buffer: MarbleReplayFrame[] = [];

  constructor(capacity = 180) {
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 3_600) throw new RangeError('capacity');
    this.capacity = capacity;
  }

  push(snapshot: MarblePublicSnapshot, events: readonly MarblePresentationEvent[] = []): void {
    this.buffer.push({ snapshot: cloneJson(snapshot), events: cloneJson([...events]) });
    while (this.buffer.length > this.capacity) this.buffer.shift();
  }

  frames(): MarbleReplayFrame[] {
    return cloneJson(this.buffer);
  }

  clear(): void {
    this.buffer.length = 0;
  }

  size(): number {
    return this.buffer.length;
  }
}
