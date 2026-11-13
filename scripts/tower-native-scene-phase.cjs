'use strict';
// P0 read-only ORIGINAL-WebM visual stage witness. Source timestamps are NOT
// rendered event pixels. This original-film chroma observation cannot prove
// the HUD floor, guardian defeat, threshold contact, or video quality.
const fs=require('node:fs'),path=require('node:path');
const {createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {sampleOriginalHud,compareHudToSource}=require('./tower-native-hud-floor.cjs');
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
    const future=scores.slice(i,i+cool);
    if(!future.every(x=>Number.isFinite(x)&&x>=min))continue;
    // A legitimate cold-floor arrival may spend 0.5–2s in a partially
    // bronze / partially violet palette. The immediate preceding 3s would
    // therefore be MIXED rather than cold, and an adjacent-warm-only search
    // wrongly selected a second run's 8->9 transition ~40s later. Confirm a
    // real sustained warm scene BEFORE the bounded mixed-color bridge; never
    // infer a floor from chroma alone or accept an earlier violet interval.
    for(let bridge=0;bridge<=Math.ceil(2*fps);bridge++){
      const start=i-bridge-warm,end=i-bridge;
      if(start<0)break;
      const past=scores.slice(start,end);
      const intermediate=scores.slice(end,i);
      if(!past.every(Number.isFinite)||
         past.reduce((a,b)=>a+b,0)/past.length>=.08||
         past.filter(x=>x<.12).length<Math.ceil(warm*.66)||
         !intermediate.every(x=>Number.isFinite(x)&&x<min))continue;
      return {nativeSeconds:i/fps,precisionSeconds:1/fps,
        warmToCoolBridgeSeconds:bridge/fps,
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

// P0: independently measured clocks, NOT an estimate of GPU presentation.
// Uses the ORIGINAL unmodified WebM's native PTS calibration and actual
// drawn 8->9 HUD glyph; accepts neither a source-only milestone nor a purple
// palette as evidence of physical passage. Diagnostic has NO passing verdict.
function sourceToOriginalNativePhaseChain(motion,clock,film) {
  const unknown={status:'NOT EVALUATED',qualityAccepted:false,
    physicalCrossingProven:false,actualDeviceGpuFrameTimeProven:false};
  if (!motion || !clock || !film ||
      !SOURCE_SHA.test(clock.sourceSha||'') ||
      motion.sourceSha!==clock.sourceSha ||
      film.sourceSha!==clock.sourceSha ||
      clock.scenario!=='danger' ||
      clock.status!=='CALIBRATED' ||
      clock.calibration?.status!=='CALIBRATED' ||
      !HASH.test(clock.originalWebMSha256||'') ||
      film.originalWebMSha256!==clock.originalWebMSha256)
    return unknown;
  const source=(clock.sourceEventTimecodes||[]).find(e=>
    e.kind==='floor-transition' && e.fromFloor===8 && e.toFloor===9 &&
    e.observedEpisode===0 && e.inOriginalVideo===true &&
    Number.isSafeInteger(e.sourceTick) && Number.isFinite(e.atMs) &&
    Number.isFinite(e.nativeVideoSeconds) &&
    typeof e.observedRunToken==='string' && !!e.observedRunToken);
  const changed=film.hud?.visibleHudFloorChange;
  const observed=motion.sourceToPresentationTrace?.observed;
  if(!source || !changed || changed.observedDigitBefore!==8 ||
     changed.observedDigitAfter!==9 ||
     !Number.isFinite(changed.nativeVideoSeconds) ||
     !Array.isArray(observed))return unknown;
  const accepted=observed.find(e=>e.phase==='browser-accepted' &&
    e.runToken===source.observedRunToken && e.floor===9 &&
    Number.isSafeInteger(e.tick) && e.tick>=source.sourceTick &&
    Number.isFinite(e.atWallMs) && e.atWallMs>=source.atMs);
  const rendered=accepted && observed.find(e=>e.phase==='renderer-submitted' &&
    e.runToken===source.observedRunToken && e.floor===9 &&
    Number.isSafeInteger(e.tick) && e.tick>=accepted.tick &&
    Number.isFinite(e.atWallMs) && e.atWallMs>=accepted.atWallMs);
  if(!rendered)return unknown;
  const samples=clock.calibration.anchorTimeline;
  if(!Array.isArray(samples)||samples.length<2)return unknown;
  // Never extrapolate or silently bridge an uncalibrated video-clock gap.
  // Pre-existing segmented/partially-calibrated films are vetoed above.
  let videoAtRender=null;
  for(let i=1;i<samples.length;i++){
    const before=samples[i-1],after=samples[i];
    if(!Number.isFinite(before.wallAtMs)||
       !Number.isFinite(after.wallAtMs)||
       !Number.isFinite(before.videoPtsSeconds)||
       !Number.isFinite(after.videoPtsSeconds)||
       !(after.wallAtMs>before.wallAtMs) ||
       !(after.videoPtsSeconds>before.videoPtsSeconds))
      return unknown;
    if(rendered.atWallMs>=before.wallAtMs &&
       rendered.atWallMs<=after.wallAtMs){
      const t=(rendered.atWallMs-before.wallAtMs)/
        (after.wallAtMs-before.wallAtMs);
      videoAtRender=before.videoPtsSeconds+
        t*(after.videoPtsSeconds-before.videoPtsSeconds);
    }
  }
  if(!Number.isFinite(videoAtRender))return unknown;
  const sourceToBrowser=accepted.atWallMs-source.atMs;
  const browserToRenderer=rendered.atWallMs-accepted.atWallMs;
  const renderToNative=(changed.nativeVideoSeconds-videoAtRender)*1000;
  const eventToNative=(changed.nativeVideoSeconds-source.nativeVideoSeconds)*1000;
  // A supposed native HUD paint before renderer return is a disputed clock,
  // not negative GPU latency and NEVER a justification to retime original film.
  if(sourceToBrowser<0 || browserToRenderer<0 ||
     sourceToBrowser>30000 || browserToRenderer>30000 ||
     renderToNative<-(250+Math.max(0,changed.precisionSeconds||0)*1000))
    return unknown;
  const round=value=>Math.round(value*1000)/1000;
  return {
    status:'CLOCKS_TRIANGULATED_DIAGNOSTIC_ONLY',
    qualityAccepted:false,physicalCrossingProven:false,
    actualDeviceGpuFrameTimeProven:false,
    runToken:source.observedRunToken,sourceTick:source.sourceTick,
    firstBrowserTick:accepted.tick,firstRendererTick:rendered.tick,
    sourceToBrowserAcceptedMs:round(sourceToBrowser),
    browserAcceptedToRendererReturnMs:round(browserToRenderer),
    rendererReturnApproxNativeSeconds:round(videoAtRender),
    rendererReturnToDrawnHudApproxMs:round(renderToNative),
    sourceEventToDrawnHudApproxMs:round(eventToNative),
    videoHash:clock.originalWebMSha256,
    clocks:'source observed, browser accepted, Three render returned, original WebM drawn HUD',
    uncertainty:'native anchor matching and HUD sample precision; not GPU/display timing',
    caveat:'An observed Floor 9 glyph is NOT a witnessed physical crossing, a visible guardian hit, actual-device frame rate, or blind acceptance.'
  };
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
  const nativeHud=sampleOriginalHud(video);
  const result={schemaVersion:1,sourceSha:expectedSha,viewport,scenario:'danger',
    originalWebMSha256:hash,originalWebMBytes:data.length,
    originalVideoUnmodified:true,method:'sampled-native-WebM-stage-chroma',
    phase:compareFilmPhaseToSource(clock,observed,scores.length),
    hud:{...compareHudToSource(clock,nativeHud.observed,nativeHud.frames),
      recognitionCounts:nativeHud.counts}};
  // An original native-video floor glyph, the browser receive clock and the
  // returned WebGL call remain distinct. Missing sidecars never become a PASS.
  let motion=null;
  try{motion=JSON.parse(fs.readFileSync(path.join(dir,'motion.json'),'utf8'));}catch{}
  result.presentationChain=sourceToOriginalNativePhaseChain(motion,clock,result);
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
    console.log(JSON.stringify(results.map(({viewport,phase,hud})=>({viewport,phase,hud})),null,2));
  }catch(e){console.error('Original film phase unverified:',e.message);process.exitCode=1;}
}
module.exports={violetSceneFraction,findSustainedVoidPhase,compareFilmPhaseToSource,sourceToOriginalNativePhaseChain,inspectOriginalPhase,WIDTH,HEIGHT,FRAME_BYTES};
