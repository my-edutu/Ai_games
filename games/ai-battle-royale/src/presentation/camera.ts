import type { BattleRenderSnapshot } from './snapshot';

export interface BattleCameraPlan {
  mode: 'overview' | 'focus' | 'final-circle' | 'result' | 'recovery';
  targetCell: number;
  zoom: number;
  impulse: number;
}

export function deriveBattleCamera(
  snapshot: BattleRenderSnapshot,
  previous: BattleRenderSnapshot | null,
): BattleCameraPlan {
  const fallbackCell = Math.floor(snapshot.arena.height / 2) * snapshot.arena.width + Math.floor(snapshot.arena.width / 2);
  if (snapshot.scene === 'recovery') return { mode: 'recovery', targetCell: fallbackCell, zoom: 0.9, impulse: 0 };
  if (snapshot.scene === 'result' || snapshot.scene === 'intermission') {
    return { mode: 'result', targetCell: snapshot.focus?.cell ?? fallbackCell, zoom: 1.18, impulse: previous?.scene === 'result' ? 0 : 0.32 };
  }
  if (snapshot.scene === 'final-circle') {
    return { mode: 'final-circle', targetCell: snapshot.zone.centerCell, zoom: 1.38, impulse: previous?.scene === 'final-circle' ? 0.04 : 0.22 };
  }
  const decisiveEvent = snapshot.recentEvents.slice(-6).reverse().find((event) => event.importance >= 4 && Number.isInteger(event.cell));
  if (decisiveEvent?.cell !== undefined) return { mode: 'focus', targetCell: decisiveEvent.cell, zoom: 1.2, impulse: 0.18 };
  if (snapshot.focus && snapshot.goal.survivors <= Math.ceil(snapshot.goal.totalContenders * 0.5)) {
    return { mode: 'focus', targetCell: snapshot.focus.cell, zoom: 1.08, impulse: 0.04 };
  }
  return { mode: 'overview', targetCell: snapshot.zone.centerCell, zoom: 0.96, impulse: 0 };
}
