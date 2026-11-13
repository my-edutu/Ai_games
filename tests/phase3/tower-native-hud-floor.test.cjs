'use strict';
const test=require('node:test'), assert=require('node:assert/strict');
const {recognizeFloorGlyph,findVisibleEightToNine,compareHudToSource,W,H,FRAME_BYTES}=require('../../scripts/tower-native-hud-floor.cjs');
function glyph(holes){
  const frame=Buffer.alloc(FRAME_BYTES,55);
  // Synthetic counter-shapes test only the math, never gameplay or review.
  for(let y=40;y<=73;y++)for(let x=20;x<=42;x++){
    const centerTop=x>=25&&x<=37&&y>=45&&y<=52;
    const centerBottom=x>=25&&x<=37&&y>=60&&y<=67;
    const drawn=!centerTop&&(!centerBottom||holes!==2);
    if(!drawn)continue;
    const i=(y*W+x)*3;frame.fill(233,i,i+3);
  }
  return frame;
}
test('extract original HUD 8 and 9 white connected counter shapes, not backdrop',()=>{
  assert.equal(recognizeFloorGlyph(glyph(2)).digit,8);
  assert.equal(recognizeFloorGlyph(glyph(1)).digit,9);
  assert.equal(recognizeFloorGlyph(Buffer.alloc(FRAME_BYTES,45)).digit,null);
  assert.equal(recognizeFloorGlyph(Buffer.alloc(8)).digit,null);
});
test('sustained visible 8 before sustained 9, not one-frame noise',()=>{
  const sequence=[...Array(80).fill(8),9,...Array(13).fill(8),...Array(20).fill(9)];
  assert.equal(findVisibleEightToNine(sequence)?.nativeVideoSeconds,23.5);
  assert.equal(findVisibleEightToNine([...Array(90).fill(8),9,...Array(8).fill(8)]),null);
  assert.equal(findVisibleEightToNine([...Array(4).fill(8),...Array(10).fill(9)]),null);
  assert.equal(findVisibleEightToNine([8,9]),null);
});
test('first real episode survives one isolated portrait 9-shaped glyph obstruction',()=>{
  // A true 2026-11-13 portrait original WebM had a 9-shaped noisy sample
  // at 22.25s, the first honest 8->9 at 25.25s, and a second real
  // 8->9 after a run restart at 66.75s. The old zero-stray rule returned
  // ONLY the later event, incorrectly reporting a 42.9s source/video delay.
  const digits=Array(293).fill(null);
  digits.fill(8,0,101);
  digits[89]=9; // one isolated earlier observation, not a genuine crossing
  digits.fill(9,101,145);
  digits.fill(8,145,267);
  digits.fill(9,267);
  const observed=findVisibleEightToNine(digits);
  assert.equal(observed.nativeVideoSeconds,25.25);
  assert.equal(observed.precedingEightFrames,11);
  const rejected=digits.slice();
  rejected[90]=9; // two consecutive nines remain inside the actual 12-sample pre-window
  assert.equal(findVisibleEightToNine(rejected).nativeVideoSeconds,66.75);
  const polluted=digits.slice();
  polluted[96]=9; // two nonadjacent ghosts inside the same pre-window must be rejected
  assert.equal(findVisibleEightToNine(polluted).nativeVideoSeconds,66.75);
});

test('independent original-HUD observation vetoes miscuing without invented game event',()=>{
  const clock={sourceEventTimecodes:[{kind:'floor-transition',fromFloor:8,toFloor:9,
    observedEpisode:0,inOriginalVideo:true,nativeVideoSeconds:23.1065,sourceTick:451}]};
  const hud={nativeVideoSeconds:25.5,precisionSeconds:.25,observedDigitBefore:8,observedDigitAfter:9};
  const report=compareHudToSource(clock,hud,291);
  assert.equal(report.status,'SOURCE_CUE_AND_DRAWN_HUD_DISAGREE');
  assert.equal(report.sourceSearchToDrawnHudDeltaSeconds,2.393);
  assert.equal(report.sourceEventIsScreenProof,false);
  assert.equal(report.hudGlyphIsPhysicalCrossingProof,false);
  assert.equal(report.guardianDefeatPixelsConfirmed,false);
  assert.equal(compareHudToSource(clock,null,291).status,'NOT EVALUATED');
  assert.equal(compareHudToSource({sourceEventTimecodes:[]},hud,291).status,'NOT EVALUATED');
  assert.equal(compareHudToSource({sourceEventTimecodes:[...clock.sourceEventTimecodes,...clock.sourceEventTimecodes]},hud,291).status,'NOT EVALUATED');
});
