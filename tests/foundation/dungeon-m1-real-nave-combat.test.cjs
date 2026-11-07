'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {DungeonRuntime,MAP_SIZE,shortestPath,planExpeditionCombatNaves,assertDungeonState}=
 require('../../dist/games/ai-dungeon/src/index.js');

function fixture(){
 const map=Array.from({length:MAP_SIZE},()=>Array(MAP_SIZE).fill('#'));
 const route=[[1,1],[5,1],[5,9],[13,9],[13,13]];
 for(let k=1;k<route.length;k++){
  const [ax,az]=route[k-1],[bx,bz]=route[k];
  const dx=Math.sign(bx-ax),dz=Math.sign(bz-az);
  for(let x=ax,z=az;;x+=dx,z+=dz){
   map[z][x]='.';if(x===bx&&z===bz)break;
  }
 }
 return {rows:map.map(row=>row.join('')),spawn:{x:1,z:1},exit:{x:13,z:13}};
}

test('real traverse route gains spaced three-dimensional combat bays without bypassing earned Warden approach',()=>{
 const {rows,spawn,exit}=fixture();
 const first=planExpeditionCombatNaves(rows,spawn,exit);
 const second=planExpeditionCombatNaves(rows,spawn,exit);
 assert.deepEqual(first,second,'the staging must be purely authoritative/deterministic');
 assert.ok(first.centers.length>=2,'three-stage route should make multiple actual chambers');
 assert.ok(first.map.join('').split('.').length>rows.join('').split('.').length,
  'new chamber stone is actually walkable, not invisible render-only collision');
 assert.ok(shortestPath(first.map,spawn,exit).length>=12,'the Warden must still be earned');
 for(const {x,z} of first.centers){
  for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)
   assert.equal(first.map[z+dz][x+dx],'.','a fight bay has nine real legal floor tiles');
 }
 assert.equal(rows[4][4],'#','input source map was not mutated');
});

test('live seeds generate navigable honest combat stages with legal actors and fully replayable changes',()=>{
 for(let n=0;n<24;n++){
  const a=DungeonRuntime.create('m1-natural-naves-'+n),b=DungeonRuntime.create('m1-natural-naves-'+n);
  assertDungeonState(a.state);
  assert.ok(shortestPath(a.state.map,{x:1,z:1},a.state.exit).length>=12);
  assert.deepEqual(a.save(),b.save(),'world and foe placement must share exactly the same seeded result');
  for(let i=0;i<80;i++){
   const one=a.step(),two=b.step();
   assert.equal(one.checksum,two.checksum,'the authored traversal and combat stays deterministic');
  }
  const restored=DungeonRuntime.restore(a.save());
  assert.deepEqual(restored.publicState(),a.publicState());
 }
});
