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
