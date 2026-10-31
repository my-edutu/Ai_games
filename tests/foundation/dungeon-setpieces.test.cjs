'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const source=path.join(__dirname,'../../public/ai-dungeon/setpiece-plan.js');
async function load(){return import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(source,'utf8')).toString('base64'))}
const adjacent=(map,x,z)=>[[-1,0],[1,0],[0,-1],[0,1]].some(([dx,dz])=>map[z+dz]?.[x+dx]==='#');
test('wall-hugging landmarks are bounded, separated, and safe near the entrance and portal',async()=>{
 const {planDungeonSetpieces}=await load();
 for(let seed=0;seed<12;seed++){
  const state=DungeonRuntime.create('setpiece-qa-'+seed).publicState();
  const placements=planDungeonSetpieces(state.map,1,state.exit);
  assert.ok(placements.length>=4&&placements.length<=8,'expected a small selection of landmarks');
  for(const p of placements){
   assert.equal(state.map[p.z]?.[p.x],'.');
   assert.ok(adjacent(state.map,p.x,p.z),'must be located next to a real wall');
   assert.ok(Math.abs(p.x-1)+Math.abs(p.z-1)>4,'protect entrance');
   assert.ok(Math.abs(p.x-state.exit.x)+Math.abs(p.z-state.exit.z)>3,'protect exit');
   assert.equal(state.map[p.z+p.dz]?.[p.x+p.dx],'#','facing actual wall');
   assert.ok(Number.isFinite(p.worldX)&&Number.isFinite(p.worldZ));
   assert.ok(Math.abs(p.worldX-(p.x-9))<=.41&&Math.abs(p.worldZ-(p.z-9))<=.41);
   assert.ok(['ossuary','forge','orrery','scriptorium'].includes(p.motif));
  }
  for(let i=0;i<placements.length;i++)for(let j=i+1;j<placements.length;j++){
   const a=placements[i],b=placements[j];assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>=2.4,'separate distinct landmarks');
  }
 }
});
test('same map and floor are reproducible and floor changes the artistic family',async()=>{
 const {planDungeonSetpieces}=await load();const {map,exit}=DungeonRuntime.create('setpiece-invariance').publicState();
 const first=planDungeonSetpieces(map,1,exit),again=planDungeonSetpieces(map,1,exit);
 assert.deepEqual(first,again);assert.ok(first.every(x=>x.motif==='ossuary'));
 for(const [floor,motif] of [[2,'forge'],[3,'orrery'],[4,'scriptorium'],[5,'ossuary']]){
  const other=planDungeonSetpieces(map,floor,exit);
  assert.ok(other.length>0);assert.ok(other.every(x=>x.motif===motif),`floor ${floor}`);
 }
});
test('degenerate grids, all-open spaces, and strict budgets do not create props',async()=>{
 const {planDungeonSetpieces}=await load();
 assert.deepEqual(planDungeonSetpieces([],1,{x:1,z:1}),[]);
 assert.deepEqual(planDungeonSetpieces(['.....','.....','.....','.....','.....'],1,{x:4,z:4}),[]);
 const {map,exit}=DungeonRuntime.create('setpiece-limit').publicState();
 assert.equal(planDungeonSetpieces(map,2,exit,0).length,0);
 assert.ok(planDungeonSetpieces(map,2,exit,3).length<=3);
 assert.ok(planDungeonSetpieces(map,2,exit,100).length<=8);
});
