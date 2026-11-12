'use strict';
// Read-only comparison of legacy and D04 in the same authentic Dungeon scene.
// This is an app post-render diagnostic; it is NOT decoded moving-video proof,
// GPU-completion timing, or causal attribution of a software-WebGL stall.
const SOURCE='actual-DungeonRuntime-ThreeJS-postWebGL-diagnostics';
const MIN_MATCHED_FRAMES=3;
const finite=value=>typeof value==='number'&&Number.isFinite(value);
const validPosition=value=>value&&['x','y','z'].every(axis=>finite(value[axis]));
const validScene=value=>value&&Number.isSafeInteger(value.run)&&value.run>=0&&
 Number.isSafeInteger(value.floor)&&value.floor>=0&&Number.isSafeInteger(value.tick)&&
 value.tick>=0&&typeof value.checksum==='string'&&value.checksum.length>0;
const validFrame=(s,mode)=>s&&s.source===SOURCE&&s.mode===mode&&
 typeof s.seed==='string'&&s.seed.length>0&&s.viewport&&
 Number.isSafeInteger(s.viewport.width)&&s.viewport.width>0&&
 Number.isSafeInteger(s.viewport.height)&&s.viewport.height>0&&
 Number.isSafeInteger(s.frameId)&&s.frameId>=1&&validScene(s.scene)&&
 typeof s.camera==='string'&&s.camera.length>0&&
 typeof s.focusedHeroId==='string'&&s.focusedHeroId.length>0&&
 validPosition(s.cameraPosition)&&validPosition(s.cameraAim)&&
 s.postFX==='direct'&&s.softwareWebGL===true&&finite(s.renderMs)&&
 s.renderMs>0&&Number.isSafeInteger(s.drawCalls)&&s.drawCalls>=0;
function uniqueFrames(arr,mode){
 const result=[],seen=new Set();let previous=-1;
 for(const item of Array.isArray(arr)?arr:[]){
  if(!validFrame(item,mode)||seen.has(item.frameId)||item.frameId<=previous)continue;
  seen.add(item.frameId);previous=item.frameId;result.push(item);
 }
 return result;
}
function coordinatesMatch(a,b,tolerance){
 return ['x','y','z'].every(axis=>Math.abs(a[axis]-b[axis])<=tolerance);
}
function sameSceneAndView(a,b){
 return a.seed===b.seed&&a.viewport.width===b.viewport.width&&
 a.viewport.height===b.viewport.height&&a.scene.run===b.scene.run&&
 a.scene.floor===b.scene.floor&&a.scene.tick===b.scene.tick&&
 a.scene.checksum===b.scene.checksum&&a.camera===b.camera&&
 a.focusedHeroId===b.focusedHeroId&&a.postFX===b.postFX&&
 a.softwareWebGL===b.softwareWebGL&&
 coordinatesMatch(a.cameraPosition,b.cameraPosition,0.35)&&
 coordinatesMatch(a.cameraAim,b.cameraAim,0.35);
}
const round=value=>Math.round(value*1000)/1000;
function percentile(data,p){
 const sorted=[...data].sort((a,b)=>a-b);
 return round(sorted[Math.max(0,Math.ceil(sorted.length*p)-1)]);
}
function metric(data){
 return {p50Ms:percentile(data,.5),p95Ms:percentile(data,.95),
  p99Ms:percentile(data,.99),worstMs:round(Math.max(...data))};
}
function classifyD04RendererPair({legacy,d04}={}){
 const left=uniqueFrames(legacy,'legacy'),right=uniqueFrames(d04,'d04');
 const matched=[];
 // Same-rank observations, never opportunistically choose the lowest D04
 // cost or pair unrelated late frames to manufacture a favorable result.
 for(let i=0;i<Math.min(left.length,right.length);i++){
  if(sameSceneAndView(left[i],right[i]))matched.push([left[i],right[i]]);
 }
 const base={source:SOURCE,matchedFrames:matched.length,
  legacyFrames: left.length,d04Frames:right.length,
  sampleSynchronized:false,causedByD04:null,
  caveat:'Separate serial real-browser render timings, not a randomized causal A/B test, GPU fence, encoded frame proof or audio synchronization'};
 if(matched.length<MIN_MATCHED_FRAMES)
  return {...base,status:'INSUFFICIENT_MATCHED_RENDER_FRAMES',legacy:null,d04:null,paired:null};
 const legacyMs=matched.map(([a])=>a.renderMs);
 const d04Ms=matched.map(([,b])=>b.renderMs);
 const deltas=matched.map(([a,b])=>round(b.renderMs-a.renderMs));
 const drawDeltas=matched.map(([a,b])=>b.drawCalls-a.drawCalls);
 return {...base,status:'MATCHED_RENDER_DIAGNOSTIC_ONLY',
  legacy:metric(legacyMs),d04:metric(d04Ms),
  paired:{p50DeltaMs:percentile(deltas,.5),p95DeltaMs:percentile(deltas,.95),
   p99DeltaMs:percentile(deltas,.99),worstPositiveDeltaMs:round(Math.max(0,...deltas)),
   minimumDeltaMs:round(Math.min(...deltas)),
   p50DrawCallDelta:percentile(drawDeltas,.5)}};
}
module.exports={SOURCE,MIN_MATCHED_FRAMES,classifyD04RendererPair};
