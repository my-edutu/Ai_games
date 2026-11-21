'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const start=html.indexOf('// W226 COURIER_REAL_RECEIVING_ROUTE_BEGIN');
const end=html.indexOf('// W226 COURIER_REAL_RECEIVING_ROUTE_END');
assert(start>=0&&end>start,'RED: actual bounded courier receiving planner is absent');
const dock=[-1,10.2],routeCalls=[];
let reachable=new Set(['-1,10.2']);
const walkable=(x,z)=>reachable.has(x+','+z);
let snapped=false;
const routeBetween=(x,z,tx,tz)=>{
 routeCalls.push([x,z,tx,tz]);
 if(!walkable(tx,tz))return null;
 // Model actual A* behavior: an obstructed exact point returns the nearest
 // snapped node outside the delivery's physical market radius.
 return snapped?[[8,13]]:[[x,z],[tx,tz]];
};
const ctx=vm.createContext({walkable,routeBetween,Math,Object,Number});
vm.runInContext(html.slice(start,end),ctx,{timeout:3000});
const route=vm.runInContext('realCourierReceivingRoute',ctx);
const person={name:'Real farmer',x:17,z:1,delivery:{
 id:'Real farmer:32',resource:'food',amount:2.8,
 destination:dock.slice(),escrowed:true,stage:'travel'}};
const before=JSON.stringify(person);
let result=route(person);
assert.equal(result.length,2);
assert.equal(result.at(-1)[0],dock[0]);
assert.equal(result.at(-1)[1],dock[1]);
assert.equal(JSON.stringify(person),before,'presentation test must not mutate original escrow');
assert(routeCalls.length>0,'real navigation must be consulted');
snapped=true;reachable=new Set(['-1,10.2','-1,9.78']);
assert.equal(route(person),null,'out-of-radius nav snap must not trigger remote unloading');
snapped=false;reachable=new Set(['-1,9.78']);
result=route(person);
assert(result&&Math.hypot(result.at(-1)[0]+1,result.at(-1)[1]-10.2)<=1.35);
const nearby={...person,x:-1.1,z:9.9};
assert.equal(route(nearby).length,1,'real cart physically in the court needs no new path');
reachable=new Set();
assert.equal(route(person),null,'unreachable market must not create a receipt');
assert.equal(JSON.stringify(person),before,'all planner cases must preserve save fields');
assert(html.includes('loadedFreight?1.45:.75'),'real loaded cart must not walk at idle speed');
assert(html.includes("if(Math.hypot(p.x-d.destination[0],p.z-d.destination[1])>1.35)"),
 'real market receipt must remain physically guarded in production');
console.log('W226 physical courier receiving-route contract PASS: real reachable approach, reject distant snap, no fake unloading, original escrow unchanged; browser FPS NOT MEASURED');
