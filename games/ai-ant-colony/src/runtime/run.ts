import{NamedRng}from '../../../../packages/seeded-rng/src/index';
import type{RngSnapshot}from '../../../../packages/seeded-rng/src/index';
import type{AntColonyConfig,AntColonyConfigInput}from '../config/schema';import{parseAntColonyConfig}from '../config/schema';
import{createInitialColonyState}from '../generation/world';import{stepAntColony}from '../rules/step';import{assertAntColonyInvariants}from '../state/invariants';import type{AntColonyState,AntEvent}from '../state/types';
export class AntColonyRuntime{
  events:AntEvent[]=[];state:AntColonyState;rng:NamedRng;private seq:number;
  private constructor(public config:AntColonyConfig,public seed:string,state?:AntColonyState,rng?:NamedRng,nextEventSeq=0){this.seq=nextEventSeq;this.rng=rng??NamedRng.fromSeed(seed);this.state=state??createInitialColonyState(config,seed,`ant-${seed}`,this.rng);if(!state)this.emit('initialized',{seed,profile:config.profile,population:this.state.ants.length})}
  static create(config:AntColonyConfigInput,seed:string){return new AntColonyRuntime(parseAntColonyConfig(config),seed)}
  static restore(config:AntColonyConfig,seed:string,state:AntColonyState,rng:RngSnapshot|NamedRng,nextEventSeq:number){const restored=rng instanceof NamedRng?rng:NamedRng.restore(rng);assertAntColonyInvariants(state);return new AntColonyRuntime(config,seed,state,restored,nextEventSeq)}
  private emit(type:string,data?:Record<string,unknown>){this.events.push({seq:this.seq++,tick:this.state.tick,type,data})}
  step(){if(this.state.lifecycle==='result'){this.state.lifecycle='intermission';this.emit('intermission',{remaining:this.state.intermissionRemaining});return this.state}if(this.state.lifecycle==='intermission'){this.state.intermissionRemaining--;if(this.state.intermissionRemaining<=0)this.restart();return this.state}if(this.state.lifecycle==='quarantined')return this.state;const output=stepAntColony(this.state,this.rng);this.state=output.state;for(const event of output.events)this.emit(event.type,event.data);return this.state}
  restart(seed?:string){const nextIndex=this.state.runIndex+1;this.seed=seed??`${this.seed}:restart:${nextIndex}`;this.rng=NamedRng.fromSeed(this.seed);this.state=createInitialColonyState(this.config,this.seed,`ant-${this.seed}`,this.rng,nextIndex);this.emit('restart',{seed:this.seed,runIndex:nextIndex});return this.state}
  drainEvents(limit=10_000){if(!Number.isInteger(limit)||limit<0)throw new RangeError('limit');return this.events.splice(0,Math.min(limit,this.events.length))}
  getNextEventSequence(){return this.seq}
}
