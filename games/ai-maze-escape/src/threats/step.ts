import type { MazeEvent, MazeState } from '../state/types';
import { passageNeighbors } from '../generation/solver';
import { doorBetween } from '../generation/content';

export function stepMazeThreats(
  state: MazeState,
  options: { lanternCounter?: boolean } = {},
): { state: MazeState; events: Omit<MazeEvent, 'seq'>[]; captured: boolean; encounters: number } {
  const next = structuredClone(state);
  const events: Omit<MazeEvent, 'seq'>[] = [];
  const before = next.world.threats.filter(threat => threat.active).map(threat => threat.cell);
  // A genuine evasive AI WAIT can counter one currently disclosed moving guardian.
  // Both ends and ALL intermediate links must be publicly visible, cardinal,
  // reciprocal and unsealed. No future patrol route or hidden cell is consulted.
  // One counter per threat per run; the original lethal collision remains real.
  if (options.lanternCounter && next.lifecycle === 'running'
    && next.ai.mode === 'evading-threat') {
    const hero=next.explorer.cell,width=next.world.width;
    const visible=new Set(next.visibleCells);
    if (visible.has(hero)) {
      for (const threat of [...next.world.threats].sort((a,b)=>
        a.cell-b.cell||a.id.localeCompare(b.id))) {
        if (!threat.active || threat.route.length<2 || threat.lanternParried
          || (threat.pausedUntilTick??0)>next.tick || threat.cell===hero
          || !visible.has(threat.cell)) continue;
        const dx=threat.cell%width-hero%width;
        const dy=Math.floor(threat.cell/width)-Math.floor(hero/width);
        const links=Math.abs(dx)+Math.abs(dy);
        if(links<1||links>2||(dx!==0&&dy!==0))continue;
        const offset=dx?Math.sign(dx):Math.sign(dy)*width;
        let cell=hero,witnessed=true;
        for(let n=0;n<links;n++){
          const nextCell=cell+offset;
          const door=doorBetween(next.world,cell,nextCell);
          if(!visible.has(nextCell)
            ||!passageNeighbors(next.world,cell).includes(nextCell)
            ||!passageNeighbors(next.world,nextCell).includes(cell)
            ||(door&&!door.open)){witnessed=false;break;}
          cell=nextCell;
        }
        if(!witnessed)continue;
        threat.lanternParried=true;
        threat.pausedUntilTick=next.tick+3;
        events.push({tick:next.tick,type:'guardian-lantern-parry',
          data:{id:threat.id,cell:threat.cell}});
        break;
      }
    }
  }

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
