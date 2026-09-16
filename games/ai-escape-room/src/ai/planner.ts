import type { EscapeAction } from '../../../../packages/game-contracts/src/index';
import { stableSerialize } from '../../../../packages/replay/src/index';
import type { EscapeBelief } from './belief';
import { observationActionFromAffordance, type EscapeAffordance, type EscapeObservation } from './observation';

export interface EscapePublicIntent{
  goal:string;
  observation:string;
  intent:string;
  confidenceBand:'low'|'medium'|'high';
  fallback:boolean;
  planChangeReason:string|null;
}
export interface EscapeDecision{action:EscapeAction;publicIntent:EscapePublicIntent;expansions:number;consideredActionKeys:string[];}
export interface EscapePlannerBudget{maxExpansions:number;}

function confidence(value:number|undefined):EscapePublicIntent['confidenceBand']{return(value??0)>=800?'high':(value??0)>=500?'medium':'low';}
function affordanceKey(value:EscapeAffordance){return stableSerialize(value);}
function intentFor(action:EscapeAction,goal:string,confidenceBand:EscapePublicIntent['confidenceBand'],fallback=false,reason:string|null=null):EscapePublicIntent{
  if(action.kind==='inspect')return{goal,observation:'An unexplored object is visible',intent:'Inspecting for new evidence',confidenceBand,fallback,planChangeReason:reason};
  if(action.kind==='take')return{goal,observation:'A useful portable object is understood',intent:'Securing the tool for a dependency',confidenceBand,fallback,planChangeReason:reason};
  if(action.kind==='use')return{goal,observation:'A tool matches the active mechanism',intent:'Applying the verified tool',confidenceBand,fallback,planChangeReason:reason};
  if(action.kind==='enter-code'||action.kind==='activate')return{goal,observation:'The clue set supports one current hypothesis',intent:'Testing a derived mechanism state',confidenceBand,fallback,planChangeReason:reason};
  if(action.kind==='exit')return{goal:'escape',observation:'Every mandatory mechanism is resolved',intent:'Opening the exit',confidenceBand:'high',fallback:false,planChangeReason:null};
  return{goal,observation:'No safe progressing action is currently available',intent:'Waiting for a valid opening',confidenceBand,fallback:true,planChangeReason:reason??'no-progressing-affordance'};
}

export function planEscapeAction(observation:EscapeObservation,belief:EscapeBelief,budget:EscapePlannerBudget):EscapeDecision{
  if(!Number.isInteger(budget.maxExpansions)||budget.maxExpansions<1)throw new RangeError('maxExpansions');
  const considered:EscapeAffordance[]=[];
  const push=(items:EscapeAffordance[])=>{for(const item of [...items].sort((a,b)=>affordanceKey(a).localeCompare(affordanceKey(b))))if(considered.length<budget.maxExpansions)considered.push(item);};
  const activeHazard=observation.hazards.find(hazard=>hazard.phase==='active');
  if(activeHazard){
    const action:EscapeAction={kind:'wait'};
    return{action,publicIntent:{goal:'survive-hazard',observation:`${activeHazard.kind} is active`,intent:'Holding position until the hazard clears',confidenceBand:'high',fallback:false,planChangeReason:'hazard-reflex'},expansions:1,consideredActionKeys:[stableSerialize(action)]};
  }
  const exit=observation.affordances.find(item=>item.kind==='exit');
  if(exit){const action=observationActionFromAffordance(exit);return{action,publicIntent:intentFor(action,'escape','high'),expansions:1,consideredActionKeys:[affordanceKey(exit)]};}

  const interactions=observation.affordances.filter(item=>item.kind==='use'||item.kind==='enter-code'||item.kind==='activate');
  push(interactions);
  for(const affordance of considered){
    if(affordance.kind!=='use'&&affordance.kind!=='enter-code'&&affordance.kind!=='activate')continue;
    const hypothesis=belief.hypotheses[affordance.puzzleId];
    if(!hypothesis)continue;
    const action=observationActionFromAffordance(affordance,hypothesis.value);
    return{action,publicIntent:intentFor(action,affordance.puzzleId,confidence(hypothesis.confidencePermille)),expansions:considered.length,consideredActionKeys:considered.map(affordanceKey)};
  }

  const take=observation.affordances.filter(item=>item.kind==='take');push(take);
  const selectedTake=considered.find(item=>item.kind==='take');
  if(selectedTake){const action=observationActionFromAffordance(selectedTake);return{action,publicIntent:intentFor(action,belief.currentGoal??'prepare-tool','medium'),expansions:considered.length,consideredActionKeys:considered.map(affordanceKey)};}

  const inspect=observation.affordances.filter(item=>item.kind==='inspect').sort((a,b)=>{
    if(a.kind!=='inspect'||b.kind!=='inspect')return 0;
    const objectA=observation.visibleObjects.find(object=>object.id===a.targetId);const objectB=observation.visibleObjects.find(object=>object.id===b.targetId);
    const score=(object?:{kind:string})=>object?.kind==='clue'||object?.kind==='tool'?0:object?.kind==='decoy'?2:1;
    return score(objectA)-score(objectB)||a.targetId.localeCompare(b.targetId);
  });
  push(inspect);
  const selectedInspect=inspect[0];
  if(selectedInspect&&considered.length<=budget.maxExpansions){const action=observationActionFromAffordance(selectedInspect);return{action,publicIntent:intentFor(action,belief.currentGoal??'discover-clue','medium'),expansions:Math.min(budget.maxExpansions,considered.length),consideredActionKeys:considered.map(affordanceKey)};}

  const combine=observation.affordances.filter(item=>item.kind==='combine');push(combine);
  const selectedCombine=combine[0];
  if(selectedCombine){const action=observationActionFromAffordance(selectedCombine);return{action,publicIntent:intentFor(action,'test-inventory','low'),expansions:Math.min(budget.maxExpansions,considered.length),consideredActionKeys:considered.map(affordanceKey)};}

  const action:EscapeAction={kind:'wait'};
  return{action,publicIntent:intentFor(action,belief.currentGoal??'recover','low',true,'no-progressing-affordance'),expansions:Math.max(1,Math.min(budget.maxExpansions,considered.length)),consideredActionKeys:[...considered.map(affordanceKey),stableSerialize(action)].slice(0,budget.maxExpansions)};
}
