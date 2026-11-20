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
