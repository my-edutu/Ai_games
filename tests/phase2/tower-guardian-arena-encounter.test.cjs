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
test('genuine guardian combat shares the real sixth-deck collision lane with one timed escape dilemma',()=>{
  const config=parseTowerConfig({guardianInterval:8,launchFloor:8,guardianArenaHazards:true});
  const source=generate(config),deck=source.platforms.find(p=>p.id==='f8:p6');
  const trap=source.hazards.find(h=>h.id==='f8:guardian-shutter');
  assert.ok(source.guardian&&deck&&trap);
  assert.equal(trap.kind,'crusher');
  assert.equal(trap.y,deck.y+deck.height);
  assert.ok(trap.x>=deck.x&&trap.x+trap.width<=deck.x+deck.width);
  assert.ok(trap.x-deck.x>=config.playerHalfWidth*2+9000,
    'an actual left-footing exit is body-width clear');
  assert.ok(deck.x+deck.width-(trap.x+trap.width)>=config.playerHalfWidth*2+9000,
    'an actual right-footing exit is body-width clear');
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
  const s=structuredClone(runtime.state),deck=s.chunks[0].platforms.find(p=>p.id==='f8:p6');
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
