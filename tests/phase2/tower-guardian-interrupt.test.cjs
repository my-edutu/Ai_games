'use strict';
// Earned projectile counterplay changes the REAL fixed-step guardian encounter.
// This is deterministic gameplay safety evidence, not a Gauntlet quality vote.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const {stepTowerCombat}=require('../../dist/games/infinite-tower-climb/src/combat/step.js');
const {createTowerRenderSnapshot}=require('../../dist/games/infinite-tower-climb/src/presentation/snapshot.js');
const {NamedRng}=require('../../dist/packages/seeded-rng/src/index.js');
const still={move:0,jump:false,dash:false,attack:false,ability:false};

function chargedEncounter(){
  const runtime=TowerRuntime.create({launchFloor:10,maxTicks:5000,noProgressTicks:2000},
    'guardian-counterplay-impact-source-v1');
  const state=structuredClone(runtime.state), p=state.player;
  const guardian=state.enemies.find(e=>e.kind==='guardian'&&e.active);
  assert.ok(guardian,'generated guardian is real and active');
  const x=Math.min(state.config.worldWidth-80000,Math.max(80000,p.position.x));
  p.position={x:x-65000,y:guardian.position.y};p.velocity={x:0,y:0};
  p.grounded=true;p.invulnerableTicks=0;
  guardian.position={x,y:p.position.y};guardian.facing=-1;
  guardian.patrolMinX=x-30000;guardian.patrolMaxX=x+30000;
  guardian.telegraphUntilTick=state.tick+6;guardian.cooldown=0;
  state.enemies=[guardian];state.projectiles=[{id:'source-player-pulse',owner:'player',
    floor:state.floor,position:{...guardian.position},velocity:{x:0,y:0},
    halfWidth:5000,halfHeight:3500,damage:1,ttl:5,active:true,hitIds:[]}];
  state.pickups=[];
  return state;
}

test('an authentic earned pulse on a charging guardian interrupts a real attack and creates a short punish window',()=>{
  const state=chargedEncounter(),tick=state.tick;
  const before=JSON.stringify(state),rng=NamedRng.fromSeed('interrupt-replay');
  const {state:hit,events}=stepTowerCombat(state,still,rng);
  const boss=hit.enemies[0];
  assert.equal(JSON.stringify(state),before,'combat may not mutate its input');
  assert.equal(boss.health,state.enemies[0].health-1);
  assert.equal(boss.telegraphUntilTick,0);
  assert.equal(boss.staggerUntilTick,tick+10);
  assert.ok(boss.cooldown>=18);
  assert.ok(events.some(e=>e.type==='guardian-windup-interrupted'&&e.data.id===boss.id));
  assert.equal(hit.projectiles.length,0,'genuine collision consumes the real projectile');
  const live=createTowerRenderSnapshot(hit,{includeWindupTicks:true});
  assert.equal(live.enemies[0].staggerTicksRemaining,10);
  assert.equal(live.enemies[0].telegraph,false);
  const historical=createTowerRenderSnapshot(hit);
  assert.equal(Object.hasOwn(historical.enemies[0],'staggerTicksRemaining'),false,
    'default historical projection/checksum contract does not expose new camera metadata');
  let next=hit;const plantedX=boss.position.x;
  for(let i=1;i<10;i++){
    next=structuredClone(next);next.tick=tick+i;
    next=stepTowerCombat(next,still,rng).state;
    assert.equal(next.enemies[0].position.x,plantedX,'guardian is truthfully staggered for its bounded window');
    assert.equal(next.enemies[0].telegraphUntilTick,0,'no phantom fire during interruption');
  }
  next=structuredClone(next);next.tick=tick+10;
  const recovered=stepTowerCombat(next,still,rng).state;
  assert.notEqual(recovered.enemies[0].position.x,plantedX,'the guardian resumes real patrol when stagger ends');
  assert.ok(recovered.projectiles.every(shot=>shot.owner!=='enemy'));
});

test('stagger never appears on a miss, non-guardian enemy, or attack already fired before the impact',()=>{
  const original=chargedEncounter();
  const miss=structuredClone(original);miss.projectiles[0].position.y+=100000;
  const untouched=stepTowerCombat(miss,still,NamedRng.fromSeed('miss')).state.enemies[0];
  assert.equal(untouched.telegraphUntilTick,original.enemies[0].telegraphUntilTick);
  assert.equal(untouched.staggerUntilTick,undefined);
  const shooter=structuredClone(original);shooter.enemies[0].kind='shooter';
  const shot=stepTowerCombat(shooter,still,NamedRng.fromSeed('shooter')).state.enemies[0];
  assert.equal(shot.staggerUntilTick,undefined,'ordinary ranged enemies keep their combat contract');
  const expired=structuredClone(original);
  expired.enemies[0].telegraphUntilTick=expired.tick;
  const outcome=stepTowerCombat(expired,still,NamedRng.fromSeed('expired'));
  assert.equal(outcome.state.enemies[0].staggerUntilTick,undefined);
  assert.ok(outcome.events.some(e=>e.type==='projectile-fired'&&e.data.owner==='enemy'),
    'an already-expired real attack is not retroactively cancelled');
});

test('identical source snapshot and seed produce identical interruption state, event order and checksums',()=>{
  const starting=chargedEncounter(),a=stepTowerCombat(starting,still,NamedRng.fromSeed('same'));
  const b=stepTowerCombat(structuredClone(starting),still,NamedRng.fromSeed('same'));
  assert.deepEqual(a,b);
  const live=createTowerRenderSnapshot(a.state,{includeWindupTicks:true});
  assert.equal(live.authorityChecksum,createTowerRenderSnapshot(b.state,{includeWindupTicks:true}).authorityChecksum);
});