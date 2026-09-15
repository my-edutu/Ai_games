import type { EkoRunConfig } from "../config/default-config";
import { createDefaultConfig } from "../config/default-config";
import { EVENT_SCHEMA_VERSION } from "../config/version";
import { integrateFoundationMovement } from "../physics/kinematic";
import { assertStateInvariants, cloneState } from "../state/create-state";
import type { EkoRunCommand, EkoRunState, RejectedCommand, SemanticEvent, StepResult, ValidatedCommand } from "../state/types";
import { checksumState } from "./checksum";
import { compareCommands, validateCommand, ValidationError } from "./commands";

function emitEvent(state: EkoRunState, events: SemanticEvent[], type: SemanticEvent["type"], data: Record<string, unknown>): void {
  events.push({
    schemaVersion: EVENT_SCHEMA_VERSION,
    sequence: state.nextEventSequence,
    tick: state.tick,
    type,
    data,
  });
  state.nextEventSequence += 1;
}

function reject(state: EkoRunState, events: SemanticEvent[], rejected: RejectedCommand[], command: EkoRunCommand, reason: string): void {
  rejected.push({ command, reason });
  emitEvent(state, events, "command.rejected", { reason, sourceId: command.sourceId, sourceSequence: command.sourceSequence });
}

function inferConfig(state: EkoRunState): EkoRunConfig {
  return createDefaultConfig({ seed: state.rootSeed });
}

export function stepSimulation(state: EkoRunState, commands: readonly EkoRunCommand[]): StepResult {
  const next = cloneState(state);
  assertStateInvariants(next);
  const config = inferConfig(next);
  if (config.runId !== next.runId) throw new Error("state run ID does not match deterministic configuration");

  const events: SemanticEvent[] = [];
  const rejectedCommands: RejectedCommand[] = [];
  const candidates: ValidatedCommand[] = [];

  if (next.tick === 0 && next.nextEventSequence === 1) emitEvent(next, events, "run.started", { routeId: next.route.id });

  const limited = commands.slice(0, config.maxCommandsPerTick);
  for (const raw of limited) {
    try {
      candidates.push(validateCommand(raw, next));
    } catch (error) {
      const reason = error instanceof ValidationError ? error.code : "INVALID_COMMAND";
      reject(next, events, rejectedCommands, raw, reason);
    }
  }
  for (const raw of commands.slice(config.maxCommandsPerTick)) reject(next, events, rejectedCommands, raw, "COMMAND_LIMIT");

  candidates.sort(compareCommands);
  const acceptedCommands: ValidatedCommand[] = [];
  for (const command of candidates) {
    if (next.lifecycle !== "running") {
      reject(next, events, rejectedCommands, command, "RUN_NOT_ACTIVE");
      continue;
    }
    if (command.targetTick < next.tick) {
      reject(next, events, rejectedCommands, command, "STALE_TICK");
      continue;
    }
    if (command.targetTick > next.tick) {
      reject(next, events, rejectedCommands, command, "FUTURE_TICK");
      continue;
    }
    const watermark = next.commandWatermarks[command.sourceId];
    if (watermark !== undefined && command.sourceSequence <= watermark) {
      reject(next, events, rejectedCommands, command, "DUPLICATE");
      continue;
    }
    if (watermark === undefined && Object.keys(next.commandWatermarks).length >= config.maxCommandSources) {
      reject(next, events, rejectedCommands, command, "SOURCE_LIMIT");
      continue;
    }
    next.commandWatermarks[command.sourceId] = command.sourceSequence;
    acceptedCommands.push(command);
  }

  if (next.lifecycle === "running") {
    const axis = acceptedCommands.length > 0 ? acceptedCommands[0].payload.axis : 0;
    next.player = integrateFoundationMovement(next.player, next.route, axis, config);
    next.player.progress = Math.min(next.route.finishX, Math.max(0, next.player.position.x));
    next.record.maxProgress = Math.max(next.record.maxProgress, next.player.progress);

    const nextCheckpointX = next.route.checkpointXs[next.player.checkpointIndex];
    if (nextCheckpointX !== undefined && next.player.position.x >= nextCheckpointX) {
      const reachedIndex = next.player.checkpointIndex;
      next.player.checkpointIndex += 1;
      emitEvent(next, events, "checkpoint.reached", { checkpointIndex: reachedIndex, x: nextCheckpointX });
    }

    if (next.player.position.x >= next.route.finishX) {
      next.lifecycle = "completed";
      next.record.completedTick = next.tick + 1;
      emitEvent(next, events, "run.completed", { progress: next.player.progress });
    }
  }

  next.tick += 1;
  assertStateInvariants(next);
  return {
    state: next,
    events,
    acceptedCommands,
    rejectedCommands,
    checksum: checksumState(next),
  };
}
