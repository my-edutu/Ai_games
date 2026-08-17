import type { EscapeAction, EscapeRoomConfig, EscapeRunResult } from '../../../../packages/game-contracts/src/index';
import { checksum } from '../../../../packages/replay/src/index';
import { NamedRng, type RngSnapshot } from '../../../../packages/seeded-rng/src/index';
import { generateEscapeRoom } from '../generation/generator';
import { solveEscapeRoom } from '../generation/solver';
import type { EscapeEvent, EscapeState, EscapeStepResult } from '../state/types';
import { applyEscapeAction } from '../rules/step';
import { listLegalEscapeActions, escapeActionKey } from '../rules/actions';

export type EscapePolicy='manual'|'oracle-test'|'autonomous';
export interface EscapeRuntimeCreateOptions{config:EscapeRoomConfig;seed:string;runId:string;roomIndex?:number;policy?:EscapePolicy;}
export interface EscapeRuntimeMaterial{
  schemaVersion:1;
  rootSeed:string;
  policy:EscapePolicy;
  state:EscapeState;
  rng:RngSnapshot;
  oracleActions:EscapeAction[];
  oracleIndex:number;
  bufferedEvents:EscapeEvent[];
}

function initialObjectStates(room:EscapeState['room']){
  return Object.fromEntries(room.objects.map(object=>[object.id,{visible:object.visibleFromStart,inspected:false,carried:false,solved:false,labelVariant:0}]));
}

export function createInitialEscapeState(config:EscapeRoomConfig,seed:string,runId:string,rng:NamedRng,roomIndex=1):EscapeState{
  const generated=generateEscapeRoom(config,rng);
  const objectStates=initialObjectStates(generated.definition);
  const roomId=`escape-${roomIndex}-${checksum(generated.definition)}`;
  return{
    schemaVersion:1,runId,roomId,roomIndex,rootSeed:seed,roomSeed:rng.seed,config:structuredClone(config),
    lifecycle:'running',tick:0,intermissionRemaining:0,room:generated.definition,objectStates,
    visibleObjectIds:Object.entries(objectStates).filter(([,value])=>value.visible).map(([id])=>id).sort(),
    inventory:[],combinedItems:[],discoveredFacts:{},solvedPuzzleIds:[],
    hazardStates:Object.fromEntries(generated.definition.hazards.map(hazard=>[hazard.id,{id:hazard.id,phase:'idle',phaseTick:0,suppressedUntilTick:-1}])),
    hintsRemaining:config.hintBudget,score:0,streak:0,lastProgressTick:0,actionHistory:[],acceptedCommandIds:[],eventSeq:0,commandSeq:0,result:null,
  };
}

function lifecycleEvent(state:EscapeState,type:string,payload:Record<string,unknown>):EscapeEvent{
  return{schemaVersion:1,seq:state.eventSeq++,tick:state.tick,type,payload};
}

export class EscapeRuntime{
  private bufferedEvents:EscapeEvent[];
  private rng:NamedRng;
  private oracleActions:EscapeAction[];
  private oracleIndex:number;
  private constructor(public state:EscapeState,private readonly rootSeed:string,private readonly policy:EscapePolicy,rng:NamedRng,oracleActions:EscapeAction[],oracleIndex:number,events:EscapeEvent[]){
    this.rng=rng;this.oracleActions=oracleActions;this.oracleIndex=oracleIndex;this.bufferedEvents=events;
  }
  static create(options:EscapeRuntimeCreateOptions){
    const roomIndex=options.roomIndex??1;
    const roomSeed=`${options.seed}:room:${roomIndex}`;
    const rng=NamedRng.fromSeed(roomSeed);
    const state=createInitialEscapeState(options.config,options.seed,options.runId,rng,roomIndex);
    const policy=options.policy??'manual';
    const oracleActions=policy==='oracle-test'?(solveEscapeRoom(state.room)?.actions??[]):[];
    const runtime=new EscapeRuntime(state,options.seed,policy,rng,oracleActions,0,[]);
    runtime.bufferedEvents.push(lifecycleEvent(runtime.state,'room-started',{roomId:state.roomId,roomIndex,seed:roomSeed}));
    return runtime;
  }
  static restore(material:EscapeRuntimeMaterial){
    return new EscapeRuntime(structuredClone(material.state),material.rootSeed,material.policy,NamedRng.restore(material.rng),structuredClone(material.oracleActions),material.oracleIndex,structuredClone(material.bufferedEvents));
  }
  private nextOracleAction():EscapeAction{
    const legal=listLegalEscapeActions(this.state);
    while(this.oracleIndex<this.oracleActions.length){
      const action=this.oracleActions[this.oracleIndex]!;
      if(legal.some(candidate=>escapeActionKey(candidate)===escapeActionKey(action))){this.oracleIndex++;return action;}
      this.oracleIndex++;
    }
    return{kind:'wait'};
  }
  private restartNextRoom(){
    const nextIndex=this.state.roomIndex+1;
    const roomSeed=`${this.rootSeed}:room:${nextIndex}`;
    this.rng=NamedRng.fromSeed(roomSeed);
    const streak=this.state.streak;const score=this.state.score;
    this.state=createInitialEscapeState(this.state.config,this.rootSeed,this.state.runId,this.rng,nextIndex);
    this.state.streak=streak;this.state.score=score;
    this.oracleActions=this.policy==='oracle-test'?(solveEscapeRoom(this.state.room)?.actions??[]):[];this.oracleIndex=0;
    this.bufferedEvents.push(lifecycleEvent(this.state,'room-started',{roomId:this.state.roomId,roomIndex:nextIndex,seed:roomSeed}));
  }
  step(action?:EscapeAction):EscapeStepResult{
    if(this.state.lifecycle==='result'){
      this.state=structuredClone(this.state);this.state.tick+=1;this.state.lifecycle='intermission';this.state.intermissionRemaining=this.state.config.intermissionTicks;
      const event=lifecycleEvent(this.state,'intermission-started',{remaining:this.state.intermissionRemaining});this.bufferedEvents.push(event);
      return{accepted:true,reason:'accepted',state:structuredClone(this.state),events:[event]};
    }
    if(this.state.lifecycle==='intermission'){
      this.state=structuredClone(this.state);this.state.tick+=1;this.state.intermissionRemaining=Math.max(0,this.state.intermissionRemaining-1);
      if(this.state.intermissionRemaining===0)this.restartNextRoom();
      return{accepted:true,reason:'accepted',state:structuredClone(this.state),events:[]};
    }
    this.state=structuredClone(this.state);this.state.tick+=1;
    const selected=action??(this.policy==='oracle-test'?this.nextOracleAction():{kind:'wait'});
    let result=applyEscapeAction(this.state,selected,this.rng);
    this.state=result.state;this.bufferedEvents.push(...result.events);
    if(!this.state.result&&this.state.tick>=this.state.config.maxTicks){
      const terminal:EscapeRunResult={kind:'game',reason:'timer-expired',tick:this.state.tick,roomIndex:this.state.roomIndex,score:this.state.score,solvedPuzzles:this.state.solvedPuzzleIds.length};
      this.state.result=terminal;this.state.lifecycle='result';const event=lifecycleEvent(this.state,'result',{...terminal});this.bufferedEvents.push(event);result={...result,state:structuredClone(this.state),events:[...result.events,event]};
    }else if(!this.state.result&&this.state.tick-this.state.lastProgressTick>=this.state.config.noProgressTicks){
      const terminal:EscapeRunResult={kind:'game',reason:'stagnation',tick:this.state.tick,roomIndex:this.state.roomIndex,score:this.state.score,solvedPuzzles:this.state.solvedPuzzleIds.length};
      this.state.result=terminal;this.state.lifecycle='result';const event=lifecycleEvent(this.state,'result',{...terminal});this.bufferedEvents.push(event);result={...result,state:structuredClone(this.state),events:[...result.events,event]};
    }
    return{...result,state:structuredClone(this.state)};
  }
  applyAction(action:EscapeAction){return this.step(action);}
  restart(){this.restartNextRoom();return structuredClone(this.state);}
  drainEvents(){const events=structuredClone(this.bufferedEvents);this.bufferedEvents=[];return events;}
  signals(){return{tick:this.state.tick,lifecycle:this.state.lifecycle,roomId:this.state.roomId,progressPermille:Math.floor(this.state.solvedPuzzleIds.length*1000/this.state.room.puzzles.length),eventBacklog:this.bufferedEvents.length,result:this.state.result?.reason??null};}
  snapshotMaterial():EscapeRuntimeMaterial{return{schemaVersion:1,rootSeed:this.rootSeed,policy:this.policy,state:structuredClone(this.state),rng:this.rng.snapshot(),oracleActions:structuredClone(this.oracleActions),oracleIndex:this.oracleIndex,bufferedEvents:structuredClone(this.bufferedEvents)};}
}
