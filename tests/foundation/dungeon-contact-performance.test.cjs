'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),THREE=require('three');
const root=path.resolve(__dirname,'../..'),file=path.join(root,'public/ai-dungeon/contact-performance.js');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(file,'utf8')).toString('base64'));
test('physically raised original weapon and injury fragments stay finite and bounded',async()=>{
 const {createBladeRibbonGeometry,createImpactSpallGeometry}=await load();
 for(const mesh of [createBladeRibbonGeometry(THREE),createImpactSpallGeometry(THREE)]){
  assert.ok(mesh?.index&&mesh.getAttribute('position')&&mesh.getAttribute('normal'));
  assert.ok(mesh.getAttribute('position').count>=32&&mesh.getAttribute('position').count<=150);
  assert.ok([...mesh.getAttribute('position').array,...mesh.getAttribute('normal').array].every(Number.isFinite));
  mesh.computeBoundingBox();
  for(const dim of ['x','y','z'])assert.ok(Math.abs(mesh.boundingBox.max[dim])<1.2);
  mesh.dispose();
 }
 assert.equal(createBladeRibbonGeometry(null),null);
});
test('contact shards require authentic positive HP loss, not projectile flight',async()=>{
 const {planTrueDamageCue}=await load();
 const b=Object.freeze({id:'hero',faction:'party',damage:20,maxHp:100,x:4,z:6,fatal:false});
 const cue=planTrueDamageCue(b,{x:4.2,z:6.1});
 assert.ok(Object.isFrozen(cue)&&cue.y>1&&cue.scale<2&&cue.x===4.2);
 for(const value of [0,-1,Infinity,NaN])assert.equal(planTrueDamageCue({...b,damage:value}),null);
 assert.equal(planTrueDamageCue({...b,faction:'neutral'}),null);
 assert.equal(planTrueDamageCue(b,{x:99,z:99}).x,4);
 assert.equal(planTrueDamageCue({...b,fatal:true}).fatal,true);
});
test('rendering uses genuine rig hand, HP-delta guard, and restricted local asset route',()=>{
 const director=fs.readFileSync(path.join(root,'public/ai-dungeon/combat-director.js'),'utf8');
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const host=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.match(director,/createBladeRibbonGeometry\(THREE\)/);
 assert.match(director,/planTrueDamageCue\(beat/);
 assert.match(director,/recordDamage\(beats,snapshot=null\)/);
 assert.match(app,/combatDirector\.recordDamage\(damageBeats,s\)/);
 assert.match(app,/actorById:id=>actors\.get\(id\)/);
 assert.match(model,/actor\.rigHandBone=handBone/);
 assert.match(model,/actor\.rigHandBone=null/);
 assert.ok(host.includes("['/dungeon/contact-performance.js','contact-performance.js']"));
 assert.doesNotMatch(director,/flashAt\(p\.target,color\(p\.kind\)\)/);
 assert.doesNotMatch(fs.readFileSync(file,'utf8'),/Math\.random|Date\.now|fetch\(|DungeonRuntime/);
});

test('the live attack-to-injury renderer follows legitimate animated skinned actors through full physical contact',()=>{
 const code=fs.readFileSync(path.join(root,'public/ai-dungeon/combat-director.js'),'utf8');
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(code,/liveActorCellPoint\(source,from,actorById\)/);
 assert.match(code,/liveActorCellPoint\(target,to,actorById\)/);
 assert.match(code,/source:\{id:source\.id,x:source\.x,z:source\.z\}/);
 assert.match(code,/liveInjuryAnchor\(beat,hit,actorById\)/);
 assert.match(code,/skinnedArcFrames/);
 assert.match(code,/skinnedHitAnchors/);
 assert.match(app,/resolveImpactSide\(a\.damageBeat\.incoming,a\.root\.rotation\.y\)/);
 assert.match(model,/resolveImpactSide\(beat\?\.incoming,actor\.root\.rotation\.y\)/);
 assert.match(code,/Math\.hypot\(x-beat\.x,z-beat\.z\)>\.58/);
 assert.doesNotMatch(code,/DungeonRuntime|Math\.random|Date\.now/);
});

test('real injury produces a bounded deterministic world-space fracture, never an invented hit',async()=>{
 const {planContactShardFan}=await load();
 const beat={id:'warden',kind:'warden',faction:'enemy',x:9,z:9,damage:36,maxHp:90,
  fatal:false,incoming:{dx:1,dz:0,sourceId:'vanguard'}};
 const contact=planContactShardFan(beat);
 assert.equal(contact.length,6);
 assert.ok(Object.isFrozen(contact)&&contact.every(Object.isFrozen));
 assert.deepEqual(contact,planContactShardFan({...beat}));
 for(const shard of contact){
  for(const key of ['vx','vz','vy','spin','size'])assert.ok(Number.isFinite(shard[key]));
  assert.ok(Math.abs(shard.vx)<2&&Math.abs(shard.vz)<2&&
   shard.vy>0&&shard.vy<1.2&&shard.size>0&&shard.size<1.5);
 }
 assert.ok(contact.every(v=>v.vx>0),'explicit legal bearing narrows the visual plume');
 assert.equal(planContactShardFan({...beat,fatal:true}).length,10);
 assert.equal(planContactShardFan({...beat,incoming:undefined}).length,6);
 assert.deepEqual(planContactShardFan(beat,true),[]);
 for(const damage of [0,-1,Infinity,NaN])
  assert.deepEqual(planContactShardFan({...beat,damage}),[]);
});
test('true-HP contact uses original 3D instancing, one pulse per real observed blow, and complete release',()=>{
 const director=fs.readFileSync(path.join(root,'public/ai-dungeon/combat-director.js'),'utf8');
 assert.match(director,/new THREE\.InstancedMesh\(shared\.chip/);
 assert.match(director,/planContactShardFan\(beat,reducedMotion\)/);
 assert.match(director,/mode:'true-shards'/);
 assert.match(director,/poseDamageShards\(effect\)/);
 assert.match(director,/fracture\.instanceMatrix\.setUsage\(THREE\.DynamicDrawUsage\)/);
 assert.match(director,/activePhysicalDamageChips/);
 assert.match(director,/while\(impacts\.length>IMPACT_LIMIT\)cleanup\(impacts\.shift\(\)\)/);
 assert.match(director,/for\(const p of impacts\)cleanup\(p\)/);
 assert.doesNotMatch(director,/Math\.random|Date\.now|DungeonRuntime/);
});
