import { checksum } from '../../../../packages/replay/src/index';
import type { EscapePublicIntent } from '../ai/planner';
import type { EscapeEvent, EscapePuzzleKind, EscapeState } from '../state/types';

export interface EscapePresentationSignals{
  ai:EscapePublicIntent;
  belief:{schemaVersion:1;currentGoal:string|null;factCount:number;hypothesisCount:number;confidenceBand:'low'|'medium'|'high';contradictions:number;lastObservationTick:number};
  pathologyCount:number;
  plannerExpansions:number;
}
export type EscapePhysicalSurface='desk'|'shelf'|'left-wall'|'right-wall'|'back-wall'|'console'|'pedestal'|'floor'|'exit';
export interface EscapePhysicalPlacement{surface:EscapePhysicalSurface;slot:number;variant:number;stage:number|null;}
export interface EscapeRenderObject{
  id:string;kind:string;labelKey:string;shape:string;symbol:string;color:string;inspected:boolean;carried:boolean;solved:boolean;xPermille:number;yPermille:number;mechanismKind:EscapePuzzleKind|null;placement:EscapePhysicalPlacement;
}
export interface EscapeRenderEvent{seq:number;tick:number;type:string;label:string;priority:number;}
export interface EscapeRenderSnapshot{
  schemaVersion:1;gameId:'ai-escape-room';renderVersion:'escape-render-v2';runToken:string;authorityChecksum:string;roomIndex:number;theme:string;difficulty:number;tick:number;
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
function stableVariant(id:string){let hash=2166136261;for(let index=0;index<id.length;index++){hash^=id.charCodeAt(index);hash=Math.imul(hash,16777619);}return(hash>>>0)%8;}
function physicalPlacement(kind:string,mechanismKind:EscapePuzzleKind|null,index:number,stage:number|null,id:string):EscapePhysicalPlacement{
  const variant=stableVariant(id),slot=Math.max(0,Math.min(15,index%16));
  if(kind==='exit')return{surface:'exit',slot:0,variant,stage};
  if(mechanismKind==='final-vault'||kind==='vault')return{surface:variant%2===0?'back-wall':'pedestal',slot:0,variant,stage};
  if(kind==='scale'||mechanismKind==='balance-clue')return{surface:'pedestal',slot:slot%4,variant,stage};
  if(kind==='switch'||mechanismKind==='switch-network')return{surface:variant%2===0?'right-wall':'console',slot:slot%6,variant,stage};
  if(kind==='lock'||mechanismKind){return{surface:variant%2===0?'left-wall':'right-wall',slot:slot%8,variant,stage};}
  if(kind==='tool')return{surface:variant%3===0?'shelf':'desk',slot:slot%8,variant,stage};
  if(kind==='clue')return{surface:variant%2===0?'desk':'shelf',slot:slot%10,variant,stage};
  return{surface:variant%2===0?'floor':'shelf',slot:slot%10,variant,stage};
}
function presentationCoordinates(placement:EscapePhysicalPlacement){
  const normalized=(placement.slot%8)/7;
  if(placement.surface==='left-wall')return{xPermille:120,yPermille:180+Math.round(normalized*560)};
  if(placement.surface==='right-wall')return{xPermille:880,yPermille:180+Math.round(normalized*560)};
  if(placement.surface==='back-wall'||placement.surface==='exit')return{xPermille:500,yPermille:180+Math.round(normalized*260)};
  if(placement.surface==='desk'||placement.surface==='console')return{xPermille:250+Math.round(normalized*500),yPermille:690};
  if(placement.surface==='pedestal')return{xPermille:350+Math.round(normalized*300),yPermille:520};
  if(placement.surface==='shelf')return{xPermille:180+Math.round(normalized*640),yPermille:350};
  return{xPermille:180+Math.round(normalized*640),yPermille:800};
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
  const mechanismKinds=new Map(state.room.puzzles.map(puzzle=>[puzzle.targetObjectId,puzzle.kind] as const));
  const stageByObject=new Map<string,number>();for(const puzzle of state.room.puzzles){stageByObject.set(puzzle.targetObjectId,puzzle.stage);for(const clueId of puzzle.clueIds)stageByObject.set(clueId,puzzle.stage);}
  const objects=visible.map((object,index)=>{
    const mechanismKind=mechanismKinds.get(object.id)??null,stage=stageByObject.get(object.id)??null,placement=physicalPlacement(object.kind,mechanismKind,index,stage,object.id),coordinates=presentationCoordinates(placement);
    return{id:object.id,kind:object.kind,labelKey:object.labelKey,shape:object.publicShape??object.kind,symbol:object.publicSymbol??object.kind,color:object.publicColor??'neutral',
      inspected:state.objectStates[object.id]!.inspected,carried:state.objectStates[object.id]!.carried,solved:state.objectStates[object.id]!.solved,mechanismKind,placement,...coordinates};
  });
  const currentPuzzle=state.room.puzzles.find(puzzle=>!state.solvedPuzzleIds.includes(puzzle.id)&&puzzle.prerequisitePuzzleIds.every(id=>state.solvedPuzzleIds.includes(id)));
  const focusObjectId=currentPuzzle?.targetObjectId??objects.find(object=>!object.inspected)?.id??null;
  const focus=objects.find(object=>object.id===focusObjectId);
  const aiMode:EscapeRenderSnapshot['avatar']['mode']=state.lifecycle==='result'?(state.result?.reason==='escape'?'celebrating':'recovering'):signals.ai.fallback?'waiting':signals.ai.intent.toLowerCase().includes('inspect')?'observing':'acting';
  const progressPermille=Math.floor(state.solvedPuzzleIds.length*1000/Math.max(1,state.room.puzzles.length));
  const remainingTicks=Math.max(0,state.config.maxTicks-state.tick);
  const base:Omit<EscapeRenderSnapshot,'authorityChecksum'>={
    schemaVersion:1,gameId:'ai-escape-room',renderVersion:'escape-render-v2',runToken:checksum({roomId:state.roomId,roomIndex:state.roomIndex}),roomIndex:state.roomIndex,theme:state.room.theme,difficulty:state.room.difficulty,tick:state.tick,
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
