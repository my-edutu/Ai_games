'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,'../../public/ai-dungeon/occluded-projectile-path.js')).href);
const empty=n=>Array.from({length:n},()=>'.'.repeat(n));
const block=(map,x,z)=>map.map((row,i)=>i===z?row.slice(0,x)+'#'+row.slice(x+1):row);
const start={x:-3,y:1.2,z:0},terminal={x:3,y:1.2,z:0};
const eps=1e-9;
test('clear authority map leaves target-cleared arrow unchanged',async()=>{
 const {planMapFlightClearance}=await load();
 assert.deepEqual(planMapFlightClearance(start,terminal,empty(9)),{fraction:1,travelMeters:6,clipped:false});
});
test('intervening masonry truncates an aimed shot before solid stone',async()=>{
 const {planMapFlightClearance,D04_PROJECTILE_WALL_CLEARANCE_METERS,D04_PROJECTILE_HALF_WIDTH_METERS}=await load();
 const p=planMapFlightClearance(start,terminal,block(empty(9),4,4));
 assert.equal(p?.clipped,true);
 assert.ok(Math.abs(start.x+6*p.fraction-(-.5-D04_PROJECTILE_WALL_CLEARANCE_METERS-D04_PROJECTILE_HALF_WIDTH_METERS))<eps);
});
test('diagonal corner crossings test both orthogonal neighbor cells',async()=>{
 const {planMapFlightClearance}=await load();
 const p=planMapFlightClearance({x:-2,y:1,z:-2},{x:2,y:1,z:2},block(empty(9),3,2));
 assert.equal(p?.clipped,true);assert.ok(p.fraction<.125);
});
test('adjacent wall suppresses embedded flight rather than producing an impact',async()=>{
 const {planMapFlightClearance}=await load();
 assert.equal(planMapFlightClearance(start,terminal,block(empty(9),2,4)),null);
});
test('malformed maps, off-floor sources and blocked starts fail closed',async()=>{
 const {planMapFlightClearance}=await load();const map=empty(9);
 assert.equal(planMapFlightClearance(start,terminal,['...']),null);
 assert.equal(planMapFlightClearance(start,terminal,map.slice(1)),null);
 assert.equal(planMapFlightClearance({...start,x:NaN},terminal,map),null);
 assert.equal(planMapFlightClearance({...start,x:-99},terminal,map),null);
 assert.equal(planMapFlightClearance(start,terminal,block(map,1,4)),null);
});
test('bounded planner is deterministic and cannot mutate public coordinates or tiles',async()=>{
 const {planMapFlightClearance}=await load();
 const map=block(empty(9),4,4),before=map.slice(),s={...start},e={...terminal};
 const a=planMapFlightClearance(s,e,map);
 assert.ok(Object.isFrozen(a));assert.deepEqual(a,planMapFlightClearance(s,e,map));
 assert.deepEqual(map,before);assert.deepEqual(s,start);assert.deepEqual(e,terminal);
});

test('near-grazing arrow clips before adjacent wall even when the centreline stays in an open tile',async()=>{
 const {planMapFlightClearance,D04_PROJECTILE_HALF_WIDTH_METERS}=await load();
 assert.ok(D04_PROJECTILE_HALF_WIDTH_METERS>=.024);
 const p=planMapFlightClearance({x:-3,y:1.2,z:.48},{x:3,y:1.2,z:.48},block(empty(9),4,5));
 assert.equal(p?.clipped,true);assert.ok(p.travelMeters>1.5&&p.travelMeters<2.5);
});
test('parallel centreline with proper lateral wall clearance remains unchanged',async()=>{
 const {planMapFlightClearance}=await load();
 const s={x:-3,y:1.2,z:.38},e={x:3,y:1.2,z:.38};
 assert.deepEqual(planMapFlightClearance(s,e,block(empty(9),4,5)),{fraction:1,travelMeters:6,clipped:false});
});
test('very close brush against wall from source suppresses effect before overlap',async()=>{
 const {planMapFlightClearance}=await load();
 assert.equal(planMapFlightClearance({x:-.6,y:1.2,z:.48},{x:3,y:1.2,z:.48},block(empty(9),4,5)),null);
});
test('parallel open path remains immutable and deterministic',async()=>{
 const {planMapFlightClearance}=await load();
 const map=empty(9),s={x:-3,y:1.2,z:.48},e={x:3,y:1.2,z:.48};
 const a=planMapFlightClearance(s,e,map);
 assert.deepEqual(a,{fraction:1,travelMeters:6,clipped:false});
 assert.ok(Object.isFrozen(a));assert.deepEqual(map,empty(9));
 assert.deepEqual(s,{x:-3,y:1.2,z:.48});assert.deepEqual(e,{x:3,y:1.2,z:.48});
});
test('endpoint on widened wall face still respects longitudinal clearance',async()=>{
 const {planMapFlightClearance,D04_PROJECTILE_HALF_WIDTH_METERS}=await load();
 const p=planMapFlightClearance({x:-3,y:1.2,z:0},
  {x:-.5-D04_PROJECTILE_HALF_WIDTH_METERS,y:1.2,z:0},block(empty(9),4,4));
 assert.equal(p?.clipped,true);assert.ok(p.travelMeters<2.2);
});
test('off-floor terminal clips at padded boundary even with open map perimeter',async()=>{
 const {planMapFlightClearance}=await load();
 const p=planMapFlightClearance({x:3,y:1,z:0},{x:6,y:1,z:0},empty(9));
 assert.equal(p?.clipped,true);assert.ok(p.travelMeters<1.2);
});
test('symmetric backward ray preserves the same widened-wall clearance',async()=>{
 const {planMapFlightClearance}=await load();const map=block(empty(9),4,5);
 const a=planMapFlightClearance({x:-3,y:1,z:.48},{x:3,y:1,z:.48},map),
  b=planMapFlightClearance({x:3,y:1,z:.48},{x:-3,y:1,z:.48},map);
 assert.equal(a?.clipped,true);assert.equal(b?.clipped,true);
 assert.ok(Math.abs(a.travelMeters-b.travelMeters)<eps);
});
