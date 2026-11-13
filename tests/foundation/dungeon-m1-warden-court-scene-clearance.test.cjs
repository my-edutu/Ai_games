'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
async function load(file){
 const text=fs.readFileSync(path.join(root,'public/ai-dungeon',file),'utf8');
 return import('data:text/javascript;base64,'+Buffer.from(text).toString('base64'));
}
const exit={x:9,z:9};
function mapWithWallNiches(){
 const rows=Array.from({length:19},(_,z)=>Array.from({length:19},(_,x)=>
  x>0&&z>0&&x<18&&z<18?'.':'#'));
 // Authentic impassable grid cells, including shallow wall-side niche sites
 // near the court, without adding any extra gameplay or changing a boss.
 for(const [x,z] of [[13,8],[13,10],[11,13],[4,4],[5,15],[15,4],[15,15],[5,4],[14,6],[8,14]])
  rows[z][x]='#';
 return rows.map(row=>row.join(''));
}
const courtDistance=(x,z)=>Math.max(Math.abs(x-exit.x),Math.abs(z-exit.z));
test('M1 actual Warden fighting lane stays free of three competing original scenery systems',async()=>{
 const [{planChapterNaves},{planDungeonSetpieces},{planFloorRuins}]=await Promise.all([
  load('chapter-nave-plan.js'),load('setpiece-plan.js'),load('floor-ruins-plan.js')]);
 const map=mapWithWallNiches(),before=JSON.stringify(map);
 for(const floor of [1,2,4]){
  const chapters=planChapterNaves(map,exit,floor);
  const niches=planDungeonSetpieces(map,floor,exit);
  const wear=planFloorRuins(map,floor,exit);
  assert.ok(chapters.rooms.length>=1,'keep genuine distant traversable chapter rooms');
  assert.ok(niches.length>=1,'keep actual carved wall-side landmarks elsewhere');
  assert.ok(wear.pavers.length>0,'keep authored world material outside the court');
  for(const room of chapters.rooms){
   assert.equal(map[room.gridZ]?.[room.gridX],'.');
   assert.ok(courtDistance(room.gridX,room.gridZ)>4,'no chapter ring within Warden perimeter');
  }
  for(const facade of chapters.reliefs){
   assert.equal(map[facade.gridZ]?.[facade.gridX],'#');
   assert.ok(courtDistance(facade.gridX,facade.gridZ)>4,'no unrelated chapel relief on Warden masonry');
  }
  for(const niche of niches){
   assert.equal(map[niche.z]?.[niche.x],'.');
   assert.ok(courtDistance(niche.x,niche.z)>4,'no large freestanding niches beside boss melee');
  }
  for(const stone of [...wear.pavers,...wear.puddles]){
   assert.equal(map[stone.gridZ]?.[stone.gridX],'.');
   assert.ok(courtDistance(stone.gridX,stone.gridZ)>3,'original boss floor and hazards are unobstructed');
  }
  assert.deepEqual(planChapterNaves(map,exit,floor),chapters,'chapter art remains deterministic');
  assert.deepEqual(planDungeonSetpieces(map,floor,exit),niches,'landmarks remain deterministic');
  assert.deepEqual(planFloorRuins(map,floor,exit),wear,'floor wear remains deterministic');
 }
 assert.equal(JSON.stringify(map),before,'all scene-only changes preserve navigation, boss and AI topology');
});
