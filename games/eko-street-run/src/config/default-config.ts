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
  /** @deprecated Phase 1 compatibility alias for groundAcceleration. */
  readonly acceleration: number;
  readonly groundAcceleration: number;
  readonly groundDeceleration: number;
  readonly airAcceleration: number;
  readonly gravity: number;
  readonly jumpSpeed: number;
  readonly maxFallSpeed: number;
  readonly coyoteTicks: number;
  readonly jumpBufferTicks: number;
  readonly jumpReleaseVelocityFactor: number;
  readonly landingCompressionTicks: number;
  readonly slideDurationTicks: number;
  readonly stumbleFallSpeed: number;
  readonly stumbleDurationTicks: number;
  readonly playerHalfWidth: number;
  readonly playerStandingHeight: number;
  readonly playerSlideHeight: number;
  readonly maxStepHeight: number;
  readonly maxVaultHeight: number;
  readonly vaultReach: number;
  readonly vaultDurationTicks: number;
  readonly vaultArcHeight: number;
  readonly collisionSkin: number;
  readonly killPlaneY: number;
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
  const groundAcceleration = 48;
  return {
    seed: input.seed,
    runId: `eko-${hash32(`${GAME_VERSION}|${DETERMINISTIC_VERSION}|${CONTENT_VERSION}|${input.seed}`).toString(16).padStart(8, "0")}`,
    gameVersion: GAME_VERSION,
    schemaVersion: SCHEMA_VERSION,
    deterministicVersion: DETERMINISTIC_VERSION,
    contentVersion: CONTENT_VERSION,
    tickRateHz: TICK_RATE_HZ,
    maxSpeed: 7,
    acceleration: groundAcceleration,
    groundAcceleration,
    groundDeceleration: 72,
    airAcceleration: 18,
    gravity: 32,
    jumpSpeed: 11.5,
    maxFallSpeed: 22,
    coyoteTicks: 6,
    jumpBufferTicks: 7,
    jumpReleaseVelocityFactor: 0.45,
    landingCompressionTicks: 5,
    slideDurationTicks: 24,
    stumbleFallSpeed: 12,
    stumbleDurationTicks: 18,
    playerHalfWidth: 0.35,
    playerStandingHeight: 1.8,
    playerSlideHeight: 0.9,
    maxStepHeight: 0.45,
    maxVaultHeight: 0.9,
    vaultReach: 0.8,
    vaultDurationTicks: 16,
    vaultArcHeight: 0.65,
    collisionSkin: 0.001,
    killPlaneY: -6,
    maxCommandsPerTick: 32,
    maxCommandSources: 8,
    quantization: 1e-6,
  };
}
