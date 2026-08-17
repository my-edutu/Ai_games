import type { EscapeState } from '../state/types';
export interface EscapeDecisionHistoryEntry{tick:number;actionKey:string;progressPermille:number;}
export interface EscapePathology{kind:'repeated-action'|'no-progress'|'no-legal-action';recovery:'explore-alternate'|'reset-plan'|'safe-wait';window:number;severity:'warning'|'critical';}
export function detectEscapePathology(state:EscapeState,history:EscapeDecisionHistoryEntry[]):EscapePathology|null{
  const recent=history.slice(-8);
  if(recent.length>=4){const last=recent.at(-1)!.actionKey;const repeated=recent.slice(-4).every(item=>item.actionKey===last);if(repeated)return{kind:'repeated-action',recovery:'explore-alternate',window:4,severity:'warning'};}
  if(state.tick-state.lastProgressTick>=state.config.noProgressTicks)return{kind:'no-progress',recovery:'reset-plan',window:Math.min(8,Math.max(1,recent.length)),severity:'critical'};
  return null;
}
