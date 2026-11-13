'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const modulePath=path.join(root,'public/ai-dungeon/native-cast-finish-plan.js');
async function load(){
 const source=fs.readFileSync(modulePath,'utf8');
 return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}
test('the real three-source-fighter exemplar has distinct original PBR iron and safe anatomical face/eye material',async()=>{
 const {planNativeCastFinish:p}=await load();
 const iron=['vanguard','revenant','warden'].map(k=>p(k,k==='vanguard'?'Knight_Body':'Skeleton_Warrior_Body'));
 assert.equal(new Set(iron.map(x=>x.tint)).size,3);
 for(const f of iron){assert.equal(f.surface,'native-plate');assert.ok(f.mix>=.3&&f.mix<=.45);
  assert.ok(f.roughness>=.5&&f.metalness<=.5);}
 for(const k of ['vanguard','revenant','warden']){
  const h=p(k,k==='vanguard'?'Knight_Head':'Skeleton_Warrior_Head'),eye=p(k,'Skeleton_Warrior_Eyes');
  assert.equal(h.surface,'native-face');assert.ok(h.mix<=.16);
  assert.equal(eye.surface,'eyes');assert.equal(eye.mix,0);assert.equal(eye.metalness,0);
  assert.equal(p(k,'Skeleton_Warrior_Sword').surface,'native-steel');
 }
});
test('non-exemplar actors and malformed/extraneous source meshes preserve original texture/material contract',async()=>{
 const {planNativeCastFinish:p}=await load();
 for(const k of ['ranger','mystic','cultist','alien',null])
  assert.equal(p(k,'Knight_Body'),null);
 for(const name of [null,42,{},'unknown', 'evil'.repeat(100)])
  assert.ok(p('warden',name)===null||p('warden',name).surface==='unmodified');
 assert.equal(p('vanguard','Knight_Cape').surface,'native-leather');
});
test('native color shaping is integrated only with actor-owned GLB materials, original maps and source rig metrics',()=>{
 const s=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(s,/planNativeCastFinish\(kind,obj\.name\)/);
 assert.match(s,/const copy=mat\.clone\(\)/);
 assert.match(s,/const surface=nativeSurfaceTier\(copy,softwareWebGL\)/);
 assert.match(s,/nativeCastFinishMeshes:/);
 const web=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.match(web,/\/dungeon\/native-cast-finish-plan\.js/);
});
