export type AntOutputHealthStatus = 'healthy' | 'stale' | 'frozen' | 'black' | 'silent' | 'wrong-scene';
export interface AntOutputHealthInput { nowMs: number; lastSnapshotMs: number; lastProgressMs: number; frameLuma: number; pixelHash: string; previousPixelHash: string; audioExpected: boolean; audioLevel: number; expectedScene: string; actualScene: string }
export interface AntOutputHealth { status: AntOutputHealthStatus; recoverable: boolean; publicMessage: string; operatorCode: string }
export function classifyAntOutputHealth(input: AntOutputHealthInput): AntOutputHealth {
  if (input.nowMs - input.lastSnapshotMs > 3000) return { status: 'stale', recoverable: true, publicMessage: 'Restoring the live colony view.', operatorCode: 'SNAPSHOT_STALE' };
  if (input.frameLuma <= 0.01) return { status: 'black', recoverable: true, publicMessage: 'Restoring the live colony view.', operatorCode: 'FRAME_BLACK' };
  if (input.nowMs - input.lastProgressMs > 3000 && input.pixelHash === input.previousPixelHash) return { status: 'frozen', recoverable: true, publicMessage: 'Refreshing the live colony view.', operatorCode: 'FRAME_FROZEN' };
  if (input.expectedScene !== input.actualScene) return { status: 'wrong-scene', recoverable: true, publicMessage: 'Synchronizing the colony scene.', operatorCode: 'SCENE_MISMATCH' };
  if (input.audioExpected && input.audioLevel <= 0.001) return { status: 'silent', recoverable: true, publicMessage: 'Visual gameplay continues while audio reconnects.', operatorCode: 'AUDIO_SILENT' };
  return { status: 'healthy', recoverable: false, publicMessage: 'Colony broadcast healthy.', operatorCode: 'OK' };
}
