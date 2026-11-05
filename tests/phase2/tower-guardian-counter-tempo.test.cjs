'use strict';
// The real guardian-cap encounter has a learnable two-beat armor / counter
// rhythm. This is a fixed-step safety test, NEVER a LOOKS/FEELS/PLAYS vote.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const {createTowerObservation}=require('../../dist/games/infinite-tower-climb/src/ai/observation.js');
const {chooseTowerAction}=require('../../dist/games/infinite-tower-climb/src/ai/policy.js');
const {stepTowerCombat}=require('../../dist/games/infinite-tower-climb/src/combat/step.js');
const {NamedRng}=require('../../dist/packages/seeded-rng/src/index.js');
const {STREAM_CONFIG}=require('../../scripts/serve-tower-stream.cjs');

function observedDuel(){
  const s=structuredClone(TowerRuntime.create({...STREAM_CONFIG,launchFloor:8},
    'tower-transformation-capture-v1',{policy:'autonomous'}).state);
  const cap=s.chunks[0].platforms.find(p=>p.id==='f8:cap');
  const boss=s.enemies.find(e=>e.active&&e.kind==='guardian');
  assert.ok(cap&&boss);
  s.enemies=[boss];s.projectiles=[];s.chunks[0].hazards=[];
  const p=s.player;
  p.position={x:cap.x+Math.floor(cap.width*.34),
    y:cap.y+cap.height+p.halfHeight};
  p.velocity={x:0,y:0};p.grounded=true;p.groundedPlatformId=cap.id;
  p.state='standing';p.facing=1;p.health=p.maxHealth;p.attackCooldown=0;
  boss.position={x:p.position.x+Math.min(42000,s.config.attackReach-8000),
    y:p.position.y};
  boss.patrolMinX=cap.x;boss.patrolMaxX=cap.x+cap.width;
  boss.facing=-1;boss.cooldown=15;
  boss.telegraphUntilTick=s.tick+2;
  boss.guardUntilTick=s.tick+12;
  return {s,p,boss,cap};
}

test('an opt-in last-beat counter is a genuine legal hit that cancels the shot',()=>{
  const {s,p,boss}=observedDuel(),frozen=structuredClone(s);
  const choice=chooseTowerAction(s,createTowerObservation(s,{includeHazardWindup:true}));
  assert.equal(choice.action.attack,true);
  assert.equal(choice.action.jump,false,'do not discard a safe, earned legal melee counter');
  assert.equal(choice.intent.mode,'bracing-telegraph');
  const rng=()=>NamedRng.fromSeed('counter-tempo-check');
  const out=stepTowerCombat(s,choice.action,rng());
  assert.ok(out.events.some(e=>e.type==='melee-hit'&&e.data.id===boss.id));
  assert.ok(out.events.some(e=>e.type==='guardian-windup-interrupted'&&
    e.data.counter==='melee'));
  assert.equal(out.state.enemies[0].telegraphUntilTick,0);
  assert.equal(out.events.some(e=>e.type==='projectile-fired'&&e.data.owner==='enemy'),false);
  assert.equal(out.state.player.health,p.health);
  assert.deepEqual(s,frozen,'policy and combat cannot change their input source');
  assert.deepEqual(stepTowerCombat(s,choice.action,rng()),out,'fixed-step replay');
});

test('no legal cooldown, edge-unsafe facing, or historical policy creates a final-beat hit',()=>{
  const {s,p,boss,cap}=observedDuel();
  p.attackCooldown=5;
  const unavailable=chooseTowerAction(s,createTowerObservation(s,{includeHazardWindup:true}));
  assert.equal(unavailable.action.attack,false);
  assert.equal(unavailable.action.jump,true);
  p.attackCooldown=0;p.facing=-1;
  p.position.x=cap.x+p.halfWidth+500;
  boss.position.x=p.position.x-30000;
  boss.facing=1;
  const unsafe=chooseTowerAction(s,createTowerObservation(s,{includeHazardWindup:true}));
  assert.equal(unsafe.action.attack,false,'a forced inward turn cannot strike an outward foe');
  const old=chooseTowerAction(s,createTowerObservation(s),{tactical:false});
  assert.notEqual(old.intent.summary,'Landing an earned final-beat guardian counter',
    'historical policy never receives the opt-in final-beat counter decision');
});

test('a presently charging crusher vetoes last-beat offense in the same real lane',()=>{
  const {s,p}=observedDuel();
  const jaw={id:'f8:guardian-shutter',kind:'crusher',
    x:p.position.x-11000,y:p.position.y-p.halfHeight,
    width:22000,height:9000,activeFromTick:s.tick+4,
    activeEvery:72,activeFor:9,damage:1};
  s.chunks[0].hazards=[jaw];
  const obs=createTowerObservation(s,{includeHazardWindup:true});
  assert.equal(obs.hazards[0].chargeTicksRemaining,4);
  const choice=chooseTowerAction(s,obs);
  assert.equal(choice.action.attack,false);
  assert.equal(choice.action.jump,true,'an imminent projectile still requires ordinary defense');
});

test('cap shield phase keeps a recoverable body gap and starts a source-timed re-entry',()=>{
  const {s,p,boss,cap}=observedDuel();
  boss.telegraphUntilTick=0;boss.guardUntilTick=s.tick+8;
  p.attackCooldown=0;
  const reach=s.config.attackReach+s.build.attackReachBonus;
  const contact=s.player.halfWidth+boss.halfWidth+8000;
  const strikeGap=Math.max(contact+4000,reach-6000);
  boss.position.x=p.position.x+strikeGap+Math.min(7000,s.config.maxRunSpeed);
  assert.ok(boss.position.x<cap.x+cap.width);
  const frozen=structuredClone(s);
  const choice=chooseTowerAction(s,createTowerObservation(s,{includeHazardWindup:true}));
  assert.equal(choice.intent.mode,'bracing-guardian-shield');
  assert.equal(choice.action.move,1,'position before the last four ticks rather than flee the shield forever');
  assert.equal(choice.action.attack,false,'raised armor still costs real time');
  assert.deepEqual(s,frozen);
  s.config.guardianArenaHazards=false;
  const old=chooseTowerAction(s,createTowerObservation(s));
  assert.equal(old.action.move,-1,'unflagged arena preserves historical shield spacing');
});
