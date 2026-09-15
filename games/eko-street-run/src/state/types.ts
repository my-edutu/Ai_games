export type EkoRunLifecycle = "running" | "completed" | "failed" | "aborted" | "quarantined" | "maintenance";
export type MovementState = "grounded" | "airborne";
export type AuthoritativeRandomStreamName = "route" | "traffic" | "ai" | "reward" | "audience";
export type RandomStreamName = AuthoritativeRandomStreamName | "cosmetic";

export interface Vec2 {
  x: number;
  y: number;
}

export interface PlayerState {
  position: Vec2;
  velocity: Vec2;
  movementState: MovementState;
  checkpointIndex: number;
  progress: number;
}

export interface RouteState {
  id: string;
  contentVersion: string;
  groundY: number;
  startX: number;
  minX: number;
  maxX: number;
  checkpointXs: number[];
  finishX: number;
}

export interface ResourceState {
  ekoTokens: number;
}

export interface RunRecordState {
  maxProgress: number;
  completedTick: number | null;
}

export type AuthoritativeRandomSnapshot = Record<AuthoritativeRandomStreamName, number>;

export interface EkoRunState {
  schemaVersion: number;
  gameVersion: string;
  deterministicVersion: number;
  contentVersion: string;
  runId: string;
  rootSeed: string;
  tick: number;
  nextEventSequence: number;
  lifecycle: EkoRunLifecycle;
  player: PlayerState;
  route: RouteState;
  resources: ResourceState;
  commandWatermarks: Record<string, number>;
  randomStreams: AuthoritativeRandomSnapshot;
  record: RunRecordState;
}

export interface MoveCommandPayload {
  axis: number;
}

export interface EkoRunCommand {
  schemaVersion: number;
  runId: string;
  targetTick: number;
  priority: number;
  sourceId: string;
  sourceSequence: number;
  type: "move";
  payload: MoveCommandPayload;
}

export type ValidatedCommand = EkoRunCommand;

export interface RejectedCommand {
  command: EkoRunCommand;
  reason: string;
}

export interface SemanticEvent {
  schemaVersion: number;
  sequence: number;
  tick: number;
  type: "run.started" | "command.rejected" | "checkpoint.reached" | "run.completed" | "integrity.failure";
  data: Record<string, unknown>;
}

export interface StepResult {
  state: EkoRunState;
  events: SemanticEvent[];
  acceptedCommands: ValidatedCommand[];
  rejectedCommands: RejectedCommand[];
  checksum: string;
}

export interface EkoRunRenderSnapshot {
  version: number;
  runId: string;
  tick: number;
  lifecycle: EkoRunLifecycle;
  player: {
    position: Vec2;
    velocity: Vec2;
    movementState: MovementState;
    checkpointIndex: number;
  };
  route: {
    id: string;
    groundY: number;
    minX: number;
    maxX: number;
    checkpointXs: number[];
    finishX: number;
  };
  progress: number;
  recentEvents: SemanticEvent[];
}

export interface EkoRunSnapshot {
  snapshotVersion: number;
  gameVersion: string;
  schemaVersion: number;
  deterministicVersion: number;
  contentVersion: string;
  runId: string;
  rootSeed: string;
  tick: number;
  state: EkoRunState;
  checksum: string;
}

export interface ReplayStep {
  commands: readonly EkoRunCommand[];
}

export interface ReplayResult {
  state: EkoRunState;
  finalChecksum: string;
  checkpointChecksums: string[];
}
