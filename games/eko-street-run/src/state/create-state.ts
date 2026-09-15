import { PLAYER_HALF_WIDTH, type EkoRunConfig } from "../config/default-config";
import { createFoundationRoute } from "../rules/route";
import { createRandomStreams } from "../runtime/prng";
import type { EkoRunState, MovementState, PlayerState, RouteState } from "./types";

export class InvariantError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "InvariantError";
    this.code = code;
  }
}

const MOVEMENT_STATES = new Set<MovementState>([
  "grounded",
  "rising",
  "falling",
  "sliding",
  "vaulting",
  "stumbling",
  "dead",
  "airborne",
]);

function createInitialPlayer(route: RouteState): PlayerState {
  return {
    position: { x: route.startX, y: route.groundY },
    velocity: { x: 0, y: 0 },
    movementState: "grounded",
    facing: 1,
    coyoteTicksRemaining: 0,
    jumpBufferTicksRemaining: 0,
    jumpCutConsumed: false,
    landingCompressionTicksRemaining: 0,
    slideTicksRemaining: 0,
    stumbleTicksRemaining: 0,
    vault: null,
    checkpointIndex: 0,
    progress: 0,
  };
}

export function createInitialState(config: EkoRunConfig): EkoRunState {
  const route = createFoundationRoute();
  route.killPlaneY = config.killPlaneY;
  const streams = createRandomStreams(config.seed);
  const state: EkoRunState = {
    schemaVersion: config.schemaVersion,
    gameVersion: config.gameVersion,
    deterministicVersion: config.deterministicVersion,
    contentVersion: config.contentVersion,
    runId: config.runId,
    rootSeed: config.seed,
    tick: 0,
    nextEventSequence: 0,
    lifecycle: "running",
    player: createInitialPlayer(route),
    route,
    resources: { ekoTokens: 0 },
    commandWatermarks: {},
    randomStreams: streams.snapshotAuthoritative(),
    record: { maxProgress: 0, completedTick: null },
  };
  assertStateInvariants(state, config.maxCommandSources, config.playerHalfWidth);
  return state;
}

export function cloneState(state: EkoRunState): EkoRunState {
  return JSON.parse(JSON.stringify(state)) as EkoRunState;
}

function assertFiniteTree(state: EkoRunState): void {
  JSON.stringify(state, (_key, value) => {
    if (typeof value === "number" && !Number.isFinite(value)) throw new InvariantError("NON_FINITE_STATE", "authoritative state contains non-finite number");
    return value;
  });
}

function assertTimer(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0 || value > 10_000) throw new InvariantError("INVALID_TIMER", `${name} must be a bounded non-negative integer`);
}

function assertRoute(route: RouteState): void {
  if (!(route.minX < route.maxX) || route.startX < route.minX || route.startX > route.maxX || route.finishX > route.maxX) {
    throw new InvariantError("INVALID_ROUTE_BOUNDS", "route bounds are invalid");
  }
  if (route.killPlaneY >= route.groundY) throw new InvariantError("INVALID_KILL_PLANE", "kill plane must remain below baseline ground");
  const ids = new Set<string>();
  const addId = (id: string): void => {
    if (!id || ids.has(id)) throw new InvariantError("DUPLICATE_ROUTE_ID", "route geometry IDs must be non-empty and unique");
    ids.add(id);
  };
  for (const segment of route.groundSegments) {
    addId(segment.id);
    if (segment.minX > segment.maxX) throw new InvariantError("INVALID_GROUND_SEGMENT", "ground segment bounds are invalid");
  }
  for (const slope of route.slopes) {
    addId(slope.id);
    if (!(slope.minX < slope.maxX)) throw new InvariantError("INVALID_SLOPE", "slope bounds are invalid");
  }
  for (const collider of route.colliders) {
    addId(collider.id);
    if (!(collider.minX < collider.maxX) || !(collider.minY < collider.maxY)) throw new InvariantError("INVALID_COLLIDER", "collider bounds are invalid");
    if (collider.motion && (!Number.isInteger(collider.motion.periodTicks) || collider.motion.periodTicks < 2 || collider.motion.minOffsetX > collider.motion.maxOffsetX)) {
      throw new InvariantError("INVALID_COLLIDER_MOTION", "moving collider motion contract is invalid");
    }
  }
}

export function assertStateInvariants(state: EkoRunState, maxCommandSources = 8, playerHalfWidth = PLAYER_HALF_WIDTH): void {
  assertFiniteTree(state);
  assertRoute(state.route);
  if (!Number.isInteger(state.tick) || state.tick < 0) throw new InvariantError("INVALID_TICK", "tick must be a non-negative integer");
  if (!Number.isInteger(state.nextEventSequence) || state.nextEventSequence < 0) throw new InvariantError("INVALID_EVENT_SEQUENCE", "event sequence is invalid");
  if (!MOVEMENT_STATES.has(state.player.movementState)) throw new InvariantError("INVALID_MOVEMENT_STATE", "movement state is invalid");
  if (state.player.facing !== -1 && state.player.facing !== 1) throw new InvariantError("INVALID_FACING", "player facing must be -1 or 1");
  assertTimer(state.player.coyoteTicksRemaining, "coyoteTicksRemaining");
  assertTimer(state.player.jumpBufferTicksRemaining, "jumpBufferTicksRemaining");
  assertTimer(state.player.landingCompressionTicksRemaining, "landingCompressionTicksRemaining");
  assertTimer(state.player.slideTicksRemaining, "slideTicksRemaining");
  assertTimer(state.player.stumbleTicksRemaining, "stumbleTicksRemaining");
  if (state.player.vault) {
    assertTimer(state.player.vault.ticksRemaining, "vault.ticksRemaining");
    assertTimer(state.player.vault.totalTicks, "vault.totalTicks");
    if (state.player.vault.totalTicks < 1 || state.player.vault.ticksRemaining > state.player.vault.totalTicks) {
      throw new InvariantError("INVALID_VAULT", "vault timing is inconsistent");
    }
  }
  if (state.player.position.x < state.route.minX - 1e-6 || state.player.position.x > state.route.maxX + 1e-6) {
    throw new InvariantError("PLAYER_OUT_OF_BOUNDS", "player left authoritative route bounds");
  }
  const minimumBodyCenter = state.route.minX + playerHalfWidth;
  const maximumBodyCenter = state.route.maxX - playerHalfWidth;
  if (state.player.position.x < minimumBodyCenter - 1e-6 || state.player.position.x > maximumBodyCenter + 1e-6) {
    throw new InvariantError("PLAYER_BODY_OUT_OF_BOUNDS", "player authoritative body extends outside route bounds");
  }
  if (state.player.position.y < state.route.killPlaneY - 1e-6) throw new InvariantError("PLAYER_BELOW_KILL_PLANE", "player crossed kill plane without failure transition");
  if (state.lifecycle === "failed" && state.player.movementState !== "dead") throw new InvariantError("FAILED_PLAYER_NOT_DEAD", "failed gameplay state must expose dead player state");
  if (state.player.movementState === "dead" && state.lifecycle !== "failed") throw new InvariantError("DEAD_PLAYER_NOT_FAILED", "dead player state must be a gameplay failure");
  if (state.player.checkpointIndex < 0 || state.player.checkpointIndex > state.route.checkpointXs.length) {
    throw new InvariantError("INVALID_CHECKPOINT", "checkpoint index is out of range");
  }
  if (Object.keys(state.commandWatermarks).length > maxCommandSources) throw new InvariantError("COMMAND_SOURCE_LIMIT", "too many command sources");
}
