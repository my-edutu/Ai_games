export type EkoRunLifecycle = "running" | "completed" | "failed" | "aborted" | "quarantined" | "maintenance";
export type MovementState = "grounded" | "rising" | "falling" | "sliding" | "vaulting" | "stumbling" | "dead" | "airborne";
export type AuthoritativeRandomStreamName = "route" | "traffic" | "ai" | "reward" | "audience";
export type RandomStreamName = AuthoritativeRandomStreamName | "cosmetic";

export interface Vec2 {
  x: number;
  y: number;
}

export interface VaultState {
  obstacleId: string;
  ticksRemaining: number;
  totalTicks: number;
  start: Vec2;
  end: Vec2;
}

export interface PlayerState {
  position: Vec2;
  velocity: Vec2;
  movementState: MovementState;
  facing: -1 | 1;
  coyoteTicksRemaining: number;
  jumpBufferTicksRemaining: number;
  jumpCutConsumed: boolean;
  landingCompressionTicksRemaining: number;
  slideTicksRemaining: number;
  stumbleTicksRemaining: number;
  vault: VaultState | null;
  checkpointIndex: number;
  progress: number;
}

export interface RouteGroundSegment {
  id: string;
  minX: number;
  maxX: number;
  y: number;
}

export interface RouteSlope {
  id: string;
  minX: number;
  maxX: number;
  startY: number;
  endY: number;
}

export type RouteColliderKind = "solid" | "vault" | "moving";

export interface RouteColliderMotion {
  minOffsetX: number;
  maxOffsetX: number;
  periodTicks: number;
}

export interface RouteColliderRect {
  id: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  kind: RouteColliderKind;
  motion?: RouteColliderMotion;
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
  killPlaneY: number;
  groundSegments: RouteGroundSegment[];
  slopes: RouteSlope[];
  colliders: RouteColliderRect[];
}

export type HazardFamily =
  | "danfo-pull-out"
  | "molue-crossing"
  | "pothole"
  | "open-drain"
  | "construction-trench"
  | "flood-puddle"
  | "handcart"
  | "rolling-object"
  | "crowd-compression"
  | "street-disturbance"
  | "temporary-block";

export type HazardResponse = "jump" | "slow" | "wait" | "slide" | "vault";
export type HazardConsequence = "stumble" | "slow" | "fail";
export type HazardEncounterPhase = "unseen" | "warned" | "resolved" | "hit";

export interface HazardMotion {
  minOffsetX: number;
  maxOffsetX: number;
  periodTicks: number;
  activeTicks: number;
}

export interface HazardContract {
  id: string;
  family: HazardFamily;
  baseX: number;
  y: number;
  width: number;
  height: number;
  warningDistance: number;
  minResponseTicks: number;
  legalResponses: HazardResponse[];
  consequence: HazardConsequence;
  captionKey: string;
  visualToken: string;
  maxHazardSpeed: number;
  phaseOffsetTicks: number;
  motion?: HazardMotion;
}

export interface HazardEncounter {
  id: string;
  family: HazardFamily;
  phase: HazardEncounterPhase;
  warningTick: number | null;
  resolvedTick: number | null;
}

export interface HazardRuntimeState {
  hazardSchemaVersion: number;
  encounters: HazardEncounter[];
}

export interface PublicHazardSnapshot {
  id: string;
  family: HazardFamily;
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  phase: HazardEncounterPhase;
  legalResponses: HazardResponse[];
  captionKey: string;
  visualToken: string;
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
  hazards?: HazardRuntimeState;
  resources: ResourceState;
  commandWatermarks: Record<string, number>;
  randomStreams: AuthoritativeRandomSnapshot;
  record: RunRecordState;
}

export interface MoveCommandPayload {
  axis: number;
  jumpPressed?: boolean;
  jumpReleased?: boolean;
  slide?: boolean;
  vault?: boolean;
}

export interface MoveCommand {
  schemaVersion: number;
  runId: string;
  targetTick: number;
  priority: number;
  sourceId: string;
  sourceSequence: number;
  type: "move";
  payload: MoveCommandPayload;
}

export interface RestartCommand {
  schemaVersion: number;
  runId: string;
  targetTick: number;
  priority: number;
  sourceId: string;
  sourceSequence: number;
  type: "restart";
  payload: Record<string, never>;
}

export type EkoRunCommand = MoveCommand | RestartCommand;
export type ValidatedCommand = EkoRunCommand;

export interface RejectedCommand {
  command: EkoRunCommand;
  reason: string;
}

export type SemanticEventType =
  | "run.started"
  | "command.rejected"
  | "checkpoint.reached"
  | "run.completed"
  | "run.failed"
  | "run.restarted"
  | "player.jumped"
  | "player.landed"
  | "player.stumbled"
  | "player.slid"
  | "player.vaulted"
  | "hazard.warned"
  | "hazard.hit"
  | "hazard.resolved"
  | "integrity.failure";

export interface SemanticEvent {
  schemaVersion: number;
  sequence: number;
  tick: number;
  type: SemanticEventType;
  data: Record<string, unknown>;
}

export interface StepResult {
  state: EkoRunState;
  events: SemanticEvent[];
  acceptedCommands: ValidatedCommand[];
  rejectedCommands: RejectedCommand[];
  checksum: string;
}

export interface PlayerControlIntent {
  axis: number;
  jumpPressed: boolean;
  jumpReleased: boolean;
  slide: boolean;
  vault: boolean;
}

export type ContactKind = "ground" | "slope" | "step" | "wall" | "ceiling" | "moving" | "vault";

export interface PhysicsContact {
  colliderId: string;
  kind: ContactKind;
}

export interface KinematicStepResult {
  player: PlayerState;
  contacts: PhysicsContact[];
  landed: boolean;
  jumpStarted: boolean;
  slideStarted: boolean;
  vaultStarted: boolean;
  stumbleStarted: boolean;
  failed: boolean;
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
    facing: -1 | 1;
    checkpointIndex: number;
    landingCompressionTicksRemaining: number;
    slideTicksRemaining: number;
    stumbleTicksRemaining: number;
  };
  route: {
    id: string;
    groundY: number;
    minX: number;
    maxX: number;
    checkpointXs: number[];
    finishX: number;
  };
  hazards: PublicHazardSnapshot[];
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
