import {planPhysicalFeedback} from './physical-feedback-plan.js';
import {createPhysicalFeedbackVisuals} from './physical-feedback-visuals.js';
import {classifySubmittedCombatAudio} from './physical-feedback-frame-gate.js';
import {isLiveWardenWarning} from './warden-warning-lifecycle.js';
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
// String frame IDs are supported by test/capture adapters. Keep bounded
// history so a non-adjacent replay cannot masquerade as a new WebGL submit.
const MAX_RECENT_STRING_FRAME_IDS=64;
const clamp=(v,min,max)=>Number.isFinite(v)?Math.max(min,Math.min(max,v)):min;
const key=s=>s&&Number.isSafeInteger(s.run)&&Number.isSafeInteger(s.floor)?s.run+':'+s.floor:null;
export function createPhysicalCombatFeedback({
 THREE=null,scene=null,ctx=null,actorById=()=>null,
 storage=null,reducedMotion=false,reducedFlash=false,
 resolveContact=()=>null,deriveDamageBeats=null,verifiedMeleeDelay=null,
 visualAdapter=null,audioAdapter=null,requirePresentedFrame=false,
 // Monotonic seconds are used only to distinguish a freshly observed public
 // action from the raw interval of the frame that PRECEDED that action.
 clock=null // Explicit opt-in only: legacy and deterministic unit callers keep the raw-interval gate.
}={}){
 let previous=null;
 const visuals=visualAdapter??(THREE&&scene?createPhysicalFeedbackVisuals(THREE,scene,
  {actorById,reducedMotion,reducedFlash,getFloorMap:()=>previous?.map,
   getCurrentSnapshot:()=>previous}):null);
 const injectedFoley=audioAdapter!==null;
 let foley=audioAdapter??(ctx?createOriginalCombatFoley(ctx,{requireVerifiedContact:true}):null);
 // An original WebAudio engine is permanently bound to its creation context
 // and FX output. Device recovery must not keep scheduling on the old bus.
 let ownedFoleyContext=injectedFoley?null:ctx,ownedFoleyOutput=null,
  injectedContextMismatch=false,injectedOutputMismatch=false,
  injectedOutputObserved=false,injectedFoleyOutput=null;
 const preference=createCombatMutePreference(storage);
 let sceneId=null,disposed=false,optedIn=false,audioEpoch=0,
  queued=0,played=0,adapterFailures=0,duplicates=0,overflow=0,sceneResets=0,
  visualAccepted=0,audioAccepted=0,renderedSeconds=0,observedSeconds=0,
  audioInterruptions=0,observedAudioContext=null,audioStateContext=ctx,
  audioStateUnavailable=false,
  unverifiedFrameInterval=false,expiredQueuedCues=0,lateLiveWarningVisuals=0,invalidFrameIntervals=0,
  framesAcknowledged=0,staleAudioDropped=0,expiredVisualAudioDropped=0,
  retroactiveAudioSuppressed=0,
   unverifiedVisualLiveness=0,lastPresentedFrame=null,
   highestNumericPresentedFrame=-1,replayedFrameAcks=0,
   receiptRenderSubmissionSeconds=null,latestTrustedClock=null,
   lastVisualAdvanceStartClock=null,lastVisualAdvanceEndClock=null;
 const recentStringFrameIds=new Set();
 const pending=[],awaitingPresentation=[],seen=new Set(),receipts=[];
 // One bounded timestamp per recent cue ID; old scenes release these entries.
 const observedAtByCueId=new Map();
 function safeCall(fn){try{return fn()}catch{adapterFailures++;return null}}
 function observedWallClock(){
  // No guess if the browser clock is missing, nonmonotonic or invalid.
  // The uncorrected raw frame age then keeps the existing fail-closed gate.
  try{
   const seconds=clock();
   if(!Number.isFinite(seconds)||seconds<0||
    latestTrustedClock!==null&&seconds<latestTrustedClock)return null;
   latestTrustedClock=seconds;return seconds;
  }catch{return null}
 }
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
  observedAtByCueId.clear();
  lastPresentedFrame=null;highestNumericPresentedFrame=-1;
  lastVisualAdvanceStartClock=null;lastVisualAdvanceEndClock=null;
  recentStringFrameIds.clear();
  safeCall(()=>visuals?.reset?.());safeCall(()=>foley?.flush?.());
 }
 function retainReceipt(cue,visual,audio=false,frameId=null,decision=null,submittedWallAt=null){
  // These are only observation and post-WebGL receipt times. They do NOT
  // certify encoded video PTS, audible sample onset or physical blade contact.
  // renderedMs is a simulation/presentation accumulation, NOT a wall clock.
  const observedAt=observedAtByCueId.get(cue.id);
  const validObserved=Number.isFinite(observedAt)&&observedAt>=0;
  // All cue receipts in one rendered frame inherit the SAME measured post-WebGL
  // boundary. A new clock read per cue shifts otherwise simultaneous hits,
  // overstates observation-to-submit latency and adds clock work on the hot path.
  const receiptClock=frameId!==null?submittedWallAt:null;
  const validSubmit=validObserved&&receiptClock!==null&&receiptClock>=observedAt;
  const observedClockMs=validObserved?Math.round(observedAt*1000):null;
  const submittedClockMs=validSubmit?Math.round(receiptClock*1000):null;
  // A delayed genuine WebGL receipt does not explain WHICH phase blocked
  // physical impact presentation. Reuse only clocks already sampled in the
  // current D04 frame: this is diagnosis, not permission to deliver late audio.
  // Never mix a prior frame's phase with a freshly observed snapshot.
  const validAdvanceStart=validSubmit&&
   Number.isFinite(lastVisualAdvanceStartClock)&&
   lastVisualAdvanceStartClock>=observedAt&&lastVisualAdvanceStartClock<=receiptClock;
  const validAdvanceEnd=validAdvanceStart&&
   Number.isFinite(lastVisualAdvanceEndClock)&&
   lastVisualAdvanceEndClock>=lastVisualAdvanceStartClock&&
   lastVisualAdvanceEndClock<=receiptClock;
  const beforeVisualAdvanceMs=validAdvanceStart?
   Math.round((lastVisualAdvanceStartClock-observedAt)*1000):null;
  const visualAdvanceMs=validAdvanceEnd?
   Math.round((lastVisualAdvanceEndClock-lastVisualAdvanceStartClock)*1000):null;
  const afterVisualAdvanceToSubmissionMs=validAdvanceEnd?
   Math.round((receiptClock-lastVisualAdvanceEndClock)*1000):null;
  const receipt=Object.freeze({cueId:cue.id,kind:cue.kind,tick:cue.tick,
   scene:cue.sceneKey,renderedMs:Math.round(renderedSeconds*1000),
   intendedDelayMs:Math.round(cue.delay*1000),
   scheduledDelayMs:Math.round(presentationDelay(cue)*1000),visual,audio,frameId,decision,
   observedClockMs,submittedClockMs,
   beforeVisualAdvanceMs,visualAdvanceMs,afterVisualAdvanceToSubmissionMs,
   observationToSubmissionMs:validSubmit?
    Math.max(0,submittedClockMs-observedClockMs):null,
   renderSubmissionMs:frameId!==null&&
    Number.isFinite(receiptRenderSubmissionSeconds)&&receiptRenderSubmissionSeconds>=0?
    Math.round(receiptRenderSubmissionSeconds*1000):null,
   sampleSynchronized:false});
  receipts.push(receipt);
  if(receipts.length>MAX_PHYSICAL_RECEIPTS)receipts.shift();
 }
 function emit(cue,plannedAudioEpoch=null,observedActionAt=observedSeconds){
  if(disposed)return;
  // A gesture authorizes only cues planned during that enabled session.
  // Delayed cues accepted before opt-in (or before mute/re-enable) stay silent.
  const soundEligible=optedIn&&audioReady()&&
   plannedAudioEpoch!==null&&plannedAudioEpoch===audioEpoch;
  const visual=!!safeCall(()=>visuals?.emit?.(cue));
  if(visual)visualAccepted++;
  // Reduced-motion deliberately hides the sword trail, but must NOT
  // bypass living source/action provenance. A witnessed attempt can sound
  // without a skinned authored blade; a dead/guarding/absent performer cannot.
  // Older injected visual adapters without this optional probe retain their
  // pre-existing contract; production D04 visuals implement it.
  if(requirePresentedFrame&&!visual&&reducedMotion&&cue.kind==='swing'&&
     typeof visuals?.hasAuthenticatedSwingAction==='function'&&
     safeCall(()=>visuals.hasAuthenticatedSwingAction(cue))!==true){
   staleAudioDropped++;
   retainReceipt(cue,false,false,null,'unverified-reduced-swing-action');
   played++;
   return;
  }
  // A true public action alone does not authorize a late sound from a source
  // that no longer has a firing/casting pose. If visual admission failed,
  // retain sound-only release ONLY with the renderer's current source witness.
  // This preserves genuine masonry-blocked/no-sprite shots but prevents an
  // empty cell, detached authored hand or changed action from sounding.
  // HP-based impacts and neutral events follow their independent evidence.
  if(requirePresentedFrame&&!visual&&
     (cue.kind==='ranged-release'||cue.kind==='spell-release')&&
     safeCall(()=>visuals?.hasAuthenticatedReleasePose?.(cue))!==true){
   staleAudioDropped++;
   retainReceipt(cue,false,false,null,'unverified-release-pose');
   played++;
   return;
  }
  // Body-local guard/utility gestures and the Warden's release/recovery
  // need the same physical provenance as an undrawn spell: an observed
  // action is not a license to sound from an unloaded/idle/expired performer.
  // A genuine emitter with a preempted visual retains its original foley.
  // Neutral event and actual HP-loss sounds remain separately authorized.
  if(requirePresentedFrame&&!visual&&
     (cue.kind==='warden-release'||cue.kind==='opening'||
      cue.kind==='guard'||cue.kind==='cast-utility')&&
     safeCall(()=>visuals?.hasAuthenticatedBodyPose?.(cue))!==true){
   staleAudioDropped++;
   retainReceipt(cue,false,false,null,'unverified-body-pose');
   played++;
   return;
  }
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
   // Preserve the timestamp when the authority action was first observed.
   // Resetting this clock at delayed VFX admission could make a 290ms spell
   // sound another 400ms later, long after its genuine animated release.
   awaitingPresentation.push({cue,visual,at:observedActionAt,sceneId});
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
  // Some embedded AudioContext adapters have no statechange EventTarget.
  // A frame receipt is also an opportunity to revoke an unavailable clock.
  onAudioStateChange();
  if(disposed||!requirePresentedFrame||!optedIn||
   !(typeof frameId==='string'&&frameId.length>0&&frameId.length<=128||
     Number.isSafeInteger(frameId)&&frameId>=0))return 0;
  // A second call bearing an old frame ID is not a new render submission.
  // Remember monotonic numeric serials (used by the actual Dungeon app) and
  // a bounded history of opaque string IDs (used by capture/test adapters).
  // Without this, A -> B -> A could drain freshly queued combat foley on
  // recycled frame A even though only the older attack was truly submitted.
  if(frameId===lastPresentedFrame||
    typeof frameId==='number'&&frameId<=highestNumericPresentedFrame||
    typeof frameId==='string'&&recentStringFrameIds.has(frameId)){
   replayedFrameAcks++;return 0;
  }
  if(typeof frameId==='number')highestNumericPresentedFrame=frameId;
  else{
   recentStringFrameIds.add(frameId);
   if(recentStringFrameIds.size>MAX_RECENT_STRING_FRAME_IDS)
    recentStringFrameIds.delete(recentStringFrameIds.values().next().value);
  }
  lastPresentedFrame=frameId;framesAcknowledged++;
  receiptRenderSubmissionSeconds=renderSubmissionSeconds;
  // A completed WebGL submission may be preceded by substantial scene/pose
  // work AFTER advance() (but BEFORE renderer.render()). The raw rAF interval
  // and measured render call do not include that intermediate CPU time. Read
  // the same monotonic observation clock at the real submission boundary.
  // This only tightens the existing 400ms sound deadline; it never grants a
  // stale cue a later frame, manufactures contact or changes visual authority.
  const submittedWallClock=observedWallClock();
  let released=0;
  for(const item of awaitingPresentation.splice(0)){
   // A revoked/impacted Warden footprint cannot release a ghost warning sound
   // just because an older cue had once staged successfully on the GPU.
   // Unattributed threat warnings have separate, event-only semantics.
   if(item.cue.visual==='warning'&&
    item.cue.proof==='authority-warning-window'&&
    !isLiveWardenWarning(item.cue,previous)){
    staleAudioDropped++;
    retainReceipt(item.cue,item.visual,false,frameId,'retired-warning',submittedWallClock);
    continue;
   }
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
   const observedWallAt=observedAtByCueId.get(item.cue.id);
   const verifiedWallAge=submittedWallClock!==null&&
    Number.isFinite(observedWallAt)&&observedWallAt>=0&&
    submittedWallClock>=observedWallAt?
    submittedWallClock-observedWallAt:null;
   // classifySubmittedCombatAudio adds submissionSeconds. Subtract the
   // already-included render interval from wall age BEFORE comparing with
   // the old raw-frame estimate. Otherwise we would double-charge GPU work.
   // A missing/nonmonotonic clock preserves the original fail-closed raw
   // frame gate, with no invented cross-clock alignment claim.
   const elapsedBeforeSubmission=verifiedWallAge===null?
    observedSeconds-item.at:
    Math.max(observedSeconds-item.at,
     Math.max(0,verifiedWallAge-renderSubmissionSeconds));
   const decision=classifySubmittedCombatAudio({
    sceneMatches:item.sceneId===sceneId,
    observedFrameVerified:!unverifiedFrameInterval,
    elapsedSeconds:elapsedBeforeSubmission,
    submissionSeconds:renderSubmissionSeconds,
    maxStalenessSeconds:MAX_AUDIO_VISUAL_STALENESS_SECONDS,
    visualAccepted:item.visual,visualAlive,visualDrawable,
    requiresMeasuredBlade:item.cue.kind==='swing'&&!reducedMotion,
    // A visible authoritative HP decrease, not an attempted swing, earns
    // independently timed impact foley even if the retained shard is hidden.
    // The frame/scene/400ms/visual-liveness/consent gates still apply.
    allowVerifiedSoundOnlyImpact:item.visual===true&&
     (item.cue.kind==='damage'||item.cue.kind==='damage-fatal')&&
     item.cue.verified===true&&item.cue.proof==='observed-hp-drop'
   });
   if(decision==='await-drawable-visual'){
    // Keep the ORIGINAL deadline and queue priority while awaiting genuine
    // skinned-hand movement on a later actual WebGL submission.
    awaitingPresentation.push(item);continue;
   }
   if(decision!=='deliver'){
    staleAudioDropped++;
    if(decision==='expired-visual')expiredVisualAudioDropped++;
    // When a REAL WebGL submission blocked long enough to make an effect
    // stale, its old retained GPU instances must not persist into the NEXT
    // frame. Audio remains refused by the same original 400ms deadline.
    // Live Warden warning cells are excluded by the visual stage: the audio
    // timeout does not revoke authoritative danger.
    if(item.visual&&(decision==='stale-frame'||decision==='expired-visual'||
     decision==='unverified-frame'))
     safeCall(()=>visuals?.retireStaleCue?.(item.cue.id,decision));
    retainReceipt(item.cue,item.visual,false,frameId,decision,submittedWallClock);continue;
   }
   // A retained, drawable sword or body glyph was checked during the
   // previous advance(), not necessarily at this actual frame receipt. An
   // actor can die, be unloaded or change its cast between those boundaries.
   // Real D04 visuals expose read-only live-pose witnesses; older injected
   // test/legacy adapters without that optional interface retain their
   // established contract. Independent HP loss and already-launched arrow
   // flights must NOT be retroactively assigned a performer or invalidated.
   const drawnSwing=item.visual&&item.cue.kind==='swing'&&!reducedMotion;
   const drawnBody=item.visual&&
    (item.cue.kind==='warden-release'||item.cue.kind==='opening'||
     item.cue.kind==='guard'||item.cue.kind==='cast-utility');
   if(drawnSwing&&typeof visuals?.hasAuthenticatedSwingPose==='function'&&
     safeCall(()=>visuals.hasAuthenticatedSwingPose(item.cue))!==true){
    staleAudioDropped++;
    // A rejected pose cannot certify a later render of the old retained
    // blade. The just-submitted frame cannot be undone; retire its GPU slot
    // before any subsequent WebGL submission, without inventing impact.
    safeCall(()=>visuals?.retireStaleCue?.(item.cue.id,'revoked-drawn-swing-pose'));
    retainReceipt(item.cue,true,false,frameId,'revoked-drawn-swing-pose',submittedWallClock);
    continue;
   }
   if(drawnBody&&typeof visuals?.hasAuthenticatedBodyPose==='function'&&
     safeCall(()=>visuals.hasAuthenticatedBodyPose(item.cue))!==true){
    staleAudioDropped++;
    // A released/cancelled guard or Warden body gesture must not leave a
    // ghost ring after its original pose was revoked at frame receipt.
    safeCall(()=>visuals?.retireStaleCue?.(item.cue.id,'revoked-drawn-body-pose'));
    retainReceipt(item.cue,true,false,frameId,'revoked-drawn-body-pose',submittedWallClock);
    continue;
   }
   // An undrawn source was authenticated when its cue entered the frame
   // queue, not necessarily when WebGL actually submitted it. A renderer
   // stall, asset unload or actor pose change may revoke that permission.
   // Recheck at the genuine submission receipt, without assigning a target
   // or mutating authority. Drawn effects use the retained-slot gate above.
   if(!item.visual){
    // A previously witnessed reduced-motion swing may have been interrupted
    // between admission and genuine WebGL frame submission. Its body-local
    // whoosh cannot outlive its attack; no blade geometry is required here.
    if(reducedMotion&&item.cue.kind==='swing'&&
       typeof visuals?.hasAuthenticatedSwingAction==='function'&&
       safeCall(()=>visuals.hasAuthenticatedSwingAction(item.cue))!==true){
     staleAudioDropped++;
     retainReceipt(item.cue,false,false,frameId,'revoked-reduced-swing-action',submittedWallClock);
     continue;
    }
    const release=item.cue.kind==='ranged-release'||item.cue.kind==='spell-release';
    const body=item.cue.kind==='warden-release'||item.cue.kind==='opening'||
     item.cue.kind==='guard'||item.cue.kind==='cast-utility';
    if(release||body){
     const authenticated=safeCall(()=>release?
      visuals?.hasAuthenticatedReleasePose?.(item.cue):
      visuals?.hasAuthenticatedBodyPose?.(item.cue))===true;
     if(!authenticated){
      staleAudioDropped++;
      retainReceipt(item.cue,false,false,frameId,
       release?'revoked-release-pose':'revoked-body-pose',submittedWallClock);
      continue;
     }
    }
   }
   // A submitted REAL wrist passage can subtly shape the air-whoosh foley.
   // No measurement? Preserve the established recipe. Never apply velocity
   // to damage, target assignment, reduced-motion or other cue families.
   // This is read-only acoustic metadata; immutable authority cues survive.
   let soundCue=item.cue;
   if(drawnSwing&&typeof visuals?.measuredSwingSpeed==='function'){
    const metersPerSecond=safeCall(()=>visuals.measuredSwingSpeed(item.cue));
    if(Number.isFinite(metersPerSecond)&&metersPerSecond>0&&
       metersPerSecond<=48)
     soundCue={...item.cue,detail:{...item.cue.detail,
      measuredHandMetersPerSecond:metersPerSecond}};
   }
   const audible=!!safeCall(()=>foley?.emit?.(soundCue));
   if(audible){audioAccepted++;released++}
   retainReceipt(item.cue,item.visual,audible,frameId,
    audible?'delivered':'foley-rejected',submittedWallClock);
  }
  return released;
 }
 function popDue(dt){
  if(!pending.length)return;
  for(const item of [...pending]){
   // Never render or play a queued swing after a long real browser/GPU stall.
   if(observedSeconds-item.queuedAt>MAX_AUDIO_VISUAL_STALENESS_SECONDS){
    pending.splice(pending.indexOf(item),1);
    // A warning with matching, STILL-LIVE public danger cells is not a stale
    // authored attack. The first actual frame may have stalled before its
    // warning could be painted. Restore ONLY the retained floor markers if
    // the latest authority still proves their full footprint and sole owner.
    // Never recover its old audio: the original 400ms deadline has elapsed.
    // Unverified frame intervals and revoked/replaced warnings fail closed.
    if(requirePresentedFrame&&!unverifiedFrameInterval&&
       item.cue.visual==='warning'&&
       item.cue.proof==='authority-warning-window'&&
       isLiveWardenWarning(item.cue,previous)){
     const visual=!!safeCall(()=>visuals?.emit?.(item.cue));
     if(visual){
      visualAccepted++;lateLiveWarningVisuals++;
      if(item.audioEpoch!==null)staleAudioDropped++;
     }else expiredQueuedCues++;
     // A revived LIVE hazard counts as visual admission, not as both admitted
     // and expired: the browser counter invariant stays truthful.
     retainReceipt(item.cue,visual,false,null,visual?
      'live-warning-visual-only-after-stall':'live-warning-undrawable-after-stall');
     played++;
    }else{
     expiredQueuedCues++;
     retainReceipt(item.cue,false,false,null,'expired-pending-before-frame');
    }
    continue;
   }
   item.remaining-=dt;
  }
  const due=pending.filter(x=>x.remaining<=0).sort((a,b)=>
   b.cue.priority-a.cue.priority||a.cue.tick-b.cue.tick||
   a.cue.id.localeCompare(b.cue.id,'en'));
  for(const item of due){
   const at=pending.indexOf(item);
   if(at!==-1){pending.splice(at,1);emit(item.cue,item.audioEpoch,item.queuedAt)}
  }
 }
 function acceptSnapshot(snapshot){
  if(disposed||!snapshot||!Number.isSafeInteger(snapshot.tick)||!key(snapshot))return 0;
  // An attempt FIRST observed while WebAudio is suspended must never be
  // retroactively authorized after the browser resumes.
  onAudioStateChange();
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
  // One immutable public snapshot is observed at ONE boundary. Clocking once
  // per cue assigned different onset ages to simultaneous verified HP losses
  // and could overrun 400ms during dense snapshot planning.
  const snapshotWallAt=requirePresentedFrame&&cues.length?
   observedWallClock():null;
  for(const cue of cues){
   if(seen.has(cue.id)){duplicates++;continue}
   seen.add(cue.id);
   if(seen.size>MAX_PHYSICAL_SEEN_IDS){
    const oldest=seen.values().next().value;seen.delete(oldest);
    observedAtByCueId.delete(oldest);
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
    const queuedWallAt=snapshotWallAt;
    if(queuedWallAt!==null)observedAtByCueId.set(cue.id,queuedWallAt);
    pending.push({cue,remaining:presentationDelay(cue),queuedAt:observedSeconds,
    // A 19-second renderer interval may PRECEDE a just-observed HP transition.
    // Keep the actual observation clock until the next advance, not the old
    // frame's beginning. Never use this as a substitute for WebGL receipts.
    queuedWallAt,
    freshlyObserved:requirePresentedFrame,
    audioEpoch:optedIn&&audioReady()?audioEpoch:null});queued++;
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
  onAudioStateChange();
  const dt=clamp(frameSeconds,0,.05);
  renderedSeconds+=dt;
  // Raw browser time, not the 50ms animation cap, determines late audio.
  // An invalid frame interval cannot certify a timely delivered sound.
  unverifiedFrameInterval=!(Number.isFinite(actualFrameSeconds)&&actualFrameSeconds>0);
  if(unverifiedFrameInterval)invalidFrameIntervals++;
  observedSeconds+=unverifiedFrameInterval?
   MAX_AUDIO_VISUAL_STALENESS_SECONDS+.01:Math.min(actualFrameSeconds,3600);
  if(requirePresentedFrame){
   const wallNow=observedWallClock();
   lastVisualAdvanceStartClock=wallNow;
   lastVisualAdvanceEndClock=null;
   for(const item of pending){
    if(!item.freshlyObserved)continue;
    item.freshlyObserved=false;
    if(wallNow!==null&&item.queuedWallAt!==null&&wallNow>=item.queuedWallAt)
     // The frame interval is measured from the previous rAF, not the
     // arrival of THIS snapshot. Preserve actual elapsed wall age, while
     // older cues still expire normally. A slow render AFTER this point
     // is independently rejected by acknowledgePresentedFrame().
     item.queuedAt=observedSeconds-(wallNow-item.queuedWallAt);
   }
  }
  const before=pending.length;
  // First expire retained art against the actual browser interval. A cue
  // that becomes due THIS frame has not survived that interval yet; it must
  // get a first genuine render opportunity rather than instantly aging out.
  safeCall(()=>visuals?.advance?.(dt,actualFrameSeconds));
  // One extra bounded, monotonic clock read measures the D04 visual pass
  // itself. The remaining observation-to-submission wall time includes all
  // other main-thread work and renderer submission. Neither measurement
  // changes the original 400ms safety gate or asserts decoded A/V alignment.
  if(requirePresentedFrame)lastVisualAdvanceEndClock=observedWallClock();
  popDue(dt);safeCall(()=>foley?.cleanup?.());
  return Math.max(0,before-pending.length);
 }
 // WebAudio's clock freezes on suspend. Without revocation, a queued sword
 // transient can resume minutes later against an obsolete visual frame.
 // Observe ONLY this D04 audio context; do not change the shared soundstage.
 // Direct state reads cover contexts lacking the optional EventTarget API.
 function audioReady(){
  return !audioStateUnavailable&&
   (!audioStateContext||audioStateContext.state==='running');
 }
 function onAudioStateChange(){
  if(disposed||!audioStateContext)return;
  if(audioStateContext.state==='running'){
   audioStateUnavailable=false;return;
  }
  if(audioStateUnavailable||!optedIn)return;
  audioStateUnavailable=true;audioInterruptions++;
  // An involuntary browser suspend must not silently flip the already-on
  // shared soundstage toggle or persist a fake manual mute. Instead revoke
  // only OLD D04 audio: advancing the consent epoch makes queued old cues
  // silent after resume, while the existing explicit opt-in remains valid
  // for genuinely NEW observed actions. Stop all currently scheduled voices.
  audioEpoch++;awaitingPresentation.length=0;
  safeCall(()=>foley?.flush?.());
 }
 function detachAudioState(){
  if(!observedAudioContext)return;
  const old=observedAudioContext;observedAudioContext=null;
  try{old.removeEventListener?.('statechange',onAudioStateChange)}
  catch{adapterFailures++}
 }
 function observeAudioState(context){
  if(!context||context===observedAudioContext)return;
  detachAudioState();
  audioStateContext=context;
  // Poll state on snapshot, advance and receipt when the context cannot
  // dispatch events. Do not silently assume an unavailable clock is live.
  if(typeof context.addEventListener!=='function'){
   onAudioStateChange();return;
  }
  try{context.addEventListener('statechange',onAudioStateChange);
   observedAudioContext=context;audioStateUnavailable=false;
   onAudioStateChange()}
  catch{adapterFailures++;onAudioStateChange()}
 }
 function attachAudioContext(context,{output=null}={}){
  if(disposed||!context)return false;
  if(injectedFoley){
   // An injected adapter cannot be rebound to a new AudioContext OR FX bus:
   // its output nodes are externally owned and have no rebind contract.
   // The first matching-context attachment records a bus identity only;
   // it does not claim to connect or verify the injected adapter's nodes.
   const contextMismatch=!!(audioStateContext&&audioStateContext!==context);
   const outputMismatch=injectedOutputObserved&&injectedFoleyOutput!==output;
   if(contextMismatch||outputMismatch){
    audioEpoch++;awaitingPresentation.length=0;optedIn=false;
    injectedContextMismatch=contextMismatch;
    injectedOutputMismatch=outputMismatch;
    safeCall(()=>foley?.disable?.());
    return false;
   }
   injectedContextMismatch=false;injectedOutputMismatch=false;
   injectedOutputObserved=true;injectedFoleyOutput=output;
   if(foley)observeAudioState(context);
   return !!foley;
  }
  if(foley&&(ownedFoleyContext!==context||ownedFoleyOutput!==output)){
   // Old scheduled voices and staged receipts cannot follow a new output.
   // Original visual cues still render, but a fresh gesture is required to
   // authorize the newly created original synth. Do not persist a fake mute.
   audioEpoch++;awaitingPresentation.length=0;optedIn=false;
   safeCall(()=>foley.dispose());
   foley=null;
  }
  if(!foley){
   foley=createOriginalCombatFoley(context,{output,requireVerifiedContact:true});
   ownedFoleyContext=context;ownedFoleyOutput=output;
  }
  observeAudioState(context);
  return true;
 }
 function enableAudioFromGesture(){
  if(disposed||injectedContextMismatch||injectedOutputMismatch||
   !safeCall(()=>foley?.enable?.()))return false;
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
  detachAudioState();audioStateContext=null;
  optedIn=false;safeCall(()=>foley?.dispose?.());safeCall(()=>visuals?.dispose?.());
 }
 function stats(){return Object.freeze({
  implementation:'D04-physical-authority-feedback',disposed,scene:sceneId,
  audioOptedIn:optedIn,preferredMuted:preferredMuted(),
  audioInterruptions,injectedContextMismatch,injectedOutputMismatch,
  pending:pending.length,queued,emitted:played,visualAccepted,audioAccepted,
  awaitingPresentation:awaitingPresentation.length,framesAcknowledged,
  replayedFrameAcks,recentStringFrameIds:recentStringFrameIds.size,
  expiredQueuedCues,lateLiveWarningVisuals,invalidFrameIntervals,observedFrameMs:Math.round(observedSeconds*1000),
  staleAudioDropped,expiredVisualAudioDropped,retroactiveAudioSuppressed,
  unverifiedVisualLiveness,
   requirePresentedFrame,
  recentDeliveryReceipts:[...receipts],duplicateCues:duplicates,
  pendingOverflow:overflow,adapterFailures,sceneResets,
  limits:{maxPending:MAX_PHYSICAL_PENDING,maxSeen:MAX_PHYSICAL_SEEN_IDS,
   maxReceipts:MAX_PHYSICAL_RECEIPTS,maxAudioAwaitingFrame:MAX_AUDIO_AWAITING_FRAME},
  visuals:visuals?.stats?.()??null,audio:foley?.stats?.()??null
 });}
 observeAudioState(ctx);
 return Object.freeze({acceptSnapshot,advance,acknowledgePresentedFrame,
  attachAudioContext,enableAudioFromGesture,muteAudio,
  preferredMuted,reset,dispose,stats});
}
