import type { EscapeAction, GameLifecycle } from '../../../../packages/game-contracts/src/index';
import type { EscapeDiscoveredFact, EscapePuzzleKind, EscapeState } from '../state/types';

export interface EscapeObservedObject{
  id:string;
  kind:string;
  labelKey:string;
  publicColor?:string;
  publicShape?:string;
  publicSymbol?:string;
  publicTextKey?:string;
  inspected:boolean;
  carried:boolean;
  solved:boolean;
  portable:boolean;
}
export interface EscapeKnownPuzzle{
  id:string;
  stage:number;
  kind:EscapePuzzleKind;
  prerequisitePuzzleIds:string[];
  clueIds:string[];
  targetObjectId:string;
  requiredItemIds:string[];
  solved:boolean;
}
export interface EscapeObservedHazard{id:string;kind:string;phase:'idle'|'telegraph'|'active';phaseTick:number;}
export type EscapeAffordance=
  |{kind:'inspect';targetId:string}
  |{kind:'take';targetId:string}
  |{kind:'combine';targetId:string;withId:string}
  |{kind:'use';targetId:string;itemId:string;puzzleId:string}
  |{kind:'enter-code';targetId:string;puzzleId:string}
  |{kind:'activate';targetId:string;puzzleId:string}
  |{kind:'wait'}
  |{kind:'exit';targetId:string};
export interface EscapeObservation{
  schemaVersion:1;
  tick:number;
  roomId:string;
  lifecycle:GameLifecycle;
  timerRemaining:number;
  visibleObjects:EscapeObservedObject[];
  inventory:string[];
  solvedPuzzleIds:string[];
  hazards:EscapeObservedHazard[];
  affordances:EscapeAffordance[];
  knownPuzzles:EscapeKnownPuzzle[];
  discoveredFacts:EscapeDiscoveredFact[];
  progressPermille:number;
}

function stable<T extends {id:string}>(values:T[]):T[]{return values.sort((a,b)=>a.id.localeCompare(b.id));}

export function createEscapeObservation(state:EscapeState):EscapeObservation{
  const visibleObjects=stable(state.room.objects.filter(object=>state.objectStates[object.id]?.visible).map(object=>{
    const status=state.objectStates[object.id]!;
    return{id:object.id,kind:object.kind,labelKey:object.labelKey,publicColor:object.publicColor,publicShape:object.publicShape,publicSymbol:object.publicSymbol,publicTextKey:object.publicTextKey,inspected:status.inspected,carried:status.carried,solved:status.solved,portable:object.portable};
  }));
  const discoveredFacts=Object.values(state.discoveredFacts).sort((a,b)=>a.discoveredTick-b.discoveredTick||a.factId.localeCompare(b.factId)).map(fact=>structuredClone(fact));
  const discoveredPuzzleIds=new Set(discoveredFacts.map(fact=>fact.puzzleId));
  const knownPuzzles=state.room.puzzles.filter(puzzle=>discoveredPuzzleIds.has(puzzle.id)||state.solvedPuzzleIds.includes(puzzle.id)).map(puzzle=>({
    id:puzzle.id,stage:puzzle.stage,kind:puzzle.kind,prerequisitePuzzleIds:[...puzzle.prerequisitePuzzleIds].sort(),clueIds:[...puzzle.clueIds].sort(),targetObjectId:puzzle.targetObjectId,requiredItemIds:[...puzzle.requiredItemIds].sort(),solved:state.solvedPuzzleIds.includes(puzzle.id),
  })).sort((a,b)=>a.stage-b.stage||a.id.localeCompare(b.id));
  const affordances:EscapeAffordance[]=[];
  for(const object of visibleObjects){
    if(!object.inspected)affordances.push({kind:'inspect',targetId:object.id});
    if(object.portable&&object.inspected&&!object.carried)affordances.push({kind:'take',targetId:object.id});
  }
  const inventory=[...new Set(state.inventory)].sort();
  for(let i=0;i<inventory.length;i++)for(let j=i+1;j<inventory.length;j++)affordances.push({kind:'combine',targetId:inventory[i]!,withId:inventory[j]!});
  for(const puzzle of knownPuzzles){
    if(puzzle.solved||!puzzle.prerequisitePuzzleIds.every(id=>state.solvedPuzzleIds.includes(id)))continue;
    if(puzzle.kind==='tool-dependency'&&puzzle.requiredItemIds.every(id=>inventory.includes(id)))affordances.push({kind:'use',targetId:puzzle.targetObjectId,itemId:puzzle.requiredItemIds[0]!,puzzleId:puzzle.id});
    else if(puzzle.kind==='switch-network'||puzzle.kind==='balance-clue')affordances.push({kind:'activate',targetId:puzzle.targetObjectId,puzzleId:puzzle.id});
    else if(puzzle.kind!=='tool-dependency')affordances.push({kind:'enter-code',targetId:puzzle.targetObjectId,puzzleId:puzzle.id});
  }
  if(state.solvedPuzzleIds.length===state.room.puzzles.length)affordances.push({kind:'exit',targetId:state.room.exitObjectId});
  affordances.push({kind:'wait'});
  const unique=new Map<string,EscapeAffordance>();
  for(const item of affordances){const key=JSON.stringify(item,Object.keys(item).sort());unique.set(key,item);}
  return{
    schemaVersion:1,tick:state.tick,roomId:state.roomId,lifecycle:state.lifecycle,timerRemaining:Math.max(0,state.config.maxTicks-state.tick),
    visibleObjects,inventory,solvedPuzzleIds:[...state.solvedPuzzleIds],
    hazards:state.room.hazards.map(hazard=>({id:hazard.id,kind:hazard.kind,phase:state.hazardStates[hazard.id]?.phase??'idle',phaseTick:state.hazardStates[hazard.id]?.phaseTick??0})).sort((a,b)=>a.id.localeCompare(b.id)),
    affordances:[...unique.values()],knownPuzzles,discoveredFacts,progressPermille:Math.floor(state.solvedPuzzleIds.length*1000/state.room.puzzles.length),
  };
}

export function observationActionFromAffordance(affordance:EscapeAffordance,value?:string):EscapeAction{
  if(affordance.kind==='enter-code')return{kind:'enter-code',targetId:affordance.targetId,code:value??''};
  if(affordance.kind==='activate')return{kind:'activate',targetId:affordance.targetId,option:value??''};
  if(affordance.kind==='use')return{kind:'use',targetId:affordance.targetId,itemId:affordance.itemId};
  return affordance;
}
