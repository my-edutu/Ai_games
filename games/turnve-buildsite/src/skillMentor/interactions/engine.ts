import type { InteractionScore, PlacementSample, TraceOptions, Vec2Sample } from './types';

const clampQuality = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function scorePlacement(sample: PlacementSample): InteractionScore {
  const [x, y, z] = sample.position;
  const [tx, ty, tz] = sample.target;
  const distance = Math.hypot(x - tx, y - ty, z - tz);
  const tolerance = Math.max(0.0001, sample.tolerance);
  const ratio = distance / tolerance;
  const quality = clampQuality(100 - ratio * 20);
  const valid = distance <= tolerance;
  return {
    quality,
    valid,
    feedback: valid ? 'Placement is inside the highlighted tolerance.' : 'Move the workpiece into the highlighted placement zone before releasing it.',
    metrics: { distance, tolerance },
  };
}

export function scoreMeasurement(actual: number, expected: number, tolerance: number): InteractionScore {
  const safeTolerance = Math.max(0.0001, Math.abs(tolerance));
  const error = Math.abs(actual - expected);
  const quality = clampQuality(100 - (error / safeTolerance) * 12);
  const valid = error <= safeTolerance * 2;
  return {
    quality,
    valid,
    feedback: error <= safeTolerance ? 'Measurement is within target tolerance.' : 'Reposition the gauge on the marked points and measure again.',
    metrics: { actual, expected, tolerance: safeTolerance, error },
  };
}

export function scoreAlignment(offsetMm: number, toleranceMm: number): InteractionScore {
  const tolerance = Math.max(0.0001, Math.abs(toleranceMm));
  const error = Math.abs(offsetMm);
  const quality = clampQuality(100 - (error / tolerance) * 20);
  const valid = error <= tolerance * 2;
  return {
    quality,
    valid,
    feedback: error <= tolerance ? 'Alignment is within the working tolerance.' : 'Correct the offset before accepting the alignment.',
    metrics: { offsetMm, toleranceMm: tolerance, error },
  };
}

function projectedProgress(sample: Vec2Sample, startX: number, startY: number, ux: number, uy: number, lineLength: number) {
  if (lineLength <= 0.0001) return 0;
  return ((sample.x - startX) * ux + (sample.y - startY) * uy) / lineLength;
}

export function scoreTrace(inputSamples: Vec2Sample[], options: TraceOptions): InteractionScore {
  const samples = inputSamples.slice(0, 96);
  if (samples.length < 2) {
    return { quality: 0, valid: false, feedback: 'Complete the full guided path from start to finish.', metrics: { samples: samples.length, backtracks: 0 } };
  }

  const [sx, sy] = options.start;
  const [ex, ey] = options.end;
  const dx = ex - sx;
  const dy = ey - sy;
  const lineLength = Math.max(0.0001, Math.hypot(dx, dy));
  const ux = dx / lineLength;
  const uy = dy / lineLength;
  const corridor = Math.max(0.0001, options.corridor);

  let deviationTotal = 0;
  let backtracks = 0;
  let previousProgress = projectedProgress(samples[0], sx, sy, ux, uy, lineLength);
  for (const sample of samples) {
    const relX = sample.x - sx;
    const relY = sample.y - sy;
    const perpendicular = Math.abs(relX * uy - relY * ux);
    deviationTotal += perpendicular;
    const progress = projectedProgress(sample, sx, sy, ux, uy, lineLength);
    if (progress < previousProgress - 0.05) backtracks += 1;
    previousProgress = progress;
  }

  const first = samples[0];
  const last = samples[samples.length - 1];
  const startError = Math.hypot(first.x - sx, first.y - sy);
  const endError = Math.hypot(last.x - ex, last.y - ey);
  const averageDeviation = deviationTotal / samples.length;
  const duration = Math.max(0, last.t - first.t);
  const targetDuration = Math.max(1, options.targetDurationMs);
  const durationErrorRatio = Math.min(2, Math.abs(duration - targetDuration) / targetDuration);
  const deviationPenalty = Math.min(45, (averageDeviation / corridor) * 30);
  const backtrackPenalty = Math.min(35, backtracks * 14);
  const timingPenalty = Math.min(20, durationErrorRatio * 14);
  const completionPenalty = Math.min(30, (endError / corridor) * 12);
  const quality = clampQuality(100 - deviationPenalty - backtrackPenalty - timingPenalty - completionPenalty);
  const valid = startError <= corridor * 1.5 && endError <= corridor * 1.5 && averageDeviation <= corridor * 1.5;

  return {
    quality,
    valid,
    feedback: valid
      ? backtracks > 0 ? 'Path completed. Keep the next pass moving forward without backtracking.' : 'Path completed with controlled travel.'
      : 'Stay inside the highlighted work path and finish at the marked endpoint.',
    metrics: {
      samples: samples.length,
      startError,
      endError,
      averageDeviation,
      backtracks,
      duration,
      targetDuration,
    },
  };
}
