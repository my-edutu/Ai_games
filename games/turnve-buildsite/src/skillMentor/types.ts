export type Vec3 = [number, number, number];

export type SkillId = 'masonry' | 'welding' | 'formwork' | 'rebar-quality';

export type SkillActionType =
  | 'identify-materials'
  | 'prepare-bed'
  | 'place-block'
  | 'align-block'
  | 'finish-joint'
  | 'welding-ppe'
  | 'inspect-equipment'
  | 'secure-coupon'
  | 'travel-pass'
  | 'inspect-bead'
  | 'identify-formwork'
  | 'check-line-level'
  | 'check-bracing'
  | 'find-weak-support'
  | 'correct-support'
  | 'verify-formwork'
  | 'read-detail'
  | 'check-spacing'
  | 'check-cover'
  | 'find-mismatch'
  | 'record-discrepancy'
  | 'request-quality-inspection';

export type SkillStep = {
  id: string;
  title: string;
  instruction: string;
  actionType: SkillActionType;
  feedback: string;
  scoreWeight: number;
  worldTarget?: string;
};

export type SkillDefinition = {
  id: SkillId;
  title: string;
  trade: string;
  mentor: string;
  mentorRole: string;
  mentorPosition: Vec3;
  workstationPosition: Vec3;
  learningRadius: number;
  intro: string;
  objective: string;
  safetyNote: string;
  steps: SkillStep[];
};

export type SkillEvidence = {
  stepId: string;
  title: string;
  actionType: SkillActionType;
  quality: number;
};

export type SkillResult = {
  completed: boolean;
  score: number;
  evidence: SkillEvidence[];
};

export type SkillLessonPhase = 'idle' | 'focus' | 'practice' | 'complete';

export type SkillMentorState = {
  phase: SkillLessonPhase;
  activeSkillId: SkillId | null;
  stepIndex: number;
  evidence: SkillEvidence[];
  results: Partial<Record<SkillId, SkillResult>>;
};

export type SkillMentorAction =
  | { type: 'START_SKILL'; skillId: SkillId }
  | { type: 'BEGIN_PRACTICE' }
  | { type: 'COMPLETE_STEP'; actionType: SkillActionType; quality?: number }
  | { type: 'EXIT_SKILL' };

export type SkillCameraPose = {
  position: Vec3;
  target: Vec3;
  fov: number;
};
