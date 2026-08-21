import type{FloorsAction,FloorsConfig}from '../../../../packages/game-contracts/src/index';
import{NamedRng,type RngSnapshot}from '../../../../packages/seeded-rng/src/index';
import{validateFloorsConfig}from'../config/schema';
import{chooseFallbackAction}from'../ai/fallback';
import{chooseProductionAction}from'../ai/policy';
import{applyScheduledFloorsInfluence}from'../influence/system';
import{applyFloorsAction}from'../rules/step';
import{createFloorsInitialState}from'../index';
import type{FloorsDecision,FloorsEvent,FloorsState}from'../state/types';

export type FloorsPolicy='fallback'|'production'|'wait-test';
export interface FloorsRuntimeOptions{runId?:string;policy?:FloorsPolicy}
export interface FloorsRuntimeRestore{state:FloorsState;rng:RngSnapshot;events:FloorsEvent[];rootSeed:string;runOrdinal:number;policy:FloorsPolicy}
function clone<T>(value:T):T{return structuredClone(value)}
export class FloorsRuntime{
  public state:FloorsState;public rng:NamedRng;private events:FloorsEvent[];private readonly rootSeed:string;private runOrdinal:number;private readonly policy:FloorsPolicy;
  private constructor(input:FloorsRuntimeRestore){this.state=clone(input.state);this.rng=NamedRng.restore(input.rng);this.events=clone(input.events);this.rootSeed=input.rootSeed;this.runOrdinal=input.runOrdinal;this.policy=input.policy}
  static create(configInput:Partial<FloorsConfig>,seed:string,options:FloorsRuntimeOptions={}):FloorsRuntime{const config=validateFloorsConfig(configInput),runId=options.runId??`${seed}:run:0`,rng=NamedRng.fromSeed(seed),state=createFloorsInitialState(config,seed,runId,rng);const runtime=new FloorsRuntime({state,rng:rng.snapshot(),events:[],rootSeed:seed,runOrdinal:0,policy:options.policy??'production'});runtime.emit('runtime-initialized',{gameId:'ai-vs-1000-floors',runId:state.runId});runtime.emit('floor-started',{floor:1,sector:1,archetype:state.floor.archetype});return runtime}
  static restore(input:FloorsRuntimeRestore):FloorsRuntime{return new FloorsRuntime(input)}
  get restoreMetadata():{rootSeed:string;runOrdinal:number;policy:FloorsPolicy}{return{rootSeed:this.rootSeed,runOrdinal:this.runOrdinal,policy:this.policy}}
  private emit(type:string,data?:Record<string,unknown>):void{this.state.eventSequence++;this.events.push({seq:this.state.eventSequence,tick:this.state.tick,type,data});if(this.events.length>2048)this.events.splice(0,this.events.length-2048)}
  private restart():void{this.runOrdinal++;const seed=`${this.rootSeed}:restart:${this.runOrdinal}`,runId=`${this.rootSeed}:run:${this.runOrdinal}`;this.rng=NamedRng.fromSeed(seed);this.state=createFloorsInitialState(this.state.config,seed,runId,this.rng);this.events=[];this.emit('runtime-restarted',{runId,runOrdinal:this.runOrdinal});this.emit('floor-started',{floor:1,sector:1,archetype:this.state.floor.archetype})}
  step(action?:FloorsAction):FloorsState{
    if(this.state.lifecycle==='result'){this.state=clone(this.state);this.state.tick++;this.state.lifecycle='intermission';this.state.intermissionRemaining=this.state.config.intermissionTicks;this.emit('intermission-started',{remaining:this.state.intermissionRemaining});return this.state}
    if(this.state.lifecycle==='intermission'){this.state=clone(this.state);this.state.tick++;this.state.intermissionRemaining=Math.max(0,this.state.intermissionRemaining-1);if(this.state.intermissionRemaining===0)this.restart();return this.state}
    const influence=applyScheduledFloorsInfluence(this.state,this.state.tick,this.rng);this.state=influence.state;for(const item of influence.applied)this.emit('audience-influence-applied',{id:item.id,effectId:item.effectId,pressure:this.state.influence.pressure});
    const decision:FloorsDecision=action?{action,mode:'operator',confidence:'high',intent:'Applying a validated explicit action.',reason:'explicit-action',expansions:0}:this.policy==='wait-test'?{action:{kind:'wait'},mode:'test',confidence:'high',intent:'Waiting for deterministic timeout coverage.',reason:'wait-test',expansions:0}:this.policy==='fallback'?chooseFallbackAction(this.state):chooseProductionAction(this.state);
    const prepared=clone(this.state);const previousGoal=prepared.ai.goal;prepared.ai.mode=decision.mode==='fallback'?'fallback':decision.mode==='recovery'?'recovery':'tactical';prepared.ai.goal=prepared.floor.objective==='reach-exit'?'Reach the tower exit':'Defeat the floor guardian';prepared.ai.intent=decision.intent;prepared.ai.confidence=decision.confidence;prepared.ai.decisions++;prepared.ai.nodeExpansions=decision.expansions;if(decision.mode==='fallback')prepared.ai.fallbackCount++;if(previousGoal!==prepared.ai.goal||prepared.ai.lastPlanChangeReason!==decision.reason)prepared.ai.replans++;prepared.ai.lastPlanChangeReason=decision.reason;
    const result=applyFloorsAction(prepared,decision.action,this.rng);if(!result.accepted){this.emit('action-rejected',{reason:result.reason,action:decision.action});return this.state}this.state=result.state;for(const pending of result.events)this.emit(pending.type,pending.data);return this.state;
  }
  peekEvents():FloorsEvent[]{return clone(this.events)}
  drainEvents():FloorsEvent[]{const out=this.peekEvents();this.events=[];return out}
}
