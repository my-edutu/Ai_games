import type { NamedRng } from '../../../../packages/seeded-rng/src/index';
import type { SnakeState,SnakeEvent } from '../state/types';
import { EFFECT_COOLDOWNS } from './catalogue';
import { generateEffectCandidates } from './candidates';
import type { InfluenceCommand,InfluenceResult,RecordCategory } from './types';

function clone<T>(x:T):T{return JSON.parse(JSON.stringify(x)) as T;}
function category(a:RecordCategory,b:RecordCategory):RecordCategory{if(a==='chat-vs-ai'||b==='chat-vs-ai')return'chat-vs-ai';if(a==='assisted'||b==='assisted')return'assisted';return'standard';}
export function enqueueInfluence(input:SnakeState,command:InfluenceCommand){
  const state=clone(input);
  if(state.lifecycle!=='running')return{status:'rejected' as const,reason:'lifecycle',state};
  if(command.expiresAtTick<state.tick)return{status:'rejected' as const,reason:'expired',state};
  if(state.influence.applied[command.idempotencyKey]||state.influence.queued.some(q=>q.idempotencyKey===command.idempotencyKey))return{status:'duplicate' as const,reason:'duplicate',state};
  if((state.influence.cooldowns[command.effectId]??0)>state.tick)return{status:'rejected' as const,reason:'cooldown',state};
  if(!generateEffectCandidates(state,command.effectId).some(c=>c.id===command.candidateId))return{status:'rejected' as const,reason:'candidate',state};
  state.influence.queued=[...state.influence.queued,clone(command)].sort((a,b)=>a.scheduledTick-b.scheduledTick||a.id.localeCompare(b.id)).slice(0,32);
  return{status:'queued' as const,reason:'queued',state};
}
function expire(state:SnakeState){const t=state.tick;if(state.influence.shieldExpiresAtTick<=t){state.influence.shieldCharges=0;state.influence.shieldExpiresAtTick=0;}if(state.influence.safeHintUntilTick<=t)state.influence.safeHintUntilTick=0;if(state.influence.speedUntilTick<=t){state.influence.speedPermille=1000;state.influence.speedUntilTick=0;}if(state.influence.fogUntilTick<=t)state.influence.fogUntilTick=0;if(state.influence.portalPulseUntilTick<=t)state.influence.portalPulseUntilTick=0;}
export function applyDueInfluence(input:SnakeState,_rng:NamedRng):{state:SnakeState;events:SnakeEvent[]}{
  const state=clone(input),events:SnakeEvent[]=[];expire(state);if(state.lifecycle!=='running')return{state,events};
  const keep:InfluenceCommand[]=[];
  for(const cmd of state.influence.queued){
    if(cmd.scheduledTick>state.tick){keep.push(cmd);continue;}
    let status:'applied'|'rejected'='applied',reason='applied';
    const candidate=generateEffectCandidates(state,cmd.effectId).find(c=>c.id===cmd.candidateId);
    if(cmd.expiresAtTick<state.tick){status='rejected';reason='expired';}
    else if(!candidate){status='rejected';reason='candidate';}
    else if(state.influence.applied[cmd.idempotencyKey]){continue;}
    else{
      const until=Math.min(cmd.expiresAtTick,state.tick+60);
      if(cmd.effectId==='bonus-food'&&candidate.cell!==undefined){state.food=candidate.cell;state.foodKind='bonus';state.foodExpiresAt=until;}
      if(cmd.effectId==='food-choice'&&candidate.cell!==undefined){state.food=candidate.cell;state.foodKind='standard';state.foodExpiresAt=null;}
      if(cmd.effectId==='safe-hint')state.influence.safeHintUntilTick=until;
      if(cmd.effectId==='shield-token'){state.influence.shieldCharges=1;state.influence.shieldExpiresAtTick=until;}
      if(cmd.effectId==='speed-shift'){state.influence.speedPermille=Math.max(750,Math.min(1250,Number(candidate.value)||1000));state.influence.speedUntilTick=until;}
      if(cmd.effectId==='fog-field')state.influence.fogUntilTick=until;
      if(cmd.effectId==='portal-pulse')state.influence.portalPulseUntilTick=until;
      if(cmd.effectId==='obstacle-choice'&&candidate.cell!==undefined&&!state.obstacles.includes(candidate.cell))state.obstacles=[...state.obstacles,candidate.cell].sort((a,b)=>a-b);
      if(cmd.effectId==='theme-vote')state.influence.themeId=String(candidate.value??'neon');
      if(cmd.effectId==='next-challenge')state.influence.nextChallengeProfile=candidate.value as any;
      state.influence.recordCategory=category(state.influence.recordCategory,cmd.recordCategory);
      state.influence.cooldowns[cmd.effectId]=state.tick+EFFECT_COOLDOWNS[cmd.effectId];
    }
    const result:InfluenceResult={commandId:cmd.id,idempotencyKey:cmd.idempotencyKey,effectId:cmd.effectId,status,reason,appliedTick:state.tick};state.influence.applied[cmd.idempotencyKey]=result;
    events.push({seq:events.length,tick:state.tick,type:`influence-${status}`,data:{effectId:cmd.effectId,reason}});
  }
  state.influence.queued=keep;return{state,events};
}
