'use strict';
const test=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs');
const helper=import('../../public/infinite-tower-climb/visuals/source-synchronized-horizon.mjs');
const source={runToken:'real-guardian-episode',floor:9,theme:'void',
  lifecycle:'running',tick:512,player:{health:4}};
const oldGate={sourceBound:true,sourceTick:512,
  kind:'physically-supported-returned-old-and-new-shaft',oldWeight:.9845};

test('real returned original gateway anchors its already-walkable successor roof and sky despite early distant Void cooling',async()=>{
 const {sourceSynchronizedHorizonWeight:weight}=await helper;
 assert.equal(weight(source,1,0,oldGate),.9845);
 assert.equal(weight(source,1,.2,{...oldGate,oldWeight:.7}),.7);
 assert.equal(weight(source,1,.2,{...oldGate,oldWeight:.1}),.2);
 assert.equal(weight(source,.6,0,oldGate),.6);
 assert.equal(weight(source,1,0,{...oldGate,oldWeight:0}),0);
});

test('no stale, forged, dead, mismatched or unreturned physical doorway may hold old atmosphere',async()=>{
 const {sourceSynchronizedHorizonWeight:weight}=await helper;
 const bad=[
  [{...source,runToken:''},oldGate],
  [{...source,floor:10},oldGate],
  [{...source,theme:'foundry'},oldGate],
  [{...source,lifecycle:'outcome'},oldGate],
  [{...source,player:{health:0}},oldGate],
  [{...source,tick:511},oldGate],
  [source,{...oldGate,sourceBound:false}],
  [source,{...oldGate,sourceTick:511}],
  [source,{...oldGate,kind:'floor-label-only'}],
  [source,{...oldGate,oldWeight:NaN}],
  [source,null],
 ];
 for(const [s,c] of bad)assert.equal(weight(s,1,.22,c),.22);
 assert.equal(weight(source,NaN,.22,oldGate),0);
 assert.equal(weight(source,1,Infinity,oldGate),0);
});

test('real World separates noncolliding gallery clearance from bronze sill color and synchronizes actual scene lights',()=>{
 const world=fs.readFileSync('public/infinite-tower-climb/visuals/world.mjs','utf8');
 const scene=fs.readFileSync('public/infinite-tower-climb/visuals/scene.mjs','utf8');
 assert.match(world,/held\.originalGallerySourceOpacity=originalPresence/);
 assert.match(world,/held\.originalDeckSurface\.opacity=Math\.max\(originalPresence,\s*Math\.min\(\.94,originalGatePresence\)\)/);
 assert.match(world,/held\.originalGalleryRoot\.visible=originalPresence>\.015/);
 assert.match(world,/arrival\.color\.copy\(materials\.landing\.color\)\.lerp\(/);
 assert.match(scene,/sourceSynchronizedHorizonWeight\(snapshot,\s*oldWeightBeforeVoid,earnedVoidSkyLease\.maxOldWeight,certifiedHorizon\)/);
 assert.match(scene,/skyMaterial\.uniforms\.top\.value\.copy\(to\.top\)\.lerp\(from\.top,oldWeight\)/);
 assert.match(scene,/scene\.fog\.color\.copy\(to\.fog\)\.lerp\(from\.fog,oldWeight\)/);
});
