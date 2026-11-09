import {planPhysicalFeedback} from './physical-feedback-plan.js';
import {createPhysicalFeedbackVisuals} from './physical-feedback-visuals.js';
import {classifySubmittedCombatAudio} from './physical-feedback-frame-gate.js';
import {createOriginalCombatFoley,createCombatMutePreference} from './original-combat-foley.js';
/**
 * D04 handoff orchestrator: one rendered-frame clock drives physical cues and
 * original sound together. Runs safely without WebAudio or usable WebGL.
 *
 * Integration: call acceptSnapshot(s) where the real app accepts public
 * DungeonRuntime snapshots; call advance(dt) after pose updates; call
 * enableAudioFromGesture() ONLY inside a real user interaction. D10 must
 * retire duplicate combat output in the older combatDirector/soundstage before
 * enabling this replacement. No authoritative damage/ticks ever change.
 */
export const MAX_PHYSICAL_PENDING=32;
export const MAX_PHYSICAL_SEEN_IDS=192;
export const MAX_PHYSICAL_RECEIPTS=64;
export const MAX_AUDIO_AWAITING_FRAME=32;
export const MAX_AUDIO_VISUAL_STALENESS_SECONDS=.40;
const clamp=(v,min,max)=>Number.isFinite(v)?Math.max(min,Math.min(max,v)):min;
const key=s=>s&&Number.isSafeInteger(s.run)&&Number.isSafeInteger(s.floor)?s.run+':'+s.floor:null;
export function createPhysicalCombatFeedback({
 THREE=null,scene=null,ctx=null,actorById=()=>null,
 storage=null,reducedMotion=false,reducedFlash=false,
 resolveContact=()=>null,deriveDamageBeats=null,verifiedMeleeDelay=null,
 visualAdapter=null,audioAdapter=null,requirePresentedFrame=false
}={}){
 let previous=null;
 const visuals=visualAdapter??(THREE&&scene?createPhysicalFeedbackVisuals(THREE,scene,
  {actorById,reducedMotion,reducedFlash,getFloorMap:()=>previous?.map}):null);
 let foley=audioAdapter??(ctx?createOriginalCombatFoley(ctx):null);
 const preference=createCombatMutePreference(storage);
 let sceneId=null,disposed=false,optedIn=false,audioEpoch=0,
  queued=0,played=0,adapterFailures=0,duplicates=0,overflow=0,sceneResets=0,
  visualAccepted=0,audioAccepted=0,renderedSeconds=0,observedSeconds=0,
  unverifiedFrameInterval=false,expiredQueuedCues=0,invalidFrameIntervals=0,
  framesAcknowledged=0,staleAudioDropped=0,expiredVisualAudioDropped=0,
  retroactiveAudioSuppressed=0,
   unverifiedVisualLiveness=0,lastPresentedFrame=null;
 const pending=[],awaitingPresentation=[],seen=new Set(),receipts=[];
 function safeCall(fn){try{return fn()}catch{adapterFailures++;return null}}
 // Preserve the requested envelope in receipts even when the D04
 // submitted-frame clock must stage the action at its first drawable frame.
 // A real Warden cast emits its opening on the SAME authority tick: deferring
 // release by 230ms while rendering recovery immediately reverses the causal
 // sequence. Admit both together, priority-order release before recovery, and
 // keep BOTH sounds behind the actual frame-submission acknowledgment.
 // Legacy/non-submission callers retain their original presentation delays.
 const presentationDelay=cue=>requirePresentedFrame&&
  (cue?.kind==='swing'||cue?.kind==='warden-release')
  ?0:clamp(cue?.delay,0,.5);
 function flush(){
  pending.length=0;awaitingPresentation.length=0;seen.clear();
  lastPresentedFrame=null;
  safeCall(()=>visuals?.reset?.());safeCall(()=>foley?.flush?.());
 }
 function retainReceipt(cue,visual,audio=false,frameId=null,decision=null){
  const receipt=Object.freeze({cueId:cue.id,kind:cue.kind,tick:cue.tick,
   scene:cue.sceneKey,renderedMs:Math.round(renderedSeconds*1000),
   intendedDelayMs:Math.round(cue.delay*1000),
   scheduledDelayMs:Math.round(presentationDelay(cue)*1000),visual,audio,frameId,decision});
  receipts.push(receipt);
  if(receipts.length>MAX_PHYSICAL_RECEIPTS)receipts.shift();
 }
 function emit(cue,plannedAudioEpoch=null){
  if(disposed)return;
  // A gesture authorizes only cues planned during that enabled session.
  // Delayed cues accepted before opt-in (or before mute/re-enable) stay silent.
  const soundEligible=optedIn&&plannedAudioEpoch!==null&&plannedAudioEpoch===audioEpoch;
  const visual=!!safeCall(()=>visuals?.emit?.(cue));
  if(visual)visualAccepted++;
  // The integrator can require evidence of a real renderer submission before
  // launching a combat transient. No guessing a frame from a time delay.
  if(soundEligible&&requirePresentedFrame){
   if(awaitingPresentation.length>=MAX_AUDIO_AWAITING_FRAME){
    let weakest=0;
    for(let i=1;i<awaitingPresentation.length;i++)
     if(awaitingPresentation[i].cue.priority<awaitingPresentation[weakest].cue.priority)weakest=i;
    if(awaitingPresentation[weakest].cue.priority>=cue.priority){
     staleAudioDropped++;retainReceipt(cue,visual,false);played++;return;
    }
    awaitingPresentation.splice(weakest,1);staleAudioDropped++;
   }
   awaitingPresentation.push({cue,visual,at:observedSeconds,sceneId});
  }else{
   const audio=soundEligible?!!safeCall(()=>foley?.emit?.(cue)):false;
   if(audio)audioAccepted++;
   if(optedIn&&!soundEligible)retroactiveAudioSuppressed++;
   retainReceipt(cue,visual,audio,null,
    optedIn&&!soundEligible?'audio-opt-in-epoch-mismatch':null);
  }
  played++;
 }
 /**
  * D10 calls this once AFTER actually submitting the genuine Three.js canvas
  * to WebGL. The acknowledgement is a real render-submission boundary, not
  * proof that pixels were displayed, encoded or audible samples delivered.
  * It must never be called from a timer, synthetic recorder or state poll.
  */
 function acknowledgePresentedFrame(frameId,renderSubmissionSeconds=0){
  if(disposed||!requirePresentedFrame||!optedIn||
   !(typeof frameId==='string'&&frameId.length>0&&frameId.length<=128||
     Number.isSafeInteger(frameId)&&frameId>=0)||
   frameId===lastPresentedFrame)return 0;
  lastPresentedFrame=frameId;framesAcknowledged++;
  let released=0;
  for(const item of awaitingPresentation.splice(0)){
   // Actual raw-frame aging may expire 230ms injury art in a 300ms frame,
   // while the separate generic 400ms audio deadline has not yet expired.
   let visualAlive=null,visualDrawable=null;
   if(item.visual){
    if(typeof visuals?.hasLiveCue==='function')
     visualAlive=safeCall(()=>visuals.hasLiveCue(item.cue.id))===true;
    else unverifiedVisualLiveness++; // Older injected adapters only.
    if(typeof visuals?.hasDrawableCue==='function')
     visualDrawable=safeCall(()=>visuals.hasDrawableCue(item.cue.id))===true;
   }
   const decision=classifySubmittedCombatAudio({
    sceneMatches:item.sceneId===sceneId,
    observedFrameVerified:!unverifiedFrameInterval,
    elapsedSeconds:observedSeconds-item.at,
    submissionSeconds:renderSubmissionSeconds,
    maxStalenessSeconds:MAX_AUDIO_VISUAL_STALENESS_SECONDS,
    visualAccepted:item.visual,visualAlive,visualDrawable,
    requiresMeasuredBlade:item.cue.kind==='swing'&&!reducedMotion
   });
   if(decision==='await-drawable-visual'){
    // Keep the ORIGINAL deadline and queue priority while awaiting genuine
    // skinned-hand movement on a later actual WebGL submission.
    awaitingPresentation.push(item);continue;
   }
   if(decision!=='deliver'){
    staleAudioDropped++;
    if(decision==='expired-visual')expiredVisualAudioDropped++;
    retainReceipt(item.cue,item.visual,false,frameId,decision);continue;
   }
   const audible=!!safeCall(()=>foley?.emit?.(item.cue));
   if(audible){audioAccepted++;released++}
   retainReceipt(item.cue,item.visual,audible,frameId,
    audible?'delivered':'foley-rejected');
  }
  return released;
 }
 function popDue(dt){
  if(!pending.length)return;
  for(const item of [...pending]){
   // Never render or play a queued swing after a long real browser/GPU stall.
   if(observedSeconds-item.queuedAt>MAX_AUDIO_VISUAL_STALENESS_SECONDS){
    pending.splice(pending.indexOf(item),1);expiredQueuedCues++;
    retainReceipt(item.cue,false,false);continue;
   }
   item.remaining-=dt;
  }
  const due=pending.filter(x=>x.remaining<=0).sort((a,b)=>
   b.cue.priority-a.cue.priority||a.cue.tick-b.cue.tick||
   a.cue.id.localeCompare(b.cue.id,'en'));
  for(const item of due){
   const at=pending.indexOf(item);
   if(at!==-1){pending.splice(at,1);emit(item.cue,item.audioEpoch)}
  }
 }
 function acceptSnapshot(snapshot){
  if(disposed||!snapshot||!Number.isSafeInteger(snapshot.tick)||!key(snapshot))return 0;
  const nextKey=key(snapshot);
  if(!previous||sceneId!==nextKey){
   if(previous){flush();sceneResets++}
   sceneId=nextKey;previous=snapshot;
   return 0; // No historical first-load, floor, run or restore replay.
  }
  if(snapshot.tick<=previous.tick)return 0;
  let cues=[];
  try{cues=planPhysicalFeedback(previous,snapshot,{
   resolveContact,deriveDamageBeats,verifiedMeleeDelay,reducedMotion});}
  catch{adapterFailures++}
  previous=snapshot;
  for(const cue of cues){
   if(seen.has(cue.id)){duplicates++;continue}
   seen.add(cue.id);
   if(seen.size>MAX_PHYSICAL_SEEN_IDS){
    const oldest=seen.values().next().value;seen.delete(oldest);
   }
   if(pending.length>=MAX_PHYSICAL_PENDING){
    let weakest=0;
    for(let i=1;i<pending.length;i++)if(pending[i].cue.priority<pending[weakest].cue.priority)weakest=i;
    if(pending[weakest].cue.priority>=cue.priority){overflow++;continue}
    pending.splice(weakest,1);overflow++;
   }
   // The opt-in submitted-frame path observes the REAL animated sword hand.
    // A 120ms pre-staging delay can miss early blade passage and play a
    // belated whoosh after the strike. Stage only swings immediately, hidden
    // until the measured wrist travels; frame acknowledgment still gates
    // foley. Keep all non-melee timing and non-gated callers unchanged.
    pending.push({cue,remaining:presentationDelay(cue),queuedAt:observedSeconds,
    audioEpoch:optedIn?audioEpoch:null});queued++;
  }
  // In the submission-gated D04 preview, a zero-delay HP injury may arrive
  // between animation frames. Do not give that unsubmitted art a 300ms
  // lifetime before its first draw: the next advance() ages old pools FIRST,
  // then admits fresh cues for the imminent genuine WebGL submission.
  // The non-gated adapter keeps its established immediate dispatch contract.
  if(!requirePresentedFrame)popDue(0);
  return cues.length;
 }
 function advance(frameSeconds,actualFrameSeconds=frameSeconds){
  if(disposed)return 0;
  const dt=clamp(frameSeconds,0,.05);
  renderedSeconds+=dt;
  // Raw browser time, not the 50ms animation cap, determines late audio.
  // An invalid frame interval cannot certify a timely delivered sound.
  unverifiedFrameInterval=!(Number.isFinite(actualFrameSeconds)&&actualFrameSeconds>0);
  if(unverifiedFrameInterval)invalidFrameIntervals++;
  observedSeconds+=unverifiedFrameInterval?
   MAX_AUDIO_VISUAL_STALENESS_SECONDS+.01:Math.min(actualFrameSeconds,3600);
  const before=pending.length;
  // First expire retained art against the actual browser interval. A cue
  // that becomes due THIS frame has not survived that interval yet; it must
  // get a first genuine render opportunity rather than instantly aging out.
  safeCall(()=>visuals?.advance?.(dt,actualFrameSeconds));
  popDue(dt);safeCall(()=>foley?.cleanup?.());
  return Math.max(0,before-pending.length);
 }
 function attachAudioContext(context,{output=null}={}){
  if(disposed)return false;
  if(!foley&&context)foley=createOriginalCombatFoley(context,{output});
  return !!foley;
 }
 function enableAudioFromGesture(){
  if(disposed||!safeCall(()=>foley?.enable?.()))return false;
  if(!optedIn)audioEpoch++;
  optedIn=true;preference.write(false);return true;
 }
 function muteAudio(){
  optedIn=false;awaitingPresentation.length=0;preference.write(true);
  safeCall(()=>foley?.disable?.());
 }
 // 'unmuted' preference does not mean automatic playback after a page reload;
 // only a NEW real gesture enables oscillator synthesis on this page.
 function preferredMuted(){return preference.read()}
 function reset(){flush();previous=null;sceneId=null;}
 function dispose(){
  if(disposed)return;
  flush();disposed=true;previous=null;
  optedIn=false;safeCall(()=>foley?.dispose?.());safeCall(()=>visuals?.dispose?.());
 }
 function stats(){return Object.freeze({
  implementation:'D04-physical-authority-feedback',disposed,scene:sceneId,
  audioOptedIn:optedIn,preferredMuted:preferredMuted(),
  pending:pending.length,queued,emitted:played,visualAccepted,audioAccepted,
  awaitingPresentation:awaitingPresentation.length,framesAcknowledged,
  expiredQueuedCues,invalidFrameIntervals,observedFrameMs:Math.round(observedSeconds*1000),
  staleAudioDropped,expiredVisualAudioDropped,retroactiveAudioSuppressed,
  unverifiedVisualLiveness,
   requirePresentedFrame,
  recentDeliveryReceipts:[...receipts],duplicateCues:duplicates,
  pendingOverflow:overflow,adapterFailures,sceneResets,
  limits:{maxPending:MAX_PHYSICAL_PENDING,maxSeen:MAX_PHYSICAL_SEEN_IDS,
   maxReceipts:MAX_PHYSICAL_RECEIPTS,maxAudioAwaitingFrame:MAX_AUDIO_AWAITING_FRAME},
  visuals:visuals?.stats?.()??null,audio:foley?.stats?.()??null
 });}
 return Object.freeze({acceptSnapshot,advance,acknowledgePresentedFrame,
  attachAudioContext,enableAudioFromGesture,muteAudio,
  preferredMuted,reset,dispose,stats});
}
