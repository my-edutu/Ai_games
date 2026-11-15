'use strict';
// Read-only continuous public-authority vs original A/V recorder comparator.
// In-game renderer receipts and recorded WebM have DIFFERENT clocks.
const SOURCE='authentic-D04-continuous-public-authority-capture-pair';
const safe=n=>Number.isSafeInteger(n)&&n>=0;
const pos=n=>Number.isSafeInteger(n)&&n>0;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const vec=v=>v&&['x','y','z'].every(a=>finite(v[a]));
const scene=s=>s&&safe(s.run)&&safe(s.floor)&&safe(s.tick)&&
 typeof s.checksum==='string'&&s.checksum.length>0;
const key=s=>`${s.run}:${s.floor}:${s.tick}:${s.checksum}`;
const sceneKey=s=>`${s.run}:${s.floor}`;
const close=(a,b)=>['x','y','z'].every(axis=>Math.abs(a[axis]-b[axis])<=0.35);
const round=n=>Math.round(n*1000)/1000;
function stats(values){
 if(!values.length)return null;
 const xs=[...values].sort((a,b)=>a-b);
 const pct=p=>round(xs[Math.max(0,Math.ceil(xs.length*p)-1)]);
 return {count:xs.length,p50Ms:pct(.5),p95Ms:pct(.95),
  p99Ms:pct(.99),worstMs:round(xs.at(-1))};
}
function validManifest(list){
 if(!Array.isArray(list)||list.length<8||list.length>160)return false;
 const known=new Set();let prior=null,damage=false;
 for(let i=0;i<list.length;i++){
  const e=list[i];
  if(!e||e.stageIndex!==i||!scene(e.scene)||!Array.isArray(e.victimIds)||
   e.victimIds.some(id=>typeof id!=='string'||!id)||
   new Set(e.victimIds).size!==e.victimIds.length||known.has(key(e.scene)))return false;
  if(prior&&sceneKey(e.scene)===sceneKey(prior)){
   if(e.scene.tick!==prior.tick+1||e.scene.checksum===prior.checksum)return false;
  }else if(prior&&e.scene.run<prior.run)return false;
  known.add(key(e.scene));if(e.victimIds.length)damage=true;
  prior=e.scene;
 }
 return damage;
}
function validRecorder(mode,rec){
 if(!rec||!safe(rec.peakConcurrentRecorders)||!safe(rec.videoTracks)||
  !safe(rec.audioTracks))return false;
 if(mode==='off')return rec.status==='NOT_STARTED'&&rec.peakConcurrentRecorders===0&&
  rec.videoTracks===0&&rec.audioTracks===0;
 return rec.status==='RECORDED'&&rec.peakConcurrentRecorders===1&&
  rec.videoTracks===1&&rec.audioTracks===1&&safe(rec.bytes)&&rec.bytes>1024&&
  rec.startedBeforeAuthority===true&&rec.stoppedAfterAuthority===true&&
  safe(rec.requestedFrames)&&rec.requestedFrames<=128;
}
function validSample(x,mode){
 return x&&x.source===SOURCE&&x.capture===mode&&typeof x.seed==='string'&&x.seed&&
 x.viewport&&pos(x.viewport.width)&&pos(x.viewport.height)&&
 pos(x.frameId)&&finite(x.elapsedMs)&&x.elapsedMs>=0&&scene(x.scene)&&
 typeof x.camera==='string'&&x.camera&&
 typeof x.focusedHeroId==='string'&&x.focusedHeroId&&
 vec(x.cameraPosition)&&vec(x.cameraAim)&&x.softwareWebGL===true&&
 x.postFX==='direct'&&finite(x.directRenderMs)&&x.directRenderMs>0&&
 safe(x.vfxDrawCalls)&&safe(x.vfxReservedInstances)&&
 x.consentedSoundstage===true&&x.recordingAtSample===(mode==='on')&&
 Array.isArray(x.recentDeliveryReceipts);
}
function scanArm(arm,mode,manifest){
 const byKey=new Map(),poison=new Set(),known=new Map(manifest.map(e=>[key(e.scene),e]));
 const frames=[];let repeated=0,previousFrame=-1,previousAt=-1,maxIndex=-1;
 for(const x of Array.isArray(arm.samples)?arm.samples:[]){
  const k=scene(x?.scene)?key(x.scene):null;
  const e=k?known.get(k):null;
  if(e)maxIndex=Math.max(maxIndex,e.stageIndex);
  const good=validSample(x,mode)&&e&&x.frameId>previousFrame&&x.elapsedMs>previousAt;
  if(!good){if(k&&e){byKey.delete(k);poison.add(k)}
   if(pos(x?.frameId))previousFrame=Math.max(previousFrame,x.frameId);
   if(finite(x?.elapsedMs))previousAt=Math.max(previousAt,x.elapsedMs);
   continue;
  }
  previousFrame=x.frameId;previousAt=x.elapsedMs;
  frames.push(x);
  if(poison.has(k))continue;
  const old=byKey.get(k);
  if(old){repeated++;if(old.directRenderMs<x.directRenderMs)byKey.set(k,x)}
  else byKey.set(k,x);
 }
 return {byKey,frames,repeated,maxIndex};
}
function sameView(a,b){
 return a.seed===b.seed&&a.viewport.width===b.viewport.width&&
  a.viewport.height===b.viewport.height&&a.camera===b.camera&&
  a.focusedHeroId===b.focusedHeroId&&close(a.cameraPosition,b.cameraPosition)&&
  close(a.cameraAim,b.cameraAim);
}
function injuryReceipt(sample,manifest){
 if(!sample||!manifest.victimIds.length)return false;
 const s=manifest.scene;
 return (sample.recentDeliveryReceipts||[]).some(r=>{
  if(!r||!['damage','damage-fatal'].includes(r.kind)||
   r.tick!==s.tick||r.scene!==sceneKey(s))return false;
  if(!manifest.victimIds.some(id=>r.cueId===
   `${sceneKey(s)}:${s.tick}:${r.kind}:-:${id}`))return false;
  // An original impact sound and the presence of one retained VFX pool
  // are NOT evidence that this injury was drawable on this frame. The
  // bounded receipt ring may contain a legitimate older frame's injury;
  // neither its clock nor its art can be borrowed by a newer sample.
  // A deliberately muted/suspended but truly submitted visual-only wound
  // still earns visible-frame credit, never an audio-synchronization claim.
  return r.visual===true&&r.visualDrawableAtSubmission===true&&
   pos(r.frameId)&&r.frameId===sample.frameId&&
   (r.decision==='delivered'&&r.audio===true||
    r.decision==='visual-only-submitted'&&r.audio===false)&&
   finite(r.observedClockMs)&&finite(r.submittedClockMs)&&
   finite(r.observationToSubmissionMs)&&r.observationToSubmissionMs>=0&&
   r.observationToSubmissionMs<=400&&r.submittedClockMs>=r.observedClockMs&&
   Math.abs(r.submittedClockMs-r.observedClockMs-r.observationToSubmissionMs)<=3;
 });
}
function classifyD04LiveAuthorityPair({manifest,off,on}={}){
 const result={source:SOURCE,status:'INVALID_REAL_AUTHORITY',matchedTicks:0,
  matchedHpLossTicks:0,excludedTicks:[],budgetViolations:[],
  repeatedTickSamples:{off:0,on:0},off:null,on:null,paired:null,
  allObserved:{off:null,on:null},damageReceipts:{off:{timely:0},on:{timely:0}},
  causedByRecorder:null,sampleSynchronized:false,impactAVAccepted:false,
  caveat:'Serial continuous public-DungeonRuntime trials; shared state and view are not shared frame clocks. Media encoding, event loop and software WebGL are not randomized. A rendered cue or source.start is NOT audible contact sync.'};
 if(!validManifest(manifest))return result;
 if(off?.capture!=='off'||on?.capture!=='on'||
    !validRecorder('off',off?.recorder)||!validRecorder('on',on?.recorder))
  return {...result,status:'CAPTURE_PROVENANCE_UNVERIFIED'};
 const left=scanArm(off,'off',manifest),right=scanArm(on,'on',manifest);
 result.repeatedTickSamples={off:left.repeated,on:right.repeated};
 result.allObserved={off:stats(left.frames.map(x=>x.directRenderMs)),
  on:stats(right.frames.map(x=>x.directRenderMs))};
 const matched=[];const stop=Math.min(left.maxIndex,right.maxIndex);
 for(const e of manifest){
  if(e.stageIndex>stop)break;
  const a=left.byKey.get(key(e.scene)),b=right.byKey.get(key(e.scene));
  if(!a||!b||!sameView(a,b)){
   result.excludedTicks.push(e.stageIndex);continue;
  }
  matched.push({e,a,b});
  for(const [name,limit,kind] of [
   ['vfxDrawCalls',7,'VFX_DRAW_CALL_CAP'],
   ['vfxReservedInstances',104,'VFX_INSTANCE_CAP']]){
   if(a[name]>limit||b[name]>limit)
    result.budgetViolations.push({stageIndex:e.stageIndex,kind,
     limit,withoutCapture:a[name],withCapture:b[name]});
  }
  if(e.victimIds.length){
   if(injuryReceipt(a,e))result.damageReceipts.off.timely++;
   if(injuryReceipt(b,e))result.damageReceipts.on.timely++;
  }
 }
 result.matchedTicks=matched.length;
 result.matchedHpLossTicks=matched.filter(({e})=>e.victimIds.length>0).length;
 if(matched.length){
  const leftTimes=matched.map(({a})=>a.directRenderMs),rightTimes=matched.map(({b})=>b.directRenderMs);
  const delta=matched.map(({a,b})=>round(b.directRenderMs-a.directRenderMs));
  result.off=stats(leftTimes);result.on=stats(rightTimes);
  result.paired={...stats(delta),worstPositiveDeltaMs:round(Math.max(0,...delta)),
   minimumDeltaMs:round(Math.min(...delta))};
 }
 result.status=result.budgetViolations.length?'LIVE_EFFECT_BUDGET_VIOLATION':
  matched.length>=4&&result.matchedHpLossTicks>0?
  'MATCHED_LIVE_AUTHORITY_DIAGNOSTIC_ONLY':'INSUFFICIENT_MATCHED_LIVE_DAMAGE';
 return result;
}

/**
 * Six serial, genuine D04 spectator viewpoints are evidence ONLY when the
 * unchanged public runtime state is witnessed on each real WebGL arm.
 * Every arm uses the existing UI camera toggle; this code NEVER moves the
 * camera, makes an attack, edits authoritative state or decodes sound.
 *
 * Recorded WebM bytes do not demonstrate moving *combat*, or align pixels
 * with original PCM. The only positive claim is that six correctly sourced
 * capture streams were recorded under the same immutable authority corpus.
 */
const D04_MULTIVIEW_MODES=Object.freeze(['cinematic','tactical','chase']);
const D04_MULTIVIEW_SIZES=Object.freeze(['1440x900','390x844']);
function classifyD04RealMultiview({seed,manifest,runs}={}){
 const result={source:SOURCE,status:'INVALID_REAL_AUTHORITY',
  requestedViews:6,observedViews:0,capturedRecorders:0,missingViews:[],
  distinctViewPairs:0,viewpointGeometry:[],
  matchedAuthorityTicks:0,matchedHpLossTicks:0,matchedDrawableHpLossTicks:0,
  viewpointFrames:[],budgetViolations:[],sampleSynchronized:false,
  cameraMovingVideoVerified:false,impactAVAccepted:false,
  causation:null,capturePacing:'unverified',
  limitation:'Serial, genuine WebGL snapshots and original consented soundstage WebM, not decoded three-viewpoint moving combat, PCM onset or clock-aligned A/V.'};
 if(!validManifest(manifest)||typeof seed!=='string'||seed.length<1||
  !Array.isArray(runs))return result;
 const expected=D04_MULTIVIEW_SIZES.flatMap(size=>
  D04_MULTIVIEW_MODES.map(viewpoint=>size+'/'+viewpoint));
 const known=new Set(manifest.map(m=>key(m.scene)));
 const byView=new Map();
 const pacingKinds=new Set(runs.map(arm=>arm?.capturePacing??'wall-clock'));
 if(pacingKinds.size!==1||![...pacingKinds].every(p=>
  p==='wall-clock'||p==='frame-acknowledged'))
  return {...result,status:'INVALID_VIEWPOINT_PROVENANCE'};
 result.capturePacing=[...pacingKinds][0];
 for(const arm of runs){
  const size=arm?.viewport?.width+'x'+arm?.viewport?.height;
  const view=size+'/'+arm?.viewpoint;
  if(!expected.includes(view)||byView.has(view))
   return {...result,status:'INVALID_VIEWPOINT_PROVENANCE'};
  byView.set(view,arm);
 }
 result.missingViews=expected.filter(view=>!byView.has(view));
 if(result.missingViews.length||byView.size!==6)
  return {...result,status:'INCOMPLETE_VIEWPOINT_CAPTURE'};
 const scans=[],byGeometryView=new Map();
 for(const view of expected){
  const arm=byView.get(view);
  if(arm.seed!==seed||arm.capture!=='on'||arm.feedbackMode!=='d04'||
   !Array.isArray(arm.errors)||arm.errors.length||
   arm.start?.status!=='STARTED'||!pos(arm.start.originalAudioTracks)||
   !Array.isArray(arm.samples)||!arm.samples.length)
   return {...result,status:'INVALID_VIEWPOINT_PROVENANCE'};
  const [size,viewpoint]=view.split('/');
  let previousFrame=-1,previousMs=-1;
  for(const s of arm.samples){
   if(!validSample(s,'on')||s.seed!==seed||
    s.feedbackMode!=='d04'||s.d04PreviewEnabled!==true||
    s.previewAudioOptedIn!==true||s.camera!==viewpoint||
    s.viewport.width+'x'+s.viewport.height!==size||
    !known.has(key(s.scene))||s.frameId<=previousFrame||
    s.elapsedMs<=previousMs)
    return {...result,status:'INVALID_VIEWPOINT_PROVENANCE'};
   previousFrame=s.frameId;previousMs=s.elapsedMs;
   if(s.vfxDrawCalls>7||s.vfxReservedInstances>104||
    s.activeVfxDrawCalls>7||s.activeVfxInstances>104){
    result.budgetViolations.push({view,frameId:s.frameId,
     drawCalls:s.vfxDrawCalls,reservedInstances:s.vfxReservedInstances,
     activeDrawCalls:s.activeVfxDrawCalls,activeInstances:s.activeVfxInstances});
   }
  }
  const scan=scanArm(arm,'on',manifest);
  // A frame-paced run makes a narrower claim than continuous playback:
  // each genuine public tick must be witnessed after an actual WebGL
  // submission. Its sequence is not realtime, not sample-synchronized
  // and cannot be used to fabricate responsive 400ms injury playback.
  if(result.capturePacing==='frame-acknowledged'){
   if(!Array.isArray(arm.pacedReceipts)||arm.pacedReceipts.length===0||
    arm.pacedReceipts.length>40)
    return {...result,status:'INVALID_VIEWPOINT_PROVENANCE'};
   let previousStage=-1,previousFrame=0,previousAck=0;
   for(const receipt of arm.pacedReceipts){
    const m=manifest[receipt?.stageIndex];
    if(!m||receipt.accepted!==true||
     receipt.stageIndex!==previousStage+1||
     !scene(receipt.scene)||key(receipt.scene)!==key(m.scene)||
     !pos(receipt.frameId)||receipt.frameId<=previousFrame||
     !pos(receipt.acknowledgedFrames)||receipt.acknowledgedFrames<=previousAck||
     !scan.byKey.has(key(m.scene))||
     !arm.samples.some(x=>x.frameId===receipt.frameId&&
      key(x.scene)===key(m.scene)))
     return {...result,status:'INVALID_VIEWPOINT_PROVENANCE'};
    previousStage=receipt.stageIndex;previousFrame=receipt.frameId;
    previousAck=receipt.acknowledgedFrames;
   }
  }
  if(scan.frames.length!==arm.samples.length)
   return {...result,status:'INVALID_VIEWPOINT_PROVENANCE'};
  scans.push(scan);byGeometryView.set(view,scan);
  const recorded=validRecorder('on',arm.recorder)&&
   pos(arm.recorder.requestedFrames);
  if(recorded)result.capturedRecorders++;
  result.viewpointFrames.push({view,observedFrameSamples:scan.frames.length,
   observedAuthorityStates:scan.byKey.size,originalAVRecorded:recorded,
   requestedSubmissionFrames:arm.recorder?.requestedFrames??null,
   encodedBytes:recorded?arm.recorder.bytes:null,
   sampledWorstRenderMs:stats(scan.frames.map(x=>x.directRenderMs))?.worstMs??null});
 }
 result.observedViews=6;
 // This is ONLY an exact (run,floor,tick,checksum) intersection of serial
 // recordings, not the same presented frame or an audio-aligned contact.
 const matches=manifest.filter(m=>scans.every(s=>s.byKey.has(key(m.scene))));
 result.matchedAuthorityTicks=matches.length;
 result.matchedHpLossTicks=matches.filter(m=>m.victimIds.length).length;
 // Same public HP state across six cameras does NOT mean the physical wound
 // was drawable on any camera. Require a separate same-frame renderer
 // witness from EACH view. This diagnostic remains pre-decoder: it cannot
 // certify visible encoded pixels or original PCM synchronization.
 result.matchedDrawableHpLossTicks=matches.filter(m=>m.victimIds.length&&
  scans.every(scan=>scan.frames.some(sample=>
   key(sample.scene)===key(m.scene)&&injuryReceipt(sample,m)))).length;
 // Distinct UI labels are NOT evidence of distinct 3D camera positions.
 // Compare the physical camera and aim on EXACT shared authority states
 // within each viewport. A sampled software-WebGL gap is UNKNOWN, never
 // a made-up third camera direction.
 const different3D=(a,b)=>{
  const distance2=(u,v)=>(u.x-v.x)**2+(u.y-v.y)**2+(u.z-v.z)**2;
  return distance2(a.cameraPosition,b.cameraPosition)>.75**2||
   distance2(a.cameraAim,b.cameraAim)>.75**2;
 };
 for(const size of D04_MULTIVIEW_SIZES){
  for(let i=0;i<D04_MULTIVIEW_MODES.length;i++){
   for(let j=i+1;j<D04_MULTIVIEW_MODES.length;j++){
    const left=size+'/'+D04_MULTIVIEW_MODES[i],
     right=size+'/'+D04_MULTIVIEW_MODES[j];
    const a=byGeometryView.get(left).byKey,
     b=byGeometryView.get(right).byKey;
    const common=manifest.filter(m=>a.has(key(m.scene))&&b.has(key(m.scene)));
    const distinguished=common.some(m=>
     different3D(a.get(key(m.scene)),b.get(key(m.scene))));
    result.viewpointGeometry.push({left,right,commonAuthorityStates:common.length,
     distinctCameraPositionsOrAims:distinguished});
    if(distinguished)result.distinctViewPairs++;
   }
  }
 }
 result.status=result.budgetViolations.length?'LIVE_EFFECT_BUDGET_VIOLATION':
  result.capturedRecorders<6?'INCOMPLETE_VIEWPOINT_CAPTURE':
  result.matchedAuthorityTicks<1||result.matchedHpLossTicks<1?
   'SPARSE_VIEWPOINT_COVERAGE':
  result.distinctViewPairs<6?'VIEWPOINT_GEOMETRY_UNVERIFIED':
   result.capturePacing==='frame-acknowledged'?
    'SIX_VIEWPOINT_FRAME_PACED_UNALIGNED':'SIX_VIEWPOINT_CAPTURED_UNALIGNED';
 return result;
}
module.exports={SOURCE,classifyD04LiveAuthorityPair,classifyD04RealMultiview};

