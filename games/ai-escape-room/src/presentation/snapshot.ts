import { checksum } from '../../../../packages/replay/src/index';
import type { EscapePublicIntent } from '../ai/planner';
import type { EscapeEvent, EscapeState } from '../state/types';

export interface EscapePresentationSignals{
  ai:EscapePublicIntent;
  belief:{schemaVersion:1;currentGoal:string|null;factCount:number;hypothesisCount:number;confidenceBand:'low'|'medium'|'high';contradictions:number;lastObservationTick:number};
  pathologyCount:number;
  plannerExpansions:number;
}
export interface EscapeRenderObject{
  id:string;kind:string;labelKey:string;shape:string;symbol:string;color:string;inspected:boolean;carried:boolean;solved:boolean;xPermille:number;yPermille:number;
}
export interface EscapeRenderEvent{seq:number;tick:number;type:string;label:string;priority:number;}
export interface EscapeRenderSnapshot{
  schemaVersion:1;gameId:'ai-escape-room';renderVersion:'escape-render-v1';runToken:string;authorityChecksum:string;roomIndex:number;theme:string;difficulty:number;tick:number;
  scene:'normal'|'danger'|'result'|'intermission'|'recovery';objective:string;
  progress:{solvedPuzzles:number;totalPuzzles:number;permille:number;currentStage:number};
  timer:{remainingTicks:number;danger:boolean};record:{score:number;streak:number};
  ai:EscapePublicIntent&{factCount:number;contradictions:number};
  objects:EscapeRenderObject[];inventory:Array<{id:string;label:string}>;hazards:Array<{id:string;kind:string;phase:'idle'|'telegraph'|'active';phaseTick:number}>;
  avatar:{xPermille:number;yPermille:number;mode:'observing'|'acting'|'waiting'|'celebrating'|'recovering'};
  focusObjectId:string|null;events:EscapeRenderEvent[];
  health:{level:'healthy'|'degraded'|'safe-scene';reason:string|null};
}

const EVENT_LABELS:Record<string,{label:string;priority:number}>={
  'room-started':{label:'A new vault is live',priority:70},'object-revealed':{label:'A new mechanism is revealed',priority:50},'object-inspected':{label:'The AI inspects an object',priority:30},
  'clue-discovered':{label:'A clue is confirmed',priority:60},'item-taken':{label:'A tool enters the inventory',priority:45},'items-combined':{label:'Two tools are combined',priority:50},
  'puzzle-solved':{label:'Mechanism unlocked',priority:80},'hazard-phase':{label:'Room hazard state changed',priority:85},'hazard-failure':{label:'The room hazard ended the attempt',priority:100},
  'escape':{label:'The vault is open',priority:100},'result':{label:'Run result recorded',priority:95},'intermission-started':{label:'Preparing the next room',priority:40},
};

function deepFreeze<T>(value:T):T{
  if(value&&typeof value==='object'&&!Object.isFrozen(value)){
    Object.freeze(value);
    for(const item of Object.values(value as Record<string,unknown>))deepFreeze(item);
  }
  return value;
}
function objectCoordinates(index:number,total:number){
  const columns=Math.max(3,Math.ceil(Math.sqrt(Math.max(1,total)*1.55)));const rows=Math.max(2,Math.ceil(total/columns));
  const column=index%columns,row=Math.floor(index/columns);
  return{xPermille:columns===1?500:90+Math.round(column*820/(columns-1)),yPermille:rows===1?500:150+Math.round(row*690/(rows-1))};
}
function sceneFor(state:EscapeState):EscapeRenderSnapshot['scene']{
  if(state.lifecycle==='result')return'result';if(state.lifecycle==='intermission')return'intermission';
  if(Object.values(state.hazardStates).some(hazard=>hazard.phase==='active'||hazard.phase==='telegraph'))return'danger';return'normal';
}
function sanitizeEvents(events:EscapeEvent[]):EscapeRenderEvent[]{
  return events.slice(-24).map(event=>{const meta=EVENT_LABELS[event.type]??{label:'Room state updated',priority:20};return{seq:event.seq,tick:event.tick,type:event.type.slice(0,48),label:meta.label,priority:meta.priority};});
}

export function buildEscapeRenderSnapshot(state:EscapeState,signals:EscapePresentationSignals,events:EscapeEvent[]=[]):EscapeRenderSnapshot{
  const visible=state.room.objects.filter(object=>state.objectStates[object.id]?.visible).slice(0,48).sort((a,b)=>a.id.localeCompare(b.id));
  const objects=visible.map((object,index)=>({
    id:object.id,kind:object.kind,labelKey:object.labelKey,shape:object.publicShape??object.kind,symbol:object.publicSymbol??object.kind,color:object.publicColor??'neutral',
    inspected:state.objectStates[object.id]!.inspected,carried:state.objectStates[object.id]!.carried,solved:state.objectStates[object.id]!.solved,...objectCoordinates(index,visible.length),
  }));
  const currentPuzzle=state.room.puzzles.find(puzzle=>!state.solvedPuzzleIds.includes(puzzle.id)&&puzzle.prerequisitePuzzleIds.every(id=>state.solvedPuzzleIds.includes(id)));
  const focusObjectId=currentPuzzle?.targetObjectId??objects.find(object=>!object.inspected)?.id??null;
  const focus=objects.find(object=>object.id===focusObjectId);
  const aiMode:EscapeRenderSnapshot['avatar']['mode']=state.lifecycle==='result'?(state.result?.reason==='escape'?'celebrating':'recovering'):signals.ai.fallback?'waiting':signals.ai.intent.toLowerCase().includes('inspect')?'observing':'acting';
  const progressPermille=Math.floor(state.solvedPuzzleIds.length*1000/Math.max(1,state.room.puzzles.length));
  const remainingTicks=Math.max(0,state.config.maxTicks-state.tick);
  const base:Omit<EscapeRenderSnapshot,'authorityChecksum'>={
    schemaVersion:1,gameId:'ai-escape-room',renderVersion:'escape-render-v1',runToken:checksum({roomId:state.roomId,roomIndex:state.roomIndex}),roomIndex:state.roomIndex,theme:state.room.theme,difficulty:state.room.difficulty,tick:state.tick,
    scene:sceneFor(state),objective:'Unlock every mechanism and escape the room',progress:{solvedPuzzles:state.solvedPuzzleIds.length,totalPuzzles:state.room.puzzles.length,permille:progressPermille,currentStage:Math.min(state.room.puzzles.length,state.solvedPuzzleIds.length+1)},
    timer:{remainingTicks,danger:remainingTicks<=Math.max(30,Math.floor(state.config.maxTicks*0.15))},record:{score:state.score,streak:state.streak},
    ai:{...structuredClone(signals.ai),factCount:signals.belief.factCount,contradictions:signals.belief.contradictions},objects,
    inventory:state.inventory.slice(0,16).sort().map(id=>({id,label:id.replace(/[-_]/g,' ')})),
    hazards:state.room.hazards.slice(0,6).map(hazard=>({id:hazard.id,kind:hazard.kind,phase:state.hazardStates[hazard.id]?.phase??'idle',phaseTick:state.hazardStates[hazard.id]?.phaseTick??0})).sort((a,b)=>a.id.localeCompare(b.id)),
    avatar:{xPermille:focus?Math.max(100,Math.min(900,focus.xPermille-70)):500,yPermille:focus?Math.max(140,Math.min(880,focus.yPermille+80)):760,mode:aiMode},focusObjectId,events:sanitizeEvents(events),health:{level:'healthy',reason:null},
  };
  const snapshot={...base,authorityChecksum:checksum(base)} as EscapeRenderSnapshot;
  return deepFreeze(snapshot);
}
