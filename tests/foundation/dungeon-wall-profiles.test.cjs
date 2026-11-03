'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=path.join(__dirname,'../../public/ai-dungeon/wall-profile-plan.js');
async function load(){return import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(source,'utf8')).toString('base64'))}
function sample(){
 const size=19,rows=Array.from({length:size},()=>Array(size).fill('#'));
 for(let z=1;z<size-1;z++)for(let x=1;x<size-1;x++){
  if(z%4===2||x%4===2)rows[z][x]='.';
 }
 return rows.map(row=>row.join(''));
}
const isExposed=(map,x,z)=>[[-1,0],[1,0],[0,-1],[0,1]].filter(([dx,dz])=>map[z+dz]?.[x+dx]==='.').length;
test('wall silhouettes vary deterministically without changing authoritative grid or occupancy',async()=>{
 const {planDungeonWallProfiles}=await load(),map=sample(),unchanged=map.slice();
 const profiles=planDungeonWallProfiles(map,1),again=planDungeonWallProfiles(map,1);
 assert.deepEqual(profiles,again);assert.deepEqual(map,unchanged);
 assert.equal(profiles.length,map.join('').split('').filter(cell=>cell!=='.').length);
 const occupied=new Set();
 for(const p of profiles){
  assert.notEqual(map[p.z][p.x],'.');assert.equal(p.worldX,p.x-9);assert.equal(p.worldZ,p.z-9);
  assert.ok(!occupied.has(p.x+':'+p.z));occupied.add(p.x+':'+p.z);
  assert.equal(p.exposedFaces,isExposed(map,p.x,p.z));
  assert.ok(p.height>=2.48&&p.height<=3.08,'height remains a bounded cosmetic embellishment');
  if(!p.exposedFaces)assert.equal(p.height,2.6,'hidden wall material is not needlessly varied');
 }
 const exposed=profiles.filter(p=>p.exposedFaces);
 assert.ok(exposed.length>20,'sample must contain real exposed corridor walls');
 assert.ok(new Set(exposed.map(p=>p.height)).size>=4,'visible corridors need more than a single rectangular crown height');
});
test('different floors change decorative pattern without touching the map',async()=>{
 const {planDungeonWallProfiles}=await load(),map=sample();
 const first=planDungeonWallProfiles(map,1),second=planDungeonWallProfiles(map,2);
 assert.deepEqual(first.map(({x,z})=>[x,z]),second.map(({x,z})=>[x,z]));
 assert.ok(first.some((p,i)=>p.exposedFaces&&p.height!==second[i].height));
});
test('invalid maps and solid masonry do not create unsafe or unbounded ornaments',async()=>{
 const {planDungeonWallProfiles}=await load();
 assert.deepEqual(planDungeonWallProfiles(null,1),[]);
 assert.deepEqual(planDungeonWallProfiles(['abc','def'],1),[]);
 assert.deepEqual(planDungeonWallProfiles(Array.from({length:65},()=> '#'.repeat(65)),1),[]);
 const solid=planDungeonWallProfiles(Array.from({length:7},()=> '#'.repeat(7)),1);
 assert.equal(solid.length,49);
 assert.ok(solid.every(p=>p.height===2.6&&p.exposedFaces===0));
});

test('camera-readable, varied real-3D room walls retain the unchanged solid authority grid',async()=>{
 const {planDungeonWallProfiles,planLegibleWallMass}=await load(),map=sample();
 const original=map.join('\n'),profiles=planDungeonWallProfiles(map,4);
 const candidates=profiles.filter(p=>p.exposedFaces>0),vaulted=candidates.slice(0,3).map(p=>({gridX:p.x,gridZ:p.z}));
 const heights=planLegibleWallMass(map,4,vaulted);
 assert.equal(heights.length,profiles.length);
 assert.equal(map.join('\n'),original);
 assert.ok(heights.every(h=>Number.isFinite(h)&&h>=.78&&h<=1.98),'ruin silhouettes stay bounded in the original solid tiles');
 assert.ok(heights.filter((h,i)=>profiles[i].exposedFaces&&h<=1.56).length>candidates.length*.60,
  'most corridor walls form low, readable ruins around authentic actors');
 assert.ok(heights.filter((h,i)=>profiles[i].exposedFaces>=2&&h>=.78&&h<=1.02).length>3,
  'physically low broken arcade junctions expose source-rig arms and weapons without altering solid maze walls');
 assert.ok(heights.some(h=>h>=1.76),'distant backing masonry still encloses rooms');
 assert.ok(profiles.filter((p,i)=>p.exposedFaces===1&&heights[i]>=1.76).length>=3,
  'standing piers must physically support stained glass, warm sconces and chipped coping');
 for(const site of vaulted){
  const index=profiles.findIndex(p=>p.x===site.gridX&&p.z===site.gridZ);
  assert.equal(heights[index],1.16,'physical vaulted bays retain low stone plinths');
 }
 assert.deepEqual(heights,planLegibleWallMass(map,4,vaulted));
 const app=fs.readFileSync(path.join(__dirname,'../../public/ai-dungeon/app.js'),'utf8');
 const env=fs.readFileSync(path.join(__dirname,'../../public/ai-dungeon/environment.js'),'utf8');
 assert.match(app,/planLegibleWallMass\(s\.map,s\.floor,vaultedSites\)/);
 assert.match(app,/renderHeight:wallHeights\[i\]/);
 assert.match(env,/claddingHeightByTile\.get\(z\*N\+x\)/);
 assert.match(env,/faceHeight\+\.065/);
 assert.doesNotMatch(fs.readFileSync(source,'utf8'),/Math\.random|performance\.now|Date\.|fetch\(|DungeonRuntime/);
});
