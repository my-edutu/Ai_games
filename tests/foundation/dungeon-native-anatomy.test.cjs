'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const source=path.join(root,'public/ai-dungeon/cinematic-figure.js');
async function load(){return import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(source)).toString('base64'))}
test('original figure retains only continuously skinned torso and four limbs underneath armor',async()=>{
 const {isNativeContinuityMesh}=await load();
 for(const prefix of ['Knight','Rogue','Mage','Skeleton_Warrior','Skeleton_Mage','Skeleton_Rogue']){
  for(const piece of ['Body','ArmLeft','ArmRight','LegLeft','LegRight']){
   const name=prefix+'_'+piece;
   assert.equal(isNativeContinuityMesh(name,true),true,name);
   assert.equal(isNativeContinuityMesh(name,false),false,'rigid mesh cannot stand in for animation');
  }
  for(const part of ['Helmet','Head','Jaw','Cape','Hat','Bow','Sword','Eyes'])
   assert.equal(isNativeContinuityMesh(prefix+'_'+part,true),false,'no duplicate oversized head or gear');
 }
 for(const bad of [null,{},'Head','Unknown',undefined,18])assert.equal(isNativeContinuityMesh(bad,true),false);
});
test('six licensed real GLB skeletons contain exactly five native underbody pieces',()=>{
 for(const name of ['player/player_swordsman','player/player_archer','player/player_priest',
  'enemy/enemy_swordsman','enemy/enemy_priest','enemy/enemy_archer']){
  const file=fs.readFileSync(path.join(root,'public/ai-dungeon/models',name+'.glb'));
  assert.equal(file.toString('ascii',0,4),'glTF');
  const size=file.readUInt32LE(12),type=file.readUInt32LE(16);
  assert.equal(type,0x4e4f534a);
  const gltf=JSON.parse(file.subarray(20,20+size).toString('utf8'));
  const native=gltf.nodes.filter(node=>node.mesh!==undefined&&node.skin!==undefined&&
   /_(?:Body|ArmLeft|ArmRight|LegLeft|LegRight)$/i.test(node.name||''));
  assert.equal(native.length,5,name);
  assert.ok(gltf.animations.length>=5,name+' must have real animated clips');
 }
});
test('continuous anatomy belongs to the live scene and fails closed without invented motion',()=>{
 const text=fs.readFileSync(source,'utf8');
 const adapter=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(text,/obj\.isSkinnedMesh&&isNativeContinuityMesh/);
 // Keep configured, embedded GLB textures visible on all five moving limbs.
 assert.doesNotMatch(text,/obj\.material=mat\.nativeSuit/);
 assert.match(text,/if\(keep\)\{obj\.userData\.cinematicBodyUnderlay=true;\}/);
 assert.match(text,/obj\.userData\.cinematicBodyUnderlay=true/);
 assert.match(text,/if\(nativeAnatomy\.length<MIN_NATIVE_BODY_PIECES\)/);
 assert.match(adapter,/cinematicNativeBodyUnderlays:/);
 assert.doesNotMatch(text,/Math\.random|DungeonRuntime|fetch\(|performance\.now/);
});
