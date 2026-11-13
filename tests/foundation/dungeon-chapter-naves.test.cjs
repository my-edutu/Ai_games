'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const src=p=>fs.readFileSync(path.join(root,p),'utf8');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(src('public/ai-dungeon/chapter-nave-plan.js')).toString('base64'));
const map=Array.from({length:19},(_,z)=>Array.from({length:19},(_,x)=>{
 if(x>0&&z>0&&x<18&&z<18&&((x>=3&&x<=8&&z>=3&&z<=8)||(x>=10&&x<=16&&z>=10&&z<=16)))return '.';
 return '#';
}).join(''));
// Real exit remains in the second court, leaving another chamber genuinely
// outside the separate boss four-cell scenic exclusion.
const exit={x:16,z:16};
test('real walkable chambers become deterministic, bounded sculpted chapters',async()=>{
 const {planChapterNaves}=await load(),before=JSON.stringify(map);
 const a=planChapterNaves(map,exit,2),b=planChapterNaves(map,exit,2);
 assert.deepEqual(a,b);assert.equal(JSON.stringify(map),before);
 assert.ok(a.rooms.length>=2&&a.rooms.length<=3);
 assert.equal(a.rosettes.length,a.rooms.length*16);
 assert.ok(a.reliefs.length<=a.rooms.length*8);
 for(const r of a.rooms)for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)
  assert.equal(map[r.gridZ+dz][r.gridX+dx],'.');
 for(const f of a.reliefs){
  assert.equal(map[f.gridZ][f.gridX],'#');
  assert.equal(map[f.gridZ+f.faceZ][f.gridX+f.faceX],'.');
 }
 assert.ok(a.reliefs.length>0);
});
test('original physical nave light reflects ONLY genuine timely boss threat',async()=>{
 const {planChapterTension,planChapterNaves}=await load();
 const s={tick:22,bossPhase:'RUPTURE',units:[{kind:'warden',faction:'enemy',hp:99}],
  bossWarning:{attackTick:23,cells:[{x:8,z:9}]}};
 assert.equal(planChapterTension(s).warning,true);
 s.bossWarning.attackTick=14;
 assert.equal(planChapterTension(s).warning,false);
 s.units[0].hp=0;
 assert.equal(planChapterTension(s).phase,'NONE');
 assert.equal(planChapterNaves(map,{x:0,z:0},1).rooms.length,0);
});
test('physical original nave is integrated into actual game build, current authority and camera',()=>{
 const app=src('public/ai-dungeon/app.js'),render=src('public/ai-dungeon/chapter-nave.js'),
  host=src('scripts/serve-dungeon-stream.cjs');
 for(const exp of [/createChapterNaves\(world,s\.map,s\.exit,s\.floor/,/chapterNaves\?\.accept\(s\)/,
  /chapterNaves\?\.cutaway\(partySightlines,camera\.position/,/chapterNaves\?\.dispose\(\)/,
  /chapterNaves:world\.userData\.chapterNaves\?\.metrics/])assert.match(app,exp);
 assert.match(render,/new THREE\.InstancedMesh\(/);
 assert.match(render,/planPartyWallReveal\(/);
 assert.doesNotMatch(render,/Math\.random|fetch\(|DungeonRuntime|https?:/);
 for(const route of ["['/dungeon/chapter-nave.js','chapter-nave.js']",
  "['/dungeon/chapter-nave-plan.js','chapter-nave-plan.js']"])assert.ok(host.includes(route));
});

test('M1 chapter staging proves real room enemies and true same-run HP loss',async()=>{
 const {planChapterEncounterBeat}=await load();
 const rooms=[{gridX:7,gridZ:7},{gridX:12,gridZ:12}];
 const a=(id,faction,x,z,hp)=>({id,faction,x,z,hp});
 const before={run:1,floor:1,units:[a('hero','party',7,7,60),
  a('enemy','enemy',8,7,30),a('far','enemy',18,18,20)]};
 const initial=planChapterEncounterBeat(before,null,rooms);
 assert.equal(initial.focusRoom,0);assert.equal(initial.contestedRooms,1);
 assert.equal(initial.authenticWounds,0);assert.equal(initial.rooms[1].phase,'QUIET');
 const after={...before,units:before.units.map(u=>({...u,
  hp:u.id==='enemy'?23:u.hp}))};
 const contact=planChapterEncounterBeat(after,before,rooms);
 assert.equal(contact.authenticWounds,1);assert.equal(contact.rooms[0].wounds,1);
 assert.equal(planChapterEncounterBeat(after,{...before,run:2},rooms).authenticWounds,0);
 const dead={...before,units:before.units.map(u=>({...u,
  hp:u.id==='enemy'?0:u.hp}))};
 const ended=planChapterEncounterBeat(dead,before,rooms);
 assert.equal(ended.focusRoom,-1);assert.equal(ended.rooms[0].phase,'EXPEDITION');
 assert.equal(ended.authenticWounds,1,'a witnessed fatal loss remains true');
 assert.equal(before.units[1].hp,30,'presentation never changes authority');
 assert.deepEqual(planChapterEncounterBeat({run:1,floor:1,units:[]},null,
  Array(5).fill(rooms[0])).rooms,[]);
});
test('M1 real playable chambers own physical local contact lighting, without phantom AI or collision',()=>{
 const path=require('node:path'),fs=require('node:fs');
 const base=path.resolve(__dirname,'../..');
 const render=fs.readFileSync(base+'/public/ai-dungeon/chapter-nave.js','utf8');
 const app=fs.readFileSync(base+'/public/ai-dungeon/app.js','utf8');
 assert.match(render,/planChapterEncounterBeat\(snapshot,previous,plan\.rooms\)/);
 assert.match(render,/const chapterKey=new THREE\.PointLight/);
 assert.match(render,/verifiedWoundFlashes/);
 assert.match(render,/bladeRelief/);
 assert.match(render,/chapterKey\.castShadow=false/);
 assert.match(app,/chapterNaves\?\.animate\(dt\)/);
 assert.doesNotMatch(render,/Math\.random|createFloor\(|DungeonRuntime\(|fetch\(/);
});
