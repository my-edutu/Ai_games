import type{FloorsConfig}from '../../../../packages/game-contracts/src/index';
import type{NamedRng}from '../../../../packages/seeded-rng/src/index';
import{bossDefinition,enemyDefinition,hazardDefinition,isWardenFloor,sectorForFloor,weightedEnemyKind}from'../content/catalogue';
import type{EnemyKind,FloorArchetype,FloorEnemy,FloorHazard,GeneratedFloor,HazardKind}from '../state/types';

export function toCell(x:number,y:number,width:number):number{return y*width+x}
export function fromCell(cell:number,width:number):{x:number;y:number}{return{x:cell%width,y:Math.floor(cell/width)}}

function shuffled<T>(items:T[],rng:NamedRng,stream:string):T[]{const out=[...items];for(let i=out.length-1;i>0;i--){const j=rng.nextInt(stream,i+1);[out[i],out[j]]=[out[j],out[i]]}return out}
function addUnique(path:number[],cell:number):void{if(path[path.length-1]!==cell)path.push(cell)}
function mandatoryRoute(config:FloorsConfig,rng:NamedRng):{start:number;exit:number;path:number[]}{const startY=1+rng.nextInt('floor-topology-start',config.height-2),exitY=1+rng.nextInt('floor-topology-exit',config.height-2),bendX=2+rng.nextInt('floor-topology-bend',Math.max(1,config.width-4)),path:number[]=[];for(let x=1;x<=bendX;x++)addUnique(path,toCell(x,startY,config.width));if(exitY!==startY){const delta=exitY>startY?1:-1;for(let y=startY+delta;y!==exitY+delta;y+=delta)addUnique(path,toCell(bendX,y,config.width))}for(let x=bendX+1;x<=config.width-2;x++)addUnique(path,toCell(x,exitY,config.width));return{start:path[0],exit:path[path.length-1],path}}
function archetypeFor(floorNumber:number,rng:NamedRng):FloorArchetype{if(floorNumber===1000)return'architect';if(isWardenFloor(floorNumber))return'warden';if(floorNumber%25===0)return'arena';return(['corridor','chambers','crossroads']as const)[rng.nextInt('floor-archetype',3)]}
function boundaryWalls(config:FloorsConfig):number[]{const walls:number[]=[];for(let y=0;y<config.height;y++)for(let x=0;x<config.width;x++)if(x===0||y===0||x===config.width-1||y===config.height-1)walls.push(toCell(x,y,config.width));return walls}
function guardianCell(route:{start:number;exit:number;path:number[]}):number{const candidate=route.path[Math.max(1,route.path.length-2)];if(candidate===undefined||candidate===route.start||candidate===route.exit)throw new Error('guardian-route-cell');return candidate}

function makeEnemy(cell:number,index:number,floorNumber:number,kind:EnemyKind):FloorEnemy{
  const def=enemyDefinition(kind),sector=Math.ceil(floorNumber/100),boss=kind==='warden'||kind==='architect',health=def.baseHealth+(boss?sector*2:Math.floor((floorNumber-1)/200));
  return{id:boss?bossDefinition(floorNumber).id:`enemy-${floorNumber}-${index}-${kind}`,kind,cell,health,maxHealth:health,attack:def.baseAttack+Math.floor((floorNumber-1)/350),armor:def.baseArmor,telegraph:boss?'guard':'idle',cooldown:0};
}
function makeHazard(cell:number,index:number,floorNumber:number,kind:HazardKind):FloorHazard{const def=hazardDefinition(kind);return{id:`hazard-${floorNumber}-${index}-${kind}`,kind,cell,damage:def.baseDamage,period:def.period,phase:(floorNumber+index)%def.period}}

export function generateFloor(config:FloorsConfig,floorNumber:number,rng:NamedRng):GeneratedFloor{
  if(!Number.isInteger(floorNumber)||floorNumber<1||floorNumber>config.totalFloors)throw new RangeError('floorNumber');
  const route=mandatoryRoute(config,rng),pathSet=new Set(route.path),walls=new Set(boundaryWalls(config)),interior:number[]=[];
  for(let y=1;y<config.height-1;y++)for(let x=1;x<config.width-1;x++){const cell=toCell(x,y,config.width);if(!pathSet.has(cell))interior.push(cell)}
  const ordered=shuffled(interior,rng,`floor-walls:${floorNumber}`),sector=sectorForFloor(floorNumber),sectorIndex=Math.ceil(floorNumber/config.sectorSize);
  const wallTarget=Math.min(Math.floor(interior.length*.42),2+sectorIndex+rng.nextInt(`floor-wall-count:${floorNumber}`,3));for(const cell of ordered.slice(0,wallTarget))walls.add(cell);
  const free=shuffled(ordered.slice(wallTarget),rng,`floor-content:${floorNumber}`),enemies:FloorEnemy[]=[],hazards:FloorHazard[]=[],rewardCells:number[]=[];let cursor=0;
  const bossKind:EnemyKind|undefined=floorNumber===1000?'architect':isWardenFloor(floorNumber)?'warden':undefined;
  if(bossKind)enemies.push(makeEnemy(guardianCell(route),0,floorNumber,bossKind));
  const scaledBudget=Math.min(config.maxEnemyBudget,config.baseEnemyBudget+Math.floor((floorNumber-1)/100));
  for(let i=enemies.length;i<scaledBudget&&cursor<free.length;i++){const kind=weightedEnemyKind(floorNumber,rng.nextInt(`floor-enemy-kind:${floorNumber}:${i}`,1000));enemies.push(makeEnemy(free[cursor++],i,floorNumber,kind))}
  const hazardCount=Math.min(4,Math.floor((floorNumber-1)/100)+(floorNumber%25===0?1:0));
  for(let i=0;i<hazardCount&&cursor<free.length;i++){const kind=sector.hazards[(floorNumber+i)%sector.hazards.length];hazards.push(makeHazard(free[cursor++],i,floorNumber,kind))}
  const rewardCount=free.length-cursor>0?1+(floorNumber%10===0?1:0):0;for(let i=0;i<rewardCount&&cursor<free.length;i++)rewardCells.push(free[cursor++]);
  return{number:floorNumber,sector:sectorIndex,archetype:archetypeFor(floorNumber,rng),width:config.width,height:config.height,start:route.start,exit:route.exit,mandatoryPath:route.path,walls:[...walls].sort((a,b)=>a-b),enemies,hazards,rewardCells:rewardCells.sort((a,b)=>a-b),objective:floorNumber===1000?'defeat-architect':isWardenFloor(floorNumber)?'defeat-warden':'reach-exit',objectiveComplete:false,featureReport:{pathLength:route.path.length,branchCells:Math.max(0,free.length-cursor),enemyBudget:enemies.length,hazardCount:hazards.length,repairCount:0,fallbackUsed:false},ticks:0};
}
