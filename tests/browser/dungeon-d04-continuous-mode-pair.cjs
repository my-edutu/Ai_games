'use strict';
// Read-only matched real-authority continuous gameplay comparison.
// Renderer receipts cannot establish video/audio synchronization.
const SOURCE='authentic-D04-continuous-legacy-vs-preview';
const safe=n=>Number.isSafeInteger(n)&&n>=0;
const positive=n=>Number.isSafeInteger(n)&&n>0;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const vector=v=>v&&['x','y','z'].every(a=>finite(v[a]));
const scene=s=>s&&safe(s.run)&&safe(s.floor)&&safe(s.tick)&&
 typeof s.checksum==='string'&&s.checksum.length>0;
const key=s=>s.run+':'+s.floor+':'+s.tick+':'+s.checksum;
const sceneKey=s=>s.run+':'+s.floor;
const sameVector=(a,b)=>['x','y','z'].every(k=>Math.abs(a[k]-b[k])<=.35);
const round=n=>Math.round(n*1000)/1000;
const POOL_LIMITS=Object.freeze({trail:8,hit:48,block:8,dust:12,signal:8,projectile:10,spell:8});
const validPoolWriteCount=p=>p&&typeof p==='object'&&
 Object.keys(p).length===Object.keys(POOL_LIMITS).length&&
 Object.entries(POOL_LIMITS).every(([name])=>safe(p[name]));
function stats(values){
 if(!values.length)return null;
 const xs=[...values].sort((a,b)=>a-b);
 const pct=p=>round(xs[Math.max(0,Math.ceil(xs.length*p)-1)]);
 return {count:xs.length,p50Ms:pct(.5),p95Ms:pct(.95),p99Ms:pct(.99),worstMs:round(xs.at(-1))};
}
function validManifest(manifest){
 if(!Array.isArray(manifest)||manifest.length<8||manifest.length>160)return false;
 let prev=null,injuries=0;const known=new Set();
 for(let i=0;i<manifest.length;i++){
  const m=manifest[i];if(!m||m.stageIndex!==i||!scene(m.scene)||
   !Array.isArray(m.victimIds)||m.victimIds.some(x=>typeof x!=='string'||!x)||
   new Set(m.victimIds).size!==m.victimIds.length||known.has(key(m.scene)))return false;
  if(prev&&sceneKey(prev)===sceneKey(m.scene)&&
   (m.scene.tick!==prev.tick+1||m.scene.checksum===prev.checksum))return false;
  if(prev&&m.scene.run<prev.run)return false;
  if(m.victimIds.length)injuries++;
  known.add(key(m.scene));prev=m.scene;
 }
 return injuries>0;
}
function recorderOff(arm,mode){
 const r=arm?.recorder;
 return arm?.feedbackMode===mode&&arm?.seed&&
  positive(arm.viewport?.width)&&positive(arm.viewport?.height)&&
  Array.isArray(arm.errors)&&arm.errors.length===0&&r?.status==='NOT_STARTED'&&
  r.peakConcurrentRecorders===0&&r.videoTracks===0&&r.audioTracks===0;
}
function validSample(s,mode,arm){
 return s&&s.source===SOURCE&&s.feedbackMode===mode&&s.seed===arm.seed&&
  s.viewport?.width===arm.viewport.width&&s.viewport?.height===arm.viewport.height&&
  positive(s.frameId)&&finite(s.elapsedMs)&&s.elapsedMs>=0&&scene(s.scene)&&
  s.camera==='tactical'&&typeof s.focusedHeroId==='string'&&s.focusedHeroId&&
  vector(s.cameraPosition)&&vector(s.cameraAim)&&s.softwareWebGL===true&&
  s.postFX==='direct'&&finite(s.directRenderMs)&&s.directRenderMs>0&&
  safe(s.drawCalls)&&safe(s.triangles)&&s.raster&&finite(s.raster.pixelRatio)&&
  s.raster.pixelRatio>0&&typeof s.raster.shadows==='boolean'&&
  safe(s.vfxDrawCalls)&&safe(s.vfxReservedInstances)&&
  safe(s.activeVfxInstances)&&safe(s.activeVfxDrawCalls)&&
  s.d04PreviewEnabled===(mode==='d04')&&s.consentedSoundstage===true&&
  s.previewAudioOptedIn===(mode==='d04')&&Array.isArray(s.recentDeliveryReceipts)&&
  (mode!=='d04'||safe(s.vfxAdvanceFrames)&&
   safe(s.vfxMatrixWrites)&&safe(s.vfxDirtyPools)&&
   safe(s.vfxPotentialBufferBytes)&&validPoolWriteCount(s.vfxWritesByPool));
}
function scan(arm,mode,manifest){
 const known=new Map(manifest.map(m=>[key(m.scene),m]));
 const byKey=new Map(),poison=new Set(),frames=[];
 let previousFrame=-1,previousAt=-1,latestIndex=-1,duplicates=0;
 for(const s of arm.samples||[]){
  const k=scene(s?.scene)?key(s.scene):null,m=k&&known.get(k);
  if(m)latestIndex=Math.max(latestIndex,m.stageIndex);
  const valid=validSample(s,mode,arm)&&m&&s.frameId>previousFrame&&
   s.elapsedMs>previousAt;
  if(!valid){if(m){poison.add(k);byKey.delete(k)}
   if(positive(s?.frameId))previousFrame=Math.max(previousFrame,s.frameId);
   if(finite(s?.elapsedMs))previousAt=Math.max(previousAt,s.elapsedMs);
   continue;
  }
  previousFrame=s.frameId;previousAt=s.elapsedMs;frames.push(s);
  if(poison.has(k))continue;
  const old=byKey.get(k);
  if(old){duplicates++;if(old.directRenderMs<s.directRenderMs)byKey.set(k,s)}
  else byKey.set(k,s);
 }
 return {byKey,frames,latestIndex,duplicates};
}

/**
 * Read-only diagnostic across EVERY valid observed submission, including
 * frames that cannot be matched to the other serial browser arm. The page
 * observer runs every 80ms, so a missing state proves only that THIS sampler
 * did not witness a frame; it cannot prove that WebGL never rendered it.
 * Treat warmup and effect-density groups as correlations, never causality.
 */
// Summarize *observed* bounded D04 phase receipts sampled from real Chrome.
// Serial browser arms, 80ms sampling and software WebGL cannot certify GPU
// completion, a specific attacker, impact-to-PCM onset or D04 causation.
function slowPhaseEvidence(frames){
 const seen=new Map(),poisoned=new Set();
 let samplesWithCounters=0,rejectedRecords=0,duplicateSamplesSuppressed=0;
 let latestCumulativeSlowFrames=null,latestVerifiedFrames=null,
  latestUnverifiedFrames=null;
 for(const s of frames){
  if(!safe(s.slowSubmissionFrames)||!safe(s.verifiedSubmissionPhaseFrames)||
   !safe(s.unverifiedSubmissionPhaseFrames)||
   !Array.isArray(s.recentSlowSubmissionPhases))continue;
  samplesWithCounters++;
  latestCumulativeSlowFrames=s.slowSubmissionFrames;
  latestVerifiedFrames=s.verifiedSubmissionPhaseFrames;
  latestUnverifiedFrames=s.unverifiedSubmissionPhaseFrames;
  const ring=s.recentSlowSubmissionPhases;
  if(ring.length>32){rejectedRecords+=ring.length;continue}
  for(const r of ring){
   const shape=r&&positive(r.frameId)&&r.frameId<=s.frameId&&
    (r.observedRafMs===null||safe(r.observedRafMs))&&
    safe(r.advanceToSubmissionMs)&&r.advanceToSubmissionMs>=100&&
    safe(r.d04VisualAdvanceMs)&&safe(r.afterVisualToSubmissionMs)&&
    Math.abs(r.d04VisualAdvanceMs+r.afterVisualToSubmissionMs-
     r.advanceToSubmissionMs)<=2&&
    ((r.beforeRendererMs===null&&r.rendererMs===null)||
     (safe(r.beforeRendererMs)&&safe(r.rendererMs)&&
      Math.abs(r.beforeRendererMs+r.rendererMs-r.afterVisualToSubmissionMs)<=2));
   if(!shape||poisoned.has(r?.frameId)){rejectedRecords++;continue}
   const k=r.frameId,prior=seen.get(k);
   if(prior){
    if(JSON.stringify(prior)===JSON.stringify(r))duplicateSamplesSuppressed++;
    else{rejectedRecords++;seen.delete(k);poisoned.add(k)}
   }else seen.set(k,r);
  }
 }
 const ordered=[...seen.values()].sort((a,b)=>b.advanceToSubmissionMs-
  a.advanceToSubmissionMs);
 const worst=ordered.length?{...ordered[0]}:null;
 return {status:samplesWithCounters===0?'NO_BROWSER_PHASE_SAMPLES':
    ordered.length?'OBSERVED_BOUNDED_PHASE_RECEIPTS':'NO_SLOW_PHASE_RECEIPTS_OBSERVED',
  samplesWithCounters,uniqueVerifiedSlowFrames:ordered.length,
  rejectedRecords,duplicateSamplesSuppressed,
  latestCumulativeSlowFrames,latestVerifiedFrames,latestUnverifiedFrames,
  worst,causedByD04:null,sampleSynchronized:false,
  caveat:'Frame CPU-phase intervals only, not GPU completion or measured sample-accurate impact audio. Missing receipts may be an 80ms sampler gap.'};
}
function summarizeFramePressure(scanResult,manifest){
 const indexByKey=new Map(manifest.map(m=>[key(m.scene),m.stageIndex]));
 const sampled=scanResult.frames.map(s=>({...s,stageIndex:indexByKey.get(key(s.scene))}));
 const missingDamage=[],seenGaps=new Set();
 let previous=null,skipped=0;
 for(const s of sampled){
  if(previous!==null&&s.stageIndex>previous+1){
   for(let i=previous+1;i<s.stageIndex;i++){
    if(seenGaps.has(i))continue;
    seenGaps.add(i);skipped++;
    if(manifest[i].victimIds.length)missingDamage.push(i);
   }
  }
  if(previous===null||s.stageIndex>previous)previous=s.stageIndex;
 }
 const worst=sampled.reduce((a,s)=>!a||s.directRenderMs>a.directRenderMs?s:a,null);
 const d04Frames=sampled.filter(s=>s.feedbackMode==='d04');
 const vfxInstancePressure=d04Frames.length?{
  sampledFrames:d04Frames.length,
  maxAdvanceMatrixWrites:Math.max(...d04Frames.map(s=>s.vfxMatrixWrites)),
  maxDirtyPools:Math.max(...d04Frames.map(s=>s.vfxDirtyPools)),
  maxPotentialBufferBytes:Math.max(...d04Frames.map(s=>s.vfxPotentialBufferBytes)),
  renderCallsOver400MsWithNoMatrixWrites:d04Frames.filter(s=>
   s.directRenderMs>400&&s.vfxMatrixWrites===0).length,
  interpretation:'CPU instance-matrix setMatrixAt counts and possible full-buffer upload envelope. Not actual GPU bufferSubData bytes, GPU execution time or an impact-audio witness.'
 }:null;
 return {
  observedSubmittedFrames:sampled.length,
  skippedAuthorityStagesBetweenSamples:skipped,
  diagnosticUnobservedHpLossStageIndices:missingDamage,
  renderCallsOver400Ms:sampled.filter(s=>s.directRenderMs>400).length,
  slowPhaseEvidence:slowPhaseEvidence(sampled),
  vfxInstancePressure,
  warmupRenderMs:stats(sampled.slice(0,2).map(s=>s.directRenderMs)),
  postWarmupRenderMs:stats(sampled.slice(2).map(s=>s.directRenderMs)),
  noActiveVfxRenderMs:stats(sampled.filter(s=>s.activeVfxInstances===0).map(s=>s.directRenderMs)),
  activeVfxRenderMs:stats(sampled.filter(s=>s.activeVfxInstances>0).map(s=>s.directRenderMs)),
  worstFrame:worst?{
   stageIndex:worst.stageIndex,frameId:worst.frameId,
   directRenderMs:round(worst.directRenderMs),
   activeVfxInstances:worst.activeVfxInstances,
   activeVfxDrawCalls:worst.activeVfxDrawCalls,
   vfxMatrixWrites:worst.vfxMatrixWrites??null,
   vfxDirtyPools:worst.vfxDirtyPools??null,
   vfxPotentialBufferBytes:worst.vfxPotentialBufferBytes??null
  }:null,
  causalAttribution:null,
  audibleImpactVerified:false,
  samplingCaveat:'An 80ms browser sampler may miss submitted frames. Unobserved HP ticks are NOT proof of lost WebGL frames, audible contact or lack of gameplay damage.'
 };
}

function comparable(a,b){
 return a.seed===b.seed&&a.viewport.width===b.viewport.width&&
  a.viewport.height===b.viewport.height&&a.camera===b.camera&&
  a.focusedHeroId===b.focusedHeroId&&sameVector(a.cameraPosition,b.cameraPosition)&&
  sameVector(a.cameraAim,b.cameraAim)&&a.raster.pixelRatio===b.raster.pixelRatio&&
  a.raster.shadows===b.raster.shadows;
}
function hasStrictInjuryReceipt(s,m){
 return s.recentDeliveryReceipts.some(r=>{
  if(!r||!['damage','damage-fatal'].includes(r.kind)||
   r.tick!==m.scene.tick||r.scene!==sceneKey(m.scene)||
   !m.victimIds.some(id=>r.cueId===sceneKey(m.scene)+':'+m.scene.tick+':'+r.kind+':-:'+id))return false;
  return r.visual===true&&r.decision==='delivered'&&safe(r.frameId)&&
   finite(r.observedClockMs)&&finite(r.submittedClockMs)&&
   finite(r.observationToSubmissionMs)&&r.observationToSubmissionMs<=400&&
   r.observationToSubmissionMs>=0&&r.submittedClockMs>=r.observedClockMs&&
   Math.abs(r.submittedClockMs-r.observedClockMs-r.observationToSubmissionMs)<=3;
 });
}
function classifyD04ContinuousModePair({manifest,legacy,preview}={}){
 const r={source:SOURCE,status:'INVALID_REAL_AUTHORITY',matchedTicks:0,
  matchedHpLossTicks:0,excludedStages:[],budgetViolations:[],repeatedTickSamples:{legacy:0,preview:0},
  allObserved:{legacy:null,preview:null},framePressure:{legacy:null,preview:null},
  legacy:null,preview:null,paired:null,
  previewDamageReceipts:{timely:0},causedByD04:null,sampleSynchronized:false,impactAVAccepted:false,
  caveat:'Serial continuous authentic WebGL gameplay. Equal authority snapshots do not share frame clocks or guarantee identical raster work. No A/V timing or performance causality is established.'};
 if(!validManifest(manifest))return r;
 if(!recorderOff(legacy,'legacy')||!recorderOff(preview,'d04')||
   legacy.seed!==preview.seed||legacy.viewport.width!==preview.viewport.width||
   legacy.viewport.height!==preview.viewport.height)
  return {...r,status:'INVALID_MODE_PROVENANCE'};
 const l=scan(legacy,'legacy',manifest),p=scan(preview,'d04',manifest);
 r.repeatedTickSamples={legacy:l.duplicates,preview:p.duplicates};
 r.allObserved={legacy:stats(l.frames.map(x=>x.directRenderMs)),
  preview:stats(p.frames.map(x=>x.directRenderMs))};
 r.framePressure={legacy:summarizeFramePressure(l,manifest),
  preview:summarizeFramePressure(p,manifest)};
 // Unpaired true browser frames MUST NOT hide D04 GPU budget overruns.
 for(const s of p.frames){
  const stageIndex=manifest.find(m=>key(m.scene)===key(s.scene))?.stageIndex;
  for(const [value,limit,kind] of [
   [s.vfxDrawCalls,7,'VFX_DRAW_CALL_CAP'],
   [s.vfxReservedInstances,104,'VFX_INSTANCE_CAP'],
   [s.activeVfxDrawCalls,7,'ACTIVE_VFX_DRAW_CALL_CAP'],
   [s.activeVfxInstances,s.vfxReservedInstances,'ACTIVE_VFX_POOL_INCONSISTENT'],
   [s.vfxMatrixWrites,s.vfxReservedInstances,'VFX_FRAME_MATRIX_WRITE_CAP'],
   [s.vfxDirtyPools,s.vfxDrawCalls,'VFX_DIRTY_POOL_CAP'],
   [s.vfxPotentialBufferBytes,s.vfxReservedInstances*64,'VFX_DIRTY_BUFFER_BYTES_CAP']]){
   if(value>limit)r.budgetViolations.push({stageIndex,kind,count:value,limit});
  }
  // A static, bounded seven-pool provenance check; never infer a render-time
  // cause or a physical hit from JavaScript matrix submissions.
  for(const [name,limit] of Object.entries(POOL_LIMITS))
   if(s.vfxWritesByPool[name]>limit)
    r.budgetViolations.push({stageIndex,kind:'VFX_POOL_WRITES_CAP',
     pool:name,count:s.vfxWritesByPool[name],limit});
  const observedSum=Object.values(s.vfxWritesByPool).reduce((a,b)=>a+b,0);
  if(observedSum!==s.vfxMatrixWrites)
   r.budgetViolations.push({stageIndex,kind:'VFX_MATRIX_WRITE_ACCOUNTING_MISMATCH',
    count:observedSum,limit:s.vfxMatrixWrites});
 }
 const matched=[],max=Math.min(l.latestIndex,p.latestIndex);
 for(const m of manifest){
  if(m.stageIndex>max)break;
  const a=l.byKey.get(key(m.scene)),b=p.byKey.get(key(m.scene));
  if(!a||!b||!comparable(a,b)){r.excludedStages.push(m.stageIndex);continue}
  matched.push({a,b,m});
  if(m.victimIds.length&&hasStrictInjuryReceipt(b,m))r.previewDamageReceipts.timely++;
 }
 r.matchedTicks=matched.length;
 r.matchedHpLossTicks=matched.filter(x=>x.m.victimIds.length).length;
 if(matched.length){
  const lhs=matched.map(x=>x.a.directRenderMs),rhs=matched.map(x=>x.b.directRenderMs);
  const delta=matched.map(x=>round(x.b.directRenderMs-x.a.directRenderMs));
  r.legacy=stats(lhs);r.preview=stats(rhs);
  r.paired={...stats(delta),worstPositiveDeltaMs:round(Math.max(0,...delta))};
 }
 r.status=r.budgetViolations.length?'LIVE_EFFECT_BUDGET_VIOLATION':
  matched.length>=4&&r.matchedHpLossTicks>0?
   'MATCHED_CONTINUOUS_MODE_DIAGNOSTIC_ONLY':'INSUFFICIENT_MATCHED_LIVE_DAMAGE';
 return r;
}
module.exports={SOURCE,classifyD04ContinuousModePair};
