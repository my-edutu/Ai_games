export type SimulationMode = 'guided' | 'assessment';
export type SimulationStage =
  | 'intro'
  | 'ppe'
  | 'briefing'
  | 'site-walk'
  | 'document-review'
  | 'pre-pour'
  | 'crisis'
  | 'artifacts'
  | 'report';

export type WeatherState = 'clear' | 'cloudy' | 'rain';
export type TruckState = 'scheduled' | 'arrived' | 'waiting' | 'released';
export type HazardStatus = 'unseen' | 'observed' | 'reported' | 'resolved';
export type StakeholderId = 'site-manager' | 'hse' | 'foreman' | 'qs' | 'consultant' | 'supplier';
export type ArtifactType = 'safety-observation' | 'rfi' | 'site-diary' | 'supervisor-update';

export type MetricKey =
  | 'safety'
  | 'quality'
  | 'communication'
  | 'documentation'
  | 'problemIdentification'
  | 'escalationJudgment'
  | 'scheduleAwareness'
  | 'costAwareness'
  | 'stakeholderManagement'
  | 'professionalConduct';

export type Metrics = Record<MetricKey, number>;

export interface StakeholderState {
  trust: number;
  frustration: number;
  informationReceived: string[];
  outstandingRequests: string[];
}

export interface HazardState {
  status: HazardStatus;
  evidenceCaptured: boolean;
}

export interface AuditEvent {
  id: string;
  minute: number;
  kind: 'info' | 'decision' | 'consequence' | 'artifact' | 'stakeholder';
  title: string;
  detail: string;
  effects?: string[];
}

export interface SimulationState {
  started: boolean;
  mode: SimulationMode;
  stage: SimulationStage;
  simulatedMinute: number;
  metrics: Metrics;
  stakeholders: Record<StakeholderId, StakeholderState>;
  hazards: Record<string, HazardState>;
  ppe: string[];
  evidence: string[];
  drawingCompared: boolean;
  latestDrawingConfirmed: boolean;
  inspectionRequested: boolean;
  inspectionSigned: boolean;
  weather: WeatherState;
  truck: TruckState;
  checklist: Record<string, boolean>;
  artifactDrafts: Record<ArtifactType, Record<string, string>>;
  artifactScores: Record<ArtifactType, number>;
  artifactSubmitted: Record<ArtifactType, boolean>;
  decisions: string[];
  audit: AuditEvent[];
  hintsUsed: number;
  budgetExposure: number;
  reworkRisk: boolean;
  holdRecommended: boolean;
  supplierUpdated: boolean;
  materialsProtected: boolean;
}

export type SimulationAction =
  | { type: 'START'; mode?: SimulationMode }
  | { type: 'FINISH_INTRO' }
  | { type: 'TOGGLE_PPE'; item: string }
  | { type: 'COMPLETE_PPE' }
  | { type: 'START_SITE_WALK' }
  | { type: 'DISCOVER_HAZARD'; hazardId: string }
  | { type: 'CAPTURE_EVIDENCE'; hazardId: string }
  | { type: 'REPORT_HAZARD'; hazardId: string }
  | { type: 'RESOLVE_HAZARD'; hazardId: string }
  | { type: 'COMPARE_DRAWINGS' }
  | { type: 'CONTACT_STAKEHOLDER'; stakeholderId: StakeholderId; topic: string }
  | { type: 'SET_CHECKLIST'; itemId: string; value: boolean }
  | { type: 'TRIGGER_CRISIS' }
  | { type: 'TRIGGER_TRUCK' }
  | { type: 'TRIGGER_RAIN' }
  | { type: 'RECOMMEND_HOLD' }
  | { type: 'REQUEST_INSPECTION' }
  | { type: 'UPDATE_SUPPLIER' }
  | { type: 'ASK_QS_COST' }
  | { type: 'PROTECT_MATERIALS' }
  | { type: 'ALLOW_POUR' }
  | { type: 'MOVE_TO_ARTIFACTS' }
  | { type: 'SET_ARTIFACT_FIELD'; artifact: ArtifactType; field: string; value: string }
  | { type: 'PREFILL_ARTIFACT'; artifact: ArtifactType }
  | { type: 'SUBMIT_ARTIFACT'; artifact: ArtifactType }
  | { type: 'USE_HINT' }
  | { type: 'TICK'; minutes?: number }
  | { type: 'OPEN_REPORT' }
  | { type: 'APPLY_RECOMMENDED_SEQUENCE' }
  | { type: 'RESET' };

export interface ReadinessReport {
  overall: number;
  readiness: string;
  strongestMetric: { key: MetricKey; score: number };
  weakestMetric: { key: MetricKey; score: number };
  strongestArtifact: { type: ArtifactType; score: number } | null;
  weakestArtifact: { type: ArtifactType; score: number } | null;
  skillsDemonstrated: string[];
  missedRisks: string[];
  consequenceChain: AuditEvent[];
  supervisorFeedback: string;
}
