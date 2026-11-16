'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const palette=import('../../public/infinite-tower-climb/visuals/original-clockwork-architecture-palette.mjs');
class Color {
  constructor(hex){this.set(hex)}
  // Match the Three.Color API consumed by the ORIGINAL production palette:
  // clone().set(hex) must return the mutable Color instance, not a bare hex.
  set(hex){this.r=(hex>>16)&255;this.g=(hex>>8)&255;this.b=hex&255;return this}
  clone(){return Object.assign(Object.create(Color.prototype),this)}
  copy(c){this.r=c.r;this.g=c.g;this.b=c.b;return this}
  lerp(c,w){this.r+=w*(c.r-this.r);this.g+=w*(c.g-this.g);this.b+=w*(c.b-this.b);return this}
  equals(c){return Math.abs(this.r-c.r)<1e-6&&Math.abs(this.g-c.g)<1e-6&&Math.abs(this.b-c.b)<1e-6}
}
const bronze={stone:0xae814d,dark:0x4c3829,metal:0xb78d50,edge:0xe0b27a,landing:0xb59367};
const source={runToken:'authentic-tower-episode',floor:9,theme:'void',
  lifecycle:'running',tick:563,player:{health:4}};
const certificate={runToken:source.runToken,sourceTick:535,
  crossingTick:475,kind:'recorded-source-zero-hp'};
function handoff(returnedFrames,returnedSeconds=returnedFrames*.075){
  return {runToken:source.runToken,lastVerifiedProof:certificate,
    retiring:true,retirementFrames:returnedFrames,retirementSeconds:returnedSeconds};
}
function fixture(){
  const materials={stone:{color:new Color(0x413850)},metal:{color:new Color(0x605779)}};
  const deck={bronze:new Color(0xb78d50),top:{color:new Color(0x625d8d)},
    body:{color:new Color(0x51496e)},rim:{color:new Color(0x897b9b)}};
  deck.topVoid=deck.top.color.clone();deck.bodyVoid=deck.body.color.clone();
  deck.rimVoid=deck.rim.color.clone();
  return {materials,deck};
}

test('the same previously verified Floor8->9 source crossing retires roof, monumental architecture and bearing palette over returned frames, never an instant violet cut',async()=>{
  const {observedVerifiedClockworkPaletteTail,createOriginalClockworkArchitecturalPalette,
    updateOriginalClockworkSuccessorRoute}=await palette;
  const {materials,deck}=fixture();
  const bridge=createOriginalClockworkArchitecturalPalette(materials,bronze);
  const originalStone=materials.stone.color.clone();
  // Historical bronze must have been painted at least once. An unpublished
  // source crossing cannot impersonate a GPU-retained color frame.
  assert.equal(observedVerifiedClockworkPaletteTail(source,handoff(0,0),0),null);
  assert.equal(observedVerifiedClockworkPaletteTail(source,handoff(1,.11),0),null,
    'one returned frame cannot certify more than 100ms of actual display');
  let tail=observedVerifiedClockworkPaletteTail(source,handoff(1,.06),0);
  assert.equal(tail.historicalOpticalTail,true);
  assert.equal(tail.sourceBound,undefined,'past source proof is optical history, not current gameplay authority');
  assert.equal(tail.authenticatedSourceTick,535);
  assert.equal(bridge.update(null,tail).sourceBound,false);
  assert.equal(updateOriginalClockworkSuccessorRoute(deck,null,tail).sourceBound,false);
  assert.ok(materials.stone.color.equals(new Color(bronze.stone)));
  assert.ok(deck.top.color.equals(deck.bronze));
  tail=observedVerifiedClockworkPaletteTail({...source,tick:570},handoff(4),.5);
  bridge.update(null,tail);updateOriginalClockworkSuccessorRoute(deck,null,tail);
  assert.ok(!materials.stone.color.equals(originalStone));
  assert.ok(!materials.stone.color.equals(new Color(bronze.stone)));
  assert.ok(!deck.top.color.equals(deck.topVoid));
  assert.ok(!deck.top.color.equals(deck.bronze));
  tail=observedVerifiedClockworkPaletteTail(source,handoff(12,1),1);
  assert.equal(tail,null,'at least five real returns and 0.95 returned seconds end the material memory');
  bridge.update(null,tail);updateOriginalClockworkSuccessorRoute(deck,null,tail);
  assert.ok(materials.stone.color.equals(originalStone));
  assert.ok(deck.top.color.equals(deck.topVoid));
});

test('a missing, mismatched, dying, stale or not-yet-certified source cannot keep bronze during successor palette retirement',async()=>{
  const {observedVerifiedClockworkPaletteTail:sample}=await palette;
  const h=handoff(2);
  assert.equal(sample(source,{...h,lastVerifiedProof:null},.3),null);
  assert.equal(sample(source,{...h,retiring:false},.3),null);
  assert.equal(sample({...source,runToken:'other-expedition'},h,.3),null);
  assert.equal(sample({...source,floor:10},h,.3),null);
  assert.equal(sample({...source,lifecycle:'outcome'},h,.3),null);
  assert.equal(sample({...source,player:{health:0}},h,.3),null);
  assert.equal(sample({...source,tick:534},h,.3),null);
  assert.equal(sample(source,{...h,lastVerifiedProof:{...certificate,kind:'uncertified'}},.3),null);
  assert.equal(sample(source,{...h,lastVerifiedProof:{...certificate,crossingTick:999}},.3),null);
  assert.equal(sample(source,h,NaN),null);
  assert.equal(sample(source,h,-.1),null);
  assert.equal(sample(source,h,1.1),null);
  assert.equal(sample(source,handoff(12,1),1),null);
});

test('Tower World coordinates real returned-frame retirement for original F9 deck and architecture, not just persistent gallery',()=>{
  const world=fs.readFileSync('public/infinite-tower-climb/visuals/world.mjs','utf8');
  assert.match(world,/observedVerifiedClockworkPaletteTail\(snapshot,handoff,departure\)/);
  assert.ok(/updateOriginalClockworkSuccessorRoute\(arrivalRoutePalette,\s*sourceAlignedMaterialProof,opticalTail\)/.test(world),
    'live World must synchronize the real route using its current verified material proof');
  assert.ok(/const materialProof=livePaletteProof\?\?\(farSideHorizon\?/.test(world),
    'far-side palette cannot be attributed to a floor label without authenticated crossing');
  assert.match(world,/originalClockworkArchitecturalPalette\.update\(sourceAlignedMaterialProof,opticalTail\)/,
    'the persistent original architecture must follow the same verified far-side palette proof as the successor route');
  assert.ok(world.includes('const returnedBronzePaletteLock=farSideHorizon') &&
    world.includes('observedReturnedOriginalArchitectureHold('),
    'only real source-supported living far-side body and returned bronze GPU owner may hold the original shared room');
  assert.ok(world.includes('const sourceAlignedMaterialProof=returnedBronzePaletteLock?{'),
    'a genuine missing incoming shader return must keep the route and architecture bronze together');
  assert.match(world,/advanceSourceEarnedPaletteReturn/);
  assert.match(world,/bearingHandoff\.retirementSeconds=next\.returnedSeconds/);
  assert.doesNotMatch(world,/snapshot\.floor\s*=\s*9/);
});
