import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import fs from 'node:fs';
import { advancePresentationCameraPose } from '../../public/snake-stream/camera.mjs';

const renderer = fs.readFileSync(new URL('../../public/snake-stream/renderer.mjs', import.meta.url),'utf8');
const vector = (x,y,z) => new THREE.Vector3(x,y,z);

// Real WebGL renderer uses these same Three.js vector operations; no mock camera.
test('portal/restart/shot/resize hard cuts replace BOTH actual camera target and offset immediately', () => {
  const target = vector(-10,0,-9), offset = vector(5,10,13);
  const nextTarget = vector(9,0,8), nextOffset = vector(-8,7,-14);
  const result = advancePresentationCameraPose(target,offset,nextTarget,nextOffset,{hardCut:true,delta:1/60});
  assert.deepEqual(target.toArray(),nextTarget.toArray());
  assert.deepEqual(offset.toArray(),nextOffset.toArray());
  assert.equal(result.settled,true,'real static HDR/depth cache must become eligible on a truthful cut');
  assert.equal(result.cut,true);
  // A held identical shot may be repeatedly drawn with no new static geometry projection.
  advancePresentationCameraPose(target,offset,nextTarget,nextOffset,{delta:1/60});
  assert.deepEqual(offset.toArray(),nextOffset.toArray());
  assert.deepEqual(target.toArray(),nextTarget.toArray());
});

test('ordinary continuous re-centering remains smoothed, bounded and converges to an exact reusable pose', () => {
  const target=vector(0,0,0), offset=vector(7,12,8), nextTarget=vector(3,0,-2),nextOffset=vector(-7,8,7);
  const first=advancePresentationCameraPose(target,offset,nextTarget,nextOffset,{delta:1/60});
  assert.equal(first.cut,false);assert.equal(first.settled,false);
  assert.ok(target.distanceTo(nextTarget)>0);
  assert.ok(offset.distanceTo(nextOffset)>0);
  for(let i=0;i<100;i++)advancePresentationCameraPose(target,offset,nextTarget,nextOffset,{delta:1/60});
  assert.deepEqual(target.toArray(),nextTarget.toArray());
  assert.deepEqual(offset.toArray(),nextOffset.toArray());
});

test('WebGL render orchestration uses the same camera pose contract for target and offset',()=>{
  assert.match(renderer,/advancePresentationCameraPose\(cameraTarget, cameraOffset, desiredTarget, desiredPosition/);
  assert.match(renderer,/hardCut: settings\.reducedMotion \|\| frameCount === 0 \|\| anchor\.snap/);
  assert.doesNotMatch(renderer,/cameraOffset\.lerp\(desiredPosition, mix\)/,
    'a direct lerp on hard portal/view cuts silently defeats the existing cache anchor');
});
