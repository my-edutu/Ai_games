import type{FloorsConfig}from '../../../../packages/game-contracts/src/index';
import type{GeneratedFloor}from '../state/types';
import{fromCell,toCell}from './floor';

export type FloorValidationError='EXIT_UNREACHABLE'|'SPAWN_UNSAFE'|'CELL_OVERLAP'|'ENTITY_BUDGET'|'OUT_OF_BOUNDS'|'MISSING_OBJECTIVE';
export interface FloorValidation{valid:boolean;reachableExit:boolean;safeSpawn:boolean;errors:FloorValidationError[];visitedCells:number}

function inBounds(cell:number,floor:GeneratedFloor):boolean{return Number.isInteger(cell)&&cell>=0&&cell<floor.width*floor.height}
function neighbors(cell:number,floor:GeneratedFloor):number[]{
  const{x,y}=fromCell(cell,floor.width),out:number[]=[];
  if(x>0)out.push(toCell(x-1,y,floor.width));if(x<floor.width-1)out.push(toCell(x+1,y,floor.width));
  if(y>0)out.push(toCell(x,y-1,floor.width));if(y<floor.height-1)out.push(toCell(x,y+1,floor.width));
  return out;
}

function reachable(floor:GeneratedFloor):{found:boolean;visited:number}{
  const walls=new Set(floor.walls);if(walls.has(floor.start)||walls.has(floor.exit))return{found:false,visited:0};
  const queue=[floor.start],seen=new Set<number>(queue);
  for(let cursor=0;cursor<queue.length;cursor++){
    const cell=queue[cursor];if(cell===floor.exit)return{found:true,visited:seen.size};
    for(const next of neighbors(cell,floor))if(!walls.has(next)&&!seen.has(next)){seen.add(next);queue.push(next)}
  }
  return{found:false,visited:seen.size};
}

export function validateFloor(floor:GeneratedFloor,config:FloorsConfig):FloorValidation{
  const errors=new Set<FloorValidationError>();
  if(floor.width!==config.width||floor.height!==config.height||!inBounds(floor.start,floor)||!inBounds(floor.exit,floor))errors.add('OUT_OF_BOUNDS');
  const allCells=[...floor.walls,...floor.mandatoryPath,...floor.enemies.map(e=>e.cell),...floor.hazards.map(h=>h.cell),...floor.rewardCells];
  if(allCells.some(cell=>!inBounds(cell,floor)))errors.add('OUT_OF_BOUNDS');
  const occupied=new Map<number,string>();
  for(const cell of floor.walls)occupied.set(cell,'wall');
  for(const cell of floor.enemies.map(e=>e.cell)){if(occupied.has(cell))errors.add('CELL_OVERLAP');occupied.set(cell,'enemy')}
  for(const cell of floor.hazards.map(h=>h.cell)){if(occupied.has(cell))errors.add('CELL_OVERLAP');occupied.set(cell,'hazard')}
  for(const cell of floor.rewardCells){if(occupied.has(cell))errors.add('CELL_OVERLAP');occupied.set(cell,'reward')}
  if(floor.mandatoryPath.some(cell=>new Set(floor.walls).has(cell)))errors.add('CELL_OVERLAP');
  if(floor.enemies.length>config.maxEnemyBudget)errors.add('ENTITY_BUDGET');
  const route=reachable(floor);if(!route.found)errors.add('EXIT_UNREACHABLE');
  const safeCells=new Set(floor.mandatoryPath.slice(0,Math.min(2,floor.mandatoryPath.length)));
  const safeSpawn=!floor.enemies.some(e=>safeCells.has(e.cell))&&!floor.hazards.some(h=>safeCells.has(h.cell));
  if(!safeSpawn)errors.add('SPAWN_UNSAFE');
  if(floor.mandatoryPath[0]!==floor.start||floor.mandatoryPath[floor.mandatoryPath.length-1]!==floor.exit||floor.mandatoryPath.length<2)errors.add('MISSING_OBJECTIVE');
  return{valid:errors.size===0,reachableExit:route.found,safeSpawn,errors:[...errors].sort(),visitedCells:route.visited};
}

function stableFreeCells(floor:GeneratedFloor):number[]{
  const protectedCells=new Set([...floor.mandatoryPath]);
  const cells:number[]=[];for(let y=1;y<floor.height-1;y++)for(let x=1;x<floor.width-1;x++){const cell=toCell(x,y,floor.width);if(!protectedCells.has(cell))cells.push(cell)}
  return cells.sort((a,b)=>a-b);
}

export function repairFloor(floor:GeneratedFloor,_validation:FloorValidation,config:FloorsConfig):GeneratedFloor{
  const repaired=structuredClone(floor);
  const path=new Set(repaired.mandatoryPath),maxCell=repaired.width*repaired.height;
  repaired.walls=[...new Set(repaired.walls.filter(cell=>cell>=0&&cell<maxCell&&!path.has(cell)&&cell!==repaired.start&&cell!==repaired.exit))].sort((a,b)=>a-b);
  const reserved=new Set(repaired.walls),free=stableFreeCells(repaired).filter(cell=>!reserved.has(cell));let cursor=0;
  const take=(preferred:number):number=>{
    if(preferred>=0&&preferred<maxCell&&!path.has(preferred)&&!reserved.has(preferred)){reserved.add(preferred);return preferred}
    while(cursor<free.length&&reserved.has(free[cursor]))cursor++;
    if(cursor>=free.length)return repaired.exit;
    const cell=free[cursor++];reserved.add(cell);return cell;
  };
  repaired.enemies=repaired.enemies.slice(0,config.maxEnemyBudget).map(enemy=>({...enemy,cell:take(enemy.cell)}));
  repaired.hazards=repaired.hazards.map(hazard=>({...hazard,cell:take(hazard.cell)}));
  repaired.rewardCells=repaired.rewardCells.map(take).filter(cell=>cell!==repaired.exit).sort((a,b)=>a-b);
  repaired.featureReport={...repaired.featureReport,repairCount:Math.min(2,repaired.featureReport.repairCount+1),fallbackUsed:false};
  return repaired;
}
