import type { MazeEvent, MazeState } from '../state/types';
import { passageNeighbors } from '../generation/solver';

export function stepMazeThreats(
  state: MazeState,
): { state: MazeState; events: Omit<MazeEvent, 'seq'>[]; captured: boolean; encounters: number } {
  const next = structuredClone(state);
  const events: Omit<MazeEvent, 'seq'>[] = [];
  const before = next.world.threats.filter(threat => threat.active).map(threat => threat.cell);

  for (const threat of next.world.threats) {
    if (!threat.active || threat.route.length < 2 || next.tick < (threat.pausedUntilTick ?? 0)) continue;
    if (next.tick % 2 === 0) {
      let index = threat.routeIndex + threat.direction;
      if (index >= threat.route.length) {
        threat.direction = -1;
        index = threat.route.length - 2;
      } else if (index < 0) {
        threat.direction = 1;
        index = 1;
      }
      threat.routeIndex = index;
      threat.cell = threat.route[index]!;
      events.push({ tick: next.tick, type: 'threat-move', data: { id: threat.id, cell: threat.cell } });
    }
  }

  let encounters = 0;
  for (const threat of next.world.threats) {
    if (!threat.active) continue;
    if (threat.cell === next.explorer.cell) {
      return { state: next, events, captured: true, encounters: 1 };
    }
    if (passageNeighbors(next.world, next.explorer.cell).includes(threat.cell)) encounters += 1;
  }

  if (encounters) {
    next.stats.threatEncounters += encounters;
    events.push({ tick: next.tick, type: 'threat-near', data: { count: encounters, previous: before } });
  }
  return { state: next, events, captured: false, encounters };
}
