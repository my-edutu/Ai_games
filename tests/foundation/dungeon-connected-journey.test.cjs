'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const source=fs.readFileSync(path.join(root,'public/ai-dungeon/connected-journey-plan.js'),'utf8');
const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/connected-journey.js'),'utf8');
const host=fs.readFileSync(path.join(root,'public/ai-dungeon/environment.js'),'utf8');
const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
async function load(){return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))}
const legal=(map,x,z)=>map[z]?.[x]==='.';
test('connected chapter plan uses real enemy, actual exit and one legal route across real seeded authorities',async()=>{
 const {planConnectedDungeonJourney:plan}=await load();
 for(const seed of ['visual-room-art-18','dungeon-ui-round17','warden-combat-m1',
  'environment-journey-19','chamber-world-2026','chapter-route-7']){
  const game=DungeonRuntime.create(seed),s=game.publicState(),before=JSON.stringify(s);
  const result=plan(s.map,s.floor,s.exit,s.units);
  assert.equal(result.status,'ready',seed);
  assert.equal(result.metrics.reachable,true,seed);
  assert.deepEqual(result.chapters.map(c=>c.role),['entry','ordinary','warden']);
  assert.deepEqual([result.chapters[0].gridX,result.chapters[0].gridZ],[1,1]);
  assert.deepEqual([result.chapters[2].gridX,result.chapters[2].gridZ],[s.exit.x,s.exit.z]);
  assert.deepEqual([result.route[0].gridX,result.route[0].gridZ],[1,1]);
  assert.deepEqual([result.route.at(-1).gridX,result.route.at(-1).gridZ],[s.exit.x,s.exit.z]);
  for(const cell of result.route)assert.ok(legal(s.map,cell.gridX,cell.gridZ),seed);
  for(let i=1;i<result.route.length;i++){
   const a=result.route[i-1],b=result.route[i];
   assert.equal(Math.abs(a.gridX-b.gridX)+Math.abs(a.gridZ-b.gridZ),1,
    'each adjacent step is actual legal authority topology');
  }
  if(result.metrics.actualOrdinaryEnemy){
   const c=result.chapters[1],enemy=s.units.find(u=>u.id===c.sourceEnemyId);
   assert.ok(enemy&&enemy.faction==='enemy'&&enemy.kind!=='warden'&&enemy.hp>0);
   assert.deepEqual([c.gridX,c.gridZ],[enemy.x,enemy.z]);
   assert.ok(result.route.some(p=>p.gridX===enemy.x&&p.gridZ===enemy.z),
    'architectural tour reaches an actual ordinary encounter');
  }else assert.equal(result.chapters[1].source,'topology-only-no-ordinary-foe');
  assert.equal(JSON.stringify(s),before,'cosmetic planner never mutates authority snapshot');
  assert.deepEqual(result,plan(s.map,s.floor,s.exit,s.units),'same snapshot = same plan');
 }
});
test('structural foundations stay in solid cells; elevated thresholds alone span genuine corridors',async()=>{
 const {planConnectedDungeonJourney:plan}=await load();
 for(const seed of ['visual-room-art-18','dungeon-ui-round17','warden-combat-m1']){
  const s=DungeonRuntime.create(seed).publicState(),p=plan(s.map,s.floor,s.exit,s.units);
  assert.ok(p.thresholds.length<=3&&p.facades.length<=18);
  assert.equal(p.occluderBounds.length,p.thresholds.length*3+p.facades.length);
  for(const box of p.occluderBounds){
   if(box.kind==='solid-blocked-support'||box.kind==='blocked-cell-blind-recess'){
    const [x,z]=box.supportCell;
    assert.equal(s.map[z]?.[x],'#','solid occluder is a real impassable cell');
   }
   if(box.kind==='overhead-vault-crown')
    assert.ok(box.minY>=2.25,'the center of a real corridor is not a fake opaque slab');
  }
  for(const arch of p.thresholds){
   assert.ok(legal(s.map,arch.gridX,arch.gridZ),'only a real corridor gets an elevated arch');
   assert.ok(arch.clearance>=2.25);
   assert.equal(arch.supportCells.length,2);
   for(const [x,z] of arch.supportCells)
    assert.equal(s.map[z]?.[x],'#','uprights must sit in true blocked flank cells');
   const forward=arch.axis==='x'?[[arch.gridX-1,arch.gridZ],[arch.gridX+1,arch.gridZ]]:
    [[arch.gridX,arch.gridZ-1],[arch.gridX,arch.gridZ+1]];
   for(const [x,z] of forward)assert.ok(legal(s.map,x,z),'threshold cannot imply fake door');
  }
  for(const face of p.facades){
   assert.equal(s.map[face.gridZ]?.[face.gridX],'#','blind wall niche cannot block combat');
   assert.ok(legal(s.map,face.gridX+face.faceX,face.gridZ+face.faceZ));
   assert.equal(face.blind,true,'recess is visibly solid; never a false exit');
   if(face.role==='warden'){
    assert.ok(Math.max(Math.abs(face.gridX-s.exit.x),Math.abs(face.gridZ-s.exit.z))>=4,
     'interior Warden fighting lane retains negative space');
   }
  }
  for(const box of p.occluderBounds){
   for(const value of [box.minX,box.minY,box.minZ,box.maxX,box.maxY,box.maxZ])
    assert.ok(Number.isFinite(value),'every culling box bounded and finite');
   assert.ok(box.maxX>box.minX&&box.maxZ>box.minZ&&box.maxY>box.minY);
  }
  assert.equal(p.metrics.walkableGroundObstacles,0);
  assert.equal(p.metrics.collisionEffects,0);
 }
});
test('without a genuine ordinary foe the visual chapter does not invent combat',async()=>{
 const {planConnectedDungeonJourney:plan}=await load();
 const s=DungeonRuntime.create('visual-room-art-18').publicState();
 const p=plan(s.map,s.floor,s.exit,[]);
 assert.equal(p.metrics.actualOrdinaryEnemy,false);
 assert.equal(p.chapters[1].source,'topology-only-no-ordinary-foe');
 assert.ok(p.route.length>0);
});
test('disconnected or malformed map is fail-closed, never fabricates walkability',async()=>{
 const {planConnectedDungeonJourney:plan}=await load();
 const malformed=['#########','#.#######','#########','#########',
  '#########','#########','#######.#','#########','#########'];
 for(const x of [plan([],1,{x:4,z:4}),plan(malformed,1,{x:7,z:6}),
  plan(['#'],1,{x:0,z:0})]){
  assert.equal(x.status,'invalid-or-unreachable');assert.equal(x.thresholds.length,0);
  assert.equal(x.facades.length,0);assert.equal(x.metrics.collisionEffects,0);
 }
});
test('eleven capped role-specific instances, no new lights and explicit disposal are integrated',()=>{
 assert.match(renderer,/new THREE\.InstancedMesh/);
 assert.match(renderer,/facadeStone\(role\)/);
 assert.match(renderer,/facadeShadow\(role\)/);
 assert.match(renderer,/facadeIron\(role\)/);
 assert.match(renderer,/const global= batch\.indices\[local\]/);
 assert.match(renderer,/mesh\.instanceMatrix\.setUsage\(THREE\.DynamicDrawUsage\)/);
 assert.match(renderer,/const batches=\[/);
 assert.match(renderer,/for\(const mesh of meshes\)\{world\.remove\(mesh\);mesh\.dispose\(\);\}/);
 assert.match(renderer,/for\(const g of geometries\)g\.dispose\(\)/);
 assert.match(renderer,/cutaway\(eyes,camera/);
 assert.match(host,/createConnectedDungeonJourney\(world,map,floor,exit,encounterUnits\)/);
 assert.match(host,/connectedJourney\.cutaway\(eyes,camera,wallPad\)/);
 assert.match(host,/connectedJourney\.dispose\(\)/);
 assert.match(host,/connectedJourney\.occluderVolumes/);
 assert.match(app,/enrichEnvironment\(world,s\.map,s\.floor,vaultedSites,s\.exit,s\.units,s\.traps,\{softwareWebGL\}\)/);
 for(const code of [source,renderer]){
  assert.doesNotMatch(code,/Math\.random\(|Date\.now\(|fetch\(|localStorage/);
 }
 assert.doesNotMatch(renderer,/new THREE\.PointLight|new THREE\.DirectionalLight/);
});
