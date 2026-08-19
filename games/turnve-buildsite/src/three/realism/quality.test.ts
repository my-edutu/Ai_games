import { describe, expect, it } from 'vitest';
import { deterministicNoise, selectRenderQuality } from './quality';

describe('BuildSite realism quality controls', () => {
  it('keeps coarse-pointer phones on the mobile realism tier', () => {
    expect(selectRenderQuality({ width: 390, dpr: 3, coarsePointer: true })).toBe('mobile');
    expect(selectRenderQuality({ width: 820, dpr: 2, coarsePointer: true })).toBe('mobile');
  });

  it('uses balanced and high tiers only when screen/input budget allows it', () => {
    expect(selectRenderQuality({ width: 1024, dpr: 1.5, coarsePointer: false })).toBe('balanced');
    expect(selectRenderQuality({ width: 1440, dpr: 1, coarsePointer: false })).toBe('high');
  });

  it('generates deterministic procedural noise for repeatable PBR textures', () => {
    expect(deterministicNoise(1337, 10)).toBe(deterministicNoise(1337, 10));
    expect(deterministicNoise(1337, 10)).not.toBe(deterministicNoise(1337, 11));
    expect(deterministicNoise(1337, 10)).toBeGreaterThanOrEqual(0);
    expect(deterministicNoise(1337, 10)).toBeLessThanOrEqual(1);
  });
});
