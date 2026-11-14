'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const director = import('../../public/snake-stream/cinematic-director.mjs');
const camera = import('../../public/snake-stream/camera.mjs');

test('explicit public 3D camera choice survives reduced-motion preferences without animating a cinematic director', async () => {
  const { selectInitialSpectatorCamera, resolveSpectatorShot } = await director;
  assert.equal(selectInitialSpectatorCamera('', true), 'overview', 'auto must start in stable overview');
  assert.equal(selectInitialSpectatorCamera('?camera=cinematic', true), 'overview', 'autoplay director must not force camera cuts');
  assert.equal(selectInitialSpectatorCamera('?camera=unknown', true), 'overview', 'invalid requests fail safely');
  for (const mode of ['overview','follow','detail']) {
    assert.equal(selectInitialSpectatorCamera('?camera='+mode, true), mode, `explicit ${mode} shot is accessible`);
    assert.equal(resolveSpectatorShot(mode, null, true), mode, `reduced-motion ${mode} camera is steady, not reclassified`);
  }
});

test('real reduced-motion camera stays a source-owned truthful 3D still without authoritative changes', async () => {
  const { createPresentationCameraAnchor, advancePresentationCameraPose } = await camera;
  const anchor = createPresentationCameraAnchor();
  const shot = anchor.resolve({ mode:'detail', runToken:'public-token', head:{x:1,z:2}, target:{x:1,y:.4,z:2}, offset:{x:3,y:4,z:5}, reducedMotion:true });
  assert.equal(shot.snap,true);
  const vector=(x,y,z)=>({x,y,z,copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this;},
    lerp(v,a){this.x+=(v.x-this.x)*a;this.y+=(v.y-this.y)*a;this.z+=(v.z-this.z)*a;return this;},
    distanceToSquared(v){return (this.x-v.x)**2+(this.y-v.y)**2+(this.z-v.z)**2;},
    equals(v){return this.distanceToSquared(v)===0;}});
  const currentTarget=vector(0,0,0), currentOffset=vector(0,0,0);
  const target=vector(1,.4,2), offset=vector(3,4,5);
  const state=advancePresentationCameraPose(currentTarget,currentOffset,target,offset,{hardCut:shot.snap,delta:1/60});
  assert.equal(state.cut,true);assert.equal(state.settled,true);
  assert.equal(currentTarget.distanceToSquared(target),0);assert.equal(currentOffset.distanceToSquared(offset),0);
  const app=fs.readFileSync(path.resolve(__dirname,'../../public/snake-stream/app.js'),'utf8');
  assert.match(app,/resolveSpectatorShot\(cameraMode, frame\.snapshot, reducedMotion\)/);
  assert.match(app,/renderer\.draw\(frame, previousFrame, alpha, timestamp, \{ reducedMotion, cameraMode: activeShot \}\)/);
});
