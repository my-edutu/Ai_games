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
function assertRealCover(map,plan,exit){
 const ids=new Set();
 for(const stone of plan.stones){
  assert.ok(Number.isFinite(stone.x)&&Number.isFinite(stone.z));
  assert.ok(stone.width===.94||stone.width===1.97);
  assert.ok(stone.depth===.94||stone.depth===1.97);
  assert.ok(stone.yaw===0||stone.yaw===Math.PI);
  assert.ok(stone.cells.length>=1&&stone.cells.length<=4);
  assert.equal(stone.cells.length,(stone.width===1.97?2:1)*(stone.depth===1.97?2:1));
  const gx=stone.cells.map(c=>c.x),gz=stone.cells.map(c=>c.z),half=(map.length-1)/2;
  assert.equal(stone.x,(Math.min(...gx)+Math.max(...gx))*.5-half);
  assert.equal(stone.z,(Math.min(...gz)+Math.max(...gz))*.5-half);
  for(const cell of stone.cells){
   assert.equal(map[cell.z][cell.x],'.','cannot bridge a physical wall');
   assert.ok(Math.max(Math.abs(cell.x-exit.x),Math.abs(cell.z-exit.z))<=3);
   const id=cell.x+','+cell.z;
   assert.equal(ids.has(id),false,'must not double-cover walkable floor');
   ids.add(id);
  }
 }
 assert.equal(ids.size,plan.coveredWalkableCells);
 assert.equal(plan.collisionChanges,0);
 assert.ok(plan.maxStoneTopMeters<.055,'physical warning floor must remain above neutral stone');
 return ids;
}
test('real 7x7 Warden court becomes sixteen coherent stone plates without losing 49 true walkable cells',async()=>{
 const {planWardenBattleFloor:plan}=await load(),map=court(),exit={x:9,z:9},before=JSON.stringify(map);
 const result=plan(map,exit,1);
 assert.equal(result.status,'READY');assert.equal(result.stones.length,16);
 assert.equal(result.coveredWalkableCells,49);
 assert.equal(result.stones.filter(p=>p.cells.length===4).length,9);
 assertRealCover(map,result,exit);
 assert.equal(JSON.stringify(map),before,'scene cannot change game map');
 assert.deepEqual(plan(map,exit,1),result,'same seed deterministic without RNG');
 assert.equal(plan(map,exit,2).coveredWalkableCells,49);
});
test('damaged court subdivides only actual walkable cells and never places a slab over a wall',async()=>{
 const {planWardenBattleFloor:plan}=await load(),map=court();
 assert.equal(plan(map,{x:0,z:0},1).stones.length,0);
 assert.equal(plan(map,{x:9,z:9},NaN).status,'UNAVAILABLE');
 assert.equal(plan(['...'],{x:1,z:0},1).status,'UNAVAILABLE');
 const damaged=map.map((row,i)=>i===7?row.slice(0,8)+'#'+row.slice(9):row);
 const p=plan(damaged,{x:9,z:9},1);
 assert.equal(p.coveredWalkableCells,48);
 assertRealCover(damaged,p,{x:9,z:9});
 assert.equal(p.stones.some(s=>s.cells.some(c=>c.x===8&&c.z===7)),false);
});

test('integrated environment suppresses unrelated floor detail on every true cell of a connected Warden plate',async()=>{
 const {planWardenBattleFloor:plan,planWardenCourtDetailMask:mask}=await load();
 const map=court(),p=plan(map,{x:9,z:9},1),all=mask(p);
 assert.equal(p.stones.length,16);
 assert.equal(all.size,49,'one slab origin cannot stand for four danger-floor cells');
 assert.ok(all.has('10,10')&&all.has('12,12')&&all.has('6,6'));
 const walls=map.map((row,z)=>z===7?row.slice(0,8)+'#'+row.slice(9):row);
 const broken=plan(walls,{x:9,z:9},1),coverage=mask(broken);
 assert.equal(coverage.size,48);
 assert.equal(coverage.has('8,7'),false,'cannot mask a genuine blocked cell');
 assert.equal(mask({...p,coveredWalkableCells:48}).size,0,'incoherent data fails closed');
 assert.equal(mask({...p,stones:[...p.stones,p.stones[0]]}).size,0,'duplicate map cell fails closed');
 const actualRender=fs.readFileSync('public/ai-dungeon/environment.js','utf8');
 assert.match(actualRender,/const battleCells=planWardenCourtDetailMask\(wardenBattleFloor\)/);
});
