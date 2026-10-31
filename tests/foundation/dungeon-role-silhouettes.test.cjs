'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.resolve(__dirname,'../..');
const SOURCE=path.join(ROOT,'public/ai-dungeon/role-silhouette-plan.js');
const ROLES=['vanguard','ranger','mystic','revenant','cultist'];
async function loadPlan(){
 const source=fs.readFileSync(SOURCE,'utf8');
 return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}
test('five original class silhouettes are distinct, bounded and entirely cosmetic',async()=>{
 const {planRoleSilhouette}=await loadPlan();
 const signatures=[];
 for(const kind of ROLES){
  const parts=planRoleSilhouette(kind);
  assert.ok(parts.length>=7&&parts.length<=12,kind+': bounded original details');
  assert.equal(new Set(parts.map(p=>p.id)).size,parts.length,kind+': unique identifiers');
  assert.ok(parts.some(p=>p.shape==='arc'||p.shape==='spike'),kind+': recognisable silhouette');
  signatures.push(parts.map(p=>p.id).join('|'));
  for(const part of parts){
   assert.ok(['plate','lamella','spike','gem','rod','arc'].includes(part.shape),part.id);
   assert.ok(['iron','antique','leather','arcane'].includes(part.finish),part.id);
   if(part.shape==='arc'){
    assert.equal(part.points.length,4,part.id);
    for(const point of part.points){
     assert.equal(point.length,3,part.id);
     assert.ok(point.every(Number.isFinite),part.id);
     assert.ok(Math.abs(point[0])<=.95&&point[1]>=.20&&point[1]<=2.35&&Math.abs(point[2])<=.70,part.id);
    }
   } else {
    assert.ok([part.x,part.y,part.z,part.sx,part.sy,part.sz,part.rz].every(Number.isFinite),part.id);
    assert.ok(Math.abs(part.x)<=.95&&part.y>=.2&&part.y<=2.35&&Math.abs(part.z)<=.70,part.id);
    assert.ok(part.sx>.012&&part.sx<=1.1&&part.sy>.012&&part.sy<=1.65&&part.sz>.012&&part.sz<=.75,part.id);
    assert.ok(Math.abs(part.rz)<=.90,part.id);
   }
  }
  assert.equal(planRoleSilhouette(kind),parts,kind+': stable recipe identity');
  assert.ok(Object.isFrozen(parts),kind+': shared plan immutable');
 }
 assert.equal(new Set(signatures).size,ROLES.length,'roles cannot be identical re-colours');
 for(const kind of ['warden','vanguard-copy',null,undefined,''])assert.deepEqual(planRoleSilhouette(kind),[]);
});
test('silhouette recipes cannot influence simulation, allocate from a frame clock or import external assets',async()=>{
 const {planRoleSilhouette}=await loadPlan();
 const before=JSON.stringify(planRoleSilhouette('ranger'));
 const p=planRoleSilhouette('ranger');
 assert.ok(p.some(x=>x.shape==='arc'&&x.points.every(Object.isFrozen)),'bow shape uses original frozen local curves');
 assert.equal(JSON.stringify(p),before);
 const source=fs.readFileSync(SOURCE,'utf8');
 assert.doesNotMatch(source,/Math\.random|Date\.|performance\.|requestAnimationFrame|fetch\(|DungeonRuntime|localStorage/);
});
test('real GLB renderer owns disposable class regalia and exposes truthful WebGL diagnostics',()=>{
 const assets=fs.readFileSync(path.join(ROOT,'public/ai-dungeon/model-assets.js'),'utf8');
 const server=fs.readFileSync(path.join(ROOT,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.ok(assets.includes("import {planRoleSilhouette} from '/dungeon/role-silhouette-plan.js'"));
 assert.match(assets,/function addRoleSilhouette\(actor\)/);
 assert.match(assets,/actor\.roleSilhouetteParts=plan\.length/);
 assert.match(assets,/addRoleSilhouette\(actor\)/);
 assert.match(assets,/roleSilhouetteParts:/);
 assert.match(assets,/for\(const g of actor\.assetGeometries\|\|\[\]\)g\.dispose\(\)/);
 assert.ok(server.includes("['/dungeon/role-silhouette-plan.js','role-silhouette-plan.js']"));
});

test('the dedicated Chromium suite actually discovers this class-silhouette browser audit',()=>{
 const config=fs.readFileSync(path.join(ROOT,'tests/browser/dungeon.playwright.config.cjs'),'utf8');
 assert.ok(config.includes("'dungeon-role-silhouettes.spec.cjs'"),'new browser contract must not silently disappear from the explicit testMatch whitelist');
});
