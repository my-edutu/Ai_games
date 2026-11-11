'use strict';
// P0 read-only ORIGINAL-WebM visual stage witness. Source timestamps are NOT
// rendered event pixels. This original-film chroma observation cannot prove
// the HUD floor, guardian defeat, threshold contact, or video quality.
const fs=require('node:fs'),path=require('node:path');
const {createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const WIDTH=64,HEIGHT=64,FPS=4,FRAME_BYTES=WIDTH*HEIGHT*3;
const SOURCE_SHA=/^[0-9a-f]{40}$/,HASH=/^[0-9a-f]{64}$/;
const MAX_DURATION=240;
function violetSceneFraction(frame){
  if(!Buffer.isBuffer(frame)||frame.length!==FRAME_BYTES)return NaN;
  let purple=0,total=0;
  for(let y=Math.ceil(HEIGHT*.20);y<Math.floor(HEIGHT*.78);y++)
    for(let x=Math.ceil(WIDTH*.12);x<Math.floor(WIDTH*.88);x++){
      const i=(y*WIDTH+x)*3,r=frame[i],g=frame[i+1],b=frame[i+2];
      if(b>g+14&&b>r+10)purple++;
      total++;
    }
  return purple/total;
}
function findSustainedVoidPhase(scores,fps=FPS){
  if(!Array.isArray(scores)||scores.length<24||!(fps>0))return null;
  // Short purple spells, UI and intermittent flares cannot become a floor.
  const warm=Math.ceil(3*fps),cool=Math.ceil(1*fps),min=.22;
  for(let i=warm;i<=scores.length-cool;i++){
    const past=scores.slice(i-warm,i),future=scores.slice(i,i+cool);
    if(past.every(Number.isFinite)&&
       past.reduce((a,b)=>a+b,0)/past.length<.08&&
       past.filter(x=>x<.12).length>=Math.ceil(warm*.66)&&
       future.every(x=>Number.isFinite(x)&&x>=min)){
      return {nativeSeconds:i/fps,precisionSeconds:1/fps,
        beforeMean:past.reduce((a,b)=>a+b,0)/past.length,
        afterMean:future.reduce((a,b)=>a+b,0)/future.length};
    }
  }
  return null;
}
function compareFilmPhaseToSource(clock,observed,sampleCount){
  const transitions=Array.isArray(clock?.sourceEventTimecodes)
    ?clock.sourceEventTimecodes.filter(e=>e?.kind==='floor-transition'&&
      e.fromFloor===8&&e.toFloor===9&&e.observedEpisode===0&&
      e.inOriginalVideo===true&&Number.isFinite(e.nativeVideoSeconds)):[];
  const source=transitions[0];
  const result={status:'NOT EVALUATED',heuristic:'FOUNDRY_TO_VOID_PALETTE_ONLY',
    videoPhaseIsFloorProof:false,eventPixelsConfirmed:false,
    eventToGPUFrameLatencyMeasured:false,sourceTick:source?.sourceTick??null,
    sourceEventSearchSeconds:source?.nativeVideoSeconds??null,
    nativeOriginalFramesSampled:sampleCount,videoPhaseWitness:observed,
    note:'Source/WebM clocks and original scene chroma differ. A purple image is not proof of a floor HUD, physical crossing, impact, or result; 1x review remains required.'};
  if(!source||!observed)return result;
  const discrepancy=observed.nativeSeconds-source.nativeVideoSeconds;
  result.sourceToVioletPhaseDeltaSeconds=Math.round(discrepancy*1000)/1000;
  result.status=Math.abs(discrepancy)>1
    ?'SOURCE_CUE_AND_VISIBLE_PHASE_DISAGREE':'CHROMATIC_PHASE_NEAR_SOURCE_CUE_ONLY';
  if(result.status==='SOURCE_CUE_AND_VISIBLE_PHASE_DISAGREE')
    result.next='Keep full original films but veto synchronized event cue; investigate source/browser/render delay on real frames.';
  return result;
}
function inspectOriginalPhase(directory,viewport,expectedSha){
  if(!['portrait','desktop'].includes(viewport)||!SOURCE_SHA.test(expectedSha))
    throw Error('invalid immutable source/viewport');
  const dir=path.join(directory,viewport),video=path.join(dir,'live.webm');
  const clock=JSON.parse(fs.readFileSync(path.join(dir,'native-video-clock.json'),'utf8'));
  if(clock.sourceSha!==expectedSha||clock.scenario!=='danger'||
     clock.viewport?.name!==viewport||clock.status!=='CALIBRATED'||
     !(clock.originalVideoDurationSeconds>=60)||
     clock.originalVideoDurationSeconds>MAX_DURATION||
     clock.viewport?.width!==(viewport==='portrait'?390:960)||
     clock.viewport?.height!==(viewport==='portrait'?844:600))
    throw Error('invalid original capture sidecar');
  const data=fs.readFileSync(video),hash=createHash('sha256').update(data).digest('hex');
  if(!HASH.test(hash)||hash!==clock.originalWebMSha256||
     data.length!==clock.originalWebMBytes)throw Error('original WebM hash/size mismatch');
  const rgb=execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-nostdin',
    '-i',video,'-vf','fps='+FPS+',scale='+WIDTH+':'+HEIGHT+',format=rgb24',
    '-f','rawvideo','-pix_fmt','rgb24','pipe:1'],
    {timeout:120000,maxBuffer:FRAME_BYTES*FPS*(MAX_DURATION+4)});
  if(rgb.length%FRAME_BYTES!==0||rgb.length<FRAME_BYTES*FPS*60)
    throw Error('truncated native visual sample');
  const scores=[];
  for(let i=0;i<rgb.length;i+=FRAME_BYTES)
    scores.push(violetSceneFraction(rgb.subarray(i,i+FRAME_BYTES)));
  const observed=findSustainedVoidPhase(scores);
  const result={schemaVersion:1,sourceSha:expectedSha,viewport,scenario:'danger',
    originalWebMSha256:hash,originalWebMBytes:data.length,
    originalVideoUnmodified:true,method:'sampled-native-WebM-stage-chroma',
    phase:compareFilmPhaseToSource(clock,observed,scores.length)};
  fs.writeFileSync(path.join(dir,'native-scene-phase.json'),JSON.stringify(result,null,2)+'\n');
  return result;
}
if(require.main===module){
  const [dir,sha]=process.argv.slice(2);
  if(!dir||!SOURCE_SHA.test(sha||'')){
    console.error('Usage: node scripts/tower-native-scene-phase.cjs <danger-dir> <immutable-source-sha>');
    process.exitCode=2;
  }else try{
    const results=['desktop','portrait'].map(view=>inspectOriginalPhase(dir,view,sha));
    console.log(JSON.stringify(results.map(({viewport,phase})=>({viewport,...phase})),null,2));
  }catch(e){console.error('Original film phase unverified:',e.message);process.exitCode=1;}
}
module.exports={violetSceneFraction,findSustainedVoidPhase,compareFilmPhaseToSource,inspectOriginalPhase,WIDTH,HEIGHT,FRAME_BYTES};
