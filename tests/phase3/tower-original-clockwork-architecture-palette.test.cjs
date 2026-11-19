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
  assert.match(world,/const materialProof=livePaletteProof\?\?\(farSideHorizon\?/);
  // The existing returned WebGL bronze owner, not an unrendered source poll,
  // owns both the old doorway's material memory and the first visible F9 room.
  assert.match(world,/const returnedBronzePaletteLock=farSideHorizon\s*\?\s*observedReturnedOriginalArchitectureHold\(/);
  assert.match(world,/const sourceAlignedMaterialProof=returnedBronzePaletteLock\?\{/);
  assert.match(world,/originalClockworkArchitecturalPalette\.update\(sourceAlignedMaterialProof,opticalTail\)/);
});

test('the original earned doorway holds only the true level F9 receiving roof, not the distinct raised Void route',async()=>{
  const {observedOriginalClockworkSuccessorDeck}=await palette;
  const held={runToken:'actual-run',floor:9,guardianGateRetained:true,
    oldRoofY:6500,originalDeckSurface:{color:new Color(0xa06a35)}};
  const ground={id:'f9:ground',kind:'static',y:6000,height:500};
  const moving={id:'f9:p1',kind:'moving',y:606000,height:500};
  const remote={id:'f9:p4',kind:'static',y:1006000,height:500};
  assert.equal(observedOriginalClockworkSuccessorDeck(ground,held,'actual-run'),true);
  assert.equal(observedOriginalClockworkSuccessorDeck(moving,held,'actual-run'),false);
  assert.equal(observedOriginalClockworkSuccessorDeck({...ground,id:'f9:p2',y:605999},held,'actual-run'),false);
  assert.equal(observedOriginalClockworkSuccessorDeck({...ground,y:9000},held,'actual-run'),false);
  assert.equal(observedOriginalClockworkSuccessorDeck(remote,held,'actual-run'),false);
  assert.equal(observedOriginalClockworkSuccessorDeck(ground,held,'other-run'),false);
  assert.equal(observedOriginalClockworkSuccessorDeck(ground,{...held,guardianGateRetained:false},'actual-run'),false);
  assert.equal(observedOriginalClockworkSuccessorDeck({...ground,y:6500.25},held,'actual-run'),false);
  assert.equal(observedOriginalClockworkSuccessorDeck({...ground,height:-1},held,'actual-run'),false);
  assert.equal(observedOriginalClockworkSuccessorDeck({...ground,id:'f8:cap'},held,'actual-run'),false);
});
test('source-authentic grounded F9 threshold shares bronze only until its destination; palette still restores without touching hazard cues',async()=>{
  const {updateOriginalClockworkSuccessorRoute}=await palette;
  const top={color:new Color(0x726982)},body={color:new Color(0xb5a0ec)},
    rim={color:new Color(0x6a577e)},mint={color:new Color(0xa7eecc)};
  const source={bronze:new Color(0xa06a35),top,body,rim,
    topVoid:top.color.clone(),bodyVoid:body.color.clone(),
    rimVoid:rim.color.clone()};
  const result=updateOriginalClockworkSuccessorRoute(source,earned);
  assert.equal(result.sourceBound,true);
  assert.ok(top.color.equals(source.bronze));
  assert.ok(body.color.equals(source.bronze), 'body must share the opened physical gate palette');
  assert.ok(rim.color.equals(source.bronze), 'rim cannot leak early violet through the original gate');
  assert.ok(mint.color.equals(new Color(0xa7eecc)));
  updateOriginalClockworkSuccessorRoute(source,{...earned,sourceTick:470,oldWeight:.5});
  const intermediate=top.color.clone();
  updateOriginalClockworkSuccessorRoute(source,{...earned,sourceTick:470,oldWeight:.5});
  assert.ok(top.color.equals(intermediate),'duplicated source receipt cannot accumulate tint');
  updateOriginalClockworkSuccessorRoute(source,null);
  assert.ok(top.color.equals(source.topVoid) && body.color.equals(source.bodyVoid) &&
    rim.color.equals(source.rimVoid),'invalid source never leaves an old palette behind');
});
test('real F9 world uses shared original successor corridor materials on near route, not global crystal or danger warning channels',()=>{
  const world=fs.readFileSync(require.resolve('../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  assert.match(world,/observedOriginalClockworkSuccessorDeck\(p,retainedEarnedCap,sourceRunToken\)/);
  assert.match(world,/buildPlatform\(p,snapshot.worldWidth,sourceGateCap,snapshot.runToken\)/);
  assert.match(world,/updateOriginalClockworkSuccessorRoute\(arrivalRoutePalette,\s*sourceAlignedMaterialProof,opticalTail\)/);
  assert.match(world,/const sourceAlignedMaterialProof=returnedBronzePaletteLock\?\{/,
    'a source-verified returned old GPU owner must keep the real near-roof route and monumental world in one painted room');
  // The existing returned WebGL bronze owner, not an unrendered source poll,
  // owns both the old doorway's material memory and the first visible F9 room.
  assert.match(world,/const returnedBronzePaletteLock=farSideHorizon\s*\?\s*observedReturnedOriginalArchitectureHold\(/);
  assert.match(world,/const sourceAlignedMaterialProof=returnedBronzePaletteLock\?\{/);
  assert.match(world,/originalClockworkArchitecturalPalette\.update\(sourceAlignedMaterialProof,opticalTail\)/);
  assert.match(world,/p.kind==='moving'\?materials.mint/);
  assert.match(world,/if\(sharedPhysicalRoof && !arrivalRoutePalette\)/);
  assert.match(world,/createSourceEarnedVoidDepartureMaterials\(/);
  assert.match(world,/realVoidDeparturePalette\?\.landing/);
  assert.match(world,/realVoidDeparturePalette\?\.rim/);
  assert.doesNotMatch(world,/materials\.crystal\.color\.lerp\(/);
});

test('original Void destination PBR shaders remain isolated from bronze roof tint and same-run invalidation',async()=>{
  const {createSourceEarnedVoidDepartureMaterials:create,
    createOriginalClockworkArchitecturalPalette}=await palette;
  class Surface {
    constructor(hex){this.isMaterial=true;this.color=new Color(hex);this.name='base'}
    clone(){const copy=new Surface(0);copy.color=this.color.clone();return copy}
  }
  const materials={landing:new Surface(0x726982),copper:new Surface(0x6a577e)};
  const held={runToken:'actual-run',floor:9,guardianGateRetained:true};
  const raised=create(materials,held,'actual-run');
  assert.ok(raised);
  assert.notStrictEqual(raised.landing,materials.landing);
  assert.notStrictEqual(raised.rim,materials.copper);
  const raisedTop=raised.landing.color.clone(),raisedRim=raised.rim.color.clone();
  // Exact old bronze source certificate tints the real at-grade roof only;
  // the separately supported upper decks have already inherited Void paint.
  const architectural=createOriginalClockworkArchitecturalPalette(materials,bronze);
  architectural.update(earned);
  assert.ok(materials.landing.color.equals(new Color(bronze.landing)));
  assert.ok(materials.copper.color.equals(new Color(bronze.metal)));
  assert.ok(raised.landing.color.equals(raisedTop));
  assert.ok(raised.rim.color.equals(raisedRim));
  assert.equal(create(materials,{...held,runToken:'other'},'actual-run'),null);
  assert.equal(create(materials,{...held,guardianGateRetained:false},'actual-run'),null);
  assert.equal(create(materials,held,'other-run'),null);
  assert.equal(create(materials,held,''),null);
});
