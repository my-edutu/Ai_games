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
  assert.equal(stage(.09,true,false),0);
  // Pass523 original 390px source image proved the generic portrait offset
  // was NOT the camera that actually photographed the previous warning.
  // Hold the true previous rendered angle through contact, then still reach
  // the complete existing physical guardian retreat within the SAME 2s cue.
  assert.equal(stage(.18,true,false),0,'do not move the shot before impact is legible');
  assert.equal(stage(.27,true,false),0);
  const beginning=stage(.34,true,false),middle=stage(.56,true,false);
  assert.ok(beginning>0 && beginning<middle && middle<1,
    'earned counter smoothly advances after the witnessed initial contact');
  assert.equal(stage(.85,true,false),1,'the authentic public retreat lens must still complete before cue expiration');
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
