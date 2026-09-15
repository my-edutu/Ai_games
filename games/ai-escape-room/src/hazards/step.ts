import type { EscapeEvent, EscapeState } from '../state/types';

export interface EscapeHazardStepResult{
  state:EscapeState;
  events:EscapeEvent[];
  telegraphHazardIds:string[];
  activeHazardIds:string[];
}

function phaseAt(state:EscapeState,hazard:EscapeState['room']['hazards'][number]):{phase:'idle'|'telegraph'|'active';phaseTick:number}{
  if(state.tick<=state.hazardStates[hazard.id]!.suppressedUntilTick)return{phase:'idle',phaseTick:0};
  const position=((state.tick+hazard.phaseOffset)%hazard.periodTicks+hazard.periodTicks)%hazard.periodTicks;
  if(position<hazard.telegraphTicks)return{phase:'telegraph',phaseTick:position};
  if(position<hazard.telegraphTicks+hazard.activeTicks)return{phase:'active',phaseTick:position-hazard.telegraphTicks};
  return{phase:'idle',phaseTick:position-hazard.telegraphTicks-hazard.activeTicks};
}

export function stepEscapeHazards(state:EscapeState):EscapeHazardStepResult{
  const next=structuredClone(state);const events:EscapeEvent[]=[];const telegraphHazardIds:string[]=[];const activeHazardIds:string[]=[];
  for(const hazard of [...next.room.hazards].sort((a,b)=>a.id.localeCompare(b.id))){
    const status=next.hazardStates[hazard.id]??{id:hazard.id,phase:'idle' as const,phaseTick:0,suppressedUntilTick:-1};
    const previous=status.phase;const phase=phaseAt(next,hazard);status.phase=phase.phase;status.phaseTick=phase.phaseTick;next.hazardStates[hazard.id]=status;
    if(phase.phase==='telegraph')telegraphHazardIds.push(hazard.id);
    if(phase.phase==='active')activeHazardIds.push(hazard.id);
    if(previous!==phase.phase){
      events.push({schemaVersion:1,seq:next.eventSeq++,tick:next.tick,type:'hazard-phase',payload:{hazardId:hazard.id,kind:hazard.kind,phase:phase.phase,phaseTick:phase.phaseTick}});
    }
  }
  return{state:next,events,telegraphHazardIds,activeHazardIds};
}
