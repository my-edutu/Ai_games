import type { Vec2 } from '../state/types';

export const FIXED_SCALE = 1_000;

export function clampInteger(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return value < 0 ? minimum : maximum;
  return Math.max(minimum, Math.min(maximum, Math.round(value)));
}

export function divideRound(numerator: number, denominator: number): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) throw new RangeError('division');
  const sign = numerator < 0 !== denominator < 0 ? -1 : 1;
  const absolute = Math.abs(numerator);
  const divisor = Math.abs(denominator);
  return sign * Math.floor((absolute + Math.floor(divisor / 2)) / divisor);
}

export function multiplyDivide(value: number, multiplier: number, denominator: number): number {
  return divideRound(value * multiplier, denominator);
}

export function integerSqrt(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError('integerSqrt');
  if (value < 2) return value;
  let low = 1;
  let high = Math.min(value, 94_906_265);
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const square = middle * middle;
    if (square === value) return middle;
    if (square < value) low = middle + 1;
    else high = middle - 1;
  }
  return high;
}

export function length(value: Vec2): number {
  const x = clampInteger(value.x, -10_000_000, 10_000_000);
  const y = clampInteger(value.y, -10_000_000, 10_000_000);
  return integerSqrt(x * x + y * y);
}

export function normalizePermille(value: Vec2, fallback: Vec2 = { x: FIXED_SCALE, y: 0 }): Vec2 {
  const magnitude = length(value);
  if (magnitude === 0) return { ...fallback };
  return {
    x: divideRound(value.x * FIXED_SCALE, magnitude),
    y: divideRound(value.y * FIXED_SCALE, magnitude)
  };
}

export function clampMagnitude(value: Vec2, maximum: number): Vec2 {
  const magnitude = length(value);
  if (magnitude <= maximum || magnitude === 0) return { x: Math.round(value.x), y: Math.round(value.y) };
  return {
    x: divideRound(value.x * maximum, magnitude),
    y: divideRound(value.y * maximum, magnitude)
  };
}

export function dotPermille(a: Vec2, normalPermille: Vec2): number {
  return divideRound(a.x * normalPermille.x + a.y * normalPermille.y, FIXED_SCALE);
}

export function triangleWave(tick: number, periodTicks: number, amplitude: number, phaseTicks = 0): number {
  if (!Number.isInteger(periodTicks) || periodTicks < 2) throw new RangeError('periodTicks');
  const normalized = ((tick + phaseTicks) % periodTicks + periodTicks) % periodTicks;
  const half = Math.floor(periodTicks / 2);
  if (normalized <= half) return divideRound((normalized * 2 - half) * amplitude, half);
  return divideRound((periodTicks + half - normalized * 2) * amplitude, periodTicks - half);
}
