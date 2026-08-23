import { describe, expect, it } from 'vitest';
import { PRESTART_CINEMATIC_DURATION, preStartCinematicPose } from './cinematic';

describe('BuildSite pre-start cinematic', () => {
  it('loops the full camera tour until the learner starts', () => {
    const start = preStartCinematicPose(0);
    const middle = preStartCinematicPose(PRESTART_CINEMATIC_DURATION * 0.5);
    const looped = preStartCinematicPose(PRESTART_CINEMATIC_DURATION);

    expect(start.position).toEqual(looped.position);
    expect(start.target).toEqual(looped.target);
    expect(middle.position).not.toEqual(start.position);
    expect(PRESTART_CINEMATIC_DURATION).toBeGreaterThanOrEqual(18);
  });

  it('wraps elapsed time instead of stopping at the final shot', () => {
    const early = preStartCinematicPose(1.25);
    const afterLoop = preStartCinematicPose(PRESTART_CINEMATIC_DURATION + 1.25);

    expect(afterLoop.position).toEqual(early.position);
    expect(afterLoop.target).toEqual(early.target);
  });
});
