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

test('previously source-validated original doorway keeps its actual sky, fog and floor together through early Void bearing upload',async()=>{
 const {sourceSynchronizedHorizonWeight:weight}=await helper;
 const {observedCertifiedClockworkHorizon:certify}=await import('../../public/infinite-tower-climb/visuals/original-clockwork-architecture-palette.mjs');
 const physical={sourceBound:true,kind:'recorded-source-zero-hp',
   sourceTick:source.tick,crossingTick:475,oldWeight:.82};
 const current=certify(source,physical);
 assert.equal(current.kind,'live-same-run-physical-gateway');
 assert.equal(weight(source,1,0,current),.82,
   'early returned Void bearing may cool distant sky, not the genuinely retained current old-room materials');
 const tail={historicalOpticalTail:true,previouslySourceVerified:true,
   runToken:source.runToken,authenticatedSourceTick:511,authenticatedCrossingTick:475,
   returnedFrames:4,returnedSeconds:.31,oldWeight:.61};
 const previous=certify(source,null,tail);
 assert.equal(previous.kind,'previous-certified-returned-material');
 assert.equal(weight(source,.9,0,previous),.61,
   'source-validated returned material tail must not share a warm roof with an instant purple sky');
 assert.equal(weight(source,.4,0,current),.4,'never exceed current original-room coverage');
 assert.equal(weight(source,1,.25,{...current,sourceTick:511}),.25);
 assert.equal(weight(source,1,.25,{...current,historicalOpticalTail:true}),.25);
 assert.equal(weight(source,1,.25,{...previous,historicalOpticalTail:false}),.25);
 assert.equal(weight(source,1,.25,{...previous,sourceBound:false}),.25);
 assert.equal(weight({...source,runToken:'',tick:512},1,0,current),0);
 assert.equal(weight({...source,floor:10},1,0,previous),0);
 assert.equal(weight(source,1,.25,{sourceBound:true,sourceTick:512,
   kind:'HUD-F9-only',oldWeight:1}),.25);
 assert.equal(weight(source,1,.25,null),.25);
});

test('real World separates noncolliding gallery clearance from bronze sill color and synchronizes actual scene lights',()=>{
 const world=fs.readFileSync('public/infinite-tower-climb/visuals/world.mjs','utf8');
 const scene=fs.readFileSync('public/infinite-tower-climb/visuals/scene.mjs','utf8');
 assert.match(world,/held\.originalGallerySourceOpacity=originalPresence/);
 assert.match(world,/held\.originalDeckSurface\.opacity=Math\.max\(originalPresence,\s*Math\.min\(\.94,originalGatePresence\)\)/);
 assert.match(world,/held\.originalGalleryRoot\.visible=originalPresence>\.015/);
 assert.match(world,/arrival\.color\.copy\(materials\.landing\.color\)\.lerp\(/);
 assert.match(scene,/sourceSynchronizedHorizonWeight\\(snapshot,\\s*oldWeightBeforeVoid,earnedVoidSkyLease\\.maxOldWeight,\\s*certifiedHorizon,earnedVoidHorizon\\)/);
 assert.match(scene,/skyMaterial\.uniforms\.top\.value\.copy\(to\.top\)\.lerp\(from\.top,oldWeight\)/);
 assert.match(scene,/scene\.fog\.color\.copy\(to\.fog\)\.lerp\(from\.fog,oldWeight\)/);
});

test('actual returned successor bearings gradually cool distant world atmosphere, not source-owned old gate or gameplay',async()=>{
 const {sourceSynchronizedHorizonWeight:weight}=await helper;
 const certified={sourceBound:true,sourceTick:source.tick,
   kind:'live-same-run-physical-gateway',oldWeight:1};
 const earned={sourceBound:true,sourceTick:source.tick,
   firstBearingReturnedFrames:6,maxOldHorizonWeight:0};
 assert.equal(weight(source,1,0,certified),1);
 assert.equal(weight(source,1,0,certified,earned),.58,
   'genuinely returned original F9 bearings reveal distant atmosphere without erasing the bronze threshold');
 assert.equal(weight(source,.5,0,certified,earned),.29);
 assert.equal(weight(source,1,.8,certified,earned),.8);
 for(const falseProof of [
   {...earned,sourceBound:false},
   {...earned,sourceTick:source.tick-1},
   {...earned,firstBearingReturnedFrames:1},
   {...earned,maxOldHorizonWeight:NaN},
   {...earned,maxOldHorizonWeight:-.1},
   {...earned,maxOldHorizonWeight:1.1}
 ])assert.equal(weight(source,1,0,certified,falseProof),1);
 assert.equal(weight({...source,runToken:''},1,0,certified,earned),0);
});
