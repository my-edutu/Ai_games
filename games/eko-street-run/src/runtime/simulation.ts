import { createDefaultConfig, type EkoRunConfig } from "../config/default-config";
import { EVENT_SCHEMA_VERSION } from "../config/version";
import { getPhase5HazardContracts, stepHazards } from "../hazards";
import { stepPlayerKinematic } from "../physics/kinematic";
import { sampleSupportSurface } from "../physics/geometry";
import { assertStateInvariants, cloneState } from "../state/create-state";
import type {
  EkoRunCommand,
  EkoRunState,
  MoveCommand,
  PlayerControlIntent,
  RejectedCommand,
  SemanticEvent,
  StepResult,
  ValidatedCommand,
} from "../state/types";
import { checksumState } from "./checksum";
import { compareCommands, ValidationError, validateCommand } from "./commands";

function reject(command: EkoRunCommand, reason: string): RejectedCommand {
  return { command, reason };
}

function emit(state: EkoRunState, events: SemanticEvent[], type: SemanticEvent["type"], data: Record<string, unknown>): void {
  events.push({
    schemaVersion: EVENT_SCHEMA_VERSION,
    sequence: state.nextEventSequence++,
    tick: state.tick,
    type,
    data,
  });
}

function intentFrom(command: MoveCommand | undefined): PlayerControlIntent {
  return {
    axis: command?.payload.axis ?? 0,
    jumpPressed: command?.payload.jumpPressed ?? false,
    jumpReleased: command?.payload.jumpReleased ?? false,
    slide: command?.payload.slide ?? false,
    vault: command?.payload.vault ?? false,
  };
}

function checkpointSpawnX(state: EkoRunState): number {
  if (state.player.checkpointIndex <= 0) return state.route.startX;
  return state.route.checkpointXs[state.player.checkpointIndex - 1] ?? state.route.startX;
}

function resetRestartHazards(state: EkoRunState, spawnX: number): void {
  if (!state.hazards) return;
  const byId = new Map(getPhase5HazardContracts(state.rootSeed).map(contract => [contract.id, contract]));
  for (const encounter of state.hazards.encounters) {
    const contract = byId.get(encounter.id);
    if (!contract) continue;
    const maximumPossibleX = contract.baseX + (contract.motion ? Math.max(contract.motion.minOffsetX, contract.motion.maxOffsetX) : 0);
    if (maximumPossibleX + 1e-9 < spawnX) continue;
    encounter.phase = "unseen";
    encounter.warningTick = null;
    encounter.resolvedTick = null;
  }
}

function restartFromCheckpoint(state: EkoRunState, config: EkoRunConfig): void {
  const x = checkpointSpawnX(state);
  const legalSupportCeiling = state.route.groundY + config.maxStepHeight;
  const support = sampleSupportSurface(state.route, x, config.playerHalfWidth, state.tick, config, legalSupportCeiling);
  resetRestartHazards(state, x);
  state.player = {
    position: { x, y: support?.y ?? state.route.groundY },
    velocity: { x: 0, y: 0 },
    movementState: "grounded",
    facing: state.player.facing,
    coyoteTicksRemaining: config.coyoteTicks,
    jumpBufferTicksRemaining: 0,
    jumpCutConsumed: false,
    landingCompressionTicksRemaining: 0,
    slideTicksRemaining: 0,
    stumbleTicksRemaining: 0,
    vault: null,
    checkpointIndex: state.player.checkpointIndex,
    progress: Math.max(0, x - state.route.startX),
  };
  state.lifecycle = "running";
}

function updateProgress(state: EkoRunState, events: SemanticEvent[]): void {
  state.player.progress = Math.max(0, state.player.position.x - state.route.startX);
  state.record.maxProgress = Math.max(state.record.maxProgress, state.player.progress);
  while (state.player.checkpointIndex < state.route.checkpointXs.length) {
    const checkpointX = state.route.checkpointXs[state.player.checkpointIndex];
    if (state.player.position.x + 1e-9 < checkpointX) break;
    state.player.checkpointIndex += 1;
    emit(state, events, "checkpoint.reached", { checkpointIndex: state.player.checkpointIndex, x: checkpointX });
  }
  if (state.player.position.x >= state.route.finishX && state.lifecycle === "running") {
    state.lifecycle = "completed";
    state.record.completedTick = state.tick;
    emit(state, events, "run.completed", { progress: state.player.progress });
  }
}

export function stepSimulation(
  source: EkoRunState,
  inputCommands: readonly EkoRunCommand[],
  config: EkoRunConfig = createDefaultConfig({ seed: source.rootSeed }),
): StepResult {
  const next = cloneState(source);
  assertStateInvariants(next, config.maxCommandSources);
  const events: SemanticEvent[] = [];
  const rejectedCommands: RejectedCommand[] = [];
  const candidates: ValidatedCommand[] = [];

  for (const raw of inputCommands.slice(0, config.maxCommandsPerTick)) {
    try {
      candidates.push(validateCommand(raw, next));
    } catch (error) {
      rejectedCommands.push(reject(raw, error instanceof ValidationError ? error.code : "INVALID_COMMAND"));
    }
  }
  for (const raw of inputCommands.slice(config.maxCommandsPerTick)) rejectedCommands.push(reject(raw, "COMMAND_LIMIT"));
  candidates.sort(compareCommands);

  const acceptedCommands: ValidatedCommand[] = [];
  let moveAuthorityClaimed = false;
  for (const command of candidates) {
    if (command.targetTick < next.tick) {
      rejectedCommands.push(reject(command, "STALE_TICK"));
      continue;
    }
    if (command.targetTick > next.tick) {
      rejectedCommands.push(reject(command, "FUTURE_TICK"));
      continue;
    }
    const watermark = next.commandWatermarks[command.sourceId];
    if (watermark !== undefined && command.sourceSequence <= watermark) {
      rejectedCommands.push(reject(command, "DUPLICATE"));
      continue;
    }
    if (watermark === undefined && Object.keys(next.commandWatermarks).length >= config.maxCommandSources) {
      rejectedCommands.push(reject(command, "SOURCE_LIMIT"));
      continue;
    }
    if (command.type === "restart" && next.lifecycle !== "failed") {
      rejectedCommands.push(reject(command, "RESTART_NOT_FAILED"));
      continue;
    }
    if (command.type === "move" && next.lifecycle !== "running") {
      rejectedCommands.push(reject(command, "RUN_NOT_ACTIVE"));
      continue;
    }
    if (command.type === "move" && moveAuthorityClaimed) {
      next.commandWatermarks[command.sourceId] = command.sourceSequence;
      rejectedCommands.push(reject(command, "MOVE_CONFLICT"));
      continue;
    }
    if (command.type === "move") moveAuthorityClaimed = true;
    next.commandWatermarks[command.sourceId] = command.sourceSequence;
    acceptedCommands.push(command);
  }

  for (const rejected of rejectedCommands) emit(next, events, "command.rejected", { reason: rejected.reason, sourceId: rejected.command.sourceId });

  const restart = acceptedCommands.find(command => command.type === "restart");
  if (restart?.type === "restart") {
    restartFromCheckpoint(next, config);
    emit(next, events, "run.restarted", { checkpointIndex: next.player.checkpointIndex, x: next.player.position.x });
  }

  if (next.lifecycle === "running") {
    const move = acceptedCommands.find(command => command.type === "move") as MoveCommand | undefined;
    const physics = stepPlayerKinematic(next.player, next.route, intentFrom(move), config, next.tick);
    next.player = physics.player;
    if (physics.jumpStarted) emit(next, events, "player.jumped", { x: next.player.position.x, y: next.player.position.y });
    if (physics.slideStarted) emit(next, events, "player.slid", { x: next.player.position.x });
    if (physics.vaultStarted) emit(next, events, "player.vaulted", { obstacleId: next.player.vault?.obstacleId ?? null });
    if (physics.landed) emit(next, events, "player.landed", { y: next.player.position.y, compressedTicks: next.player.landingCompressionTicksRemaining });
    if (physics.stumbleStarted) emit(next, events, "player.stumbled", { recoveryTicks: next.player.stumbleTicksRemaining });
    if (physics.failed) {
      next.lifecycle = "failed";
      next.player.movementState = "dead";
      emit(next, events, "run.failed", { reason: "kill-plane", x: next.player.position.x, y: next.player.position.y });
    } else {
      const hazardResult = stepHazards(next, config);
      for (const signal of hazardResult.signals) emit(next, events, signal.type, signal.data);
      if (hazardResult.failedReason) {
        emit(next, events, "run.failed", { reason: hazardResult.failedReason, x: next.player.position.x, y: next.player.position.y });
      } else {
        updateProgress(next, events);
      }
    }
  }

  next.tick += 1;
  assertStateInvariants(next, config.maxCommandSources);
  return { state: next, events, acceptedCommands, rejectedCommands, checksum: checksumState(next) };
}
