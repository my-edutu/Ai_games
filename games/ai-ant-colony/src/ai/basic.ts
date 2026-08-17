import type{AntAction,AntColonyState,AntState,AntTask,TileCode}from '../state/types';
const directions=[[0,-1],[1,0],[0,1],[-1,0]]as const;
function walkable(state:AntColonyState,cell:number,tile:TileCode){const y=Math.floor(cell/state.config.width);return tile===1||tile===3||(tile===2&&y===state.config.surfaceRow)}
function distance(width:number,a:number,b:number){const ax=a%width,ay=Math.floor(a/width),bx=b%width,by=Math.floor(b/width);return Math.abs(ax-bx)+Math.abs(ay-by)}
function legalNeighbors(state:AntColonyState,ant:AntState,allowSoil=false){const out:number[]=[];for(let offset=0;offset<4;offset++){const i=(offset+ant.bias)%4,[dx,dy]=directions[i]!,x=ant.x+dx,y=ant.y+dy;if(x<0||y<0||x>=state.config.width||y>=state.config.height)continue;const cell=y*state.config.width+x,tile=state.world.tiles[cell]!;if(walkable(state,cell,tile)||(allowSoil&&tile===0))out.push(cell)}return out}
function nearestFood(state:AntColonyState,from:number){let best=-1,bestDistance=Number.MAX_SAFE_INTEGER;for(let cell=0;cell<state.world.food.length;cell++)if(state.world.food[cell]!>0){const d=distance(state.config.width,from,cell);if(d<bestDistance||(d===bestDistance&&cell<best)){best=cell;bestDistance=d}}return best}
function stepToward(state:AntColonyState,ant:AntState,target:number,task:AntTask,intent:string,allowSoil=false):AntAction{const candidates=legalNeighbors(state,ant,allowSoil);if(!candidates.length)return{kind:'rest',task:'rest',intent:'Holding position until a safe path opens',confidence:35};let best=candidates[0]!,bestDistance=distance(state.config.width,best,target);for(const cell of candidates.slice(1)){const d=distance(state.config.width,cell,target);if(d<bestDistance){best=cell;bestDistance=d}}if(allowSoil&&state.world.tiles[best]===0)return{kind:'dig',cell:best,task:'dig',intent,confidence:70};return{kind:'move',cell:best,task,intent,confidence:72}}
export function chooseBasicAntAction(state:AntColonyState,ant:AntState):AntAction{
  const cell=ant.y*state.config.width+ant.x;
  if(ant.energy<18)return stepToward(state,ant,state.world.nestCenter,'rest','Returning to the queen chamber to recover');
  if(ant.carryingFood>0){if(cell===state.world.nestCenter||state.world.tiles[cell]===3)return{kind:'deposit',task:'return',intent:'Delivering food to colony stores',confidence:96};return stepToward(state,ant,state.world.nestCenter,'return','Following the home trail with food')}
  if(state.world.food[cell]!>0)return{kind:'pickup',task:'forage',intent:'Collecting a discovered food source',confidence:95};
  if(ant.role==='nurse')return stepToward(state,ant,state.world.nestCenter,'nurse','Tending brood near the queen chamber');
  if(ant.role==='soldier')return stepToward(state,ant,state.world.entrance,'guard','Patrolling the nest entrance');
  if(ant.role==='digger'&&state.colony.strategy==='expansion'){const target=Math.min(state.world.tiles.length-1,state.world.nestCenter+state.config.width*4+(ant.bias<2?-6:6));return stepToward(state,ant,target,'dig','Excavating a controlled expansion corridor',true)}
  const target=nearestFood(state,cell);if(target>=0)return stepToward(state,ant,target,ant.role==='scout'?'explore':'forage',ant.role==='scout'?'Scouting toward a resource signal':'Foraging toward the strongest known resource');
  const candidates=legalNeighbors(state,ant);if(!candidates.length)return{kind:'rest',task:'rest',intent:'Waiting for a safe route',confidence:30};return{kind:'move',cell:candidates[(state.tick+ant.id)%candidates.length]!,task:'explore',intent:'Exploring for a new resource trail',confidence:48};
}
