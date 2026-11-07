'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
async function planner(){
 const js=fs.readFileSync(path.join(root,'public/ai-dungeon/warden-regalia-plan.js'),'utf8');
 return import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
}
test('Warden gets a distinctive original upper-body silhouette; ordinary actors get no boss regalia',async()=>{
 const {planWardenRegalia}=await planner();
 for(const kind of ['vanguard','ranger','mystic','revenant','cultist',null,'warden-copy'])assert.deepEqual(planWardenRegalia(kind),[]);
 const pieces=planWardenRegalia('warden');
 assert.ok(pieces.length>=20&&pieces.length<=28,'boss decorations use bounded draw calls');
 assert.equal(new Set(pieces.map(p=>p.id)).size,pieces.length,'every part has an independent identifier');
 for(const side of [-1,1]){
  assert.ok(pieces.some(p=>p.id===(side<0?'left-horn':'right-horn')&&p.shape==='horn'));
  assert.ok(pieces.some(p=>p.id===(side<0?'left-pauldron':'right-pauldron')&&p.shape==='plate'));
 }
 assert.ok(pieces.some(p=>p.shape==='gem'&&p.finish==='ember'));
 assert.ok(pieces.filter(p=>p.id.startsWith('back-spine-')).length>=4);
});
test('Warden figure remains human-proportioned and clear of adjacent animated melee allies',async()=>{
 const {planWardenRegalia}=await planner();
 const pieces=planWardenRegalia('warden');
 const xExtent=Math.max(...pieces.flatMap(p=>p.shape==='horn'?p.points.map(pt=>Math.abs(pt[0])):[Math.abs(p.x)+p.sx/2]));
 const yExtent=Math.max(...pieces.flatMap(p=>p.shape==='horn'?p.points.map(pt=>pt[1]):[p.y+p.sy/2]));
 assert.ok(xExtent<=.78,'the old 1.09m lateral horns occluded neighbouring protagonists; new max='+xExtent);
 assert.ok(yExtent<=2.30,'the original 2.49m bone horns hid the boss head and contact; new max='+yExtent);
 assert.ok(pieces.some(p=>p.id==='sternum'&&p.sz<.08),'the sculpted chest must remain visible beneath shallow regalia');
 assert.ok(pieces.some(p=>p.id==='brow-diadem'),'readable crown and visor remain');
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/plaque=new THREE.ExtrudeGeometry/,'the original plaques must have real chamfered depth');
 assert.match(model,/plaque\.center\(\)/,'plaques should remain attached at their planned rig pivot');
});

test('all regalia geometry is finite, bounded and behind a renderer-only contract',async()=>{
 const {planWardenRegalia}=await planner();
 const pieces=planWardenRegalia('warden');
 const shapes=new Set(['plate','spike','gem','lamella','horn']);
 const finishes=new Set(['iron','brass','bone','ember']);
 for(const p of pieces){
  assert.ok(shapes.has(p.shape),p.id);assert.ok(finishes.has(p.finish),p.id);
  if(p.shape==='horn'){
   assert.equal(p.points.length,4,p.id);
   for(const v of p.points){assert.equal(v.length,3,p.id);assert.ok(v.every(Number.isFinite),p.id);assert.ok(Math.abs(v[0])<=1.2&&v[1]>=1.5&&v[1]<=2.6&&Math.abs(v[2])<=.65,p.id)}
  }else{
   assert.ok([p.x,p.y,p.z,p.sx,p.sy,p.sz,p.rz].every(Number.isFinite),p.id);
   assert.ok(Math.abs(p.x)<=1.2&&p.y>=.45&&p.y<=2.5&&Math.abs(p.z)<=.65,p.id);
   assert.ok(p.sx>.015&&p.sx<=1.35&&p.sy>.015&&p.sy<=1.2&&p.sz>.015&&p.sz<=.8,p.id);
   assert.ok(Math.abs(p.rz)<=.8,p.id);
  }
 }
 assert.equal(planWardenRegalia('warden'),planWardenRegalia('warden'),'no new allocations or RNG per render step');
 const code=fs.readFileSync(path.join(root,'public/ai-dungeon/warden-regalia-plan.js'),'utf8');
 assert.doesNotMatch(code,/Math\.random|Date\.|performance\.|requestAnimationFrame|fetch\(|DungeonRuntime|localStorage/);
});
test('authored boss uses real model pivot, owns cosmetic resources, exposes diagnostic count and routes the strict CSP module',()=>{
 const assets=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const server=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.match(assets,/import \{planWardenRegalia,planWardenRegaliaBone\} from '\/dungeon\/warden-regalia-plan\.js'/);
 assert.match(assets,/actor\.visualPivot\.add\(group\)/);
 assert.match(assets,/actor\.assetGeometries/);
 assert.match(assets,/for\(const g of actor\.assetGeometries\|\|\[\]\)g\.dispose\(\)/);
 assert.match(assets,/bossRegaliaParts:/);
 assert.ok(server.includes("['/dungeon/warden-regalia-plan.js','warden-regalia-plan.js']"));
});

test('M1 Warden native armour mounts move with real bones without changing original rest geometry',async()=>{
 const THREE=require('three');
 const {planWardenRegalia,planWardenRegaliaBone}=await planner();
 const pieces=planWardenRegalia('warden');
 assert.equal(pieces.length,24);
 const counts=new Map();
 for(const part of pieces){
  const joint=planWardenRegaliaBone(part.id);
  assert.ok(['head','chest','pelvis','leftUpperArm','rightUpperArm'].includes(joint),part.id);
  counts.set(joint,(counts.get(joint)||0)+1);
 }
 assert.deepEqual(Object.fromEntries(counts),{
  head:4,leftUpperArm:3,rightUpperArm:3,chest:11,pelvis:3
 });
 assert.equal(planWardenRegaliaBone('fake-damage-actor'),null);
 assert.equal(planWardenRegaliaBone(undefined),null);
 const parent=new THREE.Group(),skinned=new THREE.Group(),decor=new THREE.Group();
 parent.position.set(3,0,-2);parent.scale.set(.84,1.08,.91);
 parent.add(skinned,decor);
 const neck=new THREE.Bone();neck.position.set(0,1.7,0);skinned.add(neck);
 const piece=new THREE.Mesh(new THREE.BoxGeometry(.28,.22,.2));
 piece.position.set(.25,1.88,-.17);decor.add(piece);
 const mount=new THREE.Group();mount.matrixAutoUpdate=false;decor.add(mount);mount.add(piece);
 parent.updateMatrixWorld(true);
 const original=piece.getWorldPosition(new THREE.Vector3()).clone();
 const inverseRest=neck.matrixWorld.clone().invert(),worldBind=decor.matrixWorld.clone();
 const targetWorld=new THREE.Matrix4(),inverse=new THREE.Matrix4();
 const sync=()=>{
  parent.updateMatrixWorld(true);
  targetWorld.multiplyMatrices(neck.matrixWorld,inverseRest).multiply(worldBind);
  mount.matrix.multiplyMatrices(inverse.copy(decor.matrixWorld).invert(),targetWorld);
  mount.matrixWorldNeedsUpdate=true;parent.updateMatrixWorld(true);
 };
 sync();
 assert.ok(piece.getWorldPosition(new THREE.Vector3()).distanceTo(original)<1e-6);
 neck.rotation.z=.35;sync();
 assert.ok(piece.getWorldPosition(new THREE.Vector3()).distanceTo(original)>.03,
  'the actual cranial swing must move fitted regalia, not hover at last cell');
 neck.rotation.z=0;sync();
 assert.ok(piece.getWorldPosition(new THREE.Vector3()).distanceTo(original)<1e-6,
  'native animation recovery must not accumulate any presentation transform');
 const source=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(source,/function syncWardenNativeRegalia\(actor\)/);
 assert.match(source,/syncWardenNativeRegalia\(actor\);/);
 assert.match(source,/bindBoneInverse:bone\.matrixWorld\.clone\(\)\.invert\(\)/);
 assert.match(source,/bossNativeRiggedParts:/);
 piece.geometry.dispose();piece.material.dispose();
});
