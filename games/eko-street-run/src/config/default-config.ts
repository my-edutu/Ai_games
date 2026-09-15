import { CONTENT_VERSION, DETERMINISTIC_VERSION, GAME_VERSION, SCHEMA_VERSION, TICK_RATE_HZ } from "./version";

export interface EkoRunConfig {
  readonly seed: string;
  readonly runId: string;
  readonly gameVersion: string;
  readonly schemaVersion: number;
  readonly deterministicVersion: number;
  readonly contentVersion: string;
  readonly tickRateHz: number;
  readonly maxSpeed: number;
  readonly acceleration: number;
  readonly gravity: number;
  readonly maxCommandsPerTick: number;
  readonly maxCommandSources: number;
  readonly quantization: number;
}

export interface EkoRunConfigInput {
  readonly seed: string;
}

function hash32(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function assertSeed(seed: string): void {
  if (typeof seed !== "string" || seed.length < 1 || seed.length > 128) {
    throw new Error("Eko Run seed must contain between 1 and 128 characters");
  }
}

export function createDefaultConfig(input: EkoRunConfigInput): EkoRunConfig {
  assertSeed(input.seed);
  return {
    seed: input.seed,
    runId: `eko-${hash32(`${GAME_VERSION}|${DETERMINISTIC_VERSION}|${CONTENT_VERSION}|${input.seed}`).toString(16).padStart(8, "0")}`,
    gameVersion: GAME_VERSION,
    schemaVersion: SCHEMA_VERSION,
    deterministicVersion: DETERMINISTIC_VERSION,
    contentVersion: CONTENT_VERSION,
    tickRateHz: TICK_RATE_HZ,
    maxSpeed: 6,
    acceleration: 24,
    gravity: 30,
    maxCommandsPerTick: 32,
    maxCommandSources: 8,
    quantization: 1e-6,
  };
}
