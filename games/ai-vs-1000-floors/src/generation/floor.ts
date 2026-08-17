import type{FloorsConfig}from '../../../../packages/game-contracts/src/index';
import type{NamedRng}from '../../../../packages/seeded-rng/src/index';
import type{FloorArchetype,FloorEnemy,FloorHazard,GeneratedFloor}from '../state/types';

export function toCell(x:number,y:number,width:number):number{return y*width+x}
export function fromCell(cell:number,width:number):{x:number;y:number}{return{x:cell%width,y:Math.floor(cell/width)}}

function shuffled<T>(items:T[],rng:NamedRng,stream:string):T[]{
  const out=[...items];
  for(let i=out.length-1;i>0;i--){const j=rng.nextInt(stream,i+1);[out[i],out[j]]=[out[j],out[i]]}
  return out;
}

function addUnique(path:number[],cell:number):void{if(path[path.length-1]!==cell)path.push(cell)}

function mandatoryRoute(config:FloorsConfig,rng:NamedRng):{start:number;exit:number;path:number[]}{
  const startY=1+rng.nextInt('floor-topology-start',config.height-2);
  const exitY=1+rng.nextInt('floor-topology-exit',config.height-2);
  const bendX=2+rng.nextInt('floor-topology-bend',Math.max(1,config.width-4));
  const path:number[]=[];
  for(let x=1;x<=bendX;x++)addUnique(path,toCell(x,startY,config.width));
  if(exitY!==startY){const delta=exitY>startY?1:-1;for(let y=startY+delta;y!==exitY+delta;y+=delta)addUnique(path,toCell(bendX,y,config.width))}
  for(let x=bendX+1;x<=config.width-2;x++)addUnique(path,toCell(x,exitY,config.width));
  return{start:path[0],exit:path[path.length-1],path};
}

function archetypeFor(floorNumber:number,rng:NamedRng):FloorArchetype{
  if(floorNumber===1000)return'architect';
  if(floorNumber%100===0)return'warden';
  if(floorNumber%25===0)return'arena';
  return(['corridor','chambers','crossroads']as const)[rng.nextInt('floor-archetype',3)];
}

function boundaryWalls(config:FloorsConfig):number[]{
  const walls:number[]=[];
  for(let y=0;y<config.height;y++)for(let x=0;x<config.width;x++)if(x===0||y===0||x===config.width-1||y===config.height-1)walls.push(toCell(x,y,config.width));
  return walls;
}

function enemyFor(cell:number,index:number,floorNumber:number):FloorEnemy{
  const health=2+Math.min(4,Math.floor((floorNumber-1)/100));
  return{id:`enemy-${floorNumber}-${index}`,kind:'striker',cell,health,maxHealth:health,attack:1+Math.floor((floorNumber-1)/250),armor:0,telegraph:'idle',cooldown:0};
}

function hazardFor(cell:number,index:number,floorNumber:number):FloorHazard{
  return{id:`hazard-${floorNumber}-${index}`,kind:'spike',cell,damage:1,period:4,phase:(floorNumber+index)%4};
}

export function generateFloor(config:FloorsConfig,floorNumber:number,rng:NamedRng):GeneratedFloor{
  if(!Number.isInteger(floorNumber)||floorNumber<1||floorNumber>config.totalFloors)throw new RangeError('floorNumber');
  const route=mandatoryRoute(config,rng),pathSet=new Set(route.path),walls=new Set(boundaryWalls(config));
  const interior:number[]=[];
  for(let y=1;y<config.height-1;y++)for(let x=1;x<config.width-1;x++){const cell=toCell(x,y,config.width);if(!pathSet.has(cell))interior.push(cell)}
  const ordered=shuffled(interior,rng,'floor-walls');
  const sector=Math.ceil(floorNumber/config.sectorSize);
  const wallTarget=Math.min(Math.floor(interior.length*0.42),2+sector+rng.nextInt('floor-wall-count',3));
  for(const cell of ordered.slice(0,wallTarget))walls.add(cell);
  const free=shuffled(ordered.slice(wallTarget),rng,'floor-content');
  const enemyCount=Math.min(config.maxEnemyBudget,config.baseEnemyBudget);
  const hazardCount=Math.min(3,Math.floor((floorNumber-1)/125));
  const enemies:FloorEnemy[]=[];const hazards:FloorHazard[]=[];const rewardCells:number[]=[];
  let cursor=0;
  for(let i=0;i<enemyCount&&cursor<free.length;i++)enemies.push(enemyFor(free[cursor++],i,floorNumber));
  for(let i=0;i<hazardCount&&cursor<free.length;i++)hazards.push(hazardFor(free[cursor++],i,floorNumber));
  const rewardCount=free.length-cursor>0?1+(floorNumber%10===0?1:0):0;
  for(let i=0;i<rewardCount&&cursor<free.length;i++)rewardCells.push(free[cursor++]);
  return{
    number:floorNumber,
    sector,
    archetype:archetypeFor(floorNumber,rng),
    width:config.width,
    height:config.height,
    start:route.start,
    exit:route.exit,
    mandatoryPath:route.path,
    walls:[...walls].sort((a,b)=>a-b),
    enemies,
    hazards,
    rewardCells:rewardCells.sort((a,b)=>a-b),
    objective:'reach-exit',
    objectiveComplete:false,
    featureReport:{pathLength:route.path.length,branchCells:Math.max(0,free.length-cursor),enemyBudget:enemies.length,hazardCount:hazards.length,repairCount:0,fallbackUsed:false},
    ticks:0,
  };
}
