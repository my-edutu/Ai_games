'use strict';
// Source-truth guardian-cap combat checks; NOT experience votes or device FPS.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const {createTowerObservation}=require('../../dist/games/infinite-tower-climb/src/ai/observation.js');
const {chooseTowerAction}=require('../../dist/games/infinite-tower-climb/src/ai/policy.js');
const {stepTowerCombat}=require('../../dist/games/infinite-tower-climb/src/combat/step.js');
const {stepTowerPhysics}=require('../../dist/games/infinite-tower-climb/src/physics/step.js');
const {NamedRng}=require('../../dist/packages/seeded-rng/src/index.js');
const {STREAM_CONFIG}=require('../../scripts/serve-tower-stream.cjs');
const rng=()=>NamedRng.fromSeed('guardian-cap-contact-rhythm');
const idle={move:0,jump:false,dash:false,attack:false,ability:false};
function liveDuel(flags={guardianSecondWind:true,guardianArenaHazards:true}){
  const s=structuredClone(TowerRuntime.create({...STREAM_CONFIG,...flags,launchFloor:8},
    'tower-transformation-capture-v1',{policy:'autonomous'}).state);
  const cap=s.chunks[0].platforms.find(p=>p.id==='f8:cap');
  const guardian=s.enemies.find(e=>e.kind==='guardian'&&e.active);
  assert.ok(cap&&guardian);
  s.enemies=[guardian];s.projectiles=[];s.pickups=[];
  s.chunks[0].hazards=[];
  const p=s.player;
  p.position={x:cap.x+Math.floor(cap.width*.45),
    y:cap.y+cap.height+p.halfHeight};
  p.velocity={x:0,y:0};p.grounded=true;p.groundedPlatformId=cap.id;
  p.facing=1;p.invulnerableTicks=0;p.health=p.maxHealth;
  guardian.position={x:p.position.x+10000,y:p.position.y};
  guardian.facing=-1;guardian.cooldown=24;
  guardian.telegraphUntilTick=0;
  return {s,p,guardian,cap};
}
test('opt-in guardian patrol contact hurts but a real announced projectile remains stronger',()=>{
  const {s,p,guardian}=liveDuel(),original=structuredClone(s);
  const contact=stepTowerCombat(s,idle,rng());
  assert.equal(contact.state.player.health,p.maxHealth-1,
    'a physical patrol touch costs one HP, never invulnerability');
  assert.ok(contact.events.some(e=>e.type==='player-damage'&&
    e.data.source===guardian.id&&e.data.amount===1));
  assert.deepEqual(s,original,'combat never mutates its input');
  assert.deepEqual(stepTowerCombat(s,idle,rng()),contact,'same named seed replays');
  const shot=structuredClone(s);
  shot.enemies[0].position.x=p.position.x+130000;
  shot.enemies[0].patrolMinX=shot.enemies[0].position.x-1000;
  shot.enemies[0].patrolMaxX=shot.enemies[0].position.x+1000;
  shot.projectiles=[{id:'real-visible-bolt',owner:'enemy',floor:shot.floor,
    position:{...p.position},velocity:{x:300,y:0},halfWidth:5000,
    halfHeight:3500,damage:2,ttl:10,active:true,hitIds:[]}];
  const fired=stepTowerCombat(shot,idle,rng());
  assert.equal(fired.state.player.health,p.maxHealth-2,
    'the same guardian projectile still delivers its authoritative heavy hit');
  assert.ok(fired.events.some(e=>e.type==='player-damage'&&
    e.data.source==='real-visible-bolt'&&e.data.amount===2));
});
test('unflagged guardian contact retains its historical damage and replay',()=>{
  for(const flags of [{guardianSecondWind:true,guardianArenaHazards:false},
    {guardianSecondWind:false,guardianArenaHazards:true},
    {guardianSecondWind:false,guardianArenaHazards:false}]){
    const {s,p,guardian}=liveDuel(flags);
    const out=stepTowerCombat(s,idle,rng());
    assert.equal(out.state.player.health,p.maxHealth-guardian.damage,
      'historical body collisions cannot inherit the new cap balance');
    assert.deepEqual(stepTowerCombat(s,idle,rng()),out);
  }
});
test('a cornered climber chooses an actual grounded vault, not a cooldown bypass',()=>{
  const {s,p,guardian,cap}=liveDuel();
  p.position.x=cap.x+p.halfWidth+6100;
  guardian.position.x=p.position.x+40000;
  p.attackCooldown=9;
  const original=structuredClone(s);
  const choice=chooseTowerAction(s,createTowerObservation(s,{includeHazardWindup:true}));
  assert.equal(choice.intent.mode,'engaging-enemy');
  assert.notEqual(choice.action.move,-1,'the cap edge is not a retreat lane');
  assert.equal(choice.action.jump,true,'a corner escape spends legitimate jump physics');
  assert.equal(choice.action.attack,false,'melee cooldown remains authoritative');
  const moved=stepTowerPhysics(s,choice.action);
  assert.equal(moved.state.player.grounded,false,'the jump really launches the actor');
  assert.ok(moved.state.player.velocity.y>0,'ordinary gravity governs the vault');
  assert.deepEqual(s,original,'policy and physics do not mutate the original');
  p.position.x=cap.x+Math.floor(cap.width*.45);
  guardian.position.x=p.position.x+42000;
  const room=chooseTowerAction(s,createTowerObservation(s,{includeHazardWindup:true}));
  assert.equal(room.action.jump,false,'normal deck retreat does not waste a jump');
  assert.equal(room.action.move,-1,'normal supported contact clearance remains');
});
