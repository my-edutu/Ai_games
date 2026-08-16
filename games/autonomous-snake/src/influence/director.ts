import type { NamedRng } from '../../../../packages/seeded-rng/src/index';
import type { VoteWindow } from '../../../../packages/interaction-core/src/index';
import type { SnakeState } from '../state/types';
import { EFFECT_IDS } from './catalogue';
import { generateEffectCandidates } from './candidates';
import { enqueueInfluence } from './apply';
import type { EffectCandidate,InfluenceCommand,SnakeEffectId } from './types';

export interface DirectorState { schemaVersion:1; windowsOpened:number; recentEffects:SnakeEffectId[]; }
export function createDirectorState():DirectorState{return{schemaVersion:1,windowsOpened:0,recentEffects:[]};}

export function buildSafeChoiceSet(state:SnakeState,director:DirectorState,rng:NamedRng):EffectCandidate[]{
  if(state.lifecycle!=='running'||state.influence.chatVsAi.pressure>=state.influence.chatVsAi.pressureCap)return[];
  const preferred=EFFECT_IDS.filter(id=>!director.recentEffects.slice(-4).includes(id));
  const pool=(preferred.length>=2?preferred:EFFECT_IDS).map(id=>({id,candidates:generateEffectCandidates(state,id)})).filter(x=>x.candidates.length>0);
  const chosen:EffectCandidate[]=[];const work=[...pool];
  while(work.length&&chosen.length<4){const i=rng.nextInt('event-director',work.length),entry=work.splice(i,1)[0];chosen.push(entry.candidates[0]);}
  return chosen;
}

export function scheduleVoteResult(input:SnakeState,window:VoteWindow){
  if(window.status!=='resolved'||!window.result)return{status:'rejected' as const,reason:'unresolved',state:structuredClone(input)};
  const option=window.options.find(o=>o.id===window.result!.optionId);if(!option)return{status:'rejected' as const,reason:'option',state:structuredClone(input)};
  const effectId=option.effectId as SnakeEffectId;
  const cmd:InfluenceCommand={schemaVersion:1,id:`vote:${window.id}`,idempotencyKey:`vote:${window.id}:${window.result.optionId}`,source:'vote',effectId,candidateId:option.candidateId,scheduledTick:Math.max(input.tick,window.result.resolvedTick),expiresAtTick:Math.max(input.tick,window.result.resolvedTick)+30,recordCategory:'chat-vs-ai'};
  return enqueueInfluence(input,cmd);
}
