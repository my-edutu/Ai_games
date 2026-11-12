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
  s.d04PreviewEnabled===(mode==='d04')&&s.consentedSoundstage===true&&
  s.previewAudioOptedIn===(mode==='d04')&&Array.isArray(s.recentDeliveryReceipts);
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
  allObserved:{legacy:null,preview:null},legacy:null,preview:null,paired:null,
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
 const matched=[],max=Math.min(l.latestIndex,p.latestIndex);
 for(const m of manifest){
  if(m.stageIndex>max)break;
  const a=l.byKey.get(key(m.scene)),b=p.byKey.get(key(m.scene));
  if(!a||!b||!comparable(a,b)){r.excludedStages.push(m.stageIndex);continue}
  matched.push({a,b,m});
  if(b.vfxDrawCalls>7)r.budgetViolations.push({stageIndex:m.stageIndex,kind:'VFX_DRAW_CALL_CAP',count:b.vfxDrawCalls,limit:7});
  if(b.vfxReservedInstances>104)r.budgetViolations.push({stageIndex:m.stageIndex,kind:'VFX_INSTANCE_CAP',count:b.vfxReservedInstances,limit:104});
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
