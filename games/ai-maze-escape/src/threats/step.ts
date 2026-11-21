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
        // Earned gameplay, not a presentation-only flash: a parried warden
        // can yield ONE already disclosed walkable patrol square away from Pip.
        // The choice is restricted to actual adjacent patrol positions, legal
        // reciprocal connections and currently VISIBLE cells. Never reveal or
        // follow an undisclosed patrol square; an enclosed guardian just braces.
        const retreat = threat.route[threat.routeIndex]===threat.cell
          ? [threat.routeIndex-1,threat.routeIndex+1].flatMap(index=>{
            if(index<0||index>=threat.route.length)return [];
            const destination=threat.route[index];
            if(destination===undefined||destination===hero||!visible.has(destination)
              ||next.world.threats.some(other=>other!==threat&&other.active&&other.cell===destination)
              ||!passageNeighbors(next.world,threat.cell).includes(destination)
              ||!passageNeighbors(next.world,destination).includes(threat.cell))return [];
            const gate=doorBetween(next.world,threat.cell,destination);
            if(gate&&!gate.open)return [];
            const distance=Math.abs(destination%width-hero%width)
              +Math.abs(Math.floor(destination/width)-Math.floor(hero/width));
            return distance>links?[{index,cell:destination,distance}]:[];
          }).sort((a,b)=>b.distance-a.distance||a.cell-b.cell)[0]
          : undefined;
        if(retreat){
          const priorIndex=threat.routeIndex;
          threat.routeIndex=retreat.index;
          threat.direction=retreat.index>priorIndex?1:-1;
          threat.cell=retreat.cell;
          events.push({tick:next.tick,type:'threat-move',
            data:{id:threat.id,cell:threat.cell}});
        }
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
