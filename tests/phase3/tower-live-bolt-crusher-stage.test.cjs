'use strict';
// Real source collision corridor, cinematic hierarchy and opt-in ratchet share
// one witness. This is an engineering guardrail, NOT a full-motion quality score.
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const mod=import(pathToFileURL(path.resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/scene-hierarchy.mjs')).href);

const scene=()=>({
  lifecycle:'running',runToken:'source-crossfire-8',floor:8,tick:142,
  worldWidth:480000,chunkBaseY:1000000,
  player:{x:240000,y:1350000,health:5,maxHealth:8,
    halfWidth:9000,halfHeight:14000,state:'standing'},
  enemies:[{id:'living-guardian',kind:'guardian',active:true,
    x:200000,y:1350000,halfHeight:16000,health:8,maxHealth:8,
    telegraph:false,guardTicksRemaining:0}],
  projectiles:[{id:'enemy-bolt-42',owner:'enemy',x:225000,y:1350000,
    vx:9000,vy:0}],
  hazards:[{id:'f8:guardian-shutter',kind:'crusher',x:227000,y:1345000,
    width:30000,height:10000,active:false,chargeTicksRemaining:5}],
  intent:{mode:'evading-projectile'}
});

test('live enemy bolt and imminent shutter are ONE readable crossfire moment',async()=>{
  const {observedImmediateTrap,observedSceneHierarchy}=await mod;
  const a=scene(),original=JSON.stringify(a);
  assert.deepEqual(observedImmediateTrap(a),{
    id:'f8:guardian-shutter',x:242000,y:1350000});
  assert.deepEqual(observedSceneHierarchy(a),{kind:'crossfire',focus:1});
  assert.equal(JSON.stringify(a),original,'render observation must not mutate authority');
  assert.equal(observedSceneHierarchy({...a,intent:{mode:'oracle-evading-projectile'}}).kind,
    'crossfire','bounded oracle intent gets same source witness');
});

test('no ratchet or physical-crossfire staging from a mere scheduled future threat',async()=>{
  const {observedImmediateTrap,observedSceneHierarchy}=await mod;
  const a=scene();
  for(const b of [
    {...a,hazards:[{...a.hazards[0],chargeTicksRemaining:11}]},
    {...a,projectiles:[]},
    {...a,projectiles:[{...a.projectiles[0],vx:-9000}]},
    {...a,projectiles:[{...a.projectiles[0],owner:'player'}]},
    {...a,projectiles:[{...a.projectiles[0],y:1450000}]},
    {...a,enemies:[{...a.enemies[0],active:false}]},
    {...a,enemies:[{...a.enemies[0],health:0}]},
    {...a,intent:{mode:'aligning'}},
  ]){
    assert.equal(observedImmediateTrap(b),null,'must not create an imaginary urgent shutter');
    assert.notEqual(observedSceneHierarchy(b).kind,'crossfire',
      'only actual simultaneous evidence may take cinematic priority');
  }
  assert.equal(observedImmediateTrap({...a,stale:true}),null);
  assert.equal(observedImmediateTrap({...a,runToken:''}),null);
  assert.equal(observedImmediateTrap({...a,player:{...a.player,halfWidth:NaN}}),null);
});

test('real active crusher retains priority even after projectile has passed',async()=>{
  const {observedImmediateTrap,observedSceneHierarchy}=await mod;
  const a=scene();
  const active={...a,projectiles:[],hazards:[{...a.hazards[0],
    active:true,chargeTicksRemaining:0}]};
  assert.ok(observedImmediateTrap(active));
  assert.equal(observedSceneHierarchy(active).kind,'crossfire',
    'already-active collision threat still stages beside the living guardian');
});
