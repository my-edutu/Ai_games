import type { GameLifecycle } from '../../game-contracts/src/index';
import type { VoteWindow } from './votes';

export interface ChatVsAiState {
  enabled: boolean;
  pressure: number;
  pressureCap: number;
  roundsCompleted: number;
  cooldownUntilTick: number;
  currentWindow: VoteWindow | null;
  recentChoiceSets: string[];
}

export function createChatVsAiState(input:{enabled:boolean;pressureCap:number}):ChatVsAiState {
  if(!Number.isInteger(input.pressureCap)||input.pressureCap<0||input.pressureCap>100) throw new RangeError('pressureCap');
  return {enabled:input.enabled,pressure:0,pressureCap:input.pressureCap,roundsCompleted:0,cooldownUntilTick:0,currentWindow:null,recentChoiceSets:[]};
}

export function openChatVsAiRound(state:ChatVsAiState,input:{tick:number;lifecycle:GameLifecycle;window:VoteWindow}):{status:'opened'|'suppressed';reason:string;state:ChatVsAiState} {
  const next=structuredClone(state);
  if(!next.enabled) return {status:'suppressed',reason:'disabled',state:next};
  if(input.lifecycle!=='running') return {status:'suppressed',reason:'lifecycle',state:next};
  if(next.currentWindow) return {status:'suppressed',reason:'overlap',state:next};
  if(input.tick<next.cooldownUntilTick) return {status:'suppressed',reason:'cooldown',state:next};
  next.currentWindow=structuredClone(input.window);
  const choiceKey=input.window.options.map(o=>o.effectId).sort().join('|');
  next.recentChoiceSets=[...next.recentChoiceSets.slice(-7),choiceKey];
  return {status:'opened',reason:'opened',state:next};
}

export function completeChatVsAiRound(state:ChatVsAiState,input:{resolvedTick:number;pressureAdded:number;cooldownTicks:number}):{state:ChatVsAiState} {
  const next=structuredClone(state);
  if(!next.currentWindow) return {state:next};
  next.pressure=Math.min(next.pressureCap,Math.max(0,next.pressure+Math.max(0,Math.floor(input.pressureAdded))));
  next.roundsCompleted++;
  next.cooldownUntilTick=input.resolvedTick+Math.max(0,Math.floor(input.cooldownTicks));
  next.currentWindow=null;
  return {state:next};
}
