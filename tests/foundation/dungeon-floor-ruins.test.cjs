'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const source=path.resolve(__dirname,'../../public/ai-dungeon/floor-ruins-plan.js');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(source,'utf8')).toString('base64'));
test('natural stone floor variation remains visual-only and bounded across real dungeons',async()=>{
 const {planFloorRuins}=await load();
 for(let i=0;i<14;i++){
  const state=DungeonRuntime.create('floor-ruins-r33-'+i).publicState();
  const plan=planFloorRuins(state.map,1,state.exit);
  assert.ok(plan.pavers.length>=20&&plan.pavers.length<=144);
  assert.ok(plan.puddles.length>=1&&plan.puddles.length<=22);
  const origin=(state.map.length-1)/2;
  for(const stone of [...plan.pavers,...plan.puddles]){
   assert.equal(state.map[stone.gridZ]?.[stone.gridX],'.');
   assert.ok(Math.abs(stone.gridX-1)+Math.abs(stone.gridZ-1)>3);
   assert.ok(Math.abs(stone.gridX-state.exit.x)+Math.abs(stone.gridZ-state.exit.z)>2);
   assert.ok(Math.abs(stone.x-(stone.gridX-origin))<.45);
   assert.ok(Math.abs(stone.z-(stone.gridZ-origin))<.45);
   assert.ok(stone.y>=0&&stone.y<.08,'all geometry stays below character ankles');
   assert.ok(Number.isFinite(stone.yaw)&&Number.isFinite(stone.sx)&&Number.isFinite(stone.sz));
  }
 }
});
test('floor art is reproducible, biome-distinct, and caps maximum instances',async()=>{
 const {planFloorRuins}=await load();
 const {map,exit}=DungeonRuntime.create('floor-ruins-r33-identity').publicState();
 const first=planFloorRuins(map,1,exit);
 assert.deepEqual(first,planFloorRuins(map,1,exit));
 for(const [floor,theme] of [[1,'crypt'],[2,'ember'],[3,'obsidian'],[4,'hollow'],[5,'crypt']]){
  const p=planFloorRuins(map,floor,exit);
  assert.ok(p.pavers.length>0);assert.ok(p.pavers.every(x=>x.theme===theme));
 }
 const small=planFloorRuins(map,1,exit,{maxPavers:6,maxPuddles:2});
 assert.ok(small.pavers.length<=6&&small.puddles.length<=2);
 assert.ok(planFloorRuins(map,1,exit,{maxPavers:10000,maxPuddles:10000}).pavers.length<=144);
 assert.deepEqual(planFloorRuins(map,1,exit,{maxPavers:0,maxPuddles:0}),{pavers:[],puddles:[]});
});
test('invalid or empty grids fail safely and decorative plan cannot consume authoritative randomness',async()=>{
 const {planFloorRuins}=await load();
 for(const bad of [null,[],['.','.'],['.......','.......','.......','.......','.......','.......','.......']]){
  assert.deepEqual(planFloorRuins(bad,1,{x:1,z:1}),{pavers:[],puddles:[]});
 }
 const src=fs.readFileSync(source,'utf8');
 assert.doesNotMatch(src,/Math\.random|Date\.|performance\.|fetch\(|DungeonRuntime|requestAnimationFrame/);
});
