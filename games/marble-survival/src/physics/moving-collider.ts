import type { ArenaSweeper } from '../state/types';
import { divideRound, triangleWave } from './fixed';

export interface SweeperTransform {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  axis: 'x' | 'y';
  velocityX: number;
  velocityY: number;
}

export function sweeperTransform(
  sweeper: ArenaSweeper,
  tick: number,
  substepNumerator = 0,
  substepDenominator = 1
): SweeperTransform {
  if (!Number.isInteger(tick)) throw new RangeError('tick');
  if (!Number.isInteger(substepNumerator) || !Number.isInteger(substepDenominator) || substepDenominator <= 0 || substepNumerator < 0 || substepNumerator > substepDenominator) {
    throw new RangeError('substep');
  }
  const currentOffset = triangleWave(tick, sweeper.periodTicks, sweeper.amplitude, sweeper.phaseTicks);
  const nextOffset = triangleWave(tick + 1, sweeper.periodTicks, sweeper.amplitude, sweeper.phaseTicks);
  const delta = nextOffset - currentOffset;
  const offset = currentOffset + divideRound(delta * substepNumerator, substepDenominator);
  const velocityX = sweeper.axis === 'x' ? delta : 0;
  const velocityY = sweeper.axis === 'y' ? delta : 0;
  return {
    id: sweeper.id,
    x: sweeper.baseX + (sweeper.axis === 'x' ? offset : 0),
    y: sweeper.baseY + (sweeper.axis === 'y' ? offset : 0),
    width: sweeper.width,
    height: sweeper.height,
    axis: sweeper.axis,
    velocityX,
    velocityY
  };
}
