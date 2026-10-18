import { describe, expect, it } from 'vitest';
import { skillDefinitions } from '../skillMentor/skills';
import { buildOnboardingVoice, buildSkillMentorIntro, buildSkillStepVoice, buildStakeholderGreeting } from './voice';

describe('Turnve contextual voice guidance', () => {
  it('personalizes onboarding prompts without becoming a long narration', () => {
    expect(buildOnboardingVoice('intro', 'Chidi Okafor')).toContain('Chidi');
    expect(buildOnboardingVoice('ppe', 'Chidi Okafor')).toMatch(/PPE|protect/i);
    expect(buildOnboardingVoice('site-walk', 'Chidi Okafor')).toMatch(/move|tap|site/i);
    expect(buildOnboardingVoice('report', 'Chidi Okafor')).toBe('');
  });

  it('greets the learner by name when approaching a named stakeholder', () => {
    expect(buildStakeholderGreeting('site-manager', 'Chidi Okafor')).toMatch(/Hello Chidi/);
    expect(buildStakeholderGreeting('site-manager', 'Chidi Okafor')).toMatch(/Maya/);
    expect(buildStakeholderGreeting('hse', 'Amina Yusuf')).toMatch(/Hello Amina/);
  });

  it('creates concise personalized skill mentor introductions', () => {
    const masonry = skillDefinitions.masonry;
    const intro = buildSkillMentorIntro(masonry, 'Amina Yusuf');
    expect(intro).toContain('Amina');
    expect(intro).toContain('Emeka');
    expect(intro).toMatch(/masonry|block/i);
    expect(intro.length).toBeLessThan(420);
  });

  it('speaks the active lesson step with mentor context', () => {
    const welding = skillDefinitions.welding;
    const step = welding.steps[3];
    const line = buildSkillStepVoice(welding, step, 'Chidi Okafor');
    expect(line).toContain('Chidi');
    expect(line).toContain('Tunde');
    expect(line).toMatch(/travel|steady|pass/i);
  });
});
