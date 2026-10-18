import { describe, expect, it } from 'vitest';
import { createSkillMentorState, nearestSkillMentor, reduceSkillMentor, skillCameraPose } from './engine';
import { skillDefinitions } from './skills';

describe('Skill Mentor engine', () => {
  it('ships four distinct construction skill lessons', () => {
    expect(Object.keys(skillDefinitions).sort()).toEqual(['formwork', 'masonry', 'rebar-quality', 'welding']);
    expect(skillDefinitions.masonry.steps.length).toBeGreaterThanOrEqual(5);
    expect(skillDefinitions.welding.steps.length).toBeGreaterThanOrEqual(5);
    expect(skillDefinitions.formwork.steps.length).toBeGreaterThanOrEqual(5);
    expect(skillDefinitions['rebar-quality'].steps.length).toBeGreaterThanOrEqual(5);
  });

  it('resolves the nearest mentor only inside the learning radius', () => {
    const mentor = nearestSkillMentor(-17.8, 7.8);
    expect(mentor).toBe('masonry');
    expect(nearestSkillMentor(28, 28)).toBeNull();
  });

  it('starts a lesson at the first step and ignores the wrong action', () => {
    let state = createSkillMentorState();
    state = reduceSkillMentor(state, { type: 'START_SKILL', skillId: 'formwork' });
    expect(state.phase).toBe('focus');
    expect(state.activeSkillId).toBe('formwork');
    expect(state.stepIndex).toBe(0);

    state = reduceSkillMentor(state, { type: 'BEGIN_PRACTICE' });
    const before = state;
    state = reduceSkillMentor(state, { type: 'COMPLETE_STEP', actionType: 'check-cover', quality: 100 });
    expect(state).toEqual(before);
  });

  it('advances valid actions and computes deterministic weighted skill score', () => {
    const definition = skillDefinitions.masonry;
    let state = createSkillMentorState();
    state = reduceSkillMentor(state, { type: 'START_SKILL', skillId: 'masonry' });
    state = reduceSkillMentor(state, { type: 'BEGIN_PRACTICE' });

    definition.steps.forEach((step, index) => {
      state = reduceSkillMentor(state, {
        type: 'COMPLETE_STEP',
        actionType: step.actionType,
        quality: index === 2 ? 70 : 100,
      });
    });

    expect(state.phase).toBe('complete');
    expect(state.results.masonry?.completed).toBe(true);
    expect(state.results.masonry?.score).toBeGreaterThanOrEqual(90);
    expect(state.results.masonry?.evidence).toHaveLength(definition.steps.length);
  });

  it('exits a lesson without deleting earned skill evidence', () => {
    const definition = skillDefinitions.welding;
    let state = createSkillMentorState();
    state = reduceSkillMentor(state, { type: 'START_SKILL', skillId: 'welding' });
    state = reduceSkillMentor(state, { type: 'BEGIN_PRACTICE' });
    for (const step of definition.steps) {
      state = reduceSkillMentor(state, { type: 'COMPLETE_STEP', actionType: step.actionType, quality: 88 });
    }
    const score = state.results.welding?.score;
    state = reduceSkillMentor(state, { type: 'EXIT_SKILL' });
    expect(state.phase).toBe('idle');
    expect(state.activeSkillId).toBeNull();
    expect(state.results.welding?.score).toBe(score);
  });

  it('provides a deterministic cinematic camera pose for every skill', () => {
    for (const skillId of Object.keys(skillDefinitions) as (keyof typeof skillDefinitions)[]) {
      const pose = skillCameraPose(skillId);
      expect(pose.position).toHaveLength(3);
      expect(pose.target).toHaveLength(3);
      expect(pose.fov).toBeGreaterThanOrEqual(42);
      expect(pose.fov).toBeLessThanOrEqual(58);
    }
  });
});
