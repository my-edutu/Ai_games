export type EkoRunLifecycle = "running" | "intermission" | "completed" | "failed" | "aborted" | "quarantined" | "maintenance";
export type MovementState = "grounded" | "rising" | "falling" | "sliding" | "vaulting" | "stumbling" | "dead" | "airborne";
export type AuthoritativeRandomStreamName = "route" | "traffic" | "ai" | "reward" | "audience";
export type RandomStreamName = AuthoritativeRandomStreamName | "cosmetic";

export interface Vec2 { x: number; y: number; }
export interface VaultState { obstacleId: string; ticksRemaining: number; totalTicks: number; start: Vec2; end: Vec2; }
export interface PlayerState {
  position: Vec2; velocity: Vec2; movementState: MovementState; facing: -1 | 1;
  coyoteTicksRemaining: number; jumpBufferTicksRemaining: number; jumpCutConsumed: boolean;
  landingCompressionTicksRemaining: number; slideTicksRemaining: number; stumbleTicksRemaining: number;
  vault: VaultState | null; checkpointIndex: number; progress: number;
}
export interface RouteGroundSegment { id: string; minX: number; maxX: number; y: number; }
export interface RouteSlope { id: string; minX: number; maxX: number; startY: number; endY: number; }
export type RouteColliderKind = "solid" | "vault" | "moving";
export interface RouteColliderMotion { minOffsetX: number; maxOffsetX: number; periodTicks: number; }
export interface RouteColliderRect { id: string; minX: number; maxX: number; minY: number; maxY: number; kind: RouteColliderKind; motion?: RouteColliderMotion; }
export interface RouteState {
  id: string; contentVersion: string; groundY: number; startX: number; minX: number; maxX: number;
  checkpointXs: number[]; finishX: number; killPlaneY: number;
  groundSegments: RouteGroundSegment[]; slopes: RouteSlope[]; colliders: RouteColliderRect[];
}

export type HazardFamily = "danfo-pull-out" | "molue-crossing" | "pothole" | "open-drain" | "construction-trench" | "flood-puddle" | "handcart" | "rolling-object" | "crowd-compression" | "street-disturbance" | "temporary-block";
export type HazardResponse = "jump" | "slow" | "wait" | "slide" | "vault";
export type HazardConsequence = "stumble" | "slow" | "fail";
export type HazardEncounterPhase = "unseen" | "warned" | "resolved" | "hit";
export interface HazardMotion { minOffsetX: number; maxOffsetX: number; periodTicks: number; activeTicks: number; }
export interface HazardContract {
  id: string; family: HazardFamily; baseX: number; y: number; width: number; height: number;
  warningDistance: number; minResponseTicks: number; legalResponses: HazardResponse[];
  consequence: HazardConsequence; captionKey: string; visualToken: string; maxHazardSpeed: number;
  phaseOffsetTicks: number; motion?: HazardMotion;
}
export interface HazardEncounter { id: string; family: HazardFamily; phase: HazardEncounterPhase; warningTick: number | null; resolvedTick: number | null; }
export interface HazardRuntimeState { hazardSchemaVersion: number; encounters: HazardEncounter[]; }
export interface PublicHazardSnapshot {
  id: string; family: HazardFamily; x: number; y: number; width: number; height: number; active: boolean;
  phase: HazardEncounterPhase; legalResponses: HazardResponse[]; captionKey: string; visualToken: string;
}

export type DistrictId = "mainland-morning" | "market-rush" | "danfo-junction" | "rainy-lagos" | "island-night" | "bridge-run";
export type PacingBand = "calm" | "anticipation" | "crisis" | "recovery";
export interface DifficultyProfile {
  speedPressure: number; routeConstraint: number; verticalPrecision: number; vehicleTiming: number;
  hazardConcurrency: number; informationPressure: number; recoveryCost: number; optionalRisk: number;
}
export interface GeneratedToken { id: string; x: number; value: number; }
export interface RouteDecision { id: string; x: number; risk: "safe" | "balanced" | "bold"; rewardTokens: number; }
export interface MilestoneSpec { id: string; x: number; band: PacingBand; }
export interface GenerationValidation { valid: boolean; repairCount: number; fallbackUsed: boolean; codes: string[]; }
export interface GeneratedDistrictContent {
  generatorVersion: number; districtIndex: number; districtId: DistrictId; cycle: number; route: RouteState;
  hazards: HazardContract[]; tokens: GeneratedToken[]; decisions: RouteDecision[]; milestones: MilestoneSpec[];
  difficulty: DifficultyProfile; validation: GenerationValidation; fingerprint: string;
}
export interface ProgressionState {
  districtIndex: number; districtId: DistrictId; cycle: number; districtCompletions: number;
  totalDistance: number; pacingBand: PacingBand; activeContent: GeneratedDistrictContent;
}
export interface ResourceState {
  ekoTokens: number;
  earnedTokenTotal?: number;
  collectedTokenIds?: string[];
  awardedMilestoneIds?: string[];
  unlockedCosmetics?: string[];
  unlockedThemes?: string[];
  unlockedCelebrations?: string[];
}
export interface RunRecordState { maxProgress: number; completedTick: number | null; }
export type AuthoritativeRandomSnapshot = Record<AuthoritativeRandomStreamName, number>;
export interface EkoRunState {
  schemaVersion: number; gameVersion: string; deterministicVersion: number; contentVersion: string; runId: string;
  rootSeed: string; tick: number; nextEventSequence: number; lifecycle: EkoRunLifecycle; player: PlayerState;
  route: RouteState; hazards?: HazardRuntimeState; progression?: ProgressionState; resources: ResourceState;
  commandWatermarks: Record<string, number>; randomStreams: AuthoritativeRandomSnapshot; record: RunRecordState;
}

export interface MoveCommandPayload { axis: number; jumpPressed?: boolean; jumpReleased?: boolean; slide?: boolean; vault?: boolean; }
interface CommandEnvelope { schemaVersion: number; runId: string; targetTick: number; priority: number; sourceId: string; sourceSequence: number; }
export interface MoveCommand extends CommandEnvelope { type: "move"; payload: MoveCommandPayload; }
export interface RestartCommand extends CommandEnvelope { type: "restart"; payload: Record<string, never>; }
export interface AdvanceCommand extends CommandEnvelope { type: "advance"; payload: Record<string, never>; }
export type EkoRunCommand = MoveCommand | RestartCommand | AdvanceCommand;
export type ValidatedCommand = EkoRunCommand;
export interface RejectedCommand { command: EkoRunCommand; reason: string; }
export type SemanticEventType =
  | "run.started" | "command.rejected" | "checkpoint.reached" | "run.completed" | "run.failed" | "run.restarted"
  | "player.jumped" | "player.landed" | "player.stumbled" | "player.slid" | "player.vaulted"
  | "hazard.warned" | "hazard.hit" | "hazard.resolved" | "token.collected" | "reward.unlocked"
  | "pacing.changed" | "district.completed" | "district.started" | "integrity.failure";
export interface SemanticEvent { schemaVersion: number; sequence: number; tick: number; type: SemanticEventType; data: Record<string, unknown>; }
export interface StepResult { state: EkoRunState; events: SemanticEvent[]; acceptedCommands: ValidatedCommand[]; rejectedCommands: RejectedCommand[]; checksum: string; }
export interface PlayerControlIntent { axis: number; jumpPressed: boolean; jumpReleased: boolean; slide: boolean; vault: boolean; }
export type ContactKind = "ground" | "slope" | "step" | "wall" | "ceiling" | "moving" | "vault";
export interface PhysicsContact { colliderId: string; kind: ContactKind; }
export interface KinematicStepResult {
  player: PlayerState; contacts: PhysicsContact[]; landed: boolean; jumpStarted: boolean; slideStarted: boolean;
  vaultStarted: boolean; stumbleStarted: boolean; failed: boolean;
}

export interface PublicProgressionSnapshot {
  districtIndex: number; districtId: DistrictId; cycle: number; districtCompletions: number; totalDistance: number;
  pacingBand: PacingBand; difficulty: DifficultyProfile; nextMilestoneX: number | null;
}
export interface PublicResourceSnapshot {
  ekoTokens: number;
  earnedTokenTotal: number;
  unlockedCosmetics: string[];
  unlockedThemes: string[];
  unlockedCelebrations: string[];
}
export interface PublicRecordSnapshot { maxProgress: number; }
export interface EkoRunRenderSnapshot {
  version: number; runId: string; tick: number; lifecycle: EkoRunLifecycle;
  player: { position: Vec2; velocity: Vec2; movementState: MovementState; facing: -1 | 1; checkpointIndex: number; landingCompressionTicksRemaining: number; slideTicksRemaining: number; stumbleTicksRemaining: number; };
  route: { id: string; groundY: number; minX: number; maxX: number; checkpointXs: number[]; finishX: number; };
  hazards: PublicHazardSnapshot[]; progress: number; record: PublicRecordSnapshot; recentEvents: SemanticEvent[];
  progression?: PublicProgressionSnapshot; resources?: PublicResourceSnapshot;
}
export interface EkoRunSnapshot {
  snapshotVersion: number; gameVersion: string; schemaVersion: number; deterministicVersion: number; contentVersion: string;
  runId: string; rootSeed: string; tick: number; state: EkoRunState; checksum: string;
}
export interface ReplayStep { commands: readonly EkoRunCommand[]; }
export interface ReplayResult { state: EkoRunState; finalChecksum: string; checkpointChecksums: string[]; }
