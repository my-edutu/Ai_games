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
const exit={x:14,z:14};
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
