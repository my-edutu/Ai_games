'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
test('source-pinned telegraph follows real shooter direction in original tower-space geometry',async()=>{
 const THREE=await import(pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href);
 const {pointFor}=await import(pathToFileURL(path.join(root,'public/infinite-tower-climb/visuals/coordinates.mjs')).href);
 const source=fs.readFileSync(path.join(root,'public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
 const start=source.indexOf('const THREAT_LANE_SEGMENTS='),end=source.indexOf('// Position-only correction',start);
 assert.ok(start>0&&end>start);
 const helpers=source.slice(start,end);
 const api=vm.runInNewContext('(()=>{'+helpers+';return {createThreatLaneGeometry,poseThreatLane};})()',
 {THREE,pointFor,clamp:THREE.MathUtils.clamp});
 const geometry=api.createThreatLaneGeometry(),lane={geometry};
 assert.equal(geometry.index.count,14*6);
 const frame={worldWidth:480000,chunkBaseY:0},enemy={x:210000,y:100000,facing:1};
 api.poseThreatLane(lane,enemy,frame);
 const first=geometry.getAttribute('position').getX(0),last=geometry.getAttribute('position').getX(28);
 const expected=pointFor(219000,enemy.y,0,480000,26.15);
 assert.ok(Math.abs(first-expected.x)<1e-5);
 const copy=Float32Array.from(geometry.getAttribute('position').array);
 api.poseThreatLane(lane,enemy,frame);assert.deepEqual(Array.from(geometry.getAttribute('position').array),Array.from(copy));
 enemy.facing=-1;api.poseThreatLane(lane,enemy,frame);
 assert.notDeepEqual(Array.from(geometry.getAttribute('position').array),Array.from(copy));
 assert.ok(Number.isFinite(last));geometry.dispose();
});
