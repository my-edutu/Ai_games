import type{FloorsConfig,FloorsRunResult}from '../../../../packages/game-contracts/src/index';
import{checksum}from '../../../../packages/replay/src/index';
import{validateFloorsConfig}from '../config/schema';
import{validateFloor}from '../generation/validator';
import{FloorsRuntime}from '../runtime/run';
import{inspectFloorsInvariants}from './invariants';

export interface FloorsHeadlessOptions{seedPrefix:string;runs:number;maxTicks:number;config?:Partial<FloorsConfig>}
export interface FloorsHeadlessRun{seed:string;ticks:number;highestFloor:number;floorsCleared:number;reason:FloorsRunResult['reason']|'max-ticks';kind:'game'|'technical'|'abort';score:number;checksum:string}
export interface FloorsHeadlessReport{
  schemaVersion:1;gameId:'ai-vs-1000-floors';deterministicVersion:'floors-r1-v1';runs:FloorsHeadlessRun[];totalTicks:number;
  outcomes:Record<string,number>;invariantFailures:number;replayFailures:number;generatorInvalid:number;corpusChecksum:string;
}

export function runFloorsHeadless(options:FloorsHeadlessOptions):FloorsHeadlessReport{
  if(!options.seedPrefix)throw new RangeError('seedPrefix');
  if(!Number.isInteger(options.runs)||options.runs<1||options.runs>10_000)throw new RangeError('runs');
  if(!Number.isInteger(options.maxTicks)||options.maxTicks<1)throw new RangeError('maxTicks');
  const config=validateFloorsConfig(options.config??{}),runs:FloorsHeadlessRun[]=[],outcomes:Record<string,number>={};
  let totalTicks=0,invariantFailures=0,replayFailures=0,generatorInvalid=0;
  for(let index=0;index<options.runs;index++){
    const seed=`${options.seedPrefix}-${index}`,runId=`headless-${index}`;
    const primary=FloorsRuntime.create(config,seed,{runId,policy:'fallback'}),replay=FloorsRuntime.create(config,seed,{runId,policy:'fallback'});
    let ticks=0,lastFloor=0;
    while(primary.state.lifecycle==='running'&&ticks<options.maxTicks){
      primary.step();replay.step();ticks++;
      if(primary.state.floor.number!==lastFloor){lastFloor=primary.state.floor.number;const report=validateFloor(primary.state.floor,config);if(!report.valid)generatorInvalid++}
      const failures=inspectFloorsInvariants(primary.state);invariantFailures+=failures.length;
      if(checksum(primary.state)!==checksum(replay.state)||checksum(primary.rng.snapshot())!==checksum(replay.rng.snapshot())){replayFailures++;break}
    }
    totalTicks+=ticks;
    const reason=primary.state.result?.reason??'max-ticks',kind=primary.state.result?.kind??'abort';outcomes[reason]=(outcomes[reason]??0)+1;
    runs.push({seed,ticks,highestFloor:primary.state.highestFloor,floorsCleared:primary.state.floorsCleared,reason,kind,score:primary.state.score,checksum:checksum({state:primary.state,rng:primary.rng.snapshot(),events:primary.peekEvents()})});
  }
  const body={schemaVersion:1 as const,gameId:'ai-vs-1000-floors' as const,deterministicVersion:'floors-r1-v1' as const,runs,totalTicks,outcomes,invariantFailures,replayFailures,generatorInvalid};
  return{...body,corpusChecksum:checksum(body)};
}
