export type InteractionKind =
  | 'tap'
  | 'pick-up'
  | 'drag'
  | 'place'
  | 'rotate'
  | 'trace'
  | 'measure'
  | 'mark'
  | 'attach'
  | 'inspect';

export type Vec3 = [number, number, number];
export type Vec2 = [number, number];

export type Vec2Sample = {
  x: number;
  y: number;
  t: number;
};

export type PlacementSample = {
  position: Vec3;
  target: Vec3;
  tolerance: number;
};

export type TraceOptions = {
  start: Vec2;
  end: Vec2;
  corridor: number;
  targetDurationMs: number;
};

export type InteractionScore = {
  quality: number;
  valid: boolean;
  feedback: string;
  metrics: Record<string, number>;
};

export type InteractionTargetDefinition = {
  kind: InteractionKind;
  targetId: string;
  instruction: string;
};

export type SkillInteractionEvidence = {
  kind: InteractionKind;
  metrics: Record<string, number>;
};
