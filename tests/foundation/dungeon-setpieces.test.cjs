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

test('round 40 cavern rim is original, deterministic, safely outside the real map and strictly bounded',async()=>{
 const source=path.join(__dirname,'../../public/ai-dungeon/cavern-rim-plan.js');
 const {planCavernRim}=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(source,'utf8')).toString('base64'));
 for(const mapSize of [13,19,21]){
  const half=(mapSize-1)/2,corner=Math.SQRT2*half;
  for(const floor of [1,2,4,9]){
   const plan=planCavernRim(floor,mapSize);
   assert.equal(plan.near.length,48,'one finite low-poly foreground ridge batch');
   assert.equal(plan.far.length,32,'one finite low-poly distance ridge batch');
   assert.deepEqual(plan,planCavernRim(floor,mapSize),'identical inputs must preserve cosmetic replay');
   for(const t of [...plan.near,...plan.far]){
    assert.equal(t.length,7);
    assert.ok(t.every(Number.isFinite),'no invalid GPU instance matrices');
    const [x,y,z,sx,sy,sz]=t;
    assert.ok(Math.hypot(x,z)-Math.max(sx,sz)>corner+2,'even the rotated unit-radius rock bounding sphere remains well outside the authority map');
    assert.ok(y>0&&y<12&&sx>1&&sx<6&&sy>3&&sy<21&&sz>1&&sz<6,'bounded physical silhouettes');
   }
  }
 }
});
test('round 40 scenic rim rejects invalid floor/map inputs and never consumes authoritative randomness',async()=>{
 const source=path.join(__dirname,'../../public/ai-dungeon/cavern-rim-plan.js');
 const code=fs.readFileSync(source,'utf8');
 const {planCavernRim}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 const empty={near:[],far:[]};
 for(const floor of [0,-1,NaN,Infinity,1.5])assert.deepEqual(planCavernRim(floor,19),empty);
 for(const size of [0,4,18,130,NaN])assert.deepEqual(planCavernRim(1,size),empty);
 assert.notDeepEqual(planCavernRim(1,19),planCavernRim(2,19),'different floors deserve distinct scenic geography');
 assert.doesNotMatch(code,/Math\.random|Date\.|performance\.|DungeonRuntime|fetch\(/);
});
test('round 40 genuine Three.js atmosphere includes two bounded instanced rock families with full disposal',()=>{
 const atmosphere=fs.readFileSync(path.join(__dirname,'../../public/ai-dungeon/biome-atmosphere.js'),'utf8');
 const host=fs.readFileSync(path.join(__dirname,'../../scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.match(atmosphere,/import \{planCavernRim\} from '\/dungeon\/cavern-rim-plan\.js'/);
 assert.match(atmosphere,/planCavernRim\(floor,size\)/);
 assert.match(atmosphere,/rimNear:/);
 assert.match(atmosphere,/rimFar:/);
 assert.match(atmosphere,/new THREE\.DodecahedronGeometry/);
 assert.match(host,/\['\/dungeon\/cavern-rim-plan\.js','cavern-rim-plan\.js'\]/);
 assert.match(atmosphere,/for\(const g of geometries\)g\.dispose\(\)/);
});

test('round 40 real exterior rocks are grounded at full mesh radius rather than hovering above the dungeon',async()=>{
 const {planCavernRim}=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(__dirname,'../../public/ai-dungeon/cavern-rim-plan.js'),'utf8')).toString('base64'));
 for(const rock of [...planCavernRim(1,19).near,...planCavernRim(1,19).far]){
  const [,y,, ,height]=rock;
  assert.ok(Math.abs(y-(height/2-.18))<1e-10,'rock centre matches a unit-radius mesh ground intersection');
 }
 const atmosphere=fs.readFileSync(path.join(__dirname,'../../public/ai-dungeon/biome-atmosphere.js'),'utf8');
 assert.match(atmosphere,/new THREE\.DodecahedronGeometry\(1,1\)/,'the actual mesh must use unit radius so rocks reach the cavern floor');
});
