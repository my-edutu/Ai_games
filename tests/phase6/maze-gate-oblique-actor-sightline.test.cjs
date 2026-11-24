'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const production=path.join(root,'public/ai-maze-escape/map-view.mjs');
const scene=fs.readFileSync(path.join(root,'public/ai-maze-escape/scene.js'),'utf8');

const camera=()=>({x:6,y:34,z:25,set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}});
const pose=v=>[v.x,v.y,v.z];

test('only an already-authorized, PUBLIC north/south opening can choose a 3D actor-side sightline',async()=>{
  const {setPublicGateOpeningStageOffset:stage}=await import(pathToFileURL(production).href);
  const c=camera();
  assert.equal(stage(c,{a:77,b:94},17,{x:0,z:-1.2}),true);
  assert.deepEqual(pose(c),[24,30,-11],
    'viewer stands on the gate side of Pip, beyond the actually obstructing southern foreground barrier');
  assert.equal(stage(c,{a:94,b:77,hiddenMaze:{walkable:[88]},privateFuture:89},17,
    {x:0,z:-1.2,privateFuture:88}),true);
  assert.deepEqual(pose(c),[24,30,-11],
    'reversing source gate endpoints and private noise cannot alter the visible physical shot');
  assert.equal(stage(c,{a:77,b:94},17,{x:0,z:1.2}),true);
  assert.deepEqual(pose(c),[24,30,11],
    'gate on the opposite side must not use the old foreground-camera azimuth');
  assert.equal(stage(c,{a:77,b:94},17),true);
  assert.deepEqual(pose(c),[6,34,25],
    'existing conservative three-argument camera behavior stays unchanged');
});

test('perpendicular east/west passages retain the same oblique side-stage rule',async()=>{
  const {setPublicGateOpeningStageOffset:stage}=await import(pathToFileURL(production).href);
  const c=camera();
  assert.equal(stage(c,{a:77,b:78},17,{x:-2.4,z:0}),true);
  assert.deepEqual(pose(c),[-11,30,24]);
  assert.equal(stage(c,{a:78,b:77},17,{x:2.4,z:0}),true);
  assert.deepEqual(pose(c),[11,30,24]);
  assert.equal(stage(c,{a:77,b:78},17),true);
  assert.deepEqual(pose(c),[25,34,6]);
});

test('invalid current hero/gate data cannot move a camera, infer topology, or teleport the model',async()=>{
  const {setPublicGateOpeningStageOffset:stage}=await import(pathToFileURL(production).href);
  for(const [cue,width,delta] of [
    [null,17,{x:0,z:-1}], [{a:77,b:95},17,{x:0,z:-1}],
    [{a:77,b:77},17,{x:0,z:-1}], [{a:77,b:94},17,{x:Infinity,z:0}],
    [{a:77,b:94},17,{x:0,z:NaN}],[{a:77,b:94},17,{x:99,z:0}],
    [{a:77,b:94},17,{x:0}],[{a:77,b:94},17,{}],
    [{a:77,b:94},17,{x:0,z:-1.2,truthyPrivatePath:[90,97]}],
  ]) {
    const c=camera(),before=pose(c);
    const valid=delta?.truthyPrivatePath;
    assert.equal(stage(c,cue,width,delta),!!valid,
      'a public-valid numeric displacement is required even when private keys are present');
    if(!valid)assert.deepEqual(pose(c),before);
  }
  assert.match(scene,/openingGateToHero = openingA && openingB/,
    'only physically observed public gate endpoints and actual Pip movement enter stage selection');
  assert.match(scene,/openingGateCameraOffset, openingGateBeat, s\.width, openingGateToHero/,
    'actual WebGL camera uses the observed hero/gate three-quarter offset');
  assert.match(scene,/cameraMode === 'follow' && !settings\.reducedMotion/,
    'guardian, reduced-motion and manual camera precedence remains');
  assert.match(scene,/publicGateOpeningCameraCue\(previous, snapshot\)/,
    'the original genuine source testimony remains mandatory');
});

test('three-quarter character and authentic gate still share one projected diorama frame',async()=>{
  const THREE=require('three');
  const {setPublicGateOpeningStageOffset:stage}=await import(pathToFileURL(production).href);
  const gateA={x:0,z:-1.2};const c=camera();
  assert.equal(stage(c,{a:77,b:94},17,gateA),true);
  const ortho=new THREE.OrthographicCamera(-4.55*1280/900,4.55*1280/900,4.55,-4.55,.1,180);
  const focus=new THREE.Vector3(0,1.12,-.384);
  ortho.position.copy(focus).add(new THREE.Vector3(c.x,c.y,c.z));
  ortho.lookAt(focus);ortho.updateMatrixWorld(true);ortho.updateProjectionMatrix();
  const heroTop=new THREE.Vector3(0,2.1,0).project(ortho);
  const heroFoot=new THREE.Vector3(0,0,0).project(ortho);
  const gateTop=new THREE.Vector3(0,3.4,-1.2).project(ortho);
  for(const [name,v] of [['Pip head',heroTop],['Pip feet',heroFoot],['authentic gate roof',gateTop]]){
    assert.ok(Math.abs(v.x)<.90 && Math.abs(v.y)<.90 && v.z>-1 && v.z<1,
      name+' must not be cropped by the authored stage');
  }
});

test('landscape-only witnessed 3D gate camera re-angles a real lens and preserves portrait',async()=>{
  const {setPublicGateOpeningStageOffset:stage}=await import(pathToFileURL(production).href);
  const c=camera();
  assert.equal(stage(c,{a:77,b:94},17,{x:0,z:-1.2},1280/900),true);
  assert.deepEqual(pose(c),[28,31,-8],
    'landscape looks past the obstructing post at the physical same-run gate');
  assert.ok(c.x/Math.abs(c.z)>=3.5,'post and hero must not retain the old aligned azimuth');
  assert.equal(stage(c,{a:94,b:77},17,{x:0,z:1.2},844/390),true);
  assert.deepEqual(pose(c),[28,31,8],'true opposite passage changes the camera side');
  assert.equal(stage(c,{a:77,b:78},17,{x:-1.2,z:0},844/390),true);
  assert.deepEqual(pose(c),[-8,31,28],'perpendicular gate keeps an equally tangential physical lens');
  assert.equal(stage(c,{a:77,b:94},17,{x:0,z:-1.2},390/844),true);
  assert.deepEqual(pose(c),[24,30,-11],'native 390 portrait framing remains unchanged');
  assert.equal(stage(c,{a:77,b:94},17,{x:0,z:-1.2},320/740),true);
  assert.deepEqual(pose(c),[24,30,-11],'native 320 portrait framing remains unchanged');
  assert.equal(stage(c,{a:77,b:94},17,{x:0,z:-1.2},NaN),true);
  assert.deepEqual(pose(c),[24,30,-11],'invalid viewport cannot trigger new optical staging');
  assert.match(scene,/openingGateToHero,\s*width \/ Math\.max\(1, height\)/,
    'actual source uses real browser aspect, never the maze grid aspect');
});
