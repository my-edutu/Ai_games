import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createPresentationCameraAnchor } from '../../public/snake-stream/camera.mjs';

const rendererSource=fs.readFileSync(new URL('../../public/snake-stream/renderer.mjs',import.meta.url),'utf8');
const params=(x,z,{mode='follow',runToken='same',head={x,z},offset={x:7,y:9,z:9},reducedMotion=false}={})=>({
  mode,runToken,head,target:{x,y:0,z},offset,reducedMotion
});

test('camera holds the complete original scene for real small continuous head movements without losing overview',()=>{
 const anchor=createPresentationCameraAnchor();
 const a=anchor.resolve(params(3,2));
 assert.equal(a.reset,true);
 const b=anchor.resolve(params(4.1,2.3));
 assert.equal(b.reset,false);
 assert.deepEqual(b.target,a.target);
 assert.deepEqual(b.offset,a.offset);
 const c=anchor.resolve(params(5.8,2.3));
 assert.equal(c.reset,true);
 assert.equal(c.target.x,5.8);
 const overview=anchor.resolve(params(6,2.5,{mode:'overview'}));
 assert.equal(overview.target.x,6);
 assert.equal(overview.offset.x,7);
 assert.equal(anchor.resolve(params(6.1,2.5,{mode:'follow'})).reset,true);
});

test('real portal jump, new run, detail framing and reduced-motion cannot inherit stale camera anchors',()=>{
 const a=createPresentationCameraAnchor();
 a.resolve(params(1,1));
 const portal=a.resolve(params(10,7));
 assert.equal(portal.reset,true);
 assert.deepEqual(portal.target,{x:10,y:0,z:7});
 assert.equal(a.resolve({...params(10.1,7),discontinuity:true}).reset,true);
 assert.equal(a.resolve({...params(10.15,7),discontinuity:true}).reset,false);
 assert.equal(a.resolve({...params(10.18,7),discontinuity:false}).reset,true);
 assert.equal(a.resolve(params(10.2,7,{runToken:'new'})).reset,true);
 assert.equal(a.resolve(params(10.4,7,{mode:'detail'})).reset,true);
 const detail=a.resolve(params(11.2,7,{mode:'detail'}));
 assert.equal(detail.reset,true);
 const reduced=a.resolve(params(11.3,7,{mode:'detail',reducedMotion:true}));
 assert.equal(reduced.reset,true);
 assert.equal(reduced.target.x,11.3);
 assert.equal(a.resolve(params(11.35,7,{mode:'detail'})).reset,true);
});

test('production rendering retains true offscreen cached depth and live full-3D serpent across stable cinematic shots',()=>{
 assert.match(rendererSource,/createPresentationCameraAnchor\(/);
 assert.match(rendererSource,/cinematicAnchor\.resolve\(/);
 assert.match(rendererSource,/cameraTarget\.distanceToSquared\(desiredTarget\)/);
 assert.doesNotMatch(rendererSource,/cameraMode !== 'overview' \|\| cameraOffset\.distanceToSquared/);
 assert.match(rendererSource,/liveCacheQuad\.visible = true/);
 assert.match(rendererSource,/renderer\.render\(scene, camera\)/);
 assert.match(rendererSource,/renderer\.shadowMap\.autoUpdate = false/);
 assert.match(rendererSource,/frameGate\.canDraw\(\)/);
});
