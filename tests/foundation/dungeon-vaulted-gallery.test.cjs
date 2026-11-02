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
  assert.ok(a.length>2&&a.length<=32,'multiple vaulted facades, bounded');
  for(const site of a){
   assert.equal(map[site.gridZ][site.gridX],'#');
   assert.equal(map[site.gridZ+site.faceZ][site.gridX+site.faceX],'.');
   assert.ok(Math.abs(site.gridX-exit.x)+Math.abs(site.gridZ-exit.z)>4);
   assert.ok([0,Math.PI/2,Math.PI,-Math.PI/2].includes(site.yaw));
   assert.ok(Math.abs(site.x)<=9&&Math.abs(site.z)<=9);
   assert.equal(a.filter(b=>Math.abs(b.gridX-site.gridX)+Math.abs(b.gridZ-site.gridZ)<3).length,1);
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
 assert.match(app,/vaultedGallery:world\.userData\.vaultedGallery\?\.metrics\(\)/);
 assert.match(visuals,/new THREE\.InstancedMesh/);
 assert.match(visuals,/band===0\?1:\.00001/);
 for(const name of ['vaulted-wall-plan.js','vaulted-wall-gallery.js'])
  assert.ok(host.includes("['/dungeon/"+name+"','"+name+"']"));
});