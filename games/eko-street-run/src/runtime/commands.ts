import { COMMAND_SCHEMA_VERSION } from "../config/version";
import type { EkoRunCommand, EkoRunState, ValidatedCommand } from "../state/types";

export class ValidationError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ValidationError";
    this.code = code;
  }
}

export function validateCommand(command: EkoRunCommand, state: EkoRunState): ValidatedCommand {
  if (command.schemaVersion !== COMMAND_SCHEMA_VERSION) throw new ValidationError("SCHEMA_MISMATCH", "unsupported command schema version");
  if (command.runId !== state.runId) throw new ValidationError("RUN_MISMATCH", "command belongs to a different run");
  if (!Number.isInteger(command.targetTick) || command.targetTick < 0) throw new ValidationError("INVALID_TICK", "target tick must be a non-negative integer");
  if (!Number.isInteger(command.priority)) throw new ValidationError("INVALID_PRIORITY", "priority must be an integer");
  if (typeof command.sourceId !== "string" || command.sourceId.length < 1 || command.sourceId.length > 64) throw new ValidationError("INVALID_SOURCE", "source ID is invalid");
  if (!Number.isInteger(command.sourceSequence) || command.sourceSequence < 0) throw new ValidationError("INVALID_SEQUENCE", "source sequence must be a non-negative integer");
  if (command.type !== "move") throw new ValidationError("INVALID_TYPE", "unsupported command type");
  const axis = command.payload?.axis;
  if (!Number.isFinite(axis) || axis < -1 || axis > 1) throw new ValidationError("INVALID_AXIS", "move axis must be finite and between -1 and 1");
  return {
    ...command,
    payload: { axis: Object.is(axis, -0) ? 0 : axis },
  };
}

export function compareCommands(left: ValidatedCommand, right: ValidatedCommand): number {
  return left.targetTick - right.targetTick
    || left.priority - right.priority
    || left.sourceId.localeCompare(right.sourceId)
    || left.sourceSequence - right.sourceSequence
    || left.type.localeCompare(right.type);
}
