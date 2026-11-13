'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const folder=path.resolve(__dirname,'../../public/ai-dungeon');
const moduleFrom=path=>import('data:text/javascript;base64,'+
 Buffer.from(fs.readFileSync(require('node:path').join(folder,path),'utf8')).toString('base64'));
const MAP=Array.from({length:13},(_,z)=>{
 if(z===0||z===12)return '#'.repeat(13);
 const cells=Array.from({length:13},(_,x)=>x===0||x===12?'#':'.');
 if(z>=4&&z<=6)for(let x=5;x<=7;x++)cells[x]='#';
 return cells.join('');
});
const primary={
 status:'ready',
 route:[...Array.from({length:11},(_,i)=>({gridX:i+1,gridZ:1})),
  ...Array.from({length:10},(_,i)=>({gridX:11,gridZ:i+2}))],
 chapters:[{role:'entry',gridX:1,gridZ:1},
  {role:'ordinary',gridX:8,gridZ:1},{role:'warden',gridX:11,gridZ:11}],
 facades:[],thresholds:[]
};
const k=p=>p.gridZ+','+p.gridX;
const walk=(map,p)=>map[p.gridZ]?.[p.gridX]==='.';
test('a different, real side route reconnects twice without turning wall cells into doors',async()=>{
 const {planAlternateDungeonGallery}=await moduleFrom('alternate-gallery-plan.js');
 const p=planAlternateDungeonGallery(MAP,1,{x:11,z:11},primary,[],[]);
 assert.equal(p.status,'ready');
 assert.ok(p.metrics.branchOnlyCells>=3,'not just a renamed main corridor');
 assert.ok(p.metrics.rejoinIndex>p.metrics.branchIndex+2);
 const encounterIndex=primary.route.findIndex(q=>q.gridX===8&&q.gridZ===1);
 assert.equal(p.metrics.branchIndex<encounterIndex&&
  p.metrics.rejoinIndex>encounterIndex,false,
  'secondary architecture must not suggest skipping the real ordinary combat stage');
 const primarySet=new Set(primary.route.map(k));
 assert.equal(k(p.detour[0]),k(primary.route[p.metrics.branchIndex]));
 assert.equal(k(p.detour.at(-1)),k(primary.route[p.metrics.rejoinIndex]));
 assert.equal(k(p.rejoinedRoute[0]),k(primary.route[0]));
 assert.equal(k(p.rejoinedRoute.at(-1)),k(primary.route.at(-1)));
 for(const cell of p.detour)assert.equal(walk(MAP,cell),true);
 for(const cell of p.detour.slice(1,-1))assert.equal(primarySet.has(k(cell)),false,
  'interior follows a genuinely different, existing navigable lane');
 for(const route of [p.detour,p.rejoinedRoute])for(let i=1;i<route.length;i++){
  const a=route[i-1],b=route[i];
  assert.equal(Math.abs(a.gridX-b.gridX)+Math.abs(a.gridZ-b.gridZ),1);
 }
 assert.equal(p.metrics.navigationEdits,0);assert.equal(p.metrics.combatEdits,0);
 assert.equal(p.metrics.fakeDoorways,0);
 assert.deepEqual(p,planAlternateDungeonGallery(MAP,1,{x:11,z:11},primary,[],[]));
});
test('all alcoves are blind solid-wall extensions and inlays have no ground obstruction',async()=>{
 const {planAlternateDungeonGallery}=await moduleFrom('alternate-gallery-plan.js');
 const p=planAlternateDungeonGallery(MAP,2,{x:11,z:11},primary,[],[]);
 assert.equal(p.status,'ready');
 assert.ok(p.facades.length<=12);
 assert.ok(p.inlays.length<=18);
 assert.equal(p.occluderBounds.length,p.facades.length);
 for(const f of p.facades){
  assert.equal(MAP[f.gridZ][f.gridX],'#');
  assert.equal(MAP[f.gridZ+f.faceZ][f.gridX+f.faceX],'.');
  assert.equal(f.blind,true);
  assert.ok(Math.max(Math.abs(f.gridX-11),Math.abs(f.gridZ-11))>=5);
  assert.ok(f.depth<=.18);
 }
 for(const paving of p.inlays){
  assert.equal(MAP[paving.gridZ][paving.gridX],'.');
  assert.equal(paving.collisionHeight,0);
  assert.ok(paving.drawHeight<.04);
 }
 for(const b of p.occluderBounds){
  assert.ok([b.minX,b.minY,b.minZ,b.maxX,b.maxY,b.maxZ].every(Number.isFinite));
  assert.ok(b.maxY>b.minY);
  assert.equal(MAP[b.supportCell[1]][b.supportCell[0]],'#');
 }
});
test('a legitimate path may contain hazards, but side-gallery route must declare them',async()=>{
 const {planAlternateDungeonGallery}=await moduleFrom('alternate-gallery-plan.js');
 const plain=planAlternateDungeonGallery(MAP,3,{x:11,z:11},primary);
 assert.equal(plain.status,'ready');
 const at=plain.detour[Math.floor(plain.detour.length/2)];
 const trap={x:at.gridX,z:at.gridZ,active:true,disarmed:false};
 const marked=planAlternateDungeonGallery(MAP,3,{x:11,z:11},primary,[],[trap]);
 if(marked.detour.some(p=>p.gridX===trap.x&&p.gridZ===trap.z)){
  assert.ok(marked.metrics.activeHazardCells>=1);
  assert.equal(marked.metrics.hazardFree,false);
 }else assert.equal(marked.metrics.activeHazardCells,0);
 assert.equal(marked.inlays.some(p=>p.gridX===trap.x&&p.gridZ===trap.z),false,
  'shallow new paving may not hide a real active floor trap');
 assert.equal(marked.metrics.navigationEdits,0);
});
test('single-corridor or invalid topology does not create a fictitious loop',async()=>{
 const {planAlternateDungeonGallery}=await moduleFrom('alternate-gallery-plan.js');
 const thin=MAP.map((line,z)=>[...line].map((v,x)=>
  primary.route.some(p=>p.gridX===x&&p.gridZ===z)?'.':'#').join(''));
 for(const p of [planAlternateDungeonGallery(thin,1,{x:11,z:11},primary),
  planAlternateDungeonGallery([],1,{x:11,z:11},primary),
  planAlternateDungeonGallery(MAP,0,{x:11,z:11},primary)]){
  assert.notEqual(p.status,'ready');assert.equal(p.detour.length,0);
  assert.equal(p.facades.length,0);assert.equal(p.inlays.length,0);
 }
});
test('secondary route validates legal boundaries over genuine seeded DungeonRuntime floors',async()=>{
 const {planConnectedDungeonJourney}=await moduleFrom('connected-journey-plan.js');
 const {planAlternateDungeonGallery}=await moduleFrom('alternate-gallery-plan.js');
 let found=0;
 for(const seed of ['visual-room-art-18','dungeon-ui-round17','secondary-aisle-1',
  'secondary-aisle-2','side-gallery-corpus-4','warden-combat-m1']){
  const s=DungeonRuntime.create(seed).publicState();
  const first=planConnectedDungeonJourney(s.map,s.floor,s.exit,s.units);
  const before=JSON.stringify(s);
  const second=planAlternateDungeonGallery(s.map,s.floor,s.exit,first,s.units,s.traps);
  assert.deepEqual(JSON.stringify(s),before);
  if(second.status!=='ready')continue;
  found++;
  assert.ok(second.detour.length>4);
  for(const cell of second.rejoinedRoute)assert.ok(walk(s.map,cell),seed);
  for(let i=1;i<second.rejoinedRoute.length;i++){
   const a=second.rejoinedRoute[i-1],b=second.rejoinedRoute[i];
   assert.equal(Math.abs(a.gridX-b.gridX)+Math.abs(a.gridZ-b.gridZ),1,seed);
  }
  for(const f of second.facades)assert.equal(s.map[f.gridZ][f.gridX],'#');
  assert.equal(second.metrics.combatEdits,0);
 }
 // Individual authentic seeds can legitimately have no alternative.
 // Across this fixed seed corpus, however, at least one true level must
 // exercise the new topology and architecture instead of only its fallback.
 assert.ok(found>=1,'exercise at least one genuine runtime secondary route');
});
test('side gallery integration is render-only and has a bounded disposal path',()=>{
 const env=fs.readFileSync(path.join(folder,'environment.js'),'utf8');
 const src=fs.readFileSync(path.join(folder,'alternate-gallery.js'),'utf8');
 assert.match(env,/createAlternateDungeonGallery/);
 assert.match(env,/alternateGallery\.cutaway/);
 assert.match(env,/alternateGallery\.dispose/);
 assert.match(env,/alternateGallery\.occluderVolumes/);
 assert.match(src,/new THREE\.InstancedMesh/);
 assert.match(src,/instanceMatrix\.needsUpdate/);
 assert.match(src,/dispose\(\)/);
 assert.doesNotMatch(src,/new THREE\.PointLight|new THREE\.DirectionalLight|Math\.random\(|Date\.now\(/);
});
