'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const base=path.resolve(__dirname,'../../public/ai-vs-1000-floors');
const load=name=>import(pathToFileURL(path.join(base,name)).href);
const performance=async()=>fs.existsSync(path.join(base,'character-performance.js'))?(await load('character-performance.js')).samplePerformance:null;
const actions=['idle','walk','run','wait','jump','land','hit','recover','celebrate'];
function boneState(root){const state={};root.traverse(o=>{if(o.isBone)state[o.name]=[...o.position.toArray(),o.rotation.x,o.rotation.y,o.rotation.z,...o.scale.toArray()]});return state;}

test('cast performance is deterministic and gives each action a distinct readable pose',async()=>{
 const sample=await performance();assert.equal(typeof sample,'function','bounded character-performance sampler is missing');
 const motion=Object.freeze({lookYaw:.35,jumpProgress:.45,landAge:.08,rewardAge:.2});
 const poses=actions.map(action=>sample(action,1.25,false,motion));
 for(let i=0;i<actions.length;i++)assert.deepEqual(poses[i],sample(actions[i],1.25,false,motion));
 assert.equal(new Set(poses.map(p=>JSON.stringify(p))).size,actions.length);
 assert.ok(poses[actions.indexOf('hit')].eyeScale<poses[0].eyeScale);
 assert.ok(poses[actions.indexOf('celebrate')].fingerCurl<poses[actions.indexOf('run')].fingerCurl);
});
test('cast performance bounds gaze and invalid optional data without NaN',async()=>{
 const sample=await performance();assert.equal(typeof sample,'function');
 for(const action of [...actions,'invalid'])for(const t of [-10,0,1e6,NaN,Infinity]){
  const p=sample(action,t,false,{lookYaw:Infinity,landAge:NaN,jumpProgress:-40,rewardAge:-Infinity});
  for(const v of Object.values(p))assert.ok(typeof v==='number'&&Number.isFinite(v));
  assert.ok(Math.abs(p.gaze)<=.42);assert.ok(p.fingerCurl>=0&&p.fingerCurl<=1);
 }
 assert.ok(sample('wait',0,false,{lookYaw:9}).gaze<=.42);
});
test('reduced motion removes idle breathing, flutter and companion bob, preserving semantic poses',async()=>{
 const sample=await performance();assert.equal(typeof sample,'function');
 for(const action of actions)assert.deepEqual(sample(action,1,true,{}),sample(action,40,true,{}));
 assert.notDeepEqual(sample('idle',1,false,{}),sample('idle',2,false,{}));
 assert.notDeepEqual(sample('hit',1,true,{}),sample('celebrate',1,true,{}));
});
test('full cast has articulated glove digits, segmented scarf, mouth and companion expression',async()=>{
 const {createCharacter}=await load('character.js');const {disposeTree}=await load('materials.js');const c=createCharacter();
 try{
  for(const name of ['scarf-tip','scarf-mid','mouth','lantern-eye','lantern-lid',...[-1,1].flatMap(side=>[0,1,2].map(i=>`finger-${side}-${i}`)),...[-1,1].map(s=>`thumb-${s}`)])assert.ok(c.root.getObjectByName(name)?.isBone,`missing ${name}`);
  let triangles=0,draws=0; const textures=new Set();c.root.traverse(o=>{if(o.isMesh){draws++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;for(const v of Object.values(o.material))if(v?.isTexture)textures.add(v);}});
  assert.ok(draws<=12,`${draws} cast draw meshes`);assert.ok(triangles<32000,`${triangles} triangles`);assert.ok(textures.size<=4,'bounded surface maps');
  assert.ok(textures.size>=3,'cloth and metal microdetail plus contact map');
 }finally{c.dispose();disposeTree(c.root);}
});
test('switching from every action to idle leaves no stale joint transform',async()=>{
 const {createCharacter}=await load('character.js');const {disposeTree}=await load('materials.js');const c=createCharacter(),fresh=createCharacter();
 try{
  fresh.animate('idle',1,false,{lookYaw:.2});const reference=boneState(fresh.root);
  for(const action of actions){c.animate(action,10,false,{jumpProgress:.7,landAge:.1,lookYaw:-.4,rewardAge:.1});c.animate('idle',1,false,{lookYaw:.2});assert.deepEqual(boneState(c.root),reference,action);}
 }finally{for(const x of [c,fresh]){x.dispose();disposeTree(x.root);}}
});
test('new character surface maps release exactly once with the retired floor',async()=>{
 const {createCharacter}=await load('character.js');const {disposeTree}=await load('materials.js');const c=createCharacter();const counts=new Map();
 c.root.traverse(o=>{if(o.material)for(const t of Object.values(o.material))if(t?.isTexture&&!counts.has(t)){counts.set(t,0);t.addEventListener('dispose',()=>counts.set(t,counts.get(t)+1));}});
 c.dispose();disposeTree(c.root);for(const count of counts.values())assert.equal(count,1);
});

test('posed cast stays inside the existing horizontal and upper camera envelope',async()=>{
 const {createCharacter}=await load('character.js');const {disposeTree}=await load('materials.js');const c=createCharacter();
 try{for(const action of actions)for(const t of [0,.25,.5,.75,1]){
  c.animate(action,t,false,{jumpProgress:t,landAge:Infinity,groundOffset:0,lookYaw:t<.5?-.42:.42});c.root.updateMatrixWorld(true);
  c.root.traverse(o=>{if(o.isSkinnedMesh){o.skeleton.update();o.computeBoundingBox();const b=o.boundingBox;assert.ok(b.min.x>=-1.36&&b.max.x<=1.36,action+' x');assert.ok(b.min.z>=-1.36&&b.max.z<=1.36,action+' z');assert.ok(b.max.y<=2.30,action+' y');}});
 }}finally{c.dispose();disposeTree(c.root);}
});
