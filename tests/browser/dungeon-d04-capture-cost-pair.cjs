'use strict';
// Read-only D04 forensic comparator. Matching a captured frame and its uncaptured
// peer is a workload diagnostic, NEVER proof that encoding caused a stall,
// that audible impact occurred, or that recorded packets align with contact.
const SOURCE='authentic-D04-original-AV-capture-cost-WebGL-submission';
const MIN_MATCHED_STAGES=4;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const natural=n=>Number.isSafeInteger(n)&&n>=0;
const positive=n=>Number.isSafeInteger(n)&&n>0;
const vec=v=>v&&['x','y','z'].every(a=>finite(v[a]));
const scene=s=>s&&natural(s.run)&&natural(s.floor)&&natural(s.tick)&&
 typeof s.checksum==='string'&&s.checksum.length>0;
const sameScene=(a,b)=>a&&b&&a.run===b.run&&a.floor===b.floor&&
 a.tick===b.tick&&a.checksum===b.checksum;
const samePoint=(a,b)=>['x','y','z'].every(axis=>Math.abs(a[axis]-b[axis])<=0.35);
const round=x=>Math.round(x*1000)/1000;
function percentile(values,f){
 const sorted=[...values].sort((a,b)=>a-b);
 return round(sorted[Math.max(0,Math.ceil(sorted.length*f)-1)]);
}
const stats=values=>({p50Ms:percentile(values,.5),
 p95Ms:percentile(values,.95),p99Ms:percentile(values,.99),
 worstMs:round(Math.max(...values))});
function validManifest(expected){
 if(!Array.isArray(expected)||expected.length<MIN_MATCHED_STAGES||
    expected.length>24)return false;
 let last=-1,run=null,floor=null,checksum=null;
 for(let i=0;i<expected.length;i++){
  const s=expected[i];
  if(!s||s.stageIndex!==i||!scene(s.scene)||!natural(s.hpLossCount)||
     s.scene.tick<=last||s.scene.checksum===checksum)return false;
  if(run!==null&&(s.scene.run!==run||s.scene.floor!==floor))return false;
  last=s.scene.tick;run=s.scene.run;floor=s.scene.floor;
  checksum=s.scene.checksum;
 }
 return true;
}
function validRecorder(mode,r){
 if(!r||!natural(r.peakConcurrentRecorders)||!natural(r.videoTracks)||
    !natural(r.audioTracks))return false;
 if(mode==='off')return r.status==='NOT_STARTED'&&r.peakConcurrentRecorders===0&&
    r.videoTracks===0&&r.audioTracks===0&&r.activeDuringComparison===false;
 return r.status==='RECORDED'&&r.peakConcurrentRecorders===1&&
  r.videoTracks===1&&r.audioTracks===1&&
  r.startedBeforeStages===true&&r.stoppedAfterStages===true&&
  natural(r.bytes)&&r.bytes>1024&&natural(r.requestedFrames)&&
  r.requestedFrames>0&&r.requestedFrames<=128;
}
function validSample(s,mode){
 return s&&s.source===SOURCE&&s.capture===mode&&natural(s.stageIndex)&&
 typeof s.seed==='string'&&s.seed.length>0&&s.viewport&&
 positive(s.viewport.width)&&positive(s.viewport.height)&&
 positive(s.frameId)&&scene(s.scene)&&
 typeof s.camera==='string'&&s.camera.length>0&&
 typeof s.focusedHeroId==='string'&&s.focusedHeroId.length>0&&
 vec(s.cameraPosition)&&vec(s.cameraAim)&&
 s.softwareWebGL===true&&s.postFX==='direct'&&finite(s.renderMs)&&s.renderMs>0&&
 natural(s.drawCalls)&&natural(s.vfxDrawCalls)&&natural(s.vfxReservedInstances)&&
 s.consentedSoundstage===true&&s.recordingAtSample===(mode==='on');
}
function indexed(samples,mode){
 const out=new Map(),rejected=new Set();
 let prevStage=-1,prevFrame=-1;
 for(const s of Array.isArray(samples)?samples:[]){
  if(!natural(s?.stageIndex))continue;
  const stage=s.stageIndex;
  const monotonic=stage>prevStage&&positive(s.frameId)&&s.frameId>prevFrame;
  if(out.has(stage)){out.delete(stage);rejected.add(stage)}
  else if(!validSample(s,mode)||!monotonic)rejected.add(stage);
  else if(!rejected.has(stage))out.set(stage,s);
  prevStage=stage;
  if(positive(s.frameId))prevFrame=s.frameId;
 }
 for(const stage of rejected)out.delete(stage);
 return out;
}
function sameView(a,b){
 return a.seed===b.seed&&a.viewport.width===b.viewport.width&&
 a.viewport.height===b.viewport.height&&a.camera===b.camera&&
 a.focusedHeroId===b.focusedHeroId&&samePoint(a.cameraPosition,b.cameraPosition)&&
 samePoint(a.cameraAim,b.cameraAim)&&a.softwareWebGL===b.softwareWebGL&&
 a.postFX===b.postFX;
}
function classifyD04CaptureCostPair({expected,off,on}={}){
 const base={source:SOURCE,matchedStages:0,hpLossStagesMatched:0,
  excludedStages:[],budgetViolations:[],off:null,on:null,paired:null,
  causedByRecorder:null,sampleSynchronized:false,
  caveat:'Same seeded authoritative states across serial real WebGL pages; scheduler warmup, capture load and time variability prevent causal assignment. WebM packet presence is NOT synchronized audible impact.'};
 if(!validManifest(expected)||!expected.some(s=>s.hpLossCount>0))
  return {...base,status:'INSUFFICIENT_REAL_AUTHORITY'};
 if(!validRecorder('off',off?.recorder)||!validRecorder('on',on?.recorder))
  return {...base,status:'CAPTURE_PROVENANCE_UNVERIFIED'};
 const left=indexed(off.samples,'off'),right=indexed(on.samples,'on');
 const matched=[];
 for(const stage of expected){
  const a=left.get(stage.stageIndex),b=right.get(stage.stageIndex);
  if(!a||!b||!sameScene(a.scene,stage.scene)||!sameScene(b.scene,stage.scene)||
     !sameView(a,b)){base.excludedStages.push(stage.stageIndex);continue}
  matched.push({stage,a,b});
  for(const [name,cap,kind] of [['vfxDrawCalls',7,'VFX_DRAW_CALL_CAP'],
    ['vfxReservedInstances',104,'VFX_RESERVED_INSTANCE_CAP']]){
   if(a[name]>cap||b[name]>cap)
    base.budgetViolations.push({stageIndex:stage.stageIndex,kind,cap,
     withoutCapture:a[name],withCapture:b[name]});
  }
 }
 base.matchedStages=matched.length;
 base.hpLossStagesMatched=matched.filter(({stage})=>stage.hpLossCount>0).length;
 if(matched.length<MIN_MATCHED_STAGES||!base.hpLossStagesMatched)
  return {...base,status:'INSUFFICIENT_CAPTURE_COMBAT_MATCH'};
 const offTimes=matched.map(({a})=>a.renderMs);
 const onTimes=matched.map(({b})=>b.renderMs);
 const deltas=matched.map(({a,b})=>round(b.renderMs-a.renderMs));
 base.off=stats(offTimes);base.on=stats(onTimes);
 base.paired={p50DeltaMs:percentile(deltas,.5),
  p95DeltaMs:percentile(deltas,.95),p99DeltaMs:percentile(deltas,.99),
  worstPositiveDeltaMs:round(Math.max(0,...deltas)),
  minimumDeltaMs:round(Math.min(...deltas))};
 return {...base,status:base.budgetViolations.length?
  'D04_CAPTURE_EFFECT_BUDGET_VIOLATION':'MATCHED_CAPTURE_COST_DIAGNOSTIC_ONLY'};
}
module.exports={SOURCE,MIN_MATCHED_STAGES,classifyD04CaptureCostPair};
