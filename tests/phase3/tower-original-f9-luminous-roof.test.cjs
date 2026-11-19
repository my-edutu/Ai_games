'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const helper = import('../../public/infinite-tower-climb/visuals/original-clockwork-architecture-palette.mjs');

// Renderer-independent, channel-complete color witness. It tests the same
// source-driven GPU material contract used by the actual first Floor 9 roof.
class Color {
  constructor(value) { this.value = value; }
  clone() { return new Color(this.value); }
  copy(other) { this.value = other.value; return this; }
  lerp(other, alpha) {
    this.value += (other.value - this.value) * alpha;
    return this;
  }
}
function material(color, emissive = null) {
  return {color:new Color(color),emissive:emissive == null ? null:new Color(emissive)};
}
function roof() {
  return {
    bronze:new Color(100), top:material(10), topVoid:new Color(10),
    body:material(20), bodyVoid:new Color(20),
    rim:material(30), rimVoid:new Color(30),
    glow:material(40,41), glowVoid:new Color(40),
    glowEmissiveVoid:new Color(41), glowWarm:new Color(120),
    crystal:material(50,51), crystalVoid:new Color(50),
    crystalEmissiveVoid:new Color(51), crystalWarm:new Color(110),
    crystalEmissiveWarm:new Color(105),
  };
}
const physical = {sourceBound:true,kind:'recorded-source-zero-hp',
  sourceTick:475,crossingTick:475,oldWeight:1};

test('the FULL actual F9 receiving roof, including luminous rim and decorative undercroft, stays Clockwork-warm at the opened gate',async()=>{
  const {updateOriginalClockworkSuccessorRoute:update}=await helper;
  const deck=roof();
  const observation=update(deck,physical);
  assert.equal(observation.sourceBound,true);
  assert.equal(observation.oldWeight,1);
  for(const [label,actual,expected] of [
    ['top',deck.top.color.value,100],['body',deck.body.color.value,100],
    ['rim',deck.rim.color.value,100],['glow',deck.glow.color.value,120],
    ['glow emissive',deck.glow.emissive.value,120],
    ['crystal',deck.crystal.color.value,110],
    ['crystal emissive',deck.crystal.emissive.value,105]
  ])assert.equal(actual,expected,label);
});

test('genuine source-earned departure is monotone and brings ALL shared roof material channels into the exact Void material state',async()=>{
  const {updateOriginalClockworkSuccessorRoute:update}=await helper;
  const deck=roof();
  update(deck,physical);
  update(deck,{...physical,sourceTick:498,oldWeight:.5});
  for(const [name,actual,expected] of [
    ['top',deck.top.color.value,55],['body',deck.body.color.value,60],
    ['rim',deck.rim.color.value,65],['glow',deck.glow.color.value,80],
    ['glow emissive',deck.glow.emissive.value,80.5],
    ['crystal',deck.crystal.color.value,80],
    ['crystal emissive',deck.crystal.emissive.value,78],
  ])assert.equal(actual,expected,name);
  update(deck,{...physical,sourceTick:508,oldWeight:0});
  for(const [name,actual,expected] of [
    ['top',deck.top.color.value,10],['body',deck.body.color.value,20],
    ['rim',deck.rim.color.value,30],['glow',deck.glow.color.value,40],
    ['glow emissive',deck.glow.emissive.value,41],
    ['crystal',deck.crystal.color.value,50],
    ['crystal emissive',deck.crystal.emissive.value,51],
  ])assert.equal(actual,expected,name);
});

test('no invalid crossing may retain a warm emitting floor or a false bronze arrival',async()=>{
  const {updateOriginalClockworkSuccessorRoute:update}=await helper;
  for(const forged of [
    null,{...physical,sourceBound:false},
    {...physical,kind:'HUD-floor-nine-only'},
    {...physical,sourceTick:NaN},
    {...physical,oldWeight:Infinity},
    {...physical,oldWeight:-.1},
  ]){
    const deck=roof();update(deck,physical);
    const result=update(deck,forged);
    assert.equal(result.oldWeight,0);
    assert.equal(deck.glow.emissive.value,41);
    assert.equal(deck.crystal.emissive.value,51);
  }
});

test('the actual world isolates only true F9 ground luminous architecture, never active hazard/raised decks or floor simulation',()=>{
  const source=fs.readFileSync('public/infinite-tower-climb/visuals/world.mjs','utf8');
  assert.match(source,/const sharedPhysicalRoof=theme==='void'/);
  assert.match(source,/observedOriginalClockworkSuccessorDeck\(p,retainedEarnedCap,sourceRunToken\)/);
  assert.match(source,/const glow=materials\.glow\.clone\(\)/);
  assert.match(source,/const crystal=materials\.crystal\.clone\(\)/);
  assert.match(source,/sharedPhysicalRoof\?arrivalRoutePalette\.glow:materials\.glow/);
  assert.match(source,/sharedPhysicalRoof\?arrivalRoutePalette\.crystal:materials\.crystal/);
  assert.match(source,/updateOriginalClockworkSuccessorRoute\(arrivalRoutePalette,/);
  assert.doesNotMatch(source,/snapshot\.player\.(?:x|y|grounded|health)\s*=/);
});
