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
 const {planMapFlightClearance,D04_PROJECTILE_WALL_CLEARANCE_METERS}=await load();
 const p=planMapFlightClearance(start,terminal,block(empty(9),4,4));
 assert.equal(p?.clipped,true);
 assert.ok(Math.abs(start.x+6*p.fraction-(-.5-D04_PROJECTILE_WALL_CLEARANCE_METERS))<eps);
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
