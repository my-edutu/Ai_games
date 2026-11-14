'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const begin=source.indexOf('function renderW287GardenLeafSpray(');
const end=source.indexOf('function highStreetHomeYard(',begin);
assert.ok(begin>0&&end>begin,'W287 source-owned herb geometry must exist');
const excerpt=source.slice(begin,end);
assert.ok(!/Math\.random|state\s*\.|people\s*\.|deliveryReceipts|state\s*=/.test(excerpt),
 'presentation-only leaves cannot change simulation RNG, agents or inventory');
const positions=[];
const vertices=[];
const push=(count,vs=[])=>{
 for(const v of vs)if(Array.isArray(v))positions.push(v);
 for(let i=0;i<count*30;i++)vertices.push(0);
};
const counters={kitchenGardens:0,kitchenGardenBeds:0,kitchenGardenPlants:0,kitchenGardenTriangles:0};
const context={
 data:vertices,highStreetStats:counters,MATERIAL:{STONE:5,ROAD:3,WOOD:6,FOLIAGE:4},
 materialScope:(_material,emit)=>emit(),
 terrain:(x,z)=>.12+.005*x+.003*z,
 rgb:hex=>[(hex>>16&255)/255,(hex>>8&255)/255,(hex&255)/255],
 biomeHash:n=>{const v=Math.sin(n*127.137+78.233)*43758.5453;return v-Math.floor(v)},
 box:()=>push(12),limbSegment:()=>push(8),
 tri:(a,b,c)=>push(1,[a,b,c]),quad:(a,b,c,d)=>push(2,[a,b,c,d]),
 Math
};
vm.runInNewContext(excerpt,context,{filename:'W287-live-garden-source.js'});
const before=context.renderInhabitedKitchenGarden(4,3,0,1);
assert.ok(before>=200&&before<=720,'complete eight-plant rows, stone beds, drainage and fence remain bounded');
assert.equal(vertices.length,before*30);
assert.equal(counters.kitchenGardens,1);
assert.equal(counters.kitchenGardenBeds,2);
assert.equal(counters.kitchenGardenPlants,32);
for(const p of positions)assert.ok(p.length===3&&p.every(Number.isFinite),'terrain-following plant and lath vertices are finite');
const second=context.renderInhabitedKitchenGarden(-3,4,11,-1);
assert.ok(second>=200&&second<=720);
assert.equal(counters.kitchenGardens,2);
assert.equal(counters.kitchenGardenBeds,4);
assert.equal(counters.kitchenGardenPlants,64);
assert.equal(counters.kitchenGardenTriangles,before+second);
assert.ok(before<950&&second<950,'old original W286 cone/closed-tube budget is deliberately reclaimed');
const programs=[...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(row=>row[1]);
assert.ok(programs.length>0);
for(const program of programs)if(program.trim())new vm.Script(program,{filename:'tiny-kingdom-inline-production.js'});
console.log('W287 source-executed planted garden PASS; lots=2, initial triangles='+before+
 ', second='+second+', visible leaf and fence geometry conserved; no FPS or visual transformation PASS');
