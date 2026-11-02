'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const planner=path.join(root,'public/ai-dungeon/vaulted-wall-plan.js');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(planner,'utf8')).toString('base64'));
test('wall galleries are original, deterministic, impassable and spaced apart',async()=>{
 const {planVaultedWallBays}=await load();
 const size=19,map=Array.from({length:size},(_,z)=>Array.from({length:size},(_,x)=>
  z===0||z===size-1||x===0||x===size-1?'#':z%4===0&&x%3!==0?'#':'.').join(''));
 const exit={x:16,z:16};
 for(const floor of [1,2,3,4,11]){
  const a=planVaultedWallBays(map,floor,exit);
  assert.deepEqual(a,planVaultedWallBays(map,floor,exit));
  assert.ok(a.length>2&&a.length<=72,'multiple vaulted facades, bounded');
  for(const site of a){
   assert.equal(map[site.gridZ][site.gridX],'#');
   assert.equal(map[site.gridZ+site.faceZ][site.gridX+site.faceX],'.');
   assert.ok(Math.abs(site.gridX-exit.x)+Math.abs(site.gridZ-exit.z)>4);
   assert.ok([0,Math.PI/2,Math.PI,-Math.PI/2].includes(site.yaw));
   assert.ok(Math.abs(site.x)<=9&&Math.abs(site.z)<=9);
   assert.equal(a.filter(b=>Math.abs(b.gridX-site.gridX)+Math.abs(b.gridZ-site.gridZ)<2).length,1);
  }
 }
 assert.deepEqual(planVaultedWallBays(map,1,exit,{maxBays:0}),[]);
 assert.ok(planVaultedWallBays(map,1,exit,{maxBays:3}).length<=3);
});
test('invalid architecture plans fail closed and never consult authority RNG',async()=>{
 const {planVaultedWallBays}=await load();
 for(const bad of [null,[],['.#','##'],Array.from({length:12},()=>'.')])
  assert.deepEqual(planVaultedWallBays(bad,1,{x:1,z:1}),[]);
 assert.deepEqual(planVaultedWallBays(Array.from({length:19},()=>'.'.repeat(19)),NaN,null),[]);
 const content=fs.readFileSync(planner,'utf8');
 assert.doesNotMatch(content,/Math\.random|fetch\(|DungeonRuntime|requestAnimationFrame|performance\.now/);
});
test('actual WebGL receives original vaulted-bay 3D batches and cutaway',()=>{
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const host=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 const visuals=fs.readFileSync(path.join(root,'public/ai-dungeon/vaulted-wall-gallery.js'),'utf8');
 assert.match(app,/planVaultedWallBays\(s\.map,s\.floor,s\.exit\)/);
 assert.match(app,/createVaultedWallGallery\(world,vaultedSites,vaultedWallIndices,s\.floor\)/);
 assert.match(app,/world\.userData\.vaultedGallery\?\.cutaway\(wallBands\)/);
 assert.match(app,/enrichEnvironment\(world,s\.map,s\.floor,vaultedSites\)/);
 const dressing=fs.readFileSync(path.join(root,'public/ai-dungeon/environment.js'),'utf8');
 assert.match(dressing,/vaultedFacadeOpenings:/);
 assert.match(dressing,/gallery\?1\.04:2\.31/);
 assert.match(app,/vaultedGallery:world\.userData\.vaultedGallery\?\.metrics\(\)/);
 assert.match(visuals,/new THREE\.InstancedMesh/);
 assert.match(visuals,/band===0\?sx:\.00001/);
 assert.match(visuals,/band===0\?sy\*stageHeight:\.00001/);
 for(const name of ['vaulted-wall-plan.js','vaulted-wall-gallery.js'])
  assert.ok(host.includes("['/dungeon/"+name+"','"+name+"']"));
});
test('a true traversable route guides four distinct vaulted architectural acts without altering the map',async()=>{
 const {planVaultedWallBays}=await load();
 const n=19,map=Array.from({length:n},(_,z)=>Array.from({length:n},(_,x)=>
  z===0||z===n-1||x===0||x===n-1?'#':z%4===0&&x%3!==0?'#':'.').join(''));
 const original=map.join('\n'),sites=planVaultedWallBays(map,1,{x:16,z:16});
 assert.ok(sites.length>=16,'substantial routed corridor architecture');
 assert.ok(new Set(sites.map(s=>s.chapter)).size>=3,'several narrative chapters exist');
 assert.ok(new Set(sites.map(s=>s.style)).size>=3,'physically distinct Gothic shapes are populated');
 assert.ok(sites.filter(s=>s.routeDistance===0).length>=5,'actual legal expedition path receives strongly weighted bay sites');
 for(const site of sites){
  assert.ok(Number.isInteger(site.chapter)&&site.chapter>=0&&site.chapter<=3);
  assert.ok(Number.isInteger(site.style)&&site.style>=0&&site.style<=3);
  assert.ok(Number.isInteger(site.routeDistance)&&site.routeDistance>=0);
  assert.equal(map[site.gridZ][site.gridX],'#');
 }
 assert.equal(map.join('\n'),original,'visual art may never carve an authority wall');
 const art=fs.readFileSync(path.join(root,'public/ai-dungeon/vaulted-wall-gallery.js'),'utf8');
 assert.match(art,/style===1/);
 assert.match(art,/style===2/);
 assert.match(art,/style===3/);
 assert.match(art,/new THREE\.InstancedMesh/);
 assert.match(art,/architecturalProfiles:/);
 assert.doesNotMatch(art,/Math\.random|DungeonRuntime|fetch\(|performance\.now/);
});
