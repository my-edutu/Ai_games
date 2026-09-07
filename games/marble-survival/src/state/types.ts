export interface Vec2 { x: number; y: number }

export type MarbleArchetype = 'navigator' | 'sprinter' | 'bruiser' | 'survivor';
export type MarblePattern = 'dots' | 'chevron' | 'ring' | 'split';
export type MarbleIntent =
  | 'holding-line'
  | 'seeking-gap'
  | 'avoiding-sweeper'
  | 'recovering-momentum'
  | 'taking-risk-route'
  | 'defending-lane'
  | 'final-sprint';
export type ConfidenceBand = 'low' | 'medium' | 'high';
export type MarbleStatus = 'active' | 'qualified' | 'eliminated' | 'champion';
export type MarbleRoundStatus = 'waiting' | 'racing' | 'finished' | 'out';
export type MarbleLifecycle = 'active' | 'round-result' | 'tournament-result' | 'intermission' | 'quarantined';
export type RecordCategory = 'standard' | 'assisted';

export interface MarbleTraits {
  acceleration: number;
  topSpeed: number;
  tractionPermille: number;
  resiliencePermille: number;
  riskPermille: number;
  awareness: number;
  massPermille: number;
}

export interface MarbleCompetitor {
  id: number;
  seedRank: number;
  name: string;
  number: number;
  palette: string;
  pattern: MarblePattern;
  icon: string;
  archetype: MarbleArchetype;
  traits: MarbleTraits;
  status: MarbleStatus;
  roundStatus: MarbleRoundStatus;
  position: Vec2;
  velocity: Vec2;
  checkpointIndex: number;
  progressPermille: number;
  finishTick: number | null;
  finishRank: number | null;
  shieldCharges: number;
  intent: MarbleIntent;
  confidence: ConfidenceBand;
  lastDecisionTick: number;
  lastProgressTick: number;
  impactCount: number;
  recoveryCount: number;
  overtakes: number;
}

export interface MarbleConfig {
  rosterSize: number;
  tickRate: number;
  roundQuotas: number[];
  roundIntroTicks: number;
  roundTimeoutTicks: number;
  intermissionTicks: number;
  worldWidth: number;
  worldHeight: number;
  marbleRadius: number;
  maxSpeed: number;
  baseAcceleration: number;
  frictionPermille: number;
  worldRestitutionPermille: number;
  marbleRestitutionPermille: number;
  penetrationTolerance: number;
  maxSubsteps: number;
  collisionIterations: number;
  maxContactsPerTick: number;
  maxColliders: number;
  maxEventHistory: number;
  noProgressTicks: number;
  decisionInterval: number;
  profile: 'standard' | 'safe' | 'chaos';
}

export interface ArenaBlock {
  id: string;
  kind: 'block';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ArenaBumper {
  id: string;
  kind: 'bumper';
  x: number;
  y: number;
  radius: number;
  restitutionPermille: number;
}

export interface ArenaHazard {
  id: string;
  kind: 'pit' | 'kill-zone';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ArenaWindZone {
  id: string;
  kind: 'wind';
  x: number;
  y: number;
  width: number;
  height: number;
  forceX: number;
  forceY: number;
}

export interface ArenaSweeper {
  id: string;
  kind: 'sweeper';
  baseX: number;
  baseY: number;
  width: number;
  height: number;
  axis: 'x' | 'y';
  amplitude: number;
  periodTicks: number;
  phaseTicks: number;
  restitutionPermille: number;
}

export type RoundArchetype = 'seeding-sprint' | 'gate-gauntlet' | 'hazard-circuit' | 'final-four' | 'championship';

export interface ArenaFeatures {
  archetype: RoundArchetype;
  colliderCount: number;
  expectedContactLoad: number;
  bottlenecks: number;
  hazardDensityPermille: number;
  windIntensity: number;
  routeAsymmetryPermille: number;
  difficultyScore: number;
}

export interface MarbleArena {
  schemaVersion: 1;
  generatorVersion: 'marble-arena-v1';
  id: string;
  roundIndex: number;
  archetype: RoundArchetype;
  width: number;
  height: number;
  spawnY: number;
  finishY: number;
  spawnPoints: Vec2[];
  checkpoints: Vec2[];
  safeLanes: number[];
  obstacles: ArenaBlock[];
  bumpers: ArenaBumper[];
  hazards: ArenaHazard[];
  windZones: ArenaWindZone[];
  sweepers: ArenaSweeper[];
  features: ArenaFeatures;
  repairCount: number;
  fallbackUsed: boolean;
}

export type ArenaValidationCode =
  | 'world-bounds'
  | 'spawn-count'
  | 'spawn-overlap'
  | 'spawn-out-of-bounds'
  | 'finish-order'
  | 'collider-budget'
  | 'contact-budget'
  | 'safe-lane-blocked'
  | 'geometry-out-of-bounds';

export interface ArenaValidationIssue {
  code: ArenaValidationCode;
  entityId?: string;
  detail: string;
}

export interface ArenaValidationReport {
  valid: boolean;
  issues: ArenaValidationIssue[];
  features: ArenaFeatures;
}

export interface MarbleAction {
  marbleId: number;
  steerX: number;
  steerY: number;
  boostPermille: number;
  intent: MarbleIntent;
  confidence: ConfidenceBand;
}

export type ContactKind = 'world' | 'obstacle' | 'bumper' | 'sweeper' | 'marble';

export interface PhysicsContact {
  key: string;
  kind: ContactKind;
  marbleId: number;
  otherMarbleId?: number;
  colliderId?: string;
  impulse: number;
}

export interface IntegrityIssue {
  code: 'numeric-range' | 'contact-overflow' | 'duplicate-marble-id' | 'state-invariant';
  detail: string;
}

export interface PhysicsStepResult {
  state: MarbleState;
  contacts: PhysicsContact[];
  integrityIssue?: IntegrityIssue;
}

export interface MarbleRoundResult {
  roundIndex: number;
  roundNumber: number;
  qualifierIds: number[];
  eliminatedIds: number[];
  resolution: 'quota' | 'timeout' | 'last-standing';
  durationTicks: number;
}

export type MarbleResult =
  | { kind: 'champion'; championId: number; tournamentTicks: number; recordCategory: RecordCategory }
  | { kind: 'technical'; reason: string; tournamentTicks: number; recordCategory: RecordCategory };

export interface MarbleRecords {
  eligible: boolean;
  category: RecordCategory;
  fastestTournamentTicks: number | null;
  closestFinishGap: number | null;
  championStreak: number;
  lastChampionId: number | null;
}

export interface MarbleInfluenceState {
  recordCategory: RecordCategory;
  globalWindX: number;
  globalWindY: number;
  effectUntilTick: number;
}

export interface MarbleState {
  schemaVersion: 1;
  determinismVersion: 'marble-physics-v1';
  runId: string;
  rootSeed: string;
  tournamentSeed: string;
  runIndex: number;
  tick: number;
  tournamentTick: number;
  roundTick: number;
  lifecycle: MarbleLifecycle;
  roundIndex: number;
  roundNumber: number;
  currentQuota: number;
  roundIntroRemaining: number;
  intermissionRemaining: number;
  config: MarbleConfig;
  arena: MarbleArena;
  marbles: MarbleCompetitor[];
  activeIds: number[];
  qualifiedIds: number[];
  eliminatedIds: number[];
  roundResults: MarbleRoundResult[];
  result?: MarbleResult;
  records: MarbleRecords;
  influence: MarbleInfluenceState;
  meaningfulEventTick: number;
  droppedEvents: number;
  integrityIssue?: IntegrityIssue;
}

export interface MarbleEvent {
  seq: number;
  tick: number;
  type: string;
  data?: Record<string, unknown>;
}
