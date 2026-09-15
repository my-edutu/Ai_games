import { PLAYER_HALF_WIDTH, type EkoRunConfig } from "../config/default-config";
import { PHASE6_DISTRICT_IDS, PHASE6_GENERATOR_VERSION } from "../generation";
import { createHazardRuntimeState, createHazardRuntimeStateFromContracts, PHASE5_HAZARD_SCHEMA_VERSION } from "../hazards";
import { createPhase6Progression, createPhase6Resources, PHASE6_LEDGER_ID_LIMIT, PHASE6_TOKEN_CAP } from "../progression";
import { createFoundationRoute, createPhase5Route } from "../rules/route";
import { createRandomStreams } from "../runtime/prng";
import type { EkoRunState, HazardEncounterPhase, MovementState, PlayerState, RouteState } from "./types";

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
const HAZARD_PHASES = new Set<HazardEncounterPhase>(["unseen", "warned", "resolved", "hit"]);

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

function createStateForRoute(config: EkoRunConfig, route: RouteState, withHazards: boolean): EkoRunState {
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
    ...(withHazards ? { hazards: createHazardRuntimeState(config.seed) } : {}),
    resources: { ekoTokens: 0 },
    commandWatermarks: {},
    randomStreams: streams.snapshotAuthoritative(),
    record: { maxProgress: 0, completedTick: null },
  };
  assertStateInvariants(state, config.maxCommandSources, config.playerHalfWidth);
  return state;
}

export function createInitialState(config: EkoRunConfig): EkoRunState {
  return createStateForRoute(config, createFoundationRoute(), false);
}

export function createPhase5State(config: EkoRunConfig): EkoRunState {
  return createStateForRoute(config, createPhase5Route(), true);
}

export function createPhase6State(config: EkoRunConfig): EkoRunState {
  const progression = createPhase6Progression(config.seed, 0, 0);
  const route = JSON.parse(JSON.stringify(progression.activeContent.route)) as RouteState;
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
    hazards: createHazardRuntimeStateFromContracts(progression.activeContent.hazards),
    progression,
    resources: createPhase6Resources(),
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

function assertOptionalTick(value: number | null, name: string): void {
  if (value !== null && (!Number.isInteger(value) || value < 0)) throw new InvariantError("INVALID_HAZARD_TICK", `${name} must be null or a non-negative integer`);
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

function assertHazards(state: EkoRunState): void {
  if (!state.hazards) return;
  if (state.hazards.hazardSchemaVersion !== PHASE5_HAZARD_SCHEMA_VERSION) throw new InvariantError("INVALID_HAZARD_SCHEMA", "unsupported hazard schema");
  if (state.hazards.encounters.length > 64) throw new InvariantError("HAZARD_LIMIT", "too many hazard encounters");
  const ids = new Set<string>();
  for (const encounter of state.hazards.encounters) {
    if (!encounter.id || ids.has(encounter.id)) throw new InvariantError("DUPLICATE_HAZARD_ID", "hazard encounter IDs must be unique");
    ids.add(encounter.id);
    if (!HAZARD_PHASES.has(encounter.phase)) throw new InvariantError("INVALID_HAZARD_PHASE", "hazard encounter phase is invalid");
    assertOptionalTick(encounter.warningTick, "warningTick");
    assertOptionalTick(encounter.resolvedTick, "resolvedTick");
    if (encounter.phase === "unseen" && encounter.warningTick !== null) throw new InvariantError("INVALID_HAZARD_WARNING", "unseen hazard cannot have warning tick");
    if ((encounter.phase === "resolved" || encounter.phase === "hit") && encounter.resolvedTick === null) throw new InvariantError("INVALID_HAZARD_RESOLUTION", "resolved hazard requires resolved tick");
  }
}

function assertResourceArray(value: string[] | undefined, name: string): void {
  if (!value) return;
  if (value.length > PHASE6_LEDGER_ID_LIMIT || new Set(value).size !== value.length || value.some(item => typeof item !== "string" || item.length < 1 || item.length > 128)) {
    throw new InvariantError("INVALID_RESOURCE_LEDGER", `${name} must be unique and bounded`);
  }
}

function assertPhase6(state: EkoRunState): void {
  if (!Number.isInteger(state.resources.ekoTokens) || state.resources.ekoTokens < 0 || state.resources.ekoTokens > PHASE6_TOKEN_CAP) throw new InvariantError("INVALID_TOKEN_BALANCE", "Eko Token balance is out of range");
  assertResourceArray(state.resources.collectedTokenIds, "collectedTokenIds");
  assertResourceArray(state.resources.awardedMilestoneIds, "awardedMilestoneIds");
  assertResourceArray(state.resources.unlockedCosmetics, "unlockedCosmetics");
  assertResourceArray(state.resources.unlockedThemes, "unlockedThemes");
  assertResourceArray(state.resources.unlockedCelebrations, "unlockedCelebrations");
  if (!state.progression) return;
  const progression = state.progression;
  if (!Number.isInteger(progression.districtIndex) || progression.districtIndex < 0 || progression.districtIndex > 5) throw new InvariantError("INVALID_DISTRICT_INDEX", "district index is invalid");
  if (!Number.isInteger(progression.cycle) || progression.cycle < 0 || progression.cycle > 1_000_000) throw new InvariantError("INVALID_DISTRICT_CYCLE", "district cycle is invalid");
  if (!Number.isInteger(progression.districtCompletions) || progression.districtCompletions < 0) throw new InvariantError("INVALID_DISTRICT_COMPLETIONS", "district completions are invalid");
  const content = progression.activeContent;
  if (
    PHASE6_DISTRICT_IDS[progression.districtIndex] !== progression.districtId
    || content.generatorVersion !== PHASE6_GENERATOR_VERSION
    || content.districtIndex !== progression.districtIndex
    || content.districtId !== progression.districtId
    || content.cycle !== progression.cycle
    || content.route.id !== state.route.id
  ) throw new InvariantError("PROGRESSION_ROUTE_MISMATCH", "active generated content must match authoritative district, cycle, generator and route");
  if (!content.validation.valid) throw new InvariantError("INVALID_GENERATED_CONTENT", "active Phase 6 content must validate");
  if (content.hazards.length > 16 || content.tokens.length > 16 || content.decisions.length > 8 || content.milestones.length > 8) throw new InvariantError("PHASE6_CONTENT_LIMIT", "generated content exceeds live bounds");
  for (const value of Object.values(content.difficulty)) if (value < 0 || value > 1) throw new InvariantError("INVALID_DIFFICULTY", "difficulty axes must remain normalized");
}

export function assertStateInvariants(state: EkoRunState, maxCommandSources = 8, playerHalfWidth = PLAYER_HALF_WIDTH): void {
  assertFiniteTree(state);
  assertRoute(state.route);
  assertHazards(state);
  assertPhase6(state);
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
    if (state.player.vault.totalTicks < 1 || state.player.vault.ticksRemaining > state.player.vault.totalTicks) throw new InvariantError("INVALID_VAULT", "vault timing is inconsistent");
  }
  if (state.player.position.x < state.route.minX - 1e-6 || state.player.position.x > state.route.maxX + 1e-6) throw new InvariantError("PLAYER_OUT_OF_BOUNDS", "player left authoritative route bounds");
  const minimumBodyCenter = state.route.minX + playerHalfWidth;
  const maximumBodyCenter = state.route.maxX - playerHalfWidth;
  if (state.player.position.x < minimumBodyCenter - 1e-6 || state.player.position.x > maximumBodyCenter + 1e-6) throw new InvariantError("PLAYER_BODY_OUT_OF_BOUNDS", "player authoritative body extends outside route bounds");
  if (state.player.position.y < state.route.killPlaneY - 1e-6) throw new InvariantError("PLAYER_BELOW_KILL_PLANE", "player crossed kill plane without failure transition");
  if (state.lifecycle === "failed" && state.player.movementState !== "dead") throw new InvariantError("FAILED_PLAYER_NOT_DEAD", "failed gameplay state must expose dead player state");
  if (state.player.movementState === "dead" && state.lifecycle !== "failed") throw new InvariantError("DEAD_PLAYER_NOT_FAILED", "dead player state must be a gameplay failure");
  if (state.player.checkpointIndex < 0 || state.player.checkpointIndex > state.route.checkpointXs.length) throw new InvariantError("INVALID_CHECKPOINT", "checkpoint index is out of range");
  if (Object.keys(state.commandWatermarks).length > maxCommandSources) throw new InvariantError("COMMAND_SOURCE_LIMIT", "too many command sources");
}
