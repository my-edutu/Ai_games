import type { AudienceInput } from '../../audience-contracts/src/index';
import type { NamedRng } from '../../seeded-rng/src/index';

export interface VoteOption { id: string; label: string; effectId: string; candidateId: string; }
export interface VoteResult { optionId: string; totalWeight: number; tiedOptionIds: string[]; resolvedTick: number; }
export interface VoteWindow {
  schemaVersion: 1;
  id: string;
  runToken: string;
  startTick: number;
  endTick: number;
  options: VoteOption[];
  votesByViewer: Record<string, { optionId: string; weight: 1 | 2 | 3; inputKey: string }>;
  status: 'open' | 'resolved' | 'expired' | 'quarantined';
  result?: VoteResult;
}
export interface VoteDecision { status: 'accepted' | 'rejected' | 'duplicate'; reason: string; window: VoteWindow; }

function clone<T>(value:T):T { return JSON.parse(JSON.stringify(value)) as T; }
function weight(value:number):1|2|3 { return Math.max(1,Math.min(3,Math.round(Number(value)||1))) as 1|2|3; }

export function createVoteWindow(input:{id:string;runToken:string;startTick:number;endTick:number;options:VoteOption[]}):VoteWindow {
  if(!input.id||!input.runToken) throw new RangeError('vote identity');
  if(!Number.isInteger(input.startTick)||!Number.isInteger(input.endTick)||input.endTick<=input.startTick) throw new RangeError('vote ticks');
  if(input.options.length<1||input.options.length>4) throw new RangeError('vote options');
  const ids=new Set(input.options.map(o=>o.id)); if(ids.size!==input.options.length) throw new RangeError('duplicate option');
  return {schemaVersion:1,id:input.id,runToken:input.runToken,startTick:input.startTick,endTick:input.endTick,options:clone(input.options),votesByViewer:{},status:'open'};
}

export function submitVote(window:VoteWindow,input:AudienceInput,tokenToOption:Record<string,string>,tick:number):VoteDecision {
  const current=clone(window);
  if(current.status!=='open') return {status:'rejected',reason:'closed',window:current};
  if(tick<current.startTick) return {status:'rejected',reason:'early',window:current};
  if(tick>current.endTick) return {status:'rejected',reason:'late',window:current};
  if(!input.viewerRef) return {status:'rejected',reason:'anonymous',window:current};
  const duplicate=Object.values(current.votesByViewer).find(v=>v.inputKey===input.idempotencyKey);
  if(duplicate) return {status:'duplicate',reason:'duplicate',window:current};
  if(current.votesByViewer[input.viewerRef]) return {status:'rejected',reason:'viewer-already-voted',window:current};
  const optionId=input.fixedToken?tokenToOption[input.fixedToken]:undefined;
  if(!optionId||!current.options.some(o=>o.id===optionId)) return {status:'rejected',reason:'invalid-token',window:current};
  current.votesByViewer[input.viewerRef]={optionId,weight:weight(input.entitlementWeight),inputKey:input.idempotencyKey};
  return {status:'accepted',reason:'accepted',window:current};
}

export function publicTally(window:VoteWindow):Record<string,number> {
  const tally:Object = {};
  const out:Record<string,number>={}; for(const option of window.options) out[option.id]=0;
  for(const vote of Object.values(window.votesByViewer)) if(vote.optionId in out) out[vote.optionId]+=vote.weight;
  return out;
}

export function resolveVote(window:VoteWindow,rng:NamedRng,tick:number):{window:VoteWindow;result:VoteResult} {
  if(window.status==='resolved'&&window.result) return {window:clone(window),result:clone(window.result)};
  if(window.status!=='open') throw new Error(`cannot resolve ${window.status} vote`);
  if(tick<window.endTick) throw new Error('vote window still open');
  const current=clone(window), tally=publicTally(current);
  let max=-1; for(const value of Object.values(tally)) max=Math.max(max,value);
  const tied=current.options.map(o=>o.id).filter(id=>tally[id]===max).sort();
  const optionId=tied.length===1?tied[0]:tied[rng.nextInt('audience-tiebreaks',tied.length)];
  const result:VoteResult={optionId,totalWeight:tally[optionId],tiedOptionIds:tied,resolvedTick:tick};
  current.status='resolved'; current.result=result;
  return {window:current,result};
}
