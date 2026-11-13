'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=path.resolve(__dirname,'../../public/ai-dungeon/expedition-stonework-plan.js');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(source,'utf8')).toString('base64'));
const square=(n=19)=>Array.from({length:n},(_,z)=>Array.from({length:n},(_,x)=>
 x===0||z===0||x===n-1||z===n-1?'#':'.').join(''));
const scenarios=()=>{
 const actual=require('../../dist/games/ai-dungeon/src/index.js');
 return Array.from({length:18},(_,i)=>actual.DungeonRuntime.create('gothic-expedition-'+i).publicState());
};
test('original multi-cell stonework covers real walkable map exactly once, never wall or boss collision',async()=>{
 const {planExpeditionStonework}=await load();
 for(const state of scenarios()){
  const plan=planExpeditionStonework(state.map,state.floor,state.exit);
  const size=state.map.length,covered=new Set(),walkable=state.map.join('').split('').filter(c=>c==='.').length;
  assert.equal(plan.coveredCells,walkable);
  assert.equal(plan.walkableCells,walkable);
  assert.ok(plan.routeLength>5);
  assert.ok(plan.stones.length<=walkable);
  assert.ok(plan.largestSpan>=2,'architecture has real multi-cell original paving');
  for(const slab of plan.stones){
   assert.ok(slab.width>=1&&slab.width<=3&&slab.depth>=1&&slab.depth<=2||slab.width===1&&slab.depth===3);
   assert.ok(slab.finish>=0&&slab.finish<=2);
   assert.ok(slab.chapter>=0&&slab.chapter<=3);
   assert.ok(Math.abs(slab.yaw)<=.015);
   for(let z=slab.gridZ;z<slab.gridZ+slab.depth;z++)for(let x=slab.gridX;x<slab.gridX+slab.width;x++){
    assert.equal(state.map[z]?.[x],'.','never pave an impassable wall');
    const key=z*size+x;assert.ok(!covered.has(key),'cannot double-pave real cell');covered.add(key);
   }
  }
  assert.equal(covered.size,walkable);
  assert.deepEqual(plan,planExpeditionStonework(state.map,state.floor,state.exit));
 }
});
test('route-based chapter stone profiles vary physically in a real sized chamber',async()=>{
 const {planExpeditionStonework}=await load(),map=square();
 const a=planExpeditionStonework(map,1,{x:17,z:17}),b=planExpeditionStonework(map,2,{x:17,z:17});
 assert.equal(a.walkableCells,289);assert.equal(a.coveredCells,289);
 assert.equal(a.chapters,4);
 assert.ok(a.stones.some(s=>s.width*s.depth>=4));
 assert.ok(a.stones.some(s=>s.finish===2),'last-act court uses distinct stone');
 assert.ok(a.stones.some(s=>s.finish===0),'genuine travelled route has distinct stone');
 assert.notDeepEqual(a.stones,b.stones,'biome and seeded chiselling has physical variety');
});
test('malformed or blocked real source cannot create false doors, random movement or external dependencies',async()=>{
 const {planExpeditionStonework}=await load();
 for(const map of [null,[],['.', '#'],square(7).map((s,i)=>i===1?'#######':s)]){
  const p=planExpeditionStonework(map,1,{x:5,z:5});
  assert.deepEqual(p.stones,[]);
 }
 const src=fs.readFileSync(source,'utf8');
 assert.doesNotMatch(src,/Math\.random|Date\.|performance\.|fetch\(|requestAnimationFrame|DungeonRuntime|import /);
});
