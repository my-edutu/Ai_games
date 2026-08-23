import { describe, expect, it } from 'vitest';
import { communicationHint, sanitizeLearnerName, weatherForMinute } from './experience';

describe('Turnve BuildSite experience helpers', () => {
  it('keeps a safe human learner name for use throughout the simulation', () => {
    expect(sanitizeLearnerName('  chidi   okafor  ')).toBe('Chidi Okafor');
    expect(sanitizeLearnerName('<script>Paul</script>')).toBe('Paul');
    expect(sanitizeLearnerName('')).toBe('');
  });

  it('progresses the modeled shift from daylight into cloud and rain', () => {
    expect(weatherForMinute(0)).toBe('clear');
    expect(weatherForMinute(24)).toBe('clear');
    expect(weatherForMinute(25)).toBe('cloudy');
    expect(weatherForMinute(49)).toBe('cloudy');
    expect(weatherForMinute(50)).toBe('rain');
  });

  it('creates contextual communication coaching when the learner meets site staff', () => {
    const maya = communicationHint('site-manager', 'site-walk', 'Chidi');
    expect(maya.title).toContain('Maya');
    expect(maya.message).toContain('Chidi');
    expect(maya.suggestedTopic).toMatch(/readiness|observation/i);

    const grace = communicationHint('consultant', 'pre-pour', 'Chidi');
    expect(grace.message).toMatch(/inspection|approval/i);
  });
});
