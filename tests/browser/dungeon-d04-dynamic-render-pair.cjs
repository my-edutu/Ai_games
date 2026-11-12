'use strict';
// Strict, evidence-only dynamic combat rendering comparator. No gameplay,
// audio, camera or renderer mutation; never upgrades timings into A/V proof.
const {SOURCE}=require('./dungeon-d04-render-cost-pair.cjs');
const MIN_MATCHED_STAGES=4;
const finite=value=>typeof value==='number'&&Number.isFinite(value);
const natural=value=>Number.isSafeInteger(value)&&value>=0;
const positive=value=>Number.isSafeInteger(value)&&value>0;
const point=value=>value&&['x','y','z'].every(axis=>finite(value[axis]));
const scene=value=>value&&natural(value.run)&&natural(value.floor)&&
 natural(value.tick)&&typeof value.checksum==='string'&&value.checksum.length>0;
const sameScene=(a,b)=>a&&b&&a.run===b.run&&a.floor===b.floor&&
 a.tick===b.tick&&a.checksum===b.checksum;
const samePoint=(a,b)=>['x','y','z'].every(axis=>Math.abs(a[axis]-b[axis])<=0.35);
const round=value=>Math.round(value*1000)/1000;
function percentile(values,fraction){
 const sorted=[...values].sort((a,b)=>a-b);
 return round(sorted[Math.max(0,Math.ceil(sorted.length*fraction)-1)]);
}
function stats(values){
 return {p50Ms:percentile(values,.5),p95Ms:percentile(values,.95),
  p99Ms:percentile(values,.99),worstMs:round(Math.max(...values))};
}
function validManifest(expected){
 if(!Array.isArray(expected)||expected.length<MIN_MATCHED_STAGES||expected.length>24)return false;
 let prior=-1,run=null,floor=null,previousChecksum=null;
 for(let i=0;i<expected.length;i++){
  const e=expected[i];
  if(!e||e.stageIndex!==i||!scene(e.scene)||!natural(e.hpLossCount)||
     e.scene.tick<=prior||e.scene.checksum===previousChecksum)return false;
  if(run!==null&&(run!==e.scene.run||floor!==e.scene.floor))return false;
  prior=e.scene.tick;run=e.scene.run;floor=e.scene.floor;
  previousChecksum=e.scene.checksum;
 }
 return true;
}
function validSample(e,mode){
 return e&&e.source===SOURCE&&e.mode===mode&&natural(e.stageIndex)&&
 typeof e.seed==='string'&&e.seed.length>0&&e.viewport&&
 positive(e.viewport.width)&&positive(e.viewport.height)&&positive(e.frameId)&&
 scene(e.scene)&&typeof e.camera==='string'&&e.camera.length>0&&
 typeof e.focusedHeroId==='string'&&e.focusedHeroId.length>0&&
 point(e.cameraPosition)&&point(e.cameraAim)&&
 e.postFX==='direct'&&e.softwareWebGL===true&&
 finite(e.renderMs)&&e.renderMs>0&&natural(e.drawCalls)&&
 finite(e.stageWallMs)&&e.stageWallMs>=0&&
 (e.vfxDrawCalls==null||natural(e.vfxDrawCalls))&&
 (e.vfxReservedInstances==null||natural(e.vfxReservedInstances));
}
function indexedSamples(samples,mode){
 const byStage=new Map(),rejected=new Set();
 let previousStage=-1,previousFrame=-1;
 for(const item of Array.isArray(samples)?samples:[]){
  const index=item?.stageIndex;
  if(!natural(index))continue;
  const sequential=index>previousStage&&positive(item.frameId)&&item.frameId>previousFrame;
  // Never pick a convenient frame when repeated stage reads disagree.
  if(byStage.has(index)){byStage.delete(index);rejected.add(index)}
  else if(!validSample(item,mode)||!sequential){rejected.add(index)}
  else if(!rejected.has(index))byStage.set(index,item);
  previousStage=index;
  if(positive(item.frameId))previousFrame=item.frameId;
 }
 for(const index of rejected)byStage.delete(index);
 return byStage;
}
function sameView(a,b){
 return a.seed===b.seed&&a.viewport.width===b.viewport.width&&
 a.viewport.height===b.viewport.height&&a.camera===b.camera&&
 a.focusedHeroId===b.focusedHeroId&&samePoint(a.cameraPosition,b.cameraPosition)&&
 samePoint(a.cameraAim,b.cameraAim)&&a.postFX===b.postFX&&
 a.softwareWebGL===b.softwareWebGL;
}
function classifyD04DynamicRendererPair({expected,legacy,d04}={}){
 const base={source:SOURCE,matchedStages:0,hpLossStagesMatched:0,
  excludedStages:[],budgetViolations:[],legacy:null,d04:null,paired:null,
  causedByD04:null,sampleSynchronized:false,
  caveat:'Serial real-browser post-WebGL snapshots with polling and possible warmup bias; NOT causal GPU attribution, moving encoded footage or audible sample synchronization'};
 if(!validManifest(expected)||!expected.some(e=>e.hpLossCount>0))
  return {...base,status:'INSUFFICIENT_DYNAMIC_AUTHORITY'};
 const left=indexedSamples(legacy,'legacy'),right=indexedSamples(d04,'d04');
 const matches=[];
 for(const stage of expected){
  const a=left.get(stage.stageIndex),b=right.get(stage.stageIndex);
  if(!a||!b||!sameScene(a.scene,stage.scene)||!sameScene(b.scene,stage.scene)||
     !sameView(a,b)){
   base.excludedStages.push(stage.stageIndex);continue;
  }
  matches.push({stage,a,b});
  if(b.vfxDrawCalls!==null&&b.vfxDrawCalls!==undefined&&b.vfxDrawCalls>7)
   base.budgetViolations.push({stageIndex:stage.stageIndex,kind:'VFX_DRAW_CALL_CAP',
    observed:b.vfxDrawCalls,cap:7});
  if(b.vfxReservedInstances!==null&&b.vfxReservedInstances!==undefined&&b.vfxReservedInstances>104)
   base.budgetViolations.push({stageIndex:stage.stageIndex,kind:'VFX_RESERVED_INSTANCE_CAP',
    observed:b.vfxReservedInstances,cap:104});
 }
 base.matchedStages=matches.length;
 base.hpLossStagesMatched=matches.filter(({stage})=>stage.hpLossCount>0).length;
 if(matches.length<MIN_MATCHED_STAGES||base.hpLossStagesMatched===0)
  return {...base,status:'INSUFFICIENT_MATCHED_DYNAMIC_FRAMES'};
 const aTimes=matches.map(({a})=>a.renderMs);
 const bTimes=matches.map(({b})=>b.renderMs);
 const deltas=matches.map(({a,b})=>round(b.renderMs-a.renderMs));
 const drawDeltas=matches.map(({a,b})=>b.drawCalls-a.drawCalls);
 const paired={p50DeltaMs:percentile(deltas,.5),p95DeltaMs:percentile(deltas,.95),
  p99DeltaMs:percentile(deltas,.99),worstPositiveDeltaMs:round(Math.max(0,...deltas)),
  minimumDeltaMs:round(Math.min(...deltas)),
  p50DrawCallDelta:percentile(drawDeltas,.5),
  // Poll-to-observation includes network/scheduling and is NOT GPU duration.
  maxLegacyStageWallMs:round(Math.max(...matches.map(({a})=>a.stageWallMs))),
  maxD04StageWallMs:round(Math.max(...matches.map(({b})=>b.stageWallMs)))};
 return {...base,status:base.budgetViolations.length?'D04_VISUAL_BUDGET_VIOLATION':
  'MATCHED_DYNAMIC_RENDER_DIAGNOSTIC_ONLY',
  legacy:stats(aTimes),d04:stats(bTimes),paired};
}
module.exports={SOURCE,MIN_MATCHED_STAGES,classifyD04DynamicRendererPair};
