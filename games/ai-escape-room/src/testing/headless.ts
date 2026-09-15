import type { EscapeRoomConfig, EscapeRunResult } from '../../../../packages/game-contracts/src/index';
import { checksum } from '../../../../packages/replay/src/index';
import { EscapeRuntime } from '../runtime/run';
export interface EscapeHeadlessSummary{seed:string;runId:string;ticks:number;actionCount:number;eventCount:number;result:EscapeRunResult;finalChecksum:string;}
export function runEscapeHeadless(options:{config:EscapeRoomConfig;seed:string;runId:string;maxSteps?:number}):EscapeHeadlessSummary{
  const runtime=EscapeRuntime.create({...options,policy:'oracle-test'});let actionCount=0;const limit=options.maxSteps??options.config.maxTicks+10;
  while(!runtime.state.result&&actionCount<limit){runtime.step();actionCount++;}
  if(!runtime.state.result)throw new Error('headless run exceeded bounded step limit');
  const events=runtime.drainEvents();return{seed:options.seed,runId:options.runId,ticks:runtime.state.tick,actionCount,eventCount:events.length,result:structuredClone(runtime.state.result),finalChecksum:checksum(runtime.snapshotMaterial())};
}
