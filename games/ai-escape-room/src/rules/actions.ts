import type { EscapeAction } from '../../../../packages/game-contracts/src/index';
import { stableSerialize } from '../../../../packages/replay/src/index';
import type { EscapePuzzleDefinition, EscapeState } from '../state/types';
import { actionForPuzzle } from '../generation/templates';

export function escapeActionKey(action:EscapeAction):string{
  if(action.kind==='combine'){const [targetId,withId]=[action.targetId,action.withId].sort();return stableSerialize({kind:'combine',targetId,withId});}
  return stableSerialize(action);
}

function readyPuzzle(state:EscapeState,puzzle:EscapePuzzleDefinition):boolean{
  return !state.solvedPuzzleIds.includes(puzzle.id)
    && puzzle.prerequisitePuzzleIds.every(id=>state.solvedPuzzleIds.includes(id))
    && puzzle.clueIds.every(id=>Boolean(state.discoveredFacts[`fact:${id}`]))
    && puzzle.requiredItemIds.every(id=>state.inventory.includes(id));
}

export function listLegalEscapeActions(state:EscapeState):EscapeAction[]{
  if(state.lifecycle!=='running'||state.result)return[];
  const actions:EscapeAction[]=[];
  for(const object of [...state.room.objects].sort((a,b)=>a.id.localeCompare(b.id))){
    const status=state.objectStates[object.id];
    if(!status?.visible)continue;
    if(object.inspectable&&!status.inspected)actions.push({kind:'inspect',targetId:object.id});
    if(object.portable&&status.inspected&&!status.carried)actions.push({kind:'take',targetId:object.id});
  }
  const inventory=[...new Set(state.inventory)].sort();
  for(let i=0;i<inventory.length;i++)for(let j=i+1;j<inventory.length;j++){
    const key=`${inventory[i]}+${inventory[j]}`;
    if(!state.combinedItems.includes(key))actions.push({kind:'combine',targetId:inventory[i]!,withId:inventory[j]!});
  }
  for(const puzzle of [...state.room.puzzles].sort((a,b)=>a.stage-b.stage||a.id.localeCompare(b.id))){
    if(!readyPuzzle(state,puzzle))continue;
    const target=state.objectStates[puzzle.targetObjectId];
    if(!target?.visible||target.solved)continue;
    actions.push(actionForPuzzle(puzzle.kind,puzzle.targetObjectId,puzzle.solution,puzzle.clueIds[0]!));
  }
  if(state.solvedPuzzleIds.length===state.room.puzzles.length&&state.objectStates[state.room.exitObjectId]?.visible){
    actions.push({kind:'exit',targetId:state.room.exitObjectId});
  }
  actions.push({kind:'wait'});
  const unique=new Map<string,EscapeAction>();
  for(const action of actions)unique.set(escapeActionKey(action),action);
  return [...unique.values()].sort((a,b)=>escapeActionKey(a).localeCompare(escapeActionKey(b)));
}
