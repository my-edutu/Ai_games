import{checksum}from'../../../../packages/replay/src/index';
import{validateFloor}from'../generation/validator';
import{FloorsRuntime}from'../runtime/run';
import{actionKey,listLegalActions}from'../rules/step';
import{chooseProductionAction}from'../ai/policy';

export interface FloorsCampaignOptions{seeds:number;maxTicks:number;seedPrefix?:string}
export interface FloorsCampaignReport{runs:number;invalidActions:number;invalidFloors:number;replayDivergence:number;technicalOutcomes:number;gameOutcomes:number;maxFloor:number;sectorsSeen:number;maxPlannerExpansions:number;fallbackDecisions:number;checksums:string[];outcomes:Record<string,number>}

export function runFloorsCampaign(options:FloorsCampaignOptions):FloorsCampaignReport{
  if(!Number.isInteger(options.seeds)||options.seeds<1||options.seeds>5000)throw new RangeError('seeds');if(!Number.isInteger(options.maxTicks)||options.maxTicks<1)throw new RangeError('maxTicks');
  const prefix=options.seedPrefix??'floors-campaign',report:FloorsCampaignReport={runs:options.seeds,invalidActions:0,invalidFloors:0,replayDivergence:0,technicalOutcomes:0,gameOutcomes:0,maxFloor:1,sectorsSeen:1,maxPlannerExpansions:0,fallbackDecisions:0,checksums:[],outcomes:{}};
  const sectors=new Set<number>();
  for(let i=0;i<options.seeds;i++){
    const seed=`${prefix}-${i}`,runtime=FloorsRuntime.create({},seed,{policy:'production'}),mirror=FloorsRuntime.create({},seed,{policy:'production'});let previousFloor=0;
    for(let tick=0;tick<options.maxTicks&&runtime.state.lifecycle==='running';tick++){
      const decision=chooseProductionAction(runtime.state),legal=listLegalActions(runtime.state);if(!legal.some(action=>actionKey(action)===actionKey(decision.action))){report.invalidActions++;break}report.maxPlannerExpansions=Math.max(report.maxPlannerExpansions,decision.expansions);if(decision.mode==='fallback')report.fallbackDecisions++;
      runtime.step(decision.action);mirror.step(decision.action);
      if(runtime.state.floor.number!==previousFloor){const validation=validateFloor(runtime.state.floor,runtime.state.config);if(!validation.valid)report.invalidFloors++;previousFloor=runtime.state.floor.number}
      report.maxFloor=Math.max(report.maxFloor,runtime.state.floor.number);sectors.add(runtime.state.floor.sector);
      if(checksum(runtime.state)!==checksum(mirror.state)){report.replayDivergence++;break}
    }
    const reason=runtime.state.result?.reason??'running-cap';report.outcomes[reason]=(report.outcomes[reason]??0)+1;if(runtime.state.result?.kind==='technical')report.technicalOutcomes++;else if(runtime.state.result)report.gameOutcomes++;report.checksums.push(checksum(runtime.state));
  }
  report.sectorsSeen=sectors.size;return report;
}
