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
 assert.match(director,/recordDamage\(beats\)/);
 assert.match(app,/combatDirector\.recordDamage\(damageBeats\)/);
 assert.match(app,/actorById:id=>actors\.get\(id\)/);
 assert.match(model,/actor\.rigHandBone=handBone/);
 assert.match(model,/actor\.rigHandBone=null/);
 assert.ok(host.includes("['/dungeon/contact-performance.js','contact-performance.js']"));
 assert.doesNotMatch(director,/flashAt\(p\.target,color\(p\.kind\)\)/);
 assert.doesNotMatch(fs.readFileSync(file,'utf8'),/Math\.random|Date\.now|fetch\(|DungeonRuntime/);
});
