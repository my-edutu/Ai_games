'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {violetSceneFraction,findSustainedVoidPhase,compareFilmPhaseToSource,FRAME_BYTES}=require('../../scripts/tower-native-scene-phase.cjs');
const frame=(r,g,b)=>{const buffer=Buffer.alloc(FRAME_BYTES);for(let i=0;i<buffer.length;i+=3){buffer[i]=r;buffer[i+1]=g;buffer[i+2]=b;}return buffer;};
test('native chroma observes scene, not any HUD digit or floor state',()=>{
  assert.ok(violetSceneFraction(frame(80,38,110))>.9);
  assert.ok(violetSceneFraction(frame(170,150,125))<.01);
  assert.ok(Number.isNaN(violetSceneFraction(Buffer.alloc(42))));
});
test('stage transition requires genuinely sustained cool film after warm scene',()=>{
  const warm=Array(80).fill(.02),cool=Array(80).fill(.45);
  assert.equal(findSustainedVoidPhase([...warm,...cool]).nativeSeconds,20);
  assert.equal(findSustainedVoidPhase([...warm,.5,...warm,...cool]).nativeSeconds,40.25);
  assert.equal(findSustainedVoidPhase([...warm,.5,...warm]),null);
});
test('first real chromatic transition survives a partially violet physical doorway bridge',()=>{
  // 1x original portrait film reaches its first F9 HUD at 25.25s, but the
  // warm bronze cap and incoming violet world overlap for >1s. A detector
  // requiring the IMMEDIATELY preceding 3s to be solid warm incorrectly
  // reports the next episode around 67s instead of the first arrival.
  const warm=Array(100).fill(.02),transition=Array(5).fill(.14),
    cool=Array(36).fill(.45),restart=Array(110).fill(.02);
  const observed=findSustainedVoidPhase([
    ...warm,...transition,...cool,...restart,...transition,...cool]);
  assert.equal(observed.nativeSeconds,26.25);
  assert.ok(observed.warmToCoolBridgeSeconds>=1.25);
  assert.ok(observed.beforeMean<.08);
  assert.equal(findSustainedVoidPhase([
    ...warm,...transition,.4,.4,...restart]),null);
});

test('true source observation over two seconds ahead of native palette is a cue veto, not a fake visual proof',()=>{
  const clock={sourceEventTimecodes:[{kind:'floor-transition',fromFloor:8,toFloor:9,observedEpisode:0,
    inOriginalVideo:true,nativeVideoSeconds:23.1,sourceTick:451}]};
  const phase=compareFilmPhaseToSource(clock,{nativeSeconds:25.5,precisionSeconds:.25},290);
  assert.equal(phase.status,'SOURCE_CUE_AND_VISIBLE_PHASE_DISAGREE');
  assert.equal(phase.eventPixelsConfirmed,false);
  assert.equal(phase.videoPhaseIsFloorProof,false);
  assert.equal(phase.sourceToVioletPhaseDeltaSeconds,2.4);
  assert.equal(compareFilmPhaseToSource(clock,null,290).status,'NOT EVALUATED');
  assert.equal(compareFilmPhaseToSource({sourceEventTimecodes:[]},{nativeSeconds:25.5},290).status,'NOT EVALUATED');
});

test('real source acceptance, Three return and original HUD pixels remain three separate clocks',()=>{
  const {sourceToOriginalNativePhaseChain}=require('../../scripts/tower-native-scene-phase.cjs');
  const sha='f'.repeat(40), videoHash='a'.repeat(64);
  const clock={sourceSha:sha,scenario:'danger',status:'CALIBRATED',
    originalWebMSha256:videoHash,
    calibration:{status:'CALIBRATED',anchorTimeline:[
      {wallAtMs:1000,videoPtsSeconds:5,captureSpanMs:0},
      {wallAtMs:2000,videoPtsSeconds:6,captureSpanMs:0}]},
    sourceEventTimecodes:[{kind:'floor-transition',fromFloor:8,toFloor:9,observedEpisode:0,
      sourceTick:451,observedRunToken:'same-run',atMs:1000,
      nativeVideoSeconds:5,inOriginalVideo:true,clockUncertaintyMs:200}]};
  const motion={sourceSha:sha,scenario:'danger',
    sourceToPresentationTrace:{observed:[
      {phase:'browser-accepted',floor:9,runToken:'same-run',tick:452,atWallMs:1150},
      {phase:'renderer-submitted',floor:9,runToken:'same-run',tick:452,atWallMs:1750}]}};
  const native={sourceSha:sha,originalWebMSha256:videoHash,
    hud:{visibleHudFloorChange:{nativeVideoSeconds:6.2,
      observedDigitBefore:8,observedDigitAfter:9,precisionSeconds:.25}}};
  const proof=sourceToOriginalNativePhaseChain(motion,clock,native);
  assert.equal(proof.status,'CLOCKS_TRIANGULATED_DIAGNOSTIC_ONLY');
  assert.equal(proof.sourceToBrowserAcceptedMs,150);
  assert.equal(proof.browserAcceptedToRendererReturnMs,600);
  assert.equal(proof.rendererReturnApproxNativeSeconds,5.75);
  assert.equal(proof.rendererReturnToDrawnHudApproxMs,450);
  assert.equal(proof.sourceEventToDrawnHudApproxMs,1200);
  assert.equal(proof.sourceTick,451);
  assert.equal(proof.qualityAccepted,false);
  assert.equal(proof.physicalCrossingProven,false);
  assert.equal(proof.actualDeviceGpuFrameTimeProven,false);
});
test('missing, changed-episode, partial and non-pixel evidence cannot certify a source to video phase chain',()=>{
  const {sourceToOriginalNativePhaseChain}=require('../../scripts/tower-native-scene-phase.cjs');
  const sha='f'.repeat(40), videoHash='a'.repeat(64);
  const baseClock={sourceSha:sha,status:'CALIBRATED',originalWebMSha256:videoHash,
    calibration:{status:'CALIBRATED',anchorTimeline:[
      {wallAtMs:1000,videoPtsSeconds:5},{wallAtMs:2000,videoPtsSeconds:6}]},
    sourceEventTimecodes:[{kind:'floor-transition',fromFloor:8,toFloor:9,
      observedEpisode:0,observedRunToken:'real',sourceTick:451,atMs:1000,
      nativeVideoSeconds:5,inOriginalVideo:true}]};
  const trace={sourceSha:sha,sourceToPresentationTrace:{observed:[
    {phase:'browser-accepted',floor:9,runToken:'real',tick:451,atWallMs:1200},
    {phase:'renderer-submitted',floor:9,runToken:'real',tick:451,atWallMs:1700}]}};
  const native={sourceSha:sha,originalWebMSha256:videoHash,
    hud:{visibleHudFloorChange:{nativeVideoSeconds:6.25,observedDigitBefore:8,
      observedDigitAfter:9}}};
  const inputs=[
    [null,baseClock,native],
    [trace,{...baseClock,status:'PARTIALLY_CALIBRATED'},native],
    [trace,baseClock,{...native,originalWebMSha256:'b'.repeat(64)}],
    [trace,baseClock,{...native,hud:{}}],
    [{...trace,sourceToPresentationTrace:{observed:trace.sourceToPresentationTrace.observed.map(
      e=>({...e,runToken:'different-run'}))}},baseClock,native],
    [trace,{...baseClock,calibration:{status:'CALIBRATED',anchorTimeline:[
      {wallAtMs:1000,videoPtsSeconds:5},{wallAtMs:2000,videoPtsSeconds:4}]}},native]
  ];
  for(const args of inputs){
    const diagnostic=sourceToOriginalNativePhaseChain(...args);
    assert.equal(diagnostic.status,'NOT EVALUATED');
    assert.equal(diagnostic.qualityAccepted,false);
    assert.equal(diagnostic.physicalCrossingProven,false);
    assert.equal(diagnostic.browserAcceptedToRendererReturnMs,undefined);
  }
});
