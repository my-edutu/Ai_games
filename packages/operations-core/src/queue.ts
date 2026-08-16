export class BoundedQueue<T> {
  private readonly items: T[] = [];
  constructor(public readonly capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1) throw new RangeError('capacity');
  }
  push(value: T): 'accepted' | 'overflow' {
    if (this.items.length >= this.capacity) return 'overflow';
    this.items.push(value);
    return 'accepted';
  }
  shift(): T | undefined { return this.items.shift(); }
  peek(): T | undefined { return this.items[0]; }
  size(): number { return this.items.length; }
  drain(limit = this.capacity): T[] {
    if (!Number.isInteger(limit) || limit < 0) throw new RangeError('limit');
    return this.items.splice(0, Math.min(limit, this.items.length));
  }
  snapshot(): T[] { return structuredClone(this.items); }
}
