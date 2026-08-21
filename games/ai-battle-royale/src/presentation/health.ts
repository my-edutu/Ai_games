import type { BattlePublicScene } from './snapshot';

export type BattleOutputHealthStatus = 'healthy' | 'stale' | 'frozen' | 'black' | 'silent' | 'wrong-scene';

export interface BattleOutputHealthSample {
  nowMs: number;
  lastSnapshotMs: number;
  lastProgressMs: number;
  frameLuma: number;
  pixelHash: string;
  previousPixelHash: string;
  audioExpected: boolean;
  audioLevel: number;
  expectedScene: BattlePublicScene;
  actualScene: BattlePublicScene;
}

export interface BattleOutputHealthResult {
  status: BattleOutputHealthStatus;
  reason: string;
}

export function classifyBattleOutputHealth(sample: BattleOutputHealthSample): BattleOutputHealthResult {
  if (sample.nowMs - sample.lastSnapshotMs > 2_000) return { status: 'stale', reason: 'render snapshot age exceeded 2000ms' };
  if (sample.nowMs - sample.lastProgressMs > 3_000 && sample.pixelHash === sample.previousPixelHash) return { status: 'frozen', reason: 'frame and progress remained unchanged beyond 3000ms' };
  if (!Number.isFinite(sample.frameLuma) || sample.frameLuma <= 0.01) return { status: 'black', reason: 'frame luminance is below the output threshold' };
  if (sample.audioExpected && (!Number.isFinite(sample.audioLevel) || sample.audioLevel <= 0.01)) return { status: 'silent', reason: 'semantic audio was expected but not observed' };
  if (sample.expectedScene !== sample.actualScene) return { status: 'wrong-scene', reason: `expected ${sample.expectedScene} but observed ${sample.actualScene}` };
  return { status: 'healthy', reason: 'snapshot, progress, frame, audio and scene probes are healthy' };
}
