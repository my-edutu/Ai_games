import { skillDefinitions } from './skills';
import type { SkillCameraPose, SkillId, SkillMentorAction, SkillMentorState } from './types';

export function createSkillMentorState(): SkillMentorState {
  return {
    phase: 'idle',
    activeSkillId: null,
    stepIndex: 0,
    evidence: [],
    results: {},
  };
}

function clampQuality(value: number | undefined) {
  if (!Number.isFinite(value)) return 100;
  return Math.max(0, Math.min(100, Math.round(value ?? 100)));
}

function scoreEvidence(skillId: SkillId, state: SkillMentorState) {
  const definition = skillDefinitions[skillId];
  let weighted = 0;
  let weightTotal = 0;
  for (const step of definition.steps) {
    const evidence = state.evidence.find((entry) => entry.stepId === step.id);
    if (!evidence) continue;
    weighted += evidence.quality * step.scoreWeight;
    weightTotal += step.scoreWeight;
  }
  return weightTotal > 0 ? Math.round(weighted / weightTotal) : 0;
}

export function reduceSkillMentor(state: SkillMentorState, action: SkillMentorAction): SkillMentorState {
  if (action.type === 'START_SKILL') {
    return {
      ...state,
      phase: 'focus',
      activeSkillId: action.skillId,
      stepIndex: 0,
      evidence: [],
    };
  }

  if (action.type === 'BEGIN_PRACTICE') {
    if (!state.activeSkillId || state.phase !== 'focus') return state;
    return { ...state, phase: 'practice', stepIndex: 0, evidence: [] };
  }

  if (action.type === 'COMPLETE_STEP') {
    if (!state.activeSkillId || state.phase !== 'practice') return state;
    const definition = skillDefinitions[state.activeSkillId];
    const step = definition.steps[state.stepIndex];
    if (!step || step.actionType !== action.actionType) return state;

    const evidence = [
      ...state.evidence,
      {
        stepId: step.id,
        title: step.title,
        actionType: step.actionType,
        quality: clampQuality(action.quality),
      },
    ];
    const nextIndex = state.stepIndex + 1;

    if (nextIndex < definition.steps.length) {
      return { ...state, evidence, stepIndex: nextIndex };
    }

    const completedState: SkillMentorState = {
      ...state,
      phase: 'complete',
      stepIndex: definition.steps.length - 1,
      evidence,
    };
    const score = scoreEvidence(state.activeSkillId, completedState);
    return {
      ...completedState,
      results: {
        ...state.results,
        [state.activeSkillId]: {
          completed: true,
          score,
          evidence,
        },
      },
    };
  }

  if (action.type === 'EXIT_SKILL') {
    return {
      ...state,
      phase: 'idle',
      activeSkillId: null,
      stepIndex: 0,
      evidence: [],
    };
  }

  return state;
}

export function nearestSkillMentor(x: number, z: number): SkillId | null {
  let nearest: SkillId | null = null;
  let distance = Number.POSITIVE_INFINITY;

  for (const definition of Object.values(skillDefinitions)) {
    const dx = x - definition.mentorPosition[0];
    const dz = z - definition.mentorPosition[2];
    const current = Math.hypot(dx, dz);
    if (current <= definition.learningRadius && current < distance) {
      nearest = definition.id;
      distance = current;
    }
  }

  return nearest;
}

export function skillCameraPose(skillId: SkillId): SkillCameraPose {
  const definition = skillDefinitions[skillId];
  const [mx, , mz] = definition.mentorPosition;
  const [wx, , wz] = definition.workstationPosition;
  const midX = (mx + wx) / 2;
  const midZ = (mz + wz) / 2;
  const dx = wx - mx;
  const dz = wz - mz;
  const length = Math.max(0.001, Math.hypot(dx, dz));
  const sideX = -dz / length;
  const sideZ = dx / length;
  return {
    position: [midX + sideX * 4.6, 2.35, midZ + sideZ * 4.6],
    target: [midX, 1.1, midZ],
    fov: 50,
  };
}
