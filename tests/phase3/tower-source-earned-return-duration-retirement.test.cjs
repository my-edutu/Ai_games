'use strict';
const { test }=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const target='../../public/infinite-tower-climb/visuals/original-clockwork-architecture-palette.mjs';
test('genuine returned WebGL elapsed time, not eight rapid submissions, owns the source-earned Floor9 material transition',async()=>{
  const {advanceSourceEarnedPaletteReturn}=await import(target);
  let step={returnedFrames:0,returnedSeconds:0};
  for(let i=0;i<8;i++)step=advanceSourceEarnedPaletteReturn(step,.025);
  assert.equal(step.returnedFrames,8);
  assert.ok(step.returnedSeconds>=.199 && step.returnedSeconds<=.201);
  assert.ok(step.progress<.25,'eight fast submits cannot turn the entire source-certified bronze gateway world violet');
  for(let i=0;i<40;i++)step=advanceSourceEarnedPaletteReturn(step,.025);
  assert.ok(step.returnedSeconds>=.949);
  assert.equal(step.progress,1,'a genuinely displayed returned-time interval finishes original material retirement');
  assert.equal(advanceSourceEarnedPaletteReturn(step,-1),null,'never accept negative returned time');
  assert.equal(advanceSourceEarnedPaletteReturn(step,Infinity),null,'never accept infinite returned time');
});
test('material history stays same-run and proof-bounded after fast returns; restart and stale source cannot resurrect it',async()=>{
  const {observedVerifiedClockworkPaletteTail}=await import(target);
  const source={runToken:'earned',floor:9,theme:'void',lifecycle:'running',tick:535,player:{health:5}};
  const proof={runToken:'earned',sourceTick:535,crossingTick:475,kind:'recorded-source-zero-hp'};
  const held={runToken:'earned',retiring:true,retirementFrames:8,retirementSeconds:.2,lastVerifiedProof:proof};
  const tail=observedVerifiedClockworkPaletteTail(source,held,.21);
  assert.equal(tail?.historicalOpticalTail,true);
  assert.ok(tail.oldWeight>.75,'not instant violet after eight short WebGL returns');
  assert.equal(observedVerifiedClockworkPaletteTail(source,{...held,retirementFrames:45,retirementSeconds:1},1),null);
  assert.equal(observedVerifiedClockworkPaletteTail({...source,runToken:'restart'},held,.2),null);
  assert.equal(observedVerifiedClockworkPaletteTail({...source,tick:636},held,.2),null,'expired source passage must not be turned into a new world');
});
test('real Tower scene uses the same returned-duration transition for all existing source-owned material channels',()=>{
  const world=fs.readFileSync('public/infinite-tower-climb/visuals/world.mjs','utf8');
  assert.match(world,/bearingHandoff\.retirementSeconds=/);
  assert.match(world,/advanceSourceEarnedPaletteReturn\(/);
  assert.match(world,/handoff\.retirementSeconds\s*\/\s*\.95/);
  assert.match(world,/const materialProof=livePaletteProof\?\?\(oldRoomWitness\?/,
    'source-certified material proof must be shared across all original-world channels');
  assert.match(world,/updateOriginalClockworkSuccessorRoute\(arrivalRoutePalette,\s*sourceAlignedMaterialProof,opticalTail\)/);
  assert.match(world,/originalClockworkArchitecturalPalette\.update\(sourceAlignedMaterialProof,opticalTail\)/);
  assert.ok(world.includes('const returnedBronzePaletteLock=!options.stale && !options.reducedMotion') &&
    world.includes('observedReturnedOriginalArchitectureHold(') &&
    world.includes('const oldRoomWitness=farSideHorizon || returnedBronzePaletteLock'),
    'original returned GPU room must be shared by true near-roof and raised far-side source support');
  assert.ok(world.includes('const sourceAlignedMaterialProof=returnedBronzePaletteLock?{'),
    'all pre-return material channels must share the authorized returned-bronze proof');
  assert.ok(world.includes('if(sourceEarnedBearingPalette) {'));
  assert.doesNotMatch(world,/snapshot\.player\.x\s*=/);
});
