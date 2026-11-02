'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),THREE=require('three');
const root=path.resolve(__dirname,'../..');
const script=path.join(root,'public/ai-dungeon/forged-armor.js');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(script,'utf8')).toString('base64'));
const kinds=['vanguard','ranger','mystic','revenant','cultist','warden'];

test('six original role-contoured forged armor shells are real finite indexed meshes with normals',async()=>{
 const {planForgedArmor,createForgedArmorForms}=await load();
 const names=new Set(),counts=[];
 for(const kind of kinds){
  const profile=planForgedArmor(kind);
  assert.ok(Object.isFrozen(profile));names.add(profile.name);
  const forms=createForgedArmorForms(THREE,kind);
  assert.deepEqual(Object.keys(forms).sort(),['cuirass','pauldron','vambrace','greave','fauld','mask','collar','rib','tabard'].sort());
  for(const shape of ['cuirass','pauldron','vambrace','greave','fauld','mask']){
   const geo=forms[shape],position=geo.getAttribute('position');
   assert.ok(geo.index&&position.count>=150&&position.count<300,kind+' '+shape+' bounded indexed sculpt');
   assert.equal(geo.getAttribute('uv').count,position.count);
   assert.equal(geo.getAttribute('normal').count,position.count);
   assert.ok([...position.array,...geo.getAttribute('normal').array].every(Number.isFinite));
   assert.ok(geo.boundingBox.max.y<=.501&&geo.boundingBox.min.y>=-.501);
   assert.ok(Math.max(Math.abs(geo.boundingBox.max.x),Math.abs(geo.boundingBox.min.x))<.9);
  }
  counts.push(forms.cuirass.getAttribute('position').count);
  Object.values(forms).forEach(geo=>geo.dispose());
 }
 assert.equal(names.size,6,'unique silhouettes across the playable hero and villain roles');
 assert.ok(counts.every(count=>count>=200));
 assert.equal(planForgedArmor('missing'),null);
 assert.equal(createForgedArmorForms(THREE,'missing'),null);
});

test('adult source GLB silhouette refit is bounded and role-specific',async()=>{
 const {planAuthoredBodyShape}=await load();
 const widths=new Set();
 for(const kind of kinds){
  const shape=planAuthoredBodyShape(kind);
  assert.ok(Object.isFrozen(shape));
  assert.ok(shape.width>=.83&&shape.width<=.97);
  assert.ok(shape.depth>=.83&&shape.depth<=.97);
  widths.add(shape.width);
 }
 assert.ok(widths.size>=4);
 assert.equal(planAuthoredBodyShape('unknown'),null);
 const source=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(source,/instance\.scale\.set\(fitX,sourceScale,fitZ\)/);
 assert.match(source,/configure\(instance,actor\.u\.kind,owned\)/);
 assert.match(source,/copy\.color\.lerp\(textile/);
});
test('real skinned GLB characters use sculpted forms without changing authority or hand/leg articulation',()=>{
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const host=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 const pure=fs.readFileSync(script,'utf8');
 assert.match(renderer,/createForgedArmorForms\(THREE,actor\.u\.kind\)/);
 assert.match(renderer,/planAnatomicalDrawGroups\(actor\.u\.kind\)/);
 assert.match(renderer,/mergeGeometries\(fragments,false\)/);
 assert.match(renderer,/joint\.attach\(mesh\)/,'the moving bracers and greaves remain on real skeleton joints');
 assert.match(renderer,/sculptedArmorVertices:/);
 assert.match(renderer,/for\(const g of actor\.assetGeometries\|\|\[\]\)g\.dispose\(\)/);
 assert.ok(host.includes("['/dungeon/forged-armor.js','forged-armor.js']"));
 assert.doesNotMatch(pure,/Math\.random|fetch\(|Date\.now|performance\.now|DungeonRuntime|https?:\/\//);
});


test('forged role finishes are unique restrained physical surfaces with no new material groups',async()=>{
 const {planForgedFinishes}=await load();
 const seen=new Set();
 for(const kind of kinds){
  const materials=planForgedFinishes(kind);
  assert.ok(Object.isFrozen(materials),kind+' immutable palette');
  assert.deepEqual(Object.keys(materials).sort(),['steel','bronze','bone','leather','textile'].sort());
  const signature=Object.values(materials).map(v=>v.color).join(',');
  assert.ok(!seen.has(signature),kind+' needs its own hero/enemy color hierarchy');
  seen.add(signature);
  for(const [name,material] of Object.entries(materials)){
   assert.ok(Object.isFrozen(material),name);
   assert.match(material.color,/^#[0-9a-f]{6}$/i);
   assert.ok(material.roughness>=.25&&material.roughness<=1);
   assert.ok(material.metalness>=0&&material.metalness<=1);
  }
 }
 assert.equal(planForgedFinishes('missing'),null);
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(renderer,/planForgedFinishes\(actor\.u\.kind\)/);
 assert.match(renderer,/Object\.fromEntries\(Object\.entries\(materials\)/);
});
