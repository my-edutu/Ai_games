'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),load=async file=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'public/ai-dungeon',file),'utf8')).toString('base64'));
function map(broken=false){const n=19,r=Array.from({length:n},(_,z)=>z===0||z===18?'#'.repeat(n):'#'+'.'.repeat(n-2)+'#');if(broken)r[11]=r[11].slice(0,13)+'#'+r[11].slice(14);return r;}
test('exclusive real physical court preserves original route and all other walkable original stone',async()=>{
 const {planWardenBattleFloor,planWardenCourtDetailMask}=await load('warden-battle-floor-plan.js');
 const {planExpeditionStonework}=await load('expedition-stonework-plan.js');
 for(const broken of [false,true]){
  const m=map(broken),exit={x:12,z:12},mask=planWardenCourtDetailMask(planWardenBattleFloor(m,exit,1));
  assert.equal(mask.size,broken?48:49);
  const original=planExpeditionStonework(m,1,exit),after=planExpeditionStonework(m,1,exit,{reservedCells:mask});
  assert.equal(original.walkableCells,original.coveredCells);
  assert.equal(after.reservedCourtCells,mask.size);
  assert.equal(after.walkableCells,after.coveredCells);
  assert.equal(original.coveredCells,after.coveredCells+mask.size);
  assert.equal(after.routeLength,original.routeLength);
  assert.ok(after.stones.length<original.stones.length);
  const all=new Set();
  for(const p of after.stones)for(let dz=0;dz<p.depth;dz++)for(let dx=0;dx<p.width;dx++){
   const gx=p.gridX+dx,gz=p.gridZ+dz,k=gx+','+gz;
   assert.equal(m[gz][gx],'.');assert.equal(mask.has(k),false,'never overlay a real Warden warning tile');
   assert.equal(all.has(k),false,'no double-painted source slab');all.add(k);
  }
  assert.equal(all.size,after.coveredCells);
 }
});
test('invalid reservation fails closed to original full source walkability',async()=>{
 const {planExpeditionStonework}=await load('expedition-stonework-plan.js'),m=map(),exit={x:12,z:12};
 const before=planExpeditionStonework(m,1,exit);
 for(const reserve of [null,new Set(Array.from({length:50},(_,i)=>i+',0'))])
  assert.deepEqual(planExpeditionStonework(m,1,exit,{reservedCells:reserve}),before);
});
test('the actual original 3D renderer uses one authoritative court mask',()=>{
 const stone=fs.readFileSync(path.join(root,'public/ai-dungeon/expedition-stonework.js'),'utf8');
 const scene=fs.readFileSync(path.join(root,'public/ai-dungeon/environment.js'),'utf8');
 assert.ok(stone.includes('planWardenCourtDetailMask(court)'));
 assert.ok(stone.includes('planExpeditionStonework(map,floor,exit,{reservedCells:reserved})'));
 assert.ok(scene.includes('if(battleStone)battleFloorSubstrateSuppressed++'));
 assert.ok(scene.includes('wardenBattleFloorSubstrateSuppressed'));
});
