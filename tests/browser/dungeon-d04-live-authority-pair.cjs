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
  return r.visual===true&&r.decision==='delivered'&&safe(r.frameId)&&
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
module.exports={SOURCE,classifyD04LiveAuthorityPair};
