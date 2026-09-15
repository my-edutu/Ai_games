import type { EkoRunConfig } from "../config/default-config";
import { createFoundationRoute } from "../rules/route";
import { createRandomStreams } from "../runtime/prng";
import type { EkoRunState } from "./types";

export class InvariantError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "InvariantError";
    this.code = code;
  }
}

export function createInitialState(config: EkoRunConfig): EkoRunState {
  const route = createFoundationRoute();
  const randomStreams = createRandomStreams(config.seed).snapshotAuthoritative();
  const state: EkoRunState = {
    schemaVersion: config.schemaVersion,
    gameVersion: config.gameVersion,
    deterministicVersion: config.deterministicVersion,
    contentVersion: config.contentVersion,
    runId: config.runId,
    rootSeed: config.seed,
    tick: 0,
    nextEventSequence: 1,
    lifecycle: "running",
    player: {
      position: { x: route.startX, y: route.groundY },
      velocity: { x: 0, y: 0 },
      movementState: "grounded",
      checkpointIndex: 0,
      progress: 0,
    },
    route,
    resources: { ekoTokens: 0 },
    commandWatermarks: {},
    randomStreams,
    record: { maxProgress: 0, completedTick: null },
  };
  assertStateInvariants(state);
  return state;
}

export function cloneState(state: EkoRunState): EkoRunState {
  return JSON.parse(JSON.stringify(state)) as EkoRunState;
}

export function assertStateInvariants(state: EkoRunState): void {
  if (!Number.isInteger(state.tick) || state.tick < 0) throw new InvariantError("INVALID_TICK", "tick must be a non-negative integer");
  if (!Number.isInteger(state.nextEventSequence) || state.nextEventSequence < 1) throw new InvariantError("INVALID_EVENT_SEQUENCE", "event sequence must be positive");
  const numeric = [
    state.player.position.x,
    state.player.position.y,
    state.player.velocity.x,
    state.player.velocity.y,
    state.player.progress,
    state.route.groundY,
    state.route.minX,
    state.route.maxX,
    state.route.finishX,
    ...state.route.checkpointXs,
    ...Object.values(state.randomStreams),
  ];
  if (!numeric.every(Number.isFinite)) throw new InvariantError("NON_FINITE_STATE", "authoritative numeric state must remain finite");
  if (state.route.minX >= state.route.maxX) throw new InvariantError("INVALID_ROUTE_BOUNDS", "route bounds are invalid");
  if (state.player.position.x < state.route.minX - 1e-6 || state.player.position.x > state.route.maxX + 1e-6) {
    throw new InvariantError("PLAYER_OUT_OF_BOUNDS", "player left authoritative route bounds");
  }
  if (state.player.position.y < state.route.groundY - 1e-6) throw new InvariantError("PLAYER_BELOW_GROUND", "player penetrated foundation ground");
  if (state.player.checkpointIndex < 0 || state.player.checkpointIndex > state.route.checkpointXs.length) {
    throw new InvariantError("INVALID_CHECKPOINT_INDEX", "checkpoint index is outside route contract");
  }
  if (Object.keys(state.commandWatermarks).length > 8) throw new InvariantError("COMMAND_SOURCE_LIMIT", "command source state exceeded foundation bound");
}
