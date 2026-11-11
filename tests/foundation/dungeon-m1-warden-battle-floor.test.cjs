'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const file=path.resolve(__dirname,'../../public/ai-dungeon/warden-battle-floor-plan.js');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(file,'utf8')).toString('base64'));
function court(){
 const a=Array.from({length:19},()=>Array(19).fill('#'));
 for(let z=6;z<=12;z++)for(let x=6;x<=12;x++)a[z][x]='.';
 a[9][5]='.';a[9][4]='.';return a.map(row=>row.join(''));
}
test('true walkable Warden court has exactly 49 low, real, unblocking flagstones',async()=>{
 const {planWardenBattleFloor:plan}=await load(),map=court(),before=JSON.stringify(map),exit={x:9,z:9};
 const p=plan(map,exit,1);
 assert.equal(p.status,'READY');assert.equal(p.stones.length,49);
 assert.equal(p.collisionChanges,0);assert.ok(p.maxStoneTopMeters<.055);
 const ids=new Set();
 for(const s of p.stones){
  assert.equal(map[s.gridZ][s.gridX],'.');
  assert.ok(Math.max(Math.abs(s.gridX-exit.x),Math.abs(s.gridZ-exit.z))<=3);
  assert.ok(s.width>=.94&&s.width<=.964&&s.depth>=.94&&s.depth<=.964);
  assert.ok(Number.isFinite(s.yaw));ids.add(s.gridX+','+s.gridZ);
 }
 assert.equal(ids.size,49);assert.equal(JSON.stringify(map),before);
 assert.deepEqual(plan(map,exit,1),p);
 assert.equal(plan(map,exit,2).stones.length,49);
});
test('arena stage rejects invalid coordinates and never places stone on a wall',async()=>{
 const {planWardenBattleFloor:plan}=await load(),map=court();
 assert.equal(plan(map,{x:0,z:0},1).stones.length,0);
 assert.equal(plan(map,{x:9,z:9},NaN).status,'UNAVAILABLE');
 assert.equal(plan(['...'],{x:1,z:0},1).status,'UNAVAILABLE');
 const damaged=map.map((row,i)=>i===7?row.slice(0,8)+'#'+row.slice(9):row);
 const p=plan(damaged,{x:9,z:9},1);
 assert.equal(p.stones.length,48);
 assert.ok(!p.stones.some(s=>s.gridX===8&&s.gridZ===7));
});
