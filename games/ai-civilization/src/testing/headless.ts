import{checksum}from'../../../../packages/replay/src/index';
import type{CivilizationConfig}from'../config/schema';
import{CivilizationRuntime}from'../runtime/run';
import{assertCivilizationInvariants}from'../rules/step';
export interface HeadlessOptions{seed:string;maxDays:number;config?:Partial<CivilizationConfig>}
export interface HeadlessSummary{seed:string;days:number;outcome:string;tier:string;renown:number;population:number;stability:number;integrityFailures:number;fallbackDecisions:number;eventSequence:number;successions:number;greatWorks:number;crises:number;finalChecksum:string}
export function runCivilizationHeadless(options:HeadlessOptions):HeadlessSummary{
  const runtime=CivilizationRuntime.create({...options.config,maxRunDays:Math.max(options.maxDays,options.config?.maxRunDays??0)},options.seed);
  let failures=0,crises=0;
  for(let i=0;i<options.maxDays&&runtime.state.lifecycle==='running';i++){
    try{
      runtime.step();assertCivilizationInvariants(runtime.state);
      crises+=runtime.drainEvents().filter(e=>e.type==='crisis-warning').length;
    }catch{failures++;break}
  }
  const outcome=runtime.state.result?.reason??'running-cap';
  return{
    seed:options.seed,days:runtime.state.tick,outcome,tier:runtime.state.progression.tier,renown:runtime.state.progression.renown,
    population:runtime.state.population.total,stability:runtime.state.stability,integrityFailures:failures,
    fallbackDecisions:runtime.state.ai.fallbackUsed?1:0,eventSequence:runtime.getNextEventSequence(),
    successions:runtime.state.chronicle.reigns.length,greatWorks:runtime.state.progression.completedGreatWorks.length,crises,
    finalChecksum:checksum(runtime.state)
  };
}
