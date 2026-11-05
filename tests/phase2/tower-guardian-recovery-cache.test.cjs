'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const {createTowerObservation}=require('../../dist/games/infinite-tower-climb/src/ai/observation.js');
const {chooseTowerAction}=require('../../dist/games/infinite-tower-climb/src/ai/policy.js');
const {stepTowerCombat}=require('../../dist/games/infinite-tower-climb/src/combat/step.js');
const {NamedRng}=require('../../dist/packages/seeded-rng/src/index.js');
const {STREAM_CONFIG}=require('../../scripts/serve-tower-stream.cjs');
const seed='tower-authentic-guardian-recovery-v1';
const idle={move:0,jump:false,dash:false,attack:false,ability:false};
function run(flags={}){return TowerRuntime.create({...STREAM_CONFIG,launchFloor:8,...flags},
  seed,{policy:'autonomous'}).state}
test('guardian cap contains a real supported one-use recovery pickup, not free healing',()=>{
  const state=run(),cap=state.chunks[0].platforms.find(p=>p.id==='f8:cap');
  const shutter=state.chunks[0].hazards.find(h=>h.id==='f8:guardian-shutter');
  const boss=state.enemies.find(e=>e.kind==='guardian');
  const item=state.pickups.find(p=>p.id==='f8:guardian-recovery');
  assert.ok(item&&cap&&shutter&&boss,'source-placed arena content must coexist');
  assert.equal(state.pickups.filter(p=>p.id.endsWith(':guardian-recovery')).length,1);
  assert.equal(item.kind,'health');assert.equal(item.value,2);
  assert.ok(item.position.x>=cap.x+state.player.halfWidth);
  assert.ok(item.position.x<=cap.x+cap.width-state.player.halfWidth);
  assert.ok(item.position.x+state.player.halfWidth<shutter.x||
    item.position.x-state.player.halfWidth>shutter.x+shutter.width,
    'pickup may not be inside the trap collider');
  const original=structuredClone(state);
  const untouched=stepTowerCombat(state,idle,NamedRng.fromSeed('cache-test'));
  assert.equal(untouched.state.player.health,state.player.health,
    'health is never awarded without a real overlap');
  assert.equal(untouched.state.pickups.find(p=>p.id===item.id).collected,false);
  assert.deepEqual(state,original);
  assert.deepEqual(run(),state,'same source config and seed give same content');
});
test('a wounded autonomous climber selects a safe resource and collision heals only once',()=>{
  const state=structuredClone(run()),cache=state.pickups.find(p=>p.id==='f8:guardian-recovery');
  const cap=state.chunks[0].platforms.find(p=>p.id==='f8:cap');
  assert.ok(cache&&cap);
  const p=state.player,boss=state.enemies.find(e=>e.kind==='guardian');
  const direction=cache.position.x<cap.x+cap.width/2?1:-1;
  p.position={x:cache.position.x+direction*50000,y:cap.y+cap.height+p.halfHeight};
  p.velocity={x:0,y:0};p.health=1;p.maxHealth=5;
  p.grounded=true;p.groundedPlatformId=cap.id;p.facing=-direction;
  p.invulnerableTicks=0;
  boss.position.x=cache.position.x+direction*145000;
  boss.position.y=p.position.y;boss.telegraphUntilTick=0;boss.cooldown=24;
  state.projectiles=[];
  const choice=chooseTowerAction(state,createTowerObservation(state,{includeHazardWindup:true}));
  assert.equal(choice.intent.mode,'collecting-resource',
    'wounded hero can seek a legitimate flank pickup instead of blindly attacking');
  assert.equal(choice.action.move,-direction);assert.equal(choice.action.jump,false);
  const touched=structuredClone(state);
  touched.player.position.x=cache.position.x;
  touched.enemies=[];touched.chunks[0].hazards=[];
  const first=stepTowerCombat(touched,idle,NamedRng.fromSeed('cache-test'));
  assert.equal(first.state.player.health,3);
  assert.equal(first.state.pickups.find(x=>x.id===cache.id).collected,true);
  assert.ok(first.events.some(e=>e.type==='pickup-collected'&&e.data.id===cache.id));
  const repeated=stepTowerCombat(first.state,idle,NamedRng.fromSeed('cache-test'));
  assert.equal(repeated.state.player.health,3);
  assert.equal(repeated.events.some(e=>e.type==='pickup-collected'),false);
});
test('non-arena, old-policy and non-guardian floors do not inherit the cache',()=>{
  const old=run({guardianArenaHazards:false});
  const disabled=run({guardianSecondWind:false});
  assert.equal(old.pickups.some(p=>p.id.endsWith(':guardian-recovery')),false);
  assert.equal(disabled.pickups.some(p=>p.id.endsWith(':guardian-recovery')),false);
  assert.equal(old.pickups.length,2+old.floor%2);
  const ordinary=TowerRuntime.create({...STREAM_CONFIG,launchFloor:7},seed).state;
  assert.equal(ordinary.pickups.some(p=>p.id.endsWith(':guardian-recovery')),false);
  assert.deepEqual(run({guardianArenaHazards:false}),old);
});

test('mid-health cap guardian survival can seek the physically earned flank cache before a lethal spiral',()=>{
  const state=structuredClone(run()),cap=state.chunks[0].platforms.find(p=>p.id==='f8:cap');
  const cache=state.pickups.find(p=>p.id==='f8:guardian-recovery');
  const boss=state.enemies.find(e=>e.active&&e.kind==='guardian');
  assert.ok(cap&&cache&&boss);
  const p=state.player,away=cache.position.x<cap.x+cap.width/2?1:-1;
  p.position={x:cache.position.x+away*50000,y:cap.y+cap.height+p.halfHeight};
  p.velocity={x:0,y:0};p.facing=-away;
  p.health=4;p.maxHealth=8;p.grounded=true;p.groundedPlatformId=cap.id;
  boss.position={x:cache.position.x+away*145000,y:p.position.y};
  boss.telegraphUntilTick=0;boss.cooldown=24;
  state.projectiles=[];state.chunks[0].hazards=[];
  const before=structuredClone(state);
  const choice=chooseTowerAction(state,createTowerObservation(state,{includeHazardWindup:true}));
  assert.equal(choice.intent.mode,'collecting-resource',
    'a four-of-eight HP survivor should have a real chance to secure the one-use cache');
  assert.equal(choice.action.move,-away);
  assert.equal(choice.action.jump,false);
  assert.deepEqual(state,before,'recovery decision never grants healing or mutates authority');
  const historic=structuredClone(state);
  historic.config.guardianArenaHazards=false;
  const old=chooseTowerAction(historic,createTowerObservation(historic,{includeHazardWindup:true}));
  assert.notEqual(old.intent.mode,'collecting-resource',
    'the safer early-recovery threshold belongs ONLY to opted-in guardian-cap combat');
});

test('a visible closing shutter vetoes mid-health cache traversal without inventing healing',()=>{
  const state=structuredClone(run()),cap=state.chunks[0].platforms.find(p=>p.id==='f8:cap');
  const cache=state.pickups.find(p=>p.id==='f8:guardian-recovery');
  const boss=state.enemies.find(e=>e.active&&e.kind==='guardian');
  assert.ok(cap&&cache&&boss);
  const p=state.player,away=cache.position.x<cap.x+cap.width/2?1:-1;
  p.position={x:cache.position.x+away*50000,y:cap.y+cap.height+p.halfHeight};
  p.velocity={x:0,y:0};p.facing=-away;
  p.health=4;p.maxHealth=8;p.grounded=true;p.groundedPlatformId=cap.id;
  boss.position={x:cache.position.x+away*145000,y:p.position.y};
  boss.cooldown=24;boss.telegraphUntilTick=0;
  state.projectiles=[];state.tick=0;
  state.chunks[0].hazards=[{
    id:'published-cache-shutter',kind:'crusher',
    x:Math.min(p.position.x,cache.position.x)+13000,
    y:cap.y+cap.height,width:20000,height:12000,
    activeFromTick:6,activeEvery:80,activeFor:18,damage:1
  }];
  const observed=createTowerObservation(state,{includeHazardWindup:true});
  assert.equal(observed.hazards[0].chargeTicksRemaining,6);
  const before=structuredClone(state);
  const choice=chooseTowerAction(state,observed);
  assert.notEqual(choice.intent.mode,'collecting-resource',
    'published charging jaws may not be crossed just to reach a visible healing item');
  assert.deepEqual(state,before);
});
