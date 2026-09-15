import { CONTENT_VERSION, DETERMINISTIC_VERSION, GAME_VERSION, SCHEMA_VERSION, SNAPSHOT_VERSION } from "../config/version";
import { assertStateInvariants, cloneState } from "../state/create-state";
import type { EkoRunSnapshot, EkoRunState, ReplayResult, ReplayStep } from "../state/types";
import { checksumState } from "../runtime/checksum";
import { stepSimulation } from "../runtime/simulation";

export class IntegrityError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "IntegrityError";
    this.code = code;
  }
}

export function createSnapshot(state: EkoRunState): EkoRunSnapshot {
  assertStateInvariants(state);
  const copy = cloneState(state);
  return {
    snapshotVersion: SNAPSHOT_VERSION,
    gameVersion: state.gameVersion,
    schemaVersion: state.schemaVersion,
    deterministicVersion: state.deterministicVersion,
    contentVersion: state.contentVersion,
    runId: state.runId,
    rootSeed: state.rootSeed,
    tick: state.tick,
    state: copy,
    checksum: checksumState(copy),
  };
}

function assertSupported(snapshot: EkoRunSnapshot): void {
  if (
    snapshot.snapshotVersion !== SNAPSHOT_VERSION
    || snapshot.gameVersion !== GAME_VERSION
    || snapshot.schemaVersion !== SCHEMA_VERSION
    || snapshot.deterministicVersion !== DETERMINISTIC_VERSION
    || snapshot.contentVersion !== CONTENT_VERSION
  ) {
    throw new IntegrityError("UNSUPPORTED_VERSION", "snapshot version is not supported by this build");
  }
}

function assertEnvelopeMatchesState(snapshot: EkoRunSnapshot, candidate: EkoRunState): void {
  if (
    candidate.gameVersion !== snapshot.gameVersion
    || candidate.schemaVersion !== snapshot.schemaVersion
    || candidate.deterministicVersion !== snapshot.deterministicVersion
    || candidate.contentVersion !== snapshot.contentVersion
    || candidate.runId !== snapshot.runId
    || candidate.rootSeed !== snapshot.rootSeed
    || candidate.tick !== snapshot.tick
  ) {
    throw new IntegrityError("ENVELOPE_MISMATCH", "snapshot envelope does not match state payload");
  }
}

export function restoreSnapshot(snapshot: EkoRunSnapshot): EkoRunState {
  assertSupported(snapshot);
  const candidate = cloneState(snapshot.state);
  assertEnvelopeMatchesState(snapshot, candidate);
  const actual = checksumState(candidate);
  if (actual !== snapshot.checksum) throw new IntegrityError("CHECKSUM_MISMATCH", "snapshot checksum mismatch");
  assertStateInvariants(candidate);
  return candidate;
}

export function replayRun(initial: EkoRunState, steps: readonly ReplayStep[]): ReplayResult {
  let state = cloneState(initial);
  const checkpointChecksums: string[] = [];
  for (const step of steps) {
    const canRestart = state.lifecycle === "failed" && step.commands.some(command => command.type === "restart");
    if (state.lifecycle !== "running" && !canRestart) break;
    const result = stepSimulation(state, step.commands);
    state = result.state;
    if (result.events.some(event => event.type === "checkpoint.reached")) checkpointChecksums.push(result.checksum);
  }
  return {
    state,
    finalChecksum: checksumState(state),
    checkpointChecksums,
  };
}
