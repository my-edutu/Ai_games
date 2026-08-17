import type{MazeConfig}from '../../../../packages/game-contracts/src/index';
import type{NamedRng}from '../../../../packages/seeded-rng/src/index';
import type{MazeDoor,MazeWorld}from '../state/types';
import{passageNeighbors,solveMaze}from './solver';
import{validateGeneratedMaze}from './validator';

export function doorBetween(world:MazeWorld,a:number,b:number):MazeDoor|undefined{return world.doors.find(door=>(door.a===a&&door.b===b)||(door.a===b&&door.b===a))}
function shortestDistance(world:MazeWorld,start:number,goal:number){const path=solveMaze(world,{start,goal});return path?path.length-1:Number.POSITIVE_INFINITY}
function chooseUnique(candidates:number[],count:number,rng:NamedRng,stream:string){const pool=[...candidates],out:number[]=[];while(pool.length&&out.length<count){const index=rng.nextInt(stream,pool.length);out.push(pool.splice(index,1)[0])}return out}

export function populateMazeContent(base:MazeWorld,config:MazeConfig,rng:NamedRng):MazeWorld{
  const world=structuredClone(base),route=solveMaze(world,{start:world.start,goal:world.exit});if(!route)throw new Error('cannot populate unsolved maze');
  const dependencyCount=Math.min(config.keyCount,Math.max(0,Math.floor((route.length-3)/4)));
  for(let i=0;i<dependencyCount;i++){
    const denominator=dependencyCount*2+1;
    let keyIndex=Math.max(1,Math.floor((i*2+1)*(route.length-1)/denominator));
    let doorToIndex=Math.max(keyIndex+1,Math.floor((i*2+2)*(route.length-1)/denominator));
    if(doorToIndex>=route.length)doorToIndex=route.length-1;if(keyIndex>=doorToIndex)keyIndex=Math.max(1,doorToIndex-1);
    const keyId=`key-${i+1}`,doorId=`door-${i+1}`;
    world.keys.push({id:keyId,cell:route[keyIndex],collected:false});
    world.doors.push({id:doorId,a:route[doorToIndex-1],b:route[doorToIndex],requiredKeyId:keyId,open:false,critical:true,temporaryUntilTick:null});
  }
  const reserved=new Set<number>([world.start,world.exit,...world.keys.map(key=>key.cell),...world.doors.flatMap(door=>[door.a,door.b])]);
  const routeSet=new Set(route),offRoute=Array.from({length:world.width*world.height},(_,cell)=>cell).filter(cell=>!reserved.has(cell)&&!routeSet.has(cell));
  world.traps=chooseUnique(offRoute,Math.min(config.trapCount,offRoute.length),rng,'hazards:traps').sort((a,b)=>a-b);
  const clueCandidates=route.slice(1,-1).filter(cell=>!reserved.has(cell));
  world.clues=chooseUnique(clueCandidates,Math.min(Math.max(1,dependencyCount),clueCandidates.length),rng,'dependencies:clues').sort((a,b)=>a-b);
  if(route.length>4)world.checkpoints=[route[Math.floor(route.length/2)]];
  const threatCount=Math.min(config.threatCount,8),threatReserved=new Set<number>([...reserved,...world.traps]);
  const threatCandidates=Array.from({length:world.width*world.height},(_,cell)=>cell).filter(cell=>!threatReserved.has(cell)&&shortestDistance(world,world.start,cell)>=Math.max(3,config.visibilityRadius+1)&&passageNeighbors(world,cell).some(next=>!threatReserved.has(next)));
  const spawns=chooseUnique(threatCandidates,Math.min(threatCount,threatCandidates.length),rng,'threat-policy:spawns');for(let i=0;i<spawns.length;i++){const spawn=spawns[i],neighbor=passageNeighbors(world,spawn).filter(cell=>!threatReserved.has(cell)).sort((a,b)=>a-b)[0];if(neighbor===undefined)continue;world.threats.push({id:`threat-${i+1}`,cell:spawn,route:[spawn,neighbor],routeIndex:0,direction:1,lastSeenTick:null,active:true});threatReserved.add(spawn);threatReserved.add(neighbor)}
  return world;
}

export interface MazeInventorySolution{cells:number[];keyOrder:string[];doorOrder:string[];expansions:number}
export function solveMazeWithInventory(world:MazeWorld):MazeInventorySolution|null{
  const keyIndex=new Map(world.keys.map((key,index)=>[key.id,index] as const)),stateCount=world.width*world.height*(1<<world.keys.length),parent=new Int32Array(stateCount);parent.fill(-2);const parentDoor=new Array<string|null>(stateCount).fill(null),queue:number[]=[];
  const collect=(cell:number,mask:number)=>{for(const key of world.keys)if(key.cell===cell){const index=keyIndex.get(key.id);if(index!==undefined)mask|=1<<index}return mask};
  const encode=(cell:number,mask:number)=>mask*world.width*world.height+cell,decode=(value:number)=>({cell:value%(world.width*world.height),mask:Math.floor(value/(world.width*world.height))});
  const startMask=collect(world.start,0),startState=encode(world.start,startMask);parent[startState]=-1;queue.push(startState);let goalState=-1,expansions=0;
  for(let q=0;q<queue.length;q++){const currentState=queue[q],{cell,mask}=decode(currentState);expansions++;if(cell===world.exit){goalState=currentState;break}for(const next of passageNeighbors(world,cell)){if(world.blockedCells.includes(next))continue;const door=doorBetween(world,cell,next);if(door&&!door.open){const required=keyIndex.get(door.requiredKeyId);if(required===undefined||!(mask&(1<<required)))continue}const nextMask=collect(next,mask),encoded=encode(next,nextMask);if(parent[encoded]!==-2)continue;parent[encoded]=currentState;parentDoor[encoded]=door?.id??null;queue.push(encoded)}}
  if(goalState<0)return null;const states:number[]=[];for(let at=goalState;at!==-1;at=parent[at])states.push(at);states.reverse();const cells=states.map(state=>decode(state).cell),keyOrder:string[]=[],doorOrder:string[]=[];for(const cell of cells)for(const key of world.keys)if(key.cell===cell&&!keyOrder.includes(key.id))keyOrder.push(key.id);for(let i=1;i<states.length;i++){const door=parentDoor[states[i]];if(door&&!doorOrder.includes(door))doorOrder.push(door)}return{cells,keyOrder,doorOrder,expansions};
}

export interface MazeContentValidation{valid:boolean;reasons:string[];solutionExists:boolean;keyOrderValid:boolean;safeSpawn:boolean;solutionLength:number}
export function validateMazeContent(world:MazeWorld,options:{minimumThreatResponseDistance?:number}={}):MazeContentValidation{
  const reasons=[...validateGeneratedMaze(world).reasons],solution=solveMazeWithInventory(world),keyOrderValid=!!solution&&world.doors.every(door=>solution.keyOrder.indexOf(door.requiredKeyId)>=0&&solution.doorOrder.indexOf(door.id)>=0),minimum=options.minimumThreatResponseDistance??2,safeSpawn=world.threats.every(threat=>shortestDistance(world,world.start,threat.cell)>=minimum);
  if(!solution)reasons.push('content-unsolved');if(!keyOrderValid)reasons.push('key-order');if(!safeSpawn)reasons.push('unsafe-threat-spawn');
  const occupied=[world.start,world.exit,...world.keys.map(key=>key.cell),...world.traps,...world.threats.map(threat=>threat.cell),...world.blockedCells];if(new Set(occupied).size!==occupied.length)reasons.push('content-overlap');
  for(const trap of world.traps)if(trap===world.start||trap===world.exit)reasons.push('trap-clearance');
  return{valid:reasons.length===0,reasons:[...new Set(reasons)],solutionExists:!!solution,keyOrderValid,safeSpawn,solutionLength:solution?solution.cells.length-1:0};
}
