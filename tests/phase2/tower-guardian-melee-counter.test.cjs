'use strict';
// Opt-in REAL fixed-step melee interrupt: this checks gameplay truth, not
// an experiential transformation score or a synthetic game-quality vote.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const {chooseTowerAction}=require('../../dist/games/infinite-tower-climb/src/ai/policy.js');
const {createTowerObservation}=require('../../dist/games/infinite-tower-climb/src/ai/observation.js');
const {stepTowerCombat}=require('../../dist/games/infinite-tower-climb/src/combat/step.js');
const {createTowerRenderSnapshot}=require('../../dist/games/infinite-tower-climb/src/presentation/snapshot.js');
const {NamedRng}=require('../../dist/packages/seeded-rng/src/index.js');
const idle={move:0,jump:false,dash:false,attack:false,ability:false};
function duel(flags={guardianSecondWind:true,guardianArenaHazards:true}){
  const source=structuredClone(TowerRuntime.create({
    launchFloor:10,maxTicks:5000,noProgressTicks:2000,...flags
  },'tower-real-melee-counter-v1').state);
  const guardian=source.enemies.find(e=>e.kind==='guardian'&&e.active);
  const cap=source.chunks.find(c=>c.floor===source.floor).platforms.at(-1);
  assert.ok(guardian&&cap);
  source.enemies=[guardian];source.projectiles=[];source.pickups=[];
  // Isolate the genuine telegraph/collision phase without an unrelated
  // seeded floor spike stealing the AI's higher-priority safety decision.
  // The real source guardian stays on its original supporting cap.
  for(const chunk of source.chunks)chunk.hazards=[];
  const p=source.player;
  p.position={x:cap.x+Math.floor(cap.width*.43),
    y:cap.y+cap.height+p.halfHeight};
  p.grounded=true;p.groundedPlatformId=cap.id;
  p.velocity={x:0,y:0};p.facing=1;p.attackCooldown=0;
  p.invulnerableTicks=0;p.health=p.maxHealth;
  guardian.position={x:p.position.x+27000,y:p.position.y};
  guardian.patrolMinX=p.position.x-70000;
  guardian.patrolMaxX=p.position.x+100000;
  guardian.facing=-1;guardian.health=8;guardian.maxHealth=8;
  guardian.guardUntilTick=0;guardian.staggerUntilTick=0;
  guardian.cooldown=20;guardian.telegraphUntilTick=source.tick+5;
  guardian.telegraphDurationTicks=8;
  return {source,guardian,player:p};
}
const rng=()=>NamedRng.fromSeed('tower-real-counter-replay');
test('the actual autonomous cap pilot earns an early-window melee interrupt and source-render/audio witness',()=>{
  const {source}=duel();const frozen=structuredClone(source);
  const decision=chooseTowerAction(source,createTowerObservation(source));
  assert.equal(decision.intent.mode,'bracing-telegraph');
  assert.equal(decision.action.attack,true,'the living open guardian must be counterable without a pulse upgrade');
  assert.equal(decision.action.ability,false,'no unequipped projectile is generated');
  assert.equal(decision.action.jump,false,'early counter is not an emergency jump');
  assert.deepEqual(source,frozen,'policy may not mutate authority');
  const result=stepTowerCombat(source,decision.action,rng());
  const boss=result.state.enemies[0];
  assert.equal(boss.health,7,'only an actual melee hit spends real guardian HP');
  assert.equal(boss.telegraphUntilTick,0,'earned strike stops the not-yet-fired real projectile');
  assert.equal(boss.staggerUntilTick,source.tick+10);
  assert.ok(boss.cooldown>=18);
  assert.ok(result.events.some(e=>e.type==='melee-hit'&&e.data.id===boss.id));
  assert.ok(result.events.some(e=>e.type==='guardian-windup-interrupted'&&
    e.data.id===boss.id&&e.data.counter==='melee'));
  assert.ok(!result.events.some(e=>e.type==='projectile-fired'&&e.data.owner==='enemy'));
  const rendered=createTowerRenderSnapshot(result.state,{includeWindupTicks:true});
  const shown=rendered.enemies.find(e=>e.id===boss.id);
  assert.equal(shown.staggerTicksRemaining,10,'existing 3D model/audio receive the real source counter');
  assert.equal(shown.telegraph,false);
  assert.deepEqual(stepTowerCombat(source,decision.action,rng()),result,'same fixed-step input replays exactly');
  assert.deepEqual(source,frozen,'combat does not mutate source');
});
test('a shield block, missed facing, late windup or lethal hit never fabricates a second counter',()=>{
  const {source}=duel();const original=source.enemies[0];
  source.player.facing=-1;
  let outcome=stepTowerCombat(source,{...idle,attack:true},rng());
  assert.equal(outcome.state.enemies[0].health,8);
  assert.ok(!outcome.events.some(e=>e.type==='guardian-windup-interrupted'));
  const shield=structuredClone(source);
  shield.player.facing=1;shield.enemies[0].guardUntilTick=shield.tick+12;
  shield.enemies[0].telegraphUntilTick=0;
  outcome=stepTowerCombat(shield,{...idle,attack:true},rng());
  assert.equal(outcome.state.enemies[0].health,8);
  assert.ok(outcome.events.some(e=>e.type==='guardian-shield-block'));
  assert.ok(!outcome.events.some(e=>e.type==='guardian-windup-interrupted'));
  const expired=structuredClone(source);
  expired.player.facing=1;expired.enemies[0].telegraphUntilTick=expired.tick;
  outcome=stepTowerCombat(expired,{...idle,attack:true},rng());
  assert.equal(outcome.state.enemies[0].health,7);
  assert.ok(!outcome.events.some(e=>e.type==='guardian-windup-interrupted'));
  const lethal=structuredClone(source);
  lethal.player.facing=1;lethal.enemies[0].health=1;
  outcome=stepTowerCombat(lethal,{...idle,attack:true},rng());
  assert.equal(outcome.state.enemies[0].active,false);
  assert.ok(outcome.events.some(e=>e.type==='enemy-defeated'));
  assert.ok(!outcome.events.some(e=>e.type==='guardian-windup-interrupted'));
  assert.equal(original.health,8);
});
test('historical/unflagged arenas keep old melee and charging truth',()=>{
  for(const flags of [{guardianSecondWind:true},{guardianArenaHazards:true},{}]){
    const {source}=duel(flags);
    assert.equal(chooseTowerAction(source,createTowerObservation(source)).action.attack,false,
      'a full-health pre-shield guardian counter is only a fully opted-in cap encounter');
    const outcome=stepTowerCombat(source,{...idle,attack:true},rng());
    assert.equal(outcome.state.enemies[0].health,7,'normal legal melee still damages');
    assert.equal(outcome.state.enemies[0].telegraphUntilTick,source.enemies[0].telegraphUntilTick,
      'an unflagged encounter does not acquire new interruption physics');
    assert.ok(!outcome.events.some(e=>e.type==='guardian-windup-interrupted'));
  }
});
test('source-timed last-three-tick evasive jump and cooldown still outrank counter melee',()=>{
  const {source}=duel();
  source.enemies[0].telegraphUntilTick=source.tick+2;
  const late=chooseTowerAction(source,createTowerObservation(source));
  assert.equal(late.action.attack,false);
  assert.equal(late.action.jump,true);
  const cooling=structuredClone(source);
  cooling.enemies[0].telegraphUntilTick=cooling.tick+5;
  cooling.player.attackCooldown=6;
  const noStrike=chooseTowerAction(cooling,createTowerObservation(cooling));
  assert.equal(noStrike.action.attack,false,'no hit while real melee cooldown remains');
  const notInRange=structuredClone(cooling);
  notInRange.player.attackCooldown=0;
  notInRange.enemies[0].position.x=notInRange.player.position.x+175000;
  assert.equal(chooseTowerAction(notInRange,createTowerObservation(notInRange)).action.attack,false);
});
