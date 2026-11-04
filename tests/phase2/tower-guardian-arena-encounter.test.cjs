'use strict';
// A NEW source-authored guardian + moving-shutter arena in the same REAL
// fixed-step game. This is engineering safety, never a quality vote.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {NamedRng}=require('../../dist/packages/seeded-rng/src/index.js');
const {parseTowerConfig}=require('../../dist/games/infinite-tower-climb/src/config/schema.js');
const {generateTowerChunk}=require('../../dist/games/infinite-tower-climb/src/generation/chunks.js');
const {validateTowerChunk}=require('../../dist/games/infinite-tower-climb/src/generation/validator.js');
const {TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const {createTowerObservation}=require('../../dist/games/infinite-tower-climb/src/ai/observation.js');
const {chooseTowerAction}=require('../../dist/games/infinite-tower-climb/src/ai/policy.js');
const {createTowerRenderSnapshot}=require('../../dist/games/infinite-tower-climb/src/presentation/snapshot.js');
const SEED='real-guardian-shutter-arena';
function generate(config, floor=8) {
  return generateTowerChunk(config,SEED,floor,NamedRng.fromSeed(SEED));
}
test('the frozen source has no new arena; opt-in is typed and deterministic',()=>{
  assert.throws(()=>parseTowerConfig({guardianArenaHazards:1}),TypeError);
  const original=parseTowerConfig({guardianInterval:8,launchFloor:8});
  const explicitOff=parseTowerConfig({guardianInterval:8,launchFloor:8,guardianArenaHazards:false});
  assert.deepEqual(generate(original),generate(explicitOff),
    'new flag absent/false cannot rewrite historical generation');
  assert.equal(generate(original).hazards.some(h=>h.id==='f8:guardian-shutter'),false);
  const enabled=parseTowerConfig({guardianInterval:8,launchFloor:8,guardianArenaHazards:true});
  assert.deepEqual(generate(enabled),generate(enabled));
  assert.notEqual(generate(enabled).checksum,generate(original).checksum);
  assert.equal(generate(enabled,7).hazards.some(h=>h.id==='f7:guardian-shutter'),false,
    'no off-guardian scripted shutters');
});
test('source guardian shutter challenges the ACTUAL upper gate approach rather than unreachable sixth-deck scenery',()=>{
  const config=parseTowerConfig({guardianInterval:8,launchFloor:8,guardianArenaHazards:true});
  const source=generate(config),lower=source.platforms.find(p=>p.id==='f8:p6');
  const deck=source.platforms.find(p=>p.id==='f8:cap');
  const trap=source.hazards.find(h=>h.id==='f8:guardian-shutter');
  assert.ok(source.guardian&&lower&&deck&&trap);
  assert.equal(trap.kind,'crusher');
  assert.equal(trap.y,deck.y+deck.height,
    'real player fights the living guardian from the cap approach: the source shutter must be on that support');
  assert.notEqual(trap.y,lower.y+lower.height,
    'earlier lower-deck shutter recorded many charges but no witnessed near-body guardian pressure');
  assert.ok(trap.x>=deck.x&&trap.x+trap.width<=deck.x+deck.width);
  assert.ok(trap.x-deck.x>=config.playerHalfWidth*2+9000,
    'a genuine left-footing exit remains body-width clear');
  assert.ok(deck.x+deck.width-(trap.x+trap.width)>=config.playerHalfWidth*2+9000,
    'a genuine right-footing exit remains body-width clear');
  const approachingGuardianX=lower.x+lower.width/2;
  assert.ok(Math.abs(trap.x-approachingGuardianX)<=90000,
    'cap hazard must remain near the physical guardian/gate approach, not on far decorative cap');
  assert.ok(trap.activeEvery>trap.activeFor+12&&trap.damage>0);
  assert.ok(source.hazards.length<=config.maxHazardsPerChunk);
  assert.deepEqual(validateTowerChunk(source,config).issues,[]);
});
test('one-hazard and zero-hazard budgets never silently grow the guardian arena',()=>{
  for(const maximum of [0,1,2]){
    const config=parseTowerConfig({guardianInterval:8,launchFloor:8,guardianArenaHazards:true,
      maxHazardsPerChunk:maximum});
    const chunk=generate(config);
    assert.ok(chunk.hazards.length<=maximum);
    assert.equal(chunk.hazards.some(h=>h.id==='f8:guardian-shutter'),maximum>0);
    assert.equal(validateTowerChunk(chunk,config).valid,true);
  }
});
test('actual autonomous pilot evades its same scheduled shutter; both public feeds agree',()=>{
  const runtime=TowerRuntime.create({
    launchFloor:8,guardianInterval:8,guardianArenaHazards:true,
    maxTicks:4000,noProgressTicks:1500,
  },SEED,{policy:'autonomous'});
  const s=structuredClone(runtime.state),deck=s.chunks[0].platforms.find(p=>p.id==='f8:cap');
  const hazard=s.chunks[0].hazards.find(h=>h.id==='f8:guardian-shutter');
  assert.ok(s.enemies.some(e=>e.kind==='guardian'&&e.active));
  const p=s.player;
  s.tick=hazard.activeFromTick-8;
  p.position={x:hazard.x+hazard.width/2,y:deck.y+deck.height+p.halfHeight};
  p.velocity={x:0,y:0};
  p.grounded=true;p.groundedPlatformId=deck.id;p.state='standing';p.health=p.maxHealth;
  s.projectiles=[];s.ai.targetPlatformId=undefined;s.ai.recentHeights=[];
  const original=structuredClone(s);
  const observed=createTowerObservation(s,{includeHazardWindup:true});
  const rendered=createTowerRenderSnapshot(s,{includeWindupTicks:true});
  assert.equal(observed.hazards.find(h=>h.id===hazard.id).chargeTicksRemaining,8);
  assert.equal(rendered.hazards.find(h=>h.id===hazard.id).chargeTicksRemaining,8);
  const choice=chooseTowerAction(s,observed);
  assert.equal(choice.intent.mode,'evading-hazard');
  assert.ok(choice.action.move===-1||choice.action.move===1,
    'actual hero must steer into a source-reachable deck exit');
  assert.equal(choice.action.jump,false,'early 8-tick warning should not grant a free jump');
  assert.deepEqual(chooseTowerAction(s,observed),choice,'same state gives same combat/escape decision');
  assert.deepEqual(s,original,'rendering, observation and policy did not mutate authority');
});

test('source-imminent real crusher wins over an early guardian windup on the same observed deck',()=>{
  const runtime=TowerRuntime.create({
    launchFloor:8,guardianInterval:8,guardianArenaHazards:true,
    maxTicks:4000,noProgressTicks:1500,
  },SEED,{policy:'autonomous'});
  const s=structuredClone(runtime.state);
  const deck=s.chunks[0].platforms.find(p=>p.id==='f8:cap');
  const hazard=s.chunks[0].hazards.find(h=>h.id==='f8:guardian-shutter');
  assert.ok(deck&&hazard);
  const p=s.player;
  s.tick=hazard.activeFromTick-6;
  p.position={x:hazard.x+hazard.width/2,y:deck.y+deck.height+p.halfHeight};
  p.velocity={x:0,y:0};p.facing=1;
  p.grounded=true;p.groundedPlatformId=deck.id;p.state='standing';p.health=p.maxHealth;
  s.projectiles=[];
  // Genuine source-shaped overlapping guardian telegraph: it can be observed
  // in the same projectile lane without guessing any future attack.
  const guardian=s.enemies.find(e=>e.kind==='guardian');
  guardian.position={x:p.position.x-30000,y:p.position.y};
  guardian.facing=1;
  guardian.telegraphUntilTick=s.tick+6;
  const frozen=structuredClone(s);
  const observed=createTowerObservation(s,{includeHazardWindup:true});
  assert.equal(observed.hazards.find(h=>h.id===hazard.id).chargeTicksRemaining,6);
  const selected=chooseTowerAction(s,observed);
  assert.equal(selected.intent.mode,'evading-hazard',
    'waiting to counter a guardian cannot overrule a six-tick SOURCE trap about to hit this body');
  assert.ok(selected.action.move!==0,'use real reachable support to clear the charging jaw');
  assert.deepEqual(s,frozen,'the decision must not mutate authoritative state');
  const earlyEnemy=structuredClone(s);
  earlyEnemy.tick=hazard.activeFromTick-13;
  guardian.telegraphUntilTick=earlyEnemy.tick+6;
  earlyEnemy.enemies.find(e=>e.kind==='guardian').telegraphUntilTick=earlyEnemy.tick+6;
  const earlyObs=createTowerObservation(earlyEnemy,{includeHazardWindup:true});
  assert.equal(earlyObs.hazards.find(h=>h.id===hazard.id).chargeTicksRemaining,0);
  assert.equal(chooseTowerAction(earlyEnemy,earlyObs).intent.mode,'bracing-telegraph',
    'a non-published trap must never preempt a genuine observed hostile windup');
});
