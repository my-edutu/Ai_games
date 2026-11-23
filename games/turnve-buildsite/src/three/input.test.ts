import { describe, expect, it } from 'vitest';
import { normalizeJoystick, clampPitch } from './input';

describe('Turnve mobile navigation input', () => {
  it('normalizes joystick displacement and clamps it to the control radius', () => {
    expect(normalizeJoystick(25, -25, 50)).toEqual({ x: 0.5, y: -0.5 });
    expect(normalizeJoystick(100, 0, 50)).toEqual({ x: 1, y: 0 });
    expect(normalizeJoystick(0, -100, 50)).toEqual({ x: 0, y: -1 });
  });

  it('keeps touch-look pitch inside a comfortable first-person range', () => {
    expect(clampPitch(Math.PI)).toBeLessThan(Math.PI / 2);
    expect(clampPitch(-Math.PI)).toBeGreaterThan(-Math.PI / 2);
    expect(clampPitch(0.4)).toBeCloseTo(0.4);
  });
});
