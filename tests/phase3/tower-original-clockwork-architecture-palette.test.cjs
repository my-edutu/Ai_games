'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const palette=import('../../public/infinite-tower-climb/visuals/original-clockwork-architecture-palette.mjs');
class Color {
  constructor(hex=0){this.set(hex)}
  set(hex){this.r=(hex>>16)&255;this.g=(hex>>8)&255;this.b=hex&255;return this}
  clone(){return Object.assign(new Color(),this)}
  copy(c){this.r=c.r;this.g=c.g;this.b=c.b;return this}
  lerp(c,w){this.r+=w*(c.r-this.r);this.g+=w*(c.g-this.g);
    this.b+=w*(c.b-this.b);return this}
  equals(c){return Math.abs(this.r-c.r)<1e-8 &&
    Math.abs(this.g-c.g)<1e-8 && Math.abs(this.b-c.b)<1e-8}
}
const bronze={stone:0x625e51,dark:0x25323b,metal:0xa06a35,
  edge:0xb8a47d,landing:0x8e8269};
const voidPalette={stone:0x514963,dark:0x28233c,metal:0x6a577e,
  edge:0xb3a3c9,landing:0x726982};
const keys={stone:'stone',dark:'dark',metal:'metal',copper:'metal',
  edge:'edge',landing:'landing',tread:'dark',ceramic:'stone'};
function fixture(){
  const materials={};
  for(const [key,tint] of Object.entries(keys))
    materials[key]={color:new Color(voidPalette[tint])};
  // These are actual semantic visibility constraints: warning, crystals and
  // combat/material tells must remain wholly untouched by this palette.
  for(const key of ['warning','glow','electric','crystal','fire','hot'])
    materials[key]={color:new Color(0xfa55cc)};
  return materials;
}
const earned={sourceBound:true,sourceTick:457,crossingTick:451,
  kind:'recorded-source-zero-hp',oldWeight:1};
test('the original earned arch colors ALL new architectural channels, not just the F9 ground',async()=>{
  const {createOriginalClockworkArchitecturalPalette:create}=await palette;
  const materials=fixture();
  const bridge=create(materials,bronze);
  const result=bridge.update(earned);
  assert.equal(result.sourceBound,true);
  assert.equal(result.architecturalMaterials,8);
  for(const [key,tint] of Object.entries(keys))
    assert.ok(materials[key].color.equals(new Color(bronze[tint])),key);
  for(const key of ['warning','glow','electric','crystal','fire','hot'])
    assert.ok(materials[key].color.equals(new Color(0xfa55cc)),key);
  assert.equal(bridge.diagnostics().drawCallsAdded,0);
  assert.equal(bridge.diagnostics().geometryAdded,0);
});
test('actual source traversal yields a continuous stable palette and exact return to F9 violet',async()=>{
  const {createOriginalClockworkArchitecturalPalette:create}=await palette;
  const materials=fixture(), bridge=create(materials,bronze);
  bridge.update(earned);
  const middle={...earned,sourceTick:470,oldWeight:.5};
  bridge.update(middle);
  for(const [key,tint] of Object.entries(keys)){
    const from=new Color(voidPalette[tint]),to=new Color(bronze[tint]);
    const halfway=from.clone().lerp(to,.5);
    assert.ok(materials[key].color.equals(halfway),key);
  }
  bridge.update(middle); // source frames can duplicate; no cumulative drift
  for(const [key,tint] of Object.entries(keys)){
    const halfway=new Color(voidPalette[tint]).lerp(new Color(bronze[tint]),.5);
    assert.ok(materials[key].color.equals(halfway),key);
  }
  bridge.update({...earned,sourceTick:482,oldWeight:0});
  for(const [key,tint] of Object.entries(keys))
    assert.ok(materials[key].color.equals(new Color(voidPalette[tint])),key);
});
test('invalid or missing original crossing never borrows bronze from another scene',async()=>{
  const {createOriginalClockworkArchitecturalPalette:create}=await palette;
  const materials=fixture(),bridge=create(materials,bronze);
  bridge.update(earned);
  for(const invalid of [
    null,{...earned,sourceBound:false},
    {...earned,kind:'floor-number-only'},
    {...earned,sourceTick:'not-an-immutable-tick'},
    {...earned,oldWeight:1.2},
    {...earned,oldWeight:-.1},
    {...earned,oldWeight:NaN},
  ]){
    const result=bridge.update(invalid);
    assert.equal(result.sourceBound,false);
    for(const [key,tint] of Object.entries(keys))
      assert.ok(materials[key].color.equals(new Color(voidPalette[tint])),key);
  }
  bridge.update({...earned,kind:'verified-original-roof-receipt'});
  assert.equal(bridge.diagnostics().sourceBound,true);
  bridge.restore();
  assert.equal(bridge.diagnostics().sourceBound,false);
});
test('real World bounds the palette to the retained original same-run F9 gate and authoritative source distance',()=>{
  const path=require.resolve('../../public/infinite-tower-climb/visuals/world.mjs');
  const world=fs.readFileSync(path,'utf8');
  assert.match(world,/createOriginalClockworkArchitecturalPalette\(materials,PALETTES\.clockwork\)/);
  assert.match(world,/snapshot\.floor===9 && theme==='void'/);
  assert.match(world,/retainedEarnedCap\.runToken===snapshot\.runToken/);
  assert.match(world,/retainedEarnedCap\.guardianGateRetained===true/);
  assert.match(world,/observedSourcePhysicalArrivalPalette\(snapshot,retainedEarnedCap\)/);
  assert.match(world,/originalClockworkArchitecturalPalette\.update\(sourceProof\)/);
});
