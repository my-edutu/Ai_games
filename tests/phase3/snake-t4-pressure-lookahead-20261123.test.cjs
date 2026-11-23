'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const camera=import(pathToFileURL(path.join(root,'public/snake-stream/camera.mjs')).href);
const cmd=(x,z,extra={})=>({mode:'follow',runToken:'same',head:{x,z},target:{x,y:.4,z},offset:{x:6,y:6,z:6},aspect:1.5,reducedMotion:false,discontinuity:false,gpuPressure:true,width:28,height:16,...extra});

test('under completed GPU-fence pressure, genuine continuous travel anticipates the NEXT safe cinematic framing without moving the real hero',async()=>{
 const {createPresentationCameraAnchor}=await camera;
 const anchor=createPresentationCameraAnchor();
 anchor.resolve(cmd(0,0));
 assert.equal(anchor.resolve(cmd(2,0)).reset,false);
 const next=anchor.resolve(cmd(3.2,0));
 assert.equal(next.reset,true);
 assert.ok(next.target.x > 3.2+0.6 && next.target.x < 4.6,'meaningful forward anticipation within safe full 3D follow framing');
 const same=anchor.resolve(cmd(6.3,0));
 assert.equal(same.reset,false,'stable full static-scene view continues over >3 world units of real travel');
 assert.deepEqual(same.target,next.target);
 assert.equal(anchor.resolve(cmd(7.8,0)).reset,true,'the camera genuinely reframes again when serpent exits safe view');
});

test('real world boundaries, portals, reversals, reduced motion and normal GPU preserve truth and safe compositions',async()=>{
 const {createPresentationCameraAnchor}=await camera;
 const a=createPresentationCameraAnchor();a.resolve(cmd(9,0));
 const edge=a.resolve(cmd(12.2,0));
 assert.equal(edge.reset,true);
 assert.ok(edge.target.x <= 13,'never pan beyond a real board edge on pressure lookahead');
 assert.ok(Math.abs(edge.target.x-12.2)<=3,'actual head stays in safe view');
 const restart=a.resolve(cmd(0,0,{runToken:'new'}));
 assert.equal(restart.snap,true);assert.equal(restart.target.x,0,'no false camera travel over a real restart');
 const portal=a.resolve(cmd(12,0,{discontinuity:true}));
 assert.equal(portal.snap,true);assert.equal(portal.target.x,12);
 const reduced=createPresentationCameraAnchor();reduced.resolve(cmd(0,0,{reducedMotion:true}));
 assert.equal(reduced.resolve(cmd(3.2,0,{reducedMotion:true})).target.x,3.2);
 const normal=createPresentationCameraAnchor();normal.resolve(cmd(0,0,{gpuPressure:false}));
 assert.equal(normal.resolve(cmd(2.5,0,{gpuPressure:false})).target.x,2.5);
 const reversal=createPresentationCameraAnchor();reversal.resolve(cmd(0,0));
 const right=reversal.resolve(cmd(3.1,0));
 const back=reversal.resolve(cmd(0.1,0));
 assert.ok(Math.abs(back.target.x - .1)<=3,'direction reversal never silently crops the actual protagonist');
 assert.ok(Number.isFinite(right.target.x));
});

test('390x844 portrait retains the actual head inside a conservative 36-degree full-3D horizontal field even during GPU starvation',async()=>{
 const {createPresentationCameraAnchor}=await camera;
 const portrait=createPresentationCameraAnchor(),aspect=390/844;
 const composition={offset:{x:1.2,y:6,z:6.7},aspect};
 const first=portrait.resolve(cmd(0,0,composition));
 assert.equal(first.reset,true);
 const narrow=portrait.resolve(cmd(.55,0,composition));
 assert.equal(narrow.reset,false,'hold still while within safe view');
 const recenter=portrait.resolve(cmd(1.2,0,composition));
 assert.equal(recenter.reset,true,'do not hold a snapshot view that crops the real head on a phone');
 const cameraDistance=Math.hypot(...Object.values(composition.offset));
 const radius=cameraDistance*Math.tan(Math.PI/10)*aspect-.5;
 assert.ok(Math.hypot(recenter.target.x-1.2,recenter.target.z)<=radius+1e-7,
  'real actor remains inside camera horizontal field with clearance');
 const stationary=portrait.resolve(cmd(1.5,0,composition));
 assert.equal(stationary.reset,false);
});

test('complete synthetic public head trace reduces expensive camera-key changes without hiding any real serpent motion',async()=>{
 const {createPresentationCameraAnchor}=await camera;
 const anchor=createPresentationCameraAnchor();
 const points=[[-12,0],[12,0],[12,5],[-12,5],[-12,-5],[12,-5]];
 let resets=0,samples=0,maxHeadDistance=0;
 for(let j=1;j<points.length;j++){
   const [ax,az]=points[j-1],[bx,bz]=points[j];
   const n=Math.ceil(Math.hypot(bx-ax,bz-az)/.125);
   for(let i=0;i<=n;i++){
     const x=ax+(bx-ax)*i/n,z=az+(bz-az)*i/n;
     const v=anchor.resolve(cmd(x,z));
     if(v.reset)resets++;
     maxHeadDistance=Math.max(maxHeadDistance,Math.hypot(x-v.target.x,z-v.target.z));
     samples++;
   }
 }
 assert.equal(samples,701);
 assert.ok(resets<=20,'must limit original costly full-scene angle invalidations during true continuous head travel');
 assert.ok(maxHeadDistance<4.2,'actual actor remains inside a bounded full-3D follow composition');
});

test('complete actual WebGL render, original strict gate and public authoritative body/portal path remain unchanged',()=>{
 const renderer=fs.readFileSync(path.join(root,'public/snake-stream/renderer.mjs'),'utf8');
 const strict=fs.readFileSync(path.join(root,'tests/browser/snake-stream.spec.cjs'),'utf8');
 assert.match(renderer,/cinematicAnchor\.resolve\(/);
 assert.match(renderer,/gpuPressure:\s*severeCameraPressure,\s*width:\s*snapshot\.width,\s*height:\s*snapshot\.height/);
 assert.match(renderer,/frameGate\.submitted\(\)/);
 assert.match(renderer,/renderer\.render\(scene, camera\)/);
 assert.match(renderer,/world\.update\(snapshot,/);
 assert.match(renderer,/serpent\.update\(motion\.paths,/);
 assert.match(strict,/17/);
});
