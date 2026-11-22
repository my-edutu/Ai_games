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

test('P0 portrait original-gateway rescue uses the real hero, opened steel and walkable roof as one bounded gaze, with zero extra camera rays',async()=>{
  const {sourceOriginalGatewayJointGazeCandidates:plan}=await loaded;
  const input={aspect:390/844,dt:.045,
    currentGaze:[1,6,28],hero:[8,15,25],
    gateway:[-1,12,25],walkable:[7,7,25]};
  const before=JSON.stringify(input);
  const proposals=plan(input);
  assert.equal(proposals.length,3,'replace the three existing 3D camera trials, never add a fourth ray');
  assert.ok(proposals.every(g=>g.length===3&&g.every(Number.isFinite)));
  const target=[8*.48-1*.34+7*.18,15*.48+12*.34+7*.18,25];
  const distance=g=>Math.hypot(...g.map((v,i)=>v-input.currentGaze[i]));
  assert.ok(distance(proposals[0])<distance(proposals[1]));
  assert.ok(distance(proposals[1])<distance(proposals[2]));
  assert.ok(distance(proposals[2])<=5.5+1e-9,
    'one submitted frame cannot produce an unbounded focus teleport');
  assert.ok(Math.hypot(...proposals[2].map((v,i)=>v-target[i]))<
    Math.hypot(...input.currentGaze.map((v,i)=>v-target[i])));
  assert.equal(JSON.stringify(input),before,'immutable world source points must never be changed');
  assert.equal(plan({...input,aspect:960/600}),null,
    'desktop keeps its already vetted world/hero camera');
  assert.equal(plan({...input,dt:0}),null);
  assert.equal(plan({...input,hero:[NaN,15,25]}),null);
  assert.equal(plan({...input,walkable:null}),null);
  assert.equal(plan({...input,hero:[600,15,25]}),null,
    'unrelated actors cannot borrow an original Floor8 camera');
  const slower=plan({...input,dt:.015});
  assert.ok(distance(slower[2])<distance(proposals[2]),
    'duration bounds the camera response instead of assumed FPS');
});

test('real 3D Scene applies portrait joint gaze ONLY inside source-earned old-lens trials with unchanged physical steel/roof/core vetoes',()=>{
  const code=fs.readFileSync(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  assert.match(code,/sourceOriginalGatewayJointGazeCandidates\(/);
  assert.match(code,/const rescueTrials=selectOriginalGatewayThreeSubjectTrials\(/);
  assert.match(code,/lookAt\.set\(\.\.\.portraitJointGazes\[trialIndex\]\)/);
  assert.match(code,/const steel=world\.projectedOriginalGateSteel\(snapshot,camera\)/);
  assert.match(code,/assessOriginalGatewayPhysicalCameraBridge\(\s*bridgePhysicalBefore,world\.measureSuccessorDeckVisibility\(/);
});
