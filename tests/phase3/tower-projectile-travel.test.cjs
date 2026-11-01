'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
test('a real shot creates a bounded curved world-space trail behind its exact current velocity',async()=>{
 const THREE=await import(pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href);
 const {pointFor}=await import(pathToFileURL(path.join(root,'public/infinite-tower-climb/visuals/coordinates.mjs')).href);
 const source=fs.readFileSync(path.join(root,'public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
 const start=source.indexOf('const SHOT_TRACE_SEGMENTS='),end=source.indexOf('// Position-only correction',start);
 assert.ok(start>0&&end>start);
 const helpers=source.slice(start,end);
 const api=vm.runInNewContext('(()=>{'+helpers+';return {createProjectileRibbonGeometry,poseProjectileRibbon};})()',
 {THREE,pointFor,clamp:THREE.MathUtils.clamp});
 const geometry=api.createProjectileRibbonGeometry();assert.equal(geometry.index.count,48);
 const ribbon={geometry},frame={worldWidth:480000,chunkBaseY:0},shot={x:210000,y:90000,vx:12000};
 const before=JSON.stringify(shot);
 api.poseProjectileRibbon(ribbon,shot,frame);
 const points=geometry.getAttribute('position'),head=pointFor(shot.x,shot.y,0,480000,25.8),tail=pointFor(shot.x-12000,shot.y,0,480000,25.8);
 assert.ok(Math.abs(points.getX(0)-head.x)<1e-5 && Math.abs(points.getZ(0)-head.z)<1e-5);
 assert.ok(Math.abs(points.getX(16)-tail.x)<1e-5 && Math.abs(points.getZ(16)-tail.z)<1e-5);
 const forward=Array.from(points.array);assert.ok(forward.every(Number.isFinite));
 api.poseProjectileRibbon(ribbon,{...shot,vx:-12000},frame);
 assert.notDeepEqual(Array.from(points.array),forward);
 assert.equal(JSON.stringify(shot),before,'no authoritative state is modified');
 geometry.dispose();
});
