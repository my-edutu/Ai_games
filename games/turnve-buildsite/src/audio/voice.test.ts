import { describe, expect, it } from 'vitest';
import { buildOnboardingVoice, buildStakeholderGreeting } from './voice';

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
});
