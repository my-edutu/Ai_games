import type{AntColonyState,TileCode}from './types';
export class InvariantError extends Error{constructor(message:string){super(message);this.name='InvariantError'}}
function fail(message:string):never{throw new InvariantError(message)}
function inBounds(state:AntColonyState,x:number,y:number){return Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&y>=0&&x<state.config.width&&y<state.config.height}
function walkable(state:AntColonyState,cell:number,tile:TileCode){const y=Math.floor(cell/state.config.width);return tile===1||tile===3||(tile===2&&y===state.config.surfaceRow)}
export function assertAntColonyInvariants(state:AntColonyState):void{
  const cells=state.config.width*state.config.height;
  const arrays=[state.world.tiles,state.world.food,state.world.moisture,state.world.discovered,state.world.pheromones.home,state.world.pheromones.food,state.world.pheromones.alarm,state.world.pheromones.excavation];
  if(arrays.some(array=>array.length!==cells))fail('world-array-length');
  if(!Number.isInteger(state.tick)||state.tick<0)fail('tick');
  if(state.ants.length>state.config.maxAnts)fail('ant-capacity');
  const antIds=new Set<number>();
  for(const ant of state.ants){if(antIds.has(ant.id))fail('duplicate-ant-id');antIds.add(ant.id);if(!inBounds(state,ant.x,ant.y))fail('ant-bounds');const cell=ant.y*state.config.width+ant.x;if(!walkable(state,cell,state.world.tiles[cell]!))fail('ant-tile');if(ant.health<0||ant.health>100)fail('ant-health');if(ant.energy<0||ant.energy>100)fail('ant-energy');if(ant.carryingFood<0||ant.carryingFood>4)fail('ant-carrying')}
  const broodIds=new Set<number>();for(const brood of state.brood){if(broodIds.has(brood.id))fail('duplicate-brood-id');broodIds.add(brood.id);if(brood.ageTicks<0||brood.health<0||brood.health>100)fail('brood')}
  const predatorIds=new Set<number>();for(const predator of state.predators){if(predatorIds.has(predator.id))fail('duplicate-predator-id');predatorIds.add(predator.id);if(!inBounds(state,predator.x,predator.y))fail('predator-bounds');if(predator.health<0||predator.health>100)fail('predator-health')}
  if(state.queen.health<0||state.queen.health>state.config.queenHealth)fail('queen-health');
  for(const value of state.world.food)if(!Number.isInteger(value)||value<0||value>1000)fail('food-field');
  for(const value of state.world.moisture)if(!Number.isInteger(value)||value<0||value>255)fail('moisture-field');
  for(const field of Object.values(state.world.pheromones))for(const value of field)if(!Number.isInteger(value)||value<0||value>255)fail('pheromone-field');
  for(const value of Object.values(state.colony))if(typeof value==='number'&&(!Number.isFinite(value)||value<0))fail('colony-resource');
  if(state.influence.scheduled.length>128||state.influence.appliedIds.length>1024)fail('influence-bounds');
  if(state.lifecycle==='result'&&!state.result)fail('result-missing');
  if(state.lifecycle==='active'&&state.result)fail('active-result');
  if(!walkable(state,state.world.entrance,state.world.tiles[state.world.entrance]!)||!walkable(state,state.world.nestCenter,state.world.tiles[state.world.nestCenter]!))fail('nest-connectors');
}
