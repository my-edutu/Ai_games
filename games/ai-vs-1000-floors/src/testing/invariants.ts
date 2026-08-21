import{validateFloor}from '../generation/validator';
import type{FloorsState}from '../state/types';

export function inspectFloorsInvariants(state:FloorsState):string[]{
  const failures:string[]=[];
  const boardSize=state.floor.width*state.floor.height;
  if(state.floor.number<1||state.floor.number>state.config.totalFloors)failures.push('FLOOR_RANGE');
  if(state.player.cell<0||state.player.cell>=boardSize)failures.push('PLAYER_OUT_OF_BOUNDS');
  if(state.floor.walls.includes(state.player.cell))failures.push('PLAYER_IN_WALL');
  if(state.player.health<0||state.player.health>state.player.maxHealth)failures.push('PLAYER_HEALTH_RANGE');
  if(state.player.energy<0||state.player.energy>state.player.maxEnergy)failures.push('PLAYER_ENERGY_RANGE');
  if(state.score<0||state.floorsCleared<0||state.highestFloor<1)failures.push('PROGRESSION_RANGE');
  const ids=state.floor.enemies.map(enemy=>enemy.id),cells=state.floor.enemies.map(enemy=>enemy.cell);
  if(new Set(ids).size!==ids.length)failures.push('DUPLICATE_ENEMY_ID');
  if(new Set(cells).size!==cells.length)failures.push('DUPLICATE_ENEMY_CELL');
  if(cells.includes(state.player.cell))failures.push('PLAYER_ENEMY_OVERLAP');
  const report=validateFloor(state.floor,state.config);if(!report.valid)failures.push(...report.errors.map(error=>`FLOOR_${error}`));
  if(state.lifecycle==='result'&&!state.result)failures.push('RESULT_MISSING');
  if(state.lifecycle!=='result'&&state.result)failures.push('RESULT_OUTSIDE_RESULT');
  return[...new Set(failures)].sort();
}
