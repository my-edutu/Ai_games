'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const source=path.join(root,'public/ai-dungeon/anatomical-kit-plan.js');
const kinds=['vanguard','ranger','mystic','revenant','cultist','warden'];
async function load(){return import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(source,'utf8')).toString('base64'))}
test('six actual rig types get distinct original, layered anatomical gear instead of simple recolours',async()=>{
 const {planAnatomicalKit}=await load();const signatures=new Set();
 for(const kind of kinds){
  const recipe=planAnatomicalKit(kind);
  assert.ok(recipe.length>=10&&recipe.length<=14,kind+' bounded readable gear');
  assert.ok(!recipe.some(p=>/helmet-brow|visor-shadow|-(?:left|right)-shoulder$/.test(p.id)),
   kind+' redundant rigid masks and shoulder shells must not hide native anatomy');
  assert.equal(new Set(recipe.map(p=>p.id)).size,recipe.length);
  assert.ok(recipe.some(p=>p.shape==='cuirass'||p.shape==='rib'),kind+' sculpted anatomy');
  assert.ok(recipe.some(p=>p.shape==='vambrace'||p.shape==='greave'),kind+' defined articulated limbs');
  assert.ok(recipe.some(p=>p.shape==='mask'||p.shape==='collar'),kind+' original readable head/neck treatment');
  signatures.add(recipe.map(x=>x.id).join('|'));
  for(const part of recipe){
   assert.ok(['cuirass','pauldron','vambrace','greave','fauld','mask','collar','rib','tabard'].includes(part.shape));
   assert.ok(['steel','bronze','bone','leather','textile'].includes(part.finish));
   assert.ok([part.x,part.y,part.z,part.sx,part.sy,part.sz,part.rz].every(Number.isFinite));
   assert.ok(Math.abs(part.x)<=.85&&part.y>=.20&&part.y<=2.20&&Math.abs(part.z)<=.65);
   assert.ok(part.sx>.015&&part.sx<=1.1&&part.sy>.015&&part.sy<=1.25&&part.sz>.015&&part.sz<=.65);
   assert.ok(Math.abs(part.rz)<=.85);
   assert.ok(Object.isFrozen(part));
  }
  assert.ok(Object.isFrozen(recipe));
  assert.equal(planAnatomicalKit(kind),recipe);
 }
 assert.equal(signatures.size,kinds.length);
 assert.deepEqual(planAnatomicalKit('none'),[]);
 assert.deepEqual(planAnatomicalKit(null),[]);
});
test('anatomy recipes cannot affect combat or require externally licensed art',()=>{
 const sourceText=fs.readFileSync(source,'utf8');
 assert.doesNotMatch(sourceText,/Math\.random|Date\.|fetch\(|performance\.|DungeonRuntime|localStorage|\.glb|https?:/);
});
test('real asset rig mounts and disposes anatomy, with truthful diagnostics and public route',()=>{
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const host=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.match(renderer,/import \{planAnatomicalKit,planAnatomicalDrawGroups\} from '\/dungeon\/anatomical-kit-plan\.js'/);
 assert.match(renderer,/function addAnatomicalKit\(actor\)/);
 assert.match(renderer,/addAnatomicalKit\(actor\)/);
 assert.match(renderer,/anatomicalDetailParts:/);
 assert.match(renderer,/actor\.anatomicalParts=plan\.length/);
 assert.match(renderer,/for\(const g of actor\.assetGeometries\|\|\[\]\)g\.dispose\(\)/);
 assert.ok(host.includes("['/dungeon/anatomical-kit-plan.js','anatomical-kit-plan.js']"));
});

test('static armor is grouped once by material while every genuine forearm and shin attachment stays independent',async()=>{
 const {planAnatomicalKit,planAnatomicalDrawGroups}=await load();
 for(const kind of kinds){
  const plan=planAnatomicalKit(kind),draw=planAnatomicalDrawGroups(kind);
  assert.ok(Object.isFrozen(draw)&&Object.isFrozen(draw.staticGroups)&&Object.isFrozen(draw.jointPieces));
  assert.ok(draw.staticGroups.length>=1&&draw.staticGroups.length<=5,'finite PBR draw batches');
  const all=[...draw.jointPieces,...draw.staticGroups.flatMap(group=>group.parts)];
  assert.deepEqual(all.map(p=>p.id).sort(),plan.map(p=>p.id).sort(),'no missing or duplicated armor');
  assert.ok(draw.jointPieces.every(p=>p.mount!=='torso'),'limb fittings cannot be rigidly merged');
  assert.ok(draw.staticGroups.every(group=>Object.isFrozen(group)&&Object.isFrozen(group.parts)&&group.parts.length>0&&
   group.parts.every(p=>p.mount==='torso'&&p.finish===group.finish)),'static meshes share their original exact material');
  assert.equal(planAnatomicalDrawGroups(kind),draw,'precomputed plans cannot allocate on each visual frame');
 }
 assert.deepEqual(planAnatomicalDrawGroups('unknown'),{staticGroups:[],jointPieces:[]});
});
test('the actual GLB renderer must merge only static torso detail and dispose owned draw geometry',()=>{
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(renderer,/import \{mergeGeometries\} from '\/dungeon\/vendor\/addons\/utils\/BufferGeometryUtils\.js'/);
 assert.match(renderer,/planAnatomicalDrawGroups\(actor\.u\.kind\)/);
 assert.match(renderer,/function syncNativeArmour\(actor\)/,'native bones must drive skin-connected armour');
 assert.match(renderer,/syncNativeArmour\(actor\);/);
 assert.match(renderer,/else if\(actor\.nativePresentation\.complete\)addAnatomicalKit\(actor\)/);
 assert.doesNotMatch(renderer,/joint\.attach\(mesh\)/,'nonuniform fitted bones cannot receive rigid mesh attach');
 assert.match(renderer,/mergeGeometries\(fragments,false\)/);
 assert.match(renderer,/actor\.assetGeometries\.push\(merged\)/,'merged geometry must be owned and released');
 assert.match(renderer,/anatomicalDetailMeshes:/);
 assert.match(renderer,/anatomicalStaticMergedParts:/);
});

test('five genuine forged armor types use an original bounded shared surface, never external texture calls or excess geometry',()=>{
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(model,/forgedMicrotextureCache=new Map\(\)/);
 assert.match(model,/const size=96,pixels=new Uint8Array\(size\*size\*4\)/);
 assert.match(model,/new THREE\.DataTexture\(pixels,size,size/);
 assert.match(model,/texture\.repeat\.set\(3,3\)/);
 assert.match(model,/bumpMap:micro,roughnessMap:micro/);
 assert.match(model,/forgedMicrotextures:/);
 const source=model.slice(model.indexOf('const forgedMicrotextureCache='),model.indexOf('function addAnatomicalKit(actor)'));
 assert.doesNotMatch(source,/Math\.random|fetch\(|https?:|requestAnimationFrame|DungeonRuntime/);
});

test('M1 live cast silhouette uses restrained six-piece original armour, never the rejected rigid replacement',()=>{
 const source=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(source,/const selected=new Set\(\['forged-cuirass','left-bracer','right-bracer'/);
 assert.match(source,/planAnatomicalKit\(actor\.u\.kind\)\.filter\(p=>selected\.has\(p\.id\)\)/);
 assert.match(source,/if\(isBoss\)addWardenRegalia\(actor\);\s*else if\(actor\.nativePresentation\.complete\)addAnatomicalKit\(actor\)/);
 assert.match(source,/actor\.assetRoot\.traverse\(obj=>\{\s*if\(!obj\.isMesh\)return;\s*obj\.visible=true;/);
 assert.match(source,/mount\.targetWorld\.multiplyMatrices\(mount\.bone\.matrixWorld,mount\.bindBoneInverse\)/);
});
test('actual Three.js nonuniform-fitted bone plate recovers exact bind position after attack',()=>{
 const THREE=require('three'),root=new THREE.Group(),rig=new THREE.Group(),plates=new THREE.Group();
 root.scale.set(.82,1.12,.87);root.position.set(2,0,-3);root.add(rig,plates);
 const bone=new THREE.Bone();bone.position.set(.33,1.35,0);rig.add(bone);
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(.27,.32,.14));
 mesh.position.set(.45,1.25,-.17);plates.add(mesh);root.updateMatrixWorld(true);
 const initial=mesh.getWorldPosition(new THREE.Vector3()).clone();
 const inverseBind=bone.matrixWorld.clone().invert(),groupBind=plates.matrixWorld.clone();
 const stage=new THREE.Group();stage.matrixAutoUpdate=false;plates.add(stage);stage.add(mesh);
 const target=new THREE.Matrix4(),inv=new THREE.Matrix4();
 const sync=()=>{bone.updateWorldMatrix(true,false);plates.updateWorldMatrix(true,false);
  target.multiplyMatrices(bone.matrixWorld,inverseBind).multiply(groupBind);
  stage.matrix.multiplyMatrices(inv.copy(plates.matrixWorld).invert(),target);
  stage.matrixWorldNeedsUpdate=true;root.updateMatrixWorld(true);
 };
 sync();assert.ok(mesh.getWorldPosition(new THREE.Vector3()).distanceTo(initial)<1e-7);
 bone.rotation.z=.42;sync();assert.ok(mesh.getWorldPosition(new THREE.Vector3()).distanceTo(initial)>.03);
 bone.rotation.z=0;sync();assert.ok(mesh.getWorldPosition(new THREE.Vector3()).distanceTo(initial)<1e-7);
 mesh.geometry.dispose();mesh.material.dispose();
});
