'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const project=path.resolve(__dirname,'../..');
const root=path.join(project,'public/ai-dungeon');
const load=()=>import(pathToFileURL(path.join(root,'unconfirmed-projectile-flight.js')).href);
const start={x:0,y:1.15,z:0},target={x:3,y:1.19,z:0};
test('merely aimed projectile stops short and does not invent contact',async()=>{
 const {planUnconfirmedFlight,UNCONFIRMED_TARGET_CLEARANCE_METERS}=await load();
 const a=planUnconfirmedFlight(start,target,0),
  b=planUnconfirmedFlight(start,target,.5),
  c=planUnconfirmedFlight(start,target,1);
 assert.ok(a&&b&&c);
 assert.deepEqual(a.position,start);
 assert.ok(Math.abs(b.position.x-c.position.x/2)<1e-12,'linear instead of target-homing ease');
 assert.ok(Math.hypot(c.position.x-target.x,c.position.z-target.z)>=UNCONFIRMED_TARGET_CLEARANCE_METERS-1e-9);
 assert.equal('hit' in c,false);
});
test('cardinal and diagonal shots retain non-contact clearance',async()=>{
 const {planUnconfirmedFlight,UNCONFIRMED_TARGET_CLEARANCE_METERS}=await load();
 for(const [x,z] of [[-3,0],[0,-2],[0,4],[2,2]]){
  const end={x,y:1.1,z},p=planUnconfirmedFlight(start,end,1);
  assert.ok(p);
  assert.ok(Math.hypot(end.x-p.position.x,end.z-p.position.z)>=UNCONFIRMED_TARGET_CLEARANCE_METERS-1e-9);
  assert.ok(Math.abs(Math.hypot(p.direction.x,p.direction.y,p.direction.z)-1)<1e-10);
 }
});
test('near overlap, invalid inputs and reverse time fail closed',async()=>{
 const {planUnconfirmedFlight}=await load();
 assert.equal(planUnconfirmedFlight(start,{x:.8,y:1,z:0},1),null);
 assert.equal(planUnconfirmedFlight(start,{x:NaN,y:1,z:0},1),null);
 assert.equal(planUnconfirmedFlight(start,target,Infinity),null);
 assert.equal(planUnconfirmedFlight(start,target,-1),null);
 assert.deepEqual(planUnconfirmedFlight(start,target,3).position,planUnconfirmedFlight(start,target,1).position);
});
test('flight is deterministic, frozen and does not mutate combat state',async()=>{
 const {planUnconfirmedFlight}=await load();
 const a={...start},b={...target};
 const first=planUnconfirmedFlight(a,b,.67),again=planUnconfirmedFlight(a,b,.67);
 assert.deepEqual(first,again);assert.deepEqual(a,start);assert.deepEqual(b,target);
 assert.ok(Object.isFrozen(first)&&Object.isFrozen(first.position));
});
test('opt-in visual stage uses non-contact planner rather than arrival-at-target easing',()=>{
 const source=fs.readFileSync(path.join(root,'physical-feedback-visuals.js'),'utf8');
 assert.match(source,/import \{planUnconfirmedFlight\} from '\.\/unconfirmed-projectile-flight\.js';/);
 assert.match(source,/planUnconfirmedFlight\(start,flightDestination,0\)/);
 assert.match(source,/planUnconfirmedFlight\(origin,end,t\)/);
 assert.doesNotMatch(source,/const speed=t\*t\*\(3-2\*t\)/);
});
