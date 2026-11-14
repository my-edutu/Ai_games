'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const THREE=require('three');
const root=path.resolve(__dirname,'../..');
const scene=fs.readFileSync(path.join(root,'public/ai-maze-escape/scene.js'),'utf8');
const source=pathToFileURL(path.join(root,'public/ai-maze-escape/map-view.mjs')).href;

// Independent geometry critic for the ACTUAL production three-quarter shot.
// The native Playwright/WebGL images still decide visual quality/occlusion.
test('witnessed landscape gate uses actor-scale optical staging, never a fake model-scale edit',()=>{
  assert.match(scene,/const gateStoryCloseup = !!openingGateBeat && aspect >= 1\.1;/);
  assert.match(scene,/cameraGate \? \(gateStoryCloseup \? 3\.92/);
  assert.match(scene,/const openingGateBeat = cameraMode === 'follow' && !settings\.reducedMotion/);
  assert.match(scene,/!result && !closestThreat\?\.strength/);
  assert.match(scene,/publicGateOpeningCameraCue\(previous, snapshot\)/);
  assert.match(scene,/s\.doors\.some\(door => door\.open/);
  assert.ok(3.92 < 4.55 && 3.92 >= 3.8,
    'a real landscape opening increases modeled hero visibility, without an excessive crop');
  assert.doesNotMatch(scene,/explorer\.group\.scale\s*\.setScalar\(/,
    'the authoritative player must never be faked with a giant transient sprite');
});

test('actual Three camera projected gate, helmet and feet remain framed at 1280 and 844 landscape',async()=>{
  const {setPublicGateOpeningStageOffset:stage}=await import(source);
  for (const {width,height,edge,delta,focus,gateway} of [
    {width:1280,height:900,edge:{a:77,b:94},delta:{x:0,z:-1.2},
      focus:[0,1.12,-.384],gateway:[0,3.4,-1.2]},
    {width:844,height:390,edge:{a:77,b:78},delta:{x:-1.2,z:0},
      focus:[-.384,1.12,0],gateway:[-1.2,3.4,0]}
  ]) {
    const eye={x:0,y:0,z:0,set(x,y,z){this.x=x;this.y=y;this.z=z;}};
    assert.equal(stage(eye,edge,17,delta,width/height),true);
    assert.equal(eye.y,31,'real landscape lens, not a scaled 3D Pip sprite');
    assert.ok(Math.max(Math.abs(eye.x),Math.abs(eye.z)) / Math.min(Math.abs(eye.x),Math.abs(eye.z)) >= 3.5,
      'actual landscape lens sits across, not behind, a verified foreground gate post');
    const half=3.92,aspect=width/height;
    const cam=new THREE.OrthographicCamera(-half*aspect,half*aspect,half,-half,.1,180);
    const center=new THREE.Vector3(...focus);
    cam.position.copy(center).add(new THREE.Vector3(eye.x,eye.y,eye.z));
    cam.lookAt(center);cam.updateMatrixWorld(true);cam.updateProjectionMatrix();
    for(const [label,point] of [
      ['physical helmet',[0,2.1,0]],['physical boots',[0,0,0]],
      ['public gate roof',gateway]
    ]) {
      const p=new THREE.Vector3(...point).project(cam);
      assert.ok(Math.abs(p.x)<.88 && Math.abs(p.y)<.88 && p.z>-1 && p.z<1,
        `${width}x${height}: ${label} is not cropped: ${p.toArray()}`);
    }
  }
});

test('portrait, manual detail, observed guardian and reduced motion keep their existing safe stage',()=>{
  assert.match(scene,/targetHeight = cameraMode === 'detail'/);
  assert.match(scene,/: height < 340 \? 5\.4/);
  assert.match(scene,/: cameraGate \? \(gateStoryCloseup \? 3\.92/);
  assert.match(scene,/aspect < \.9 \? 4\.70 : 4\.55/);
  assert.match(scene,/portraitEncounterOrbit=publicPortraitGuardianOrbitAngle\(/);
  assert.match(scene,/if \(cameraMode === 'overview'\)/);
});
