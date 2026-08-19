import { describe, expect, it } from 'vitest';
import { scoreAlignment, scoreMeasurement, scorePlacement, scoreTrace } from './engine';

describe('skill interaction scoring', () => {
  it('scores placement by 3D distance and rejects placement outside tolerance', () => {
    const near = scorePlacement({ position: [1.03, 0, 1.01], target: [1, 0, 1], tolerance: 0.08 });
    const far = scorePlacement({ position: [1.4, 0, 1], target: [1, 0, 1], tolerance: 0.08 });

    expect(near.valid).toBe(true);
    expect(near.quality).toBeGreaterThanOrEqual(80);
    expect(far.valid).toBe(false);
    expect(far.quality).toBeLessThan(near.quality);
  });

  it('rewards a continuous forward trace and penalizes backtracking', () => {
    const clean = scoreTrace([
      { x: 0, y: 0, t: 0 },
      { x: 0.3, y: 0.02, t: 100 },
      { x: 0.65, y: 0.01, t: 200 },
      { x: 1, y: 0, t: 300 },
    ], { start: [0, 0], end: [1, 0], corridor: 0.12, targetDurationMs: 300 });

    const backtrack = scoreTrace([
      { x: 0, y: 0, t: 0 },
      { x: 0.6, y: 0, t: 100 },
      { x: 0.35, y: 0, t: 180 },
      { x: 1, y: 0, t: 400 },
    ], { start: [0, 0], end: [1, 0], corridor: 0.12, targetDurationMs: 300 });

    expect(clean.valid).toBe(true);
    expect(clean.quality).toBeGreaterThan(backtrack.quality);
    expect(backtrack.metrics.backtracks).toBeGreaterThan(0);
  });

  it('scores measurement and alignment around explicit tolerances', () => {
    const goodMeasurement = scoreMeasurement(201, 200, 5);
    const badMeasurement = scoreMeasurement(235, 200, 5);
    const goodAlignment = scoreAlignment(1, 3);
    const badAlignment = scoreAlignment(9, 3);

    expect(goodMeasurement.quality).toBeGreaterThanOrEqual(90);
    expect(goodMeasurement.valid).toBe(true);
    expect(badMeasurement.valid).toBe(false);
    expect(goodAlignment.quality).toBeGreaterThanOrEqual(90);
    expect(goodAlignment.valid).toBe(true);
    expect(badAlignment.valid).toBe(false);
  });
});
