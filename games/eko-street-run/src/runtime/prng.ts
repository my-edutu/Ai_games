import type { AuthoritativeRandomSnapshot, AuthoritativeRandomStreamName, RandomStreamName } from "../state/types";

const ALL_STREAMS: readonly RandomStreamName[] = ["route", "traffic", "ai", "reward", "audience", "cosmetic"];
const AUTH_STREAMS: readonly AuthoritativeRandomStreamName[] = ["route", "traffic", "ai", "reward", "audience"];

type AllStreamState = Record<RandomStreamName, number>;

function seedHash(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash === 0 ? 0x9e3779b9 : hash >>> 0;
}

function nextState(current: number): number {
  let value = current >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  value >>>= 0;
  return value === 0 ? 0x6d2b79f5 : value;
}

export class EkoRandomStreams {
  private readonly states: AllStreamState;

  constructor(rootSeed: string, snapshot?: Partial<AllStreamState>) {
    const derived = {} as AllStreamState;
    for (const stream of ALL_STREAMS) {
      const restored = snapshot?.[stream];
      derived[stream] = restored === undefined ? seedHash(`${rootSeed}|${stream}`) : restored >>> 0;
    }
    this.states = derived;
  }

  nextInt(stream: RandomStreamName, maxExclusive: number): number {
    if (!ALL_STREAMS.includes(stream)) throw new Error(`Unsupported Eko random stream: ${String(stream)}`);
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) throw new Error("maxExclusive must be a positive integer");
    const next = nextState(this.states[stream]);
    this.states[stream] = next;
    return next % maxExclusive;
  }

  snapshotAuthoritative(): AuthoritativeRandomSnapshot {
    const snapshot = {} as AuthoritativeRandomSnapshot;
    for (const stream of AUTH_STREAMS) snapshot[stream] = this.states[stream] >>> 0;
    return snapshot;
  }

  snapshotAll(): AllStreamState {
    return { ...this.states };
  }
}

export function createRandomStreams(rootSeed: string): EkoRandomStreams {
  return new EkoRandomStreams(rootSeed);
}
