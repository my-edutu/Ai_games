'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const modulePath='../../public/infinite-tower-climb/visuals/original-gateway-camera-ray-contract.mjs';
const loaded=import(modulePath);
const observed=(overrides={})=>{
  const entry={
    active:true,rays:9,bodyBlockedRays:2,gatewayBlockedRays:1,score:5,
    originalGateBlockedRays:1,originalCapBlockedBodyRays:1,
    originalCapBlockedGatewayRays:0,originalGalleryBlockedBodyRays:0,
    originalGalleryBlockedGatewayRays:0,architectureBlockedRays:0,
    ...overrides
  };
  entry.originalCapBlockedRays=overrides.originalCapBlockedRays ??
    entry.originalCapBlockedBodyRays+entry.originalCapBlockedGatewayRays;
  entry.originalGalleryBlockedRays=overrides.originalGalleryBlockedRays ??
    entry.originalGalleryBlockedBodyRays+entry.originalGalleryBlockedGatewayRays;
  return entry;
};
test('a projected hero/opened gate does not excuse a new genuine old-cap or Void bearing obstruction',async()=>{
  const {assessOriginalGatewayPhysicalCameraBridge:compare}=await loaded;
  const before=observed();
  assert.deepEqual(compare(before,observed({
    bodyBlockedRays:1,gatewayBlockedRays:1,score:3,
    originalCapBlockedBodyRays:0})),{
    allowed:true,reason:'actual-geometry-improved',gain:2
  });
  assert.equal(compare(observed({bodyBlockedRays:0,gatewayBlockedRays:0,score:0,
    originalGateBlockedRays:0,originalCapBlockedBodyRays:0}),
    observed({bodyBlockedRays:1,gatewayBlockedRays:0,score:2,
      originalGateBlockedRays:0})).allowed,false);
  assert.equal(compare(before,observed({
    bodyBlockedRays:1,gatewayBlockedRays:1,score:3,
    architectureBlockedRays:1,originalCapBlockedBodyRays:0})).allowed,false,
    'a new physical Void support obstruction cannot buy a prettier old gate shot');
  assert.equal(compare(before,observed()).reason,
    'no-physical-sightline-improvement');
  const clear=observed({bodyBlockedRays:0,gatewayBlockedRays:0,score:0,
    originalGateBlockedRays:0,originalCapBlockedBodyRays:0});
  assert.equal(compare(clear,clear).allowed,true);
  assert.equal(compare(null,clear).allowed,false);
  assert.equal(compare(clear,{...clear,rays:3}).allowed,false);
  assert.equal(compare(clear,{...clear,score:-1}).allowed,false);
  assert.equal(compare(clear,{...clear,originalCapBlockedBodyRays:1}).allowed,false);
  assert.equal(compare(clear,{...clear,score:2}).allowed,false);
});
test('original real F8 lens is checked against the same CURRENT source-owned F9 triangles before accepting the camera',()=>{
  const text=fs.readFileSync(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  assert.match(text,/assessOriginalGatewayPhysicalCameraBridge\(\s*bridgePhysicalBefore,bridgePhysicalAfter\)/);
  assert.match(text,/world\.measureSuccessorDeckVisibility\(\s*snapshot,camera\.position,thresholdHero,p\.halfHeight\/SCALE,\s*thresholdGate/);
  assert.match(text,/bridgeProjectionAndCoreSafe && bridgePhysical\.allowed/);
  assert.match(text,/originalGatewayCameraPhysicalVetoed/);
});


test('genuine 3D gateway framing needs complete moving hero, attached opened steel and walkable F9 simultaneously',async()=>{
  const {assessOriginalGatewayThreeSubjectCameraFrame:assess}=await loaded;
  const base={
    heroNdc:[-.16,.02,.28,.15],gateNdc:[.28,.06,.22,.14],
    walkableNdc:[.54,-.24,.5],
    steel:{sourceBound:true,projectedMetalArea:.042,projectedPanes:3}
  };
  const valid=assess(base);
  assert.equal(valid.accepted,true);
  assert.ok(valid.score>0 && valid.score<=1);
  assert.equal(assess({...base,heroNdc:[-.16,.64,.28,.18]}).accepted,false,
    'visible body centre is not enough when the real helmet is cropped');
  assert.equal(assess({...base,heroNdc:[-.16,.02,.28,.01]}).accepted,false,
    'an imperceptibly small character must not earn a hero/gateway shot');
  assert.equal(assess({...base,gateNdc:[1.1,.06,.22,.14]}).accepted,false);
  assert.equal(assess({...base,walkableNdc:[1.0,-.24,.5]}).accepted,false);
  assert.equal(assess({...base,walkableNdc:null}).accepted,false);
  assert.equal(assess({...base,steel:{...base.steel,projectedMetalArea:0}}).accepted,false,
    'projecting through an EMPTY original door aperture is not proof of gate steel');
  assert.equal(assess({...base,steel:{...base.steel,projectedPanes:1}}).accepted,false);
  assert.equal(assess({...base,steel:{...base.steel,sourceBound:false}}).accepted,false);
  assert.equal(assess({...base,heroNdc:[NaN,0,.2,.1]}).accepted,false);
  assert.equal(assess({...base,walkableNdc:[.4,0,2]}).accepted,false);
  assert.equal(assess({...base,steel:{...base.steel,projectedMetalArea:Infinity}}).accepted,false);
  assert.equal(assess(base).score,valid.score,'identical source has stable projection preference');
});
test('F8 returned camera rescue protects actual metal, full body and real source-owned successor roof',()=>{
  const code=fs.readFileSync(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  assert.match(code,/assessOriginalGatewayThreeSubjectCameraFrame\(\{/);
  assert.match(code,/bridgeThreeSubject\.accepted/);
  assert.match(code,/originalThreeSubject &&/);
  assert.match(code,/world\.projectedOriginalGateSteel\(snapshot,camera\)/);
  assert.match(code,/walkablePreviouslyReadable\(recordWalkableProjection\(thresholdWalkableAfter\)\)/);
  assert.match(code,/selectOriginalGatewayThreeSubjectTrials\(\s*rescueCandidates,bridgePhysicalBefore\)/,
    'bounded real-gallery obstruction controls three exterior camera probes');
  assert.match(code,/assessOriginalGatewayPhysicalCameraBridge\(\s*bridgePhysicalBefore,world\.measureSuccessorDeckVisibility\(/);
});

test('true original gallery/cap obstruction cannot be borrowed from a better aggregate score',async()=>{
  const {assessOriginalGatewayPhysicalCameraBridge:compare}=await loaded;
  const before=observed();
  const falseClear=observed({bodyBlockedRays:1,gatewayBlockedRays:1,score:3,
    originalGateBlockedRays:0,originalCapBlockedBodyRays:0,
    originalGalleryBlockedBodyRays:1});
  assert.equal(compare(before,falseClear).reason,'physical-occlusion-regression');
  const capBorrow=observed({bodyBlockedRays:1,gatewayBlockedRays:1,score:3,
    originalGateBlockedRays:0,originalCapBlockedBodyRays:0,
    originalCapBlockedGatewayRays:1});
  assert.equal(compare(before,capBorrow).allowed,false);
  const realClear=observed({bodyBlockedRays:0,gatewayBlockedRays:0,score:0,
    originalGateBlockedRays:0,originalCapBlockedBodyRays:0});
  assert.equal(compare(before,realClear).allowed,true);
  const missing={...realClear};delete missing.originalGalleryBlockedRays;
  assert.equal(compare(before,missing).allowed,false);
});
test('physical bronze obstruction selects three lifted pullbacks without expanding the ray budget',async()=>{
  const {selectOriginalGatewayThreeSubjectTrials:select}=await loaded;
  const v=[[0,0,0],[-.01,0,0],[.01,0,0],
    [0,.4,.2],[-.01,.4,.2],[.01,.4,.2]];
  assert.deepEqual(select(v,observed()),v.slice(3,6));
  const clear=observed({bodyBlockedRays:0,gatewayBlockedRays:0,score:0,
    originalGateBlockedRays:0,originalCapBlockedBodyRays:0});
  assert.deepEqual(select(v,clear),v.slice(1,4));
  assert.deepEqual(select(v.slice(1),observed()),[]);
  assert.deepEqual(select(v,{...clear,originalCapBlockedRays:-1}),[]);
  assert.equal(select(v,observed()).length,3);
});
