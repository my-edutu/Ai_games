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
