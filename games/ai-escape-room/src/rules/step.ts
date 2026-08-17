import type { EscapeAction, EscapeRunResult } from '../../../../packages/game-contracts/src/index';
import { NamedRng } from '../../../../packages/seeded-rng/src/index';
import type { EscapeEvent, EscapePuzzleDefinition, EscapeState, EscapeStepResult } from '../state/types';
import { escapeActionKey, listLegalEscapeActions } from './actions';

function cloneState(state:EscapeState):EscapeState{return structuredClone(state);}
function emit(state:EscapeState,events:EscapeEvent[],type:string,payload:Record<string,unknown>){
  const event:EscapeEvent={schemaVersion:1,seq:state.eventSeq++,tick:state.tick,type,payload};
  events.push(event);
}
function revealEligibleObjects(state:EscapeState,events:EscapeEvent[]){
  for(const puzzle of [...state.room.puzzles].sort((a,b)=>a.stage-b.stage||a.id.localeCompare(b.id))){
    if(!puzzle.prerequisitePuzzleIds.every(id=>state.solvedPuzzleIds.includes(id)))continue;
    for(const id of [...puzzle.clueIds,puzzle.targetObjectId]){
      const objectState=state.objectStates[id];
      if(objectState&&!objectState.visible){objectState.visible=true;emit(state,events,'object-revealed',{objectId:id,puzzleId:puzzle.id});}
    }
  }
  state.visibleObjectIds=Object.entries(state.objectStates).filter(([,value])=>value.visible).map(([id])=>id).sort();
}
function puzzleForAction(state:EscapeState,action:EscapeAction):EscapePuzzleDefinition|undefined{
  if(action.kind==='use'||action.kind==='enter-code'||action.kind==='activate')return state.room.puzzles.find(puzzle=>puzzle.targetObjectId===action.targetId);
  return undefined;
}
function completePuzzle(state:EscapeState,puzzle:EscapePuzzleDefinition,events:EscapeEvent[]){
  if(state.solvedPuzzleIds.includes(puzzle.id))return;
  state.solvedPuzzleIds.push(puzzle.id);
  state.solvedPuzzleIds.sort((a,b)=>(state.room.puzzles.find(p=>p.id===a)?.stage??0)-(state.room.puzzles.find(p=>p.id===b)?.stage??0)||a.localeCompare(b));
  const target=state.objectStates[puzzle.targetObjectId];if(target)target.solved=true;
  state.score+=100*puzzle.stage+state.config.difficulty*10;
  state.lastProgressTick=state.tick;
  emit(state,events,'puzzle-solved',{puzzleId:puzzle.id,stage:puzzle.stage,kind:puzzle.kind,score:state.score});
  revealEligibleObjects(state,events);
}

export function applyEscapeAction(state:EscapeState,action:EscapeAction,_rng:NamedRng):EscapeStepResult{
  if(state.lifecycle!=='running'||state.result)return{accepted:false,reason:'not-running',state:cloneState(state),events:[],action};
  const legal=listLegalEscapeActions(state);
  if(!legal.some(candidate=>escapeActionKey(candidate)===escapeActionKey(action))){
    return{accepted:false,reason:'illegal-action',state:cloneState(state),events:[],action};
  }
  const next=cloneState(state);const events:EscapeEvent[]=[];
  if(action.kind==='inspect'){
    const definition=next.room.objects.find(object=>object.id===action.targetId)!;
    const status=next.objectStates[action.targetId]!;status.inspected=true;
    emit(next,events,'object-inspected',{objectId:action.targetId,kind:definition.kind});
    if(definition.hiddenFact){
      next.discoveredFacts[`fact:${action.targetId}`]={...definition.hiddenFact,sourceObjectId:action.targetId,discoveredTick:next.tick};
      next.lastProgressTick=next.tick;
      emit(next,events,'clue-discovered',{objectId:action.targetId,factId:definition.hiddenFact.factId,puzzleId:definition.hiddenFact.puzzleId});
    }
  }else if(action.kind==='take'){
    next.objectStates[action.targetId]!.carried=true;
    next.inventory=[...new Set([...next.inventory,action.targetId])].sort();
    next.lastProgressTick=next.tick;
    emit(next,events,'item-taken',{objectId:action.targetId});
  }else if(action.kind==='combine'){
    const combined=[action.targetId,action.withId].sort().join('+');
    next.combinedItems=[...new Set([...next.combinedItems,combined])].sort().slice(-32);
    next.lastProgressTick=next.tick;
    emit(next,events,'items-combined',{itemIds:[action.targetId,action.withId].sort(),combinedId:combined});
  }else if(action.kind==='use'||action.kind==='enter-code'||action.kind==='activate'){
    const puzzle=puzzleForAction(next,action)!;
    completePuzzle(next,puzzle,events);
  }else if(action.kind==='exit'){
    const result:EscapeRunResult={kind:'game',reason:'escape',tick:next.tick,roomIndex:next.roomIndex,score:next.score+1000,solvedPuzzles:next.solvedPuzzleIds.length};
    next.score=result.score;next.result=result;next.lifecycle='result';next.streak+=1;next.lastProgressTick=next.tick;
    emit(next,events,'escape',{roomId:next.roomId,roomIndex:next.roomIndex,score:next.score});
    emit(next,events,'result',{...result});
  }else{
    emit(next,events,'wait',{reason:'policy-wait'});
  }
  next.actionHistory=[...next.actionHistory,escapeActionKey(action)].slice(-next.config.factHistoryLimit);
  return{accepted:true,reason:'accepted',state:next,events,action};
}
