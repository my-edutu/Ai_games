import type{NamedRng}from'../../../../packages/seeded-rng/src/index';
import type{FloorsState}from'../state/types';
export type FloorsInfluenceEffectId='route-scan'|'supply-cache'|'hazard-pulse'|'elite-contract'|'sector-theme'|'module-choice';
export interface FloorsInfluenceRequest{id:string;effectId:FloorsInfluenceEffectId;source:'free'|'paid-eligible'|'vote';receivedAtTick:number;policyVersion:'floors-influence-v1'}
interface Scheduled{id:string;effectId:FloorsInfluenceEffectId;source:FloorsInfluenceRequest['source'];acceptedAtTick:number;applyAtTick:number;expiresAtTick:number;conflictGroup:string;reversed:boolean}
interface Vote{id:string;options:FloorsInfluenceEffectId[];openedAtTick:number;closesAtTick:number;resolved:boolean;votes:Record<string,FloorsInfluenceEffectId>}
type InfluenceData={queued:Scheduled[];applied:Record<string,number>;cooldowns:Record<string,number>;pressure:number;themeId:string;votes?:Record<string,Vote>};
const effects:Record<FloorsInfluenceEffectId,{cooldown:number;conflict:string}>={
'route-scan':{cooldown:12,conflict:'assist'},'supply-cache':{cooldown:24,conflict:'assist'},'hazard-pulse':{cooldown:18,conflict:'challenge'},'elite-contract':{cooldown:30,conflict:'challenge'},'sector-theme':{cooldown:8,conflict:'cosmetic'},'module-choice':{cooldown:30,conflict:'assist'}};
const clone=<T>(v:T):T=>structuredClone(v);
function data(state:FloorsState):InfluenceData{return state.influence as unknown as InfluenceData}
function validId(id:string):boolean{return/^[a-zA-Z0-9:_-]{1,64}$/.test(id)}
export function submitFloorsInfluence(source:FloorsState,request:FloorsInfluenceRequest):{status:'accepted'|'duplicate'|'rejected';reason:string;state:FloorsState}{
 const state=clone(source),inf=data(state);inf.votes??={};if(!validId(request.id)||request.policyVersion!=='floors-influence-v1'||!(request.effectId in effects))return{status:'rejected',reason:'schema',state:source};
 if(request.receivedAtTick<state.tick-120||request.receivedAtTick>state.tick+2)return{status:'rejected',reason:'stale',state:source};
 if(inf.queued.some(q=>q.id===request.id)||Object.prototype.hasOwnProperty.call(inf.applied,request.id))return{status:'duplicate',reason:'idempotency',state:source};
 if(inf.queued.length>=32)return{status:'rejected',reason:'queue-cap',state:source};const effect=effects[request.effectId],cooldown=inf.cooldowns[request.effectId]??0;if(cooldown>state.tick)return{status:'rejected',reason:'cooldown',state:source};
 if(inf.queued.some(q=>q.conflictGroup===effect.conflict&&q.applyAtTick<=state.tick+2))return{status:'rejected',reason:'conflict',state:source};
 inf.queued.push({id:request.id,effectId:request.effectId,source:request.source,acceptedAtTick:state.tick,applyAtTick:state.tick+2,expiresAtTick:state.tick+40,conflictGroup:effect.conflict,reversed:false});inf.queued.sort((a,b)=>a.applyAtTick-b.applyAtTick||a.id.localeCompare(b.id));inf.cooldowns[request.effectId]=state.tick+effect.cooldown;return{status:'accepted',reason:'queued',state};
}
export function applyScheduledFloorsInfluence(source:FloorsState,tick:number,_rng:NamedRng):{state:FloorsState;applied:Array<{id:string;effectId:FloorsInfluenceEffectId}>}{
 const state=clone(source),inf=data(state),applied:Array<{id:string;effectId:FloorsInfluenceEffectId}>=[];const remaining:Scheduled[]=[];
 for(const item of inf.queued){if(item.reversed||item.expiresAtTick<tick)continue;if(item.applyAtTick>tick){remaining.push(item);continue}if(Object.prototype.hasOwnProperty.call(inf.applied,item.id))continue;
   if(item.effectId==='supply-cache'){state.player.health=Math.min(state.player.maxHealth,state.player.health+1);state.player.credits=Math.min(99,state.player.credits+2)}
   else if(item.effectId==='route-scan'){state.ai.repeatedStateCount=0;state.ai.lastPlanChangeReason='audience-route-scan'}
   else if(item.effectId==='hazard-pulse'){inf.pressure=Math.min(5,inf.pressure+1)}
   else if(item.effectId==='elite-contract'){inf.pressure=Math.min(5,inf.pressure+2)}
   else if(item.effectId==='sector-theme'){inf.themeId=state.floor.sector%2?'signalpunk':'deep-vault'}
   else if(item.effectId==='module-choice'){state.player.credits=Math.min(99,state.player.credits+1)}
   inf.applied[item.id]=tick;applied.push({id:item.id,effectId:item.effectId});
 }
 inf.queued=remaining;if(applied.length===0&&inf.pressure>0&&tick%20===0)inf.pressure--;return{state,applied};
}
export function reverseFloorsInfluence(source:FloorsState,id:string):{status:'reversed'|'already-applied'|'not-found';state:FloorsState}{const state=clone(source),inf=data(state),queued=inf.queued.find(q=>q.id===id);if(queued){queued.reversed=true;return{status:'reversed',state}}if(Object.prototype.hasOwnProperty.call(inf.applied,id))return{status:'already-applied',state:source};return{status:'not-found',state:source}}
export function openFloorsVote(source:FloorsState,options:FloorsInfluenceEffectId[],closesAtTick:number):{state:FloorsState;vote:Vote}{if(options.length<2||options.length>4||new Set(options).size!==options.length||closesAtTick<=source.tick)throw new RangeError('vote');const state=clone(source),inf=data(state);inf.votes??={};const id=`vote:${state.tick}:${Object.keys(inf.votes).length}`,vote:Vote={id,options:[...options],openedAtTick:state.tick,closesAtTick,resolved:false,votes:{}};inf.votes[id]=vote;return{state,vote:clone(vote)}}
export function submitFloorsVote(source:FloorsState,voteId:string,viewerRef:string,option:FloorsInfluenceEffectId):{status:'accepted'|'duplicate'|'rejected';state:FloorsState}{const state=clone(source),inf=data(state),vote=inf.votes?.[voteId];if(!vote||vote.resolved||state.tick>vote.closesAtTick||!vote.options.includes(option)||!validId(viewerRef))return{status:'rejected',state:source};if(vote.votes[viewerRef])return{status:'duplicate',state:source};vote.votes[viewerRef]=option;return{status:'accepted',state}}
export function resolveFloorsVote(source:FloorsState,voteId:string,tick:number,rng:NamedRng):{status:'resolved'|'not-ready'|'missing';state:FloorsState;winner:FloorsInfluenceEffectId;applicationStatus:'queued'|'blocked'|'none'}{const state=clone(source),inf=data(state),vote=inf.votes?.[voteId];if(!vote)return{status:'missing',state:source,winner:'route-scan',applicationStatus:'none'};if(tick<vote.closesAtTick)return{status:'not-ready',state:source,winner:vote.options[0],applicationStatus:'none'};const counts=new Map(vote.options.map(o=>[o,0]));for(const choice of Object.values(vote.votes))counts.set(choice,(counts.get(choice)??0)+1);const max=Math.max(...counts.values()),tied=vote.options.filter(o=>(counts.get(o)??0)===max).sort(),winner=tied[rng.nextInt(`audience-tiebreaks:${vote.id}`,tied.length)];vote.resolved=true;const queued=submitFloorsInfluence(state,{id:`${vote.id}:result`,effectId:winner,source:'vote',receivedAtTick:state.tick,policyVersion:'floors-influence-v1'});return{status:'resolved',state:queued.status==='accepted'?queued.state:state,winner,applicationStatus:queued.status==='accepted'?'queued':'blocked'}}
