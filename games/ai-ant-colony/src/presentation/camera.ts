import type { AntRenderSnapshot } from './snapshot';
export interface AntCameraState {
  mode: 'overview' | 'resource-run' | 'queen-defense' | 'result' | 'recovery';
  focus: { x: number; y: number };
  zoom: number;
  impulse: number;
  durationMs: number;
}
function cellPoint(snapshot: AntRenderSnapshot, cell: number) {
  return { x: cell % snapshot.world.width, y: Math.floor(cell / snapshot.world.width) };
}
export function deriveAntCamera(snapshot: AntRenderSnapshot, previous: AntRenderSnapshot | null): AntCameraState {
  const nest = cellPoint(snapshot, snapshot.world.nestCenter);
  if (snapshot.scene === 'recovery') return { mode: 'recovery', focus: nest, zoom: 1, impulse: 0, durationMs: 600 };
  if (snapshot.scene === 'result') return { mode: 'result', focus: nest, zoom: 1.28, impulse: snapshot.result?.reason === 'ascension' ? 0.18 : 0.08, durationMs: 900 };
  if (snapshot.colony.threat >= 60 || snapshot.predators.length > 0) {
    const predator = snapshot.predators[0];
    return { mode: 'queen-defense', focus: predator ? { x: predator.x, y: predator.y } : nest, zoom: 1.42, impulse: Math.min(0.55, snapshot.colony.threat / 180), durationMs: 420 };
  }
  const carrying = snapshot.ants.find(ant => ant.carryingFood > 0);
  const delivered = previous ? snapshot.colony.foodDelivered > previous.colony.foodDelivered : false;
  if (carrying || delivered) return { mode: 'resource-run', focus: carrying ? { x: carrying.x, y: carrying.y } : nest, zoom: 1.18, impulse: 0, durationMs: 520 };
  return { mode: 'overview', focus: nest, zoom: 1, impulse: 0, durationMs: 700 };
}
