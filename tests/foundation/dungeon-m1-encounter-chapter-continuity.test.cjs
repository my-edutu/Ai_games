'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const src=p=>fs.readFileSync(path.join(root,p),'utf8');
const load=()=>import('data:text/javascript;base64,'+
 Buffer.from(src('public/ai-dungeon/chapter-nave-plan.js')).toString('base64'));
const map=Array.from({length:19},(_,z)=>Array.from({length:19},(_,x)=>
 (x>0&&z>0&&x<18&&z<18&&(
  x>=3&&x<=8&&z>=3&&z<=8 ||
  x>=10&&x<=16&&z>=10&&z<=16))?'.':'#').join(''));
const exit={x:14,z:14};
test('real sources, not unoccupied rooms, anchor bounded native 3D encounter chapters',async()=>{
 const {planChapterNaves}=await load();
 const units=[{id:'enemy-a',kind:'cultist',faction:'enemy',hp:28,x:6,z:6},
  {id:'warden',kind:'warden',faction:'enemy',hp:300,x:14,z:14},
  {id:'fallen',kind:'revenant',faction:'enemy',hp:0,x:5,z:5}];
 const original=JSON.stringify(map),before=JSON.stringify(units);
 const a=planChapterNaves(map,exit,1,units);
 assert.deepEqual(a,planChapterNaves(map,exit,1,units));
 assert.equal(JSON.stringify(map),original);
 assert.equal(JSON.stringify(units),before);
 const active=a.rooms.filter(r=>r.chapterSource==='living-foe');
 assert.ok(active.length>=1,'a true, occupied combat chapter must be staged');
 assert.equal(active[0].sourceThreatId,'enemy-a');
 assert.ok(Math.max(Math.abs(active[0].gridX-6),Math.abs(active[0].gridZ-6))<=1);
 assert.ok(a.rooms.length<=3);
 for(const r of a.rooms)for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)
  assert.equal(map[r.gridZ+dz][r.gridX+dx],'.');
 const none=planChapterNaves(map,exit,1,[units[1],units[2]]);
 assert.equal(none.rooms.some(r=>r.chapterSource==='living-foe'),false,
  'dead actors and the Warden must not be mislabelled as ordinary chapters');
});
test('current living combat pair directs 3D light but never invents a hit',async()=>{
 const {planChapterEncounterBeat}=await load();
 const rooms=[{gridX:6,gridZ:6}],units=[
  {id:'hero',faction:'party',x:6,z:6,hp:60},
  {id:'enemy',faction:'enemy',x:7,z:6,hp:29}];
 const s={run:4,floor:2,units};
 const beat=planChapterEncounterBeat(s,null,rooms);
 assert.equal(beat.focusRoom,0);
 assert.deepEqual(beat.rooms[0].livePair,{
  heroId:'hero',enemyId:'enemy',steps:1,gridX:6.5,gridZ:6});
 assert.equal(beat.authenticWounds,0,'a duo alone never creates damage');
 const next={...s,units:units.map(u=>({...u,hp:u.id==='enemy'?20:u.hp}))};
 assert.equal(planChapterEncounterBeat(next,s,rooms).authenticWounds,1);
 assert.equal(planChapterEncounterBeat(next,{...s,run:3},rooms).authenticWounds,0);
 const solo={...s,units:units.map(u=>({...u,hp:u.id==='enemy'?0:u.hp}))};
 assert.equal(planChapterEncounterBeat(solo,s,rooms).rooms[0].livePair,null);
});
test('the original physically rendered nave and live authoritative fighters share one scene',()=>{
 const app=src('public/ai-dungeon/app.js'),render=src('public/ai-dungeon/chapter-nave.js');
 assert.match(app,/createChapterNaves\(world,s\.map,s\.exit,s\.floor,[\s\S]*?encounterUnits:s\.units/);
 assert.match(render,/planChapterNaves\(map,exit,floor,encounterUnits\)/);
 assert.match(render,/chapterKey\.position\.set\(pair\?pair\.gridX-half/);
 assert.match(render,/chapterKey\.castShadow=false/);
 assert.doesNotMatch(render,/Math\.random\(|fetch\(|DungeonRuntime\(/);
});
