'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const path=require('node:path'),{pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.join(__dirname,'../../public/ai-maze-escape/guardian-duel-camera.mjs')).href);
const camera=()=>({x:15,y:31,z:18});
const projected=(o,h,g)=>Math.abs((h.x-g.x)*o.z-(h.z-g.z)*o.x)/Math.hypot(o.x,o.z);
test('Pass518 actual public two-cell Pip/Thornback portrait earns consequential physical face-quarter',async()=>{
 const {setPublicEarnedGuardianFrontQuarterOffset:stage}=await load();
 const hero={x:-14.4,z:-9.6},guardian={x:-9.6,z:-9.6};
 for(const aspect of [320/740,390/844]){
   const o=camera(),before=projected(o,hero,guardian),r=Math.hypot(o.x,o.z);
   assert.equal(stage(o,aspect,hero,guardian,true,false),true);
   assert.ok(projected(o,hero,guardian)<before*.70,
     'must substantially compress the two genuine opposing full-body projections');
   const dx=hero.x-guardian.x,dz=hero.z-guardian.z;
   assert.ok((dx*o.x+dz*o.z)/(r*Math.hypot(dx,dz))>.84,
     'must face Thornback from a real 30-degree quarter, not a rear view');
   assert.ok(Math.abs(Math.hypot(o.x,o.z)-r)<1e-10);
   assert.equal(o.y,31,'do not pass through physical ground to fake visibility');
   const again=camera();stage(again,aspect,hero,guardian,true,false);
   assert.deepEqual(o,again);
 }
});
test('Pass518 no invented parry shot for unearned, reduced, landscape, desktop or invalid witnesses',async()=>{
 const {setPublicEarnedGuardianFrontQuarterOffset:stage}=await load();
 const hero={x:-14.4,z:-9.6},g={x:-9.6,z:-9.6};
 for(const [aspect,h,guardian,earned,reduced] of [
 [390/844,hero,g,false,false],[390/844,hero,g,true,true],
 [844/390,hero,g,true,false],[1280/900,hero,g,true,false],
 [320/740,{x:-9.25,z:-9.6},g,true,false],
 [390/844,{x:NaN,z:-9.6},g,true,false],[390/844,hero,null,true,false]
 ]){const o=camera();assert.equal(stage(o,aspect,h,guardian,earned,reduced),false);assert.deepEqual(o,camera());}
});


test('Pass522 genuine lantern impact retains the prior two-actor witness before opening the 3D retreat view',async()=>{
  const {publicEarnedGuardianCounterCameraAct:stage}=await load();
  assert.equal(stage(0,true,false),0,'the first real contact stays on its already witnessed action camera');
  // Pass526: original 390px photographed contact retains both complete
  // models but masks the actual guardian face behind glass foliage. The later
  // authentic higher 320px view already exposes the face. Keep first contact,
  // then earn that SAME physical higher reveal before the two-second hit ends.
  // These are independent stronger, numerical choreography checks; no
  // model-frame geometry, privacy, motion or gameplay gate is relaxed.
  assert.equal(stage(.08,true,false),0,'keep genuine first impact at actual previously rendered view');
  const first=stage(.09,true,false);
  assert.ok(first>0 && first<.01,'first camera movement is smooth, not a sudden cut');
  const early=stage(.18,true,false),quarter=stage(.27,true,false);
  assert.ok(early>.08 && early<.10 && quarter>.27 && quarter<.30,
    'real guardian face reveal must begin during the parry rather than after the action');
  const beginning=stage(.34,true,false),middle=stage(.56,true,false);
  assert.ok(beginning>.45 && beginning<.50 && middle>.96 && middle<1,
    'already-authentic high physical guardian camera is reached in the original 2s witness');
  assert.equal(stage(.62,true,false),1,'the genuine guardian reveal reaches its current physical geometry before expiry');
  assert.equal(stage(.85,true,false),1,'the source cue expires without a second camera jump');
  assert.equal(stage(.95,true,false),1);
  assert.equal(stage(1,true,false),1);
  for(const age of [-1,NaN,Infinity,null,undefined])
    assert.equal(stage(age,true,false),1,'invalid or ended source event must not play a stale cinematic');
  assert.equal(stage(.09,false,false),1,'an unearned or already-parried guardian never receives the camera');
  assert.equal(stage(.09,true,true),1,'reduced motion cannot animate the camera');
  const fs=require('node:fs'),path=require('node:path');
  const sceneSource=fs.readFileSync(path.join(__dirname,'../../public/ai-maze-escape/scene.js'),'utf8');
  assert.match(sceneSource,/earnedRecoilCameraOffset\.lerp\(cameraOffset,1-earnedShotAct\)/,
    'contact must begin at the ACTUAL previously rendered public camera, not its different generic portrait destination');
  assert.match(sceneSource,/desiredTarget\.lerp\(cameraTarget,1-earnedShotAct\)/,
    'live 3D camera target must hold the original real two-body composition during impact');
  assert.match(sceneSource,/targetHeight=halfHeight\+\(targetHeight-halfHeight\)\*earnedShotAct/,
    'real physical lens cannot snap to an unrelated height on the hit');
  assert.match(sceneSource,/recoilAim\.x\*earnedShotAct/,
    'the camera aim must track the same earned event phase rather than teleport at impact');
});


test('Pass527 source-matched native 390/320 connected actors lift above empty ocean without losing full silhouettes',async()=>{
  const {publicGuardianEarnedRecoilPairStageLift:lift}=await load();
  const aspect390=390/844, h=8.2;
  // ORIGINAL unaltered Pass526 390x844 public seed-13 tick94 connected
  // silhouettes: no center-of-mass fakes; strict native +/- .95 unchanged.
  const bodies390=[
    {left:-.9000,right:-.0077149,bottom:-.2161108,top:.2262768},
    {left:-.4791513,right:.9000,bottom:-.5399237,top:.1265308},
  ];
  const worldShift=lift(aspect390,h,bodies390,true,false);
  const move=-worldShift/h;
  assert.ok(move>.28 && move<=.30,'empty-sea shot must actually move the complete pair into the playable stage');
  for(const b of bodies390){
    assert.ok(b.top+move<=.63 && b.bottom+move>=-.75,
      'actual actor envelopes have stronger strict y-margins after reframe');
    assert.ok(b.left>=-.95 && b.right<=.95,'never weaken existing +/- .95 complete-body x gate');
  }
  const bodies320=[
    {left:-.900,right:-.1450,bottom:-.4143,top:-.01411},
    {left:-.17868,right:.900,bottom:-.10088,top:.43382},
  ];
  const mobileShift=lift(320/740,7.2,bodies320,true,false);
  assert.ok(mobileShift<0 && -mobileShift/7.2<.16,
    'the already-better high 320px face keeps a gentler composition adjustment');
  for(const [aspect,b,earned,reduced] of [
    [aspect390,bodies390,false,false],[aspect390,bodies390,true,true],
    [844/390,bodies390,true,false],[1280/900,bodies390,true,false],
    [aspect390,[bodies390[0],{...bodies390[1],top:.99}],true,false],
    [aspect390,[bodies390[0],{...bodies390[1],left:-1.05}],true,false],
    [aspect390,[bodies390[0],{...bodies390[1],top:NaN}],true,false],
    [aspect390,[bodies390[0]],true,false],
  ]) assert.equal(lift(aspect,h,b,earned,reduced),0,
    'never shift a hidden, invalid, unearned, manual/landscape or reduced-motion shot');
  const fs=require('node:fs'),path=require('node:path');
  const sceneSource=fs.readFileSync(path.join(__dirname,'../../public/ai-maze-escape/scene.js'),'utf8');
  assert.match(sceneSource,/publicGuardianEarnedRecoilPairStageLift\(\s*aspect,halfHeight,finalEarnedBodies,earnedDuelContinuity,/,
    'only authentic final physical envelopes may propose stage composition');
  assert.match(sceneSource,/camera\.position\.addScaledVector\(pressureReframeRight,stageLift\*earnedContactStageBlend\)/,
    'reuse current physical camera up-axis and same witnessed counter clock');
});

test('Pass528 first earned mobile contact performs meaningful SAFE camera-up movement before delayed orbit',async()=>{
  const {publicGuardianEarnedRecoilPairStageLift:lift,
    publicGuardianEarnedContactStageResponse:respond,
    publicEarnedGuardianCounterCameraAct:orbit}=await load();
  // ORIGINAL 2026-11-20 exact-Pass527 SHA-verified 390x844 tick94
  // complete connected-mesh bounds, not actor centres or fake screenshots.
  const bodies=[
    {left:-.896187,right:-.049280,bottom:-.208340,top:.214876},
    {left:-.490237,right:.896187,bottom:-.536033,top:.130853}
  ];
  const h=8.2,a=390/844,full=-lift(a,h,bodies,true,false)/h;
  assert.ok(full>.28&&full<=.30,'original impact has a genuinely worthwhile stage correction');
  assert.equal(orbit(.08,true,false),0,'keep the old true impact orbit, not a cut');
  let response=respond(0,.016,true,false);
  assert.ok(response>.1&&response<.2,'first frame begins moving without a snap');
  for(let i=1;i<37;i++)response=respond(response,.016,true,false);
  assert.ok(response>.99&&response<=1,'the authentic capture window must reveal the stage');
  assert.ok(full*response>.28,'counter stage must visibly move, not simply pass source tests');
  for(const b of bodies){
    assert.ok(b.top+full*response<=.63&&b.bottom+full*response>=-.75,
      'stronger HUD-safe complete character bounds, native ±.95 unchanged');
    assert.ok(b.left>=-.95&&b.right<=.95);
  }
  const src=require('node:fs').readFileSync(
    require('node:path').join(__dirname,'../../public/ai-maze-escape/scene.js'),'utf8');
  assert.match(src,/earnedContactStageBlend=publicGuardianEarnedContactStageResponse\(/);
  assert.match(src,/stageLift\*earnedContactStageBlend/);
  assert.doesNotMatch(src,/stageLift\*earnedShotAct/);
  assert.match(src,/wardens\.clear\(\); earnedContactStageBlend=0; runToken = snapshot\.runToken/);
  assert.match(src,/publicGuardianEarnedRecoilPairStageLift\(\s*aspect,halfHeight,finalEarnedBodies,earnedDuelContinuity/);
});
test('Pass528 response resets on missing witness and never jumps on software-renderer stalls',async()=>{
  const {publicGuardianEarnedContactStageResponse:f}=await load();
  for(const args of [[.6,.016,false,false],[.6,.016,true,true],
    [0,NaN,true,false],[0,Infinity,true,false],[-.1,.016,true,false],
    [NaN,.016,true,false],[1.01,.016,true,false],[0,-1,true,false]])
    assert.equal(f(...args),0);
  assert.equal(f(.4,0,true,false),.4);
  assert.equal(f(.4,100,true,false),f(.4,.1,true,false),
    'no huge sudden jump under CPU-throttled WebGL');
  let a=0;
  for(let i=0;i<80;i++){
    const b=f(a,.016,true,false);
    assert.ok(b>=a&&b<=1);
    a=b;
  }
  assert.ok(a>.999);
});
