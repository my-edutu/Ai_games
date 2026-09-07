'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {NamedRng}=require('../../dist/packages/seeded-rng/src/index.js');
const {parseCivilizationConfig}=require('../../dist/games/ai-civilization/src/config/schema.js');
const {createInitialCivilizationState}=require('../../dist/games/ai-civilization/src/index.js');
const {decideCivilizationAction,legalCivilizationActions}=require('../../dist/games/ai-civilization/src/ai/policy.js');
const {CivilizationRuntime}=require('../../dist/games/ai-civilization/src/runtime/run.js');
const {createCivilizationSnapshot,restoreCivilizationSnapshot}=require('../../dist/games/ai-civilization/src/persistence/snapshot.js');

function makeDeadlockedCamp(){
  const config=parseCivilizationConfig({maxRunDays:5000});
  const state=createInitialCivilizationState(config,'policy-progression','run-policy-progression',NamedRng.fromSeed('policy-progression'));
  for(const key of ['food','wood','stone','gold','knowledge','influence'])state.resources[key]=Math.min(state.config.storageCap,1000);
  state.population.housing=state.population.total+20;
  state.progression.renown=24;
  state.progression.tier='camp';
  state.progression.nextTierRenown=50;
  const farmTile=state.world.tiles.find(tile=>tile.terrain!=='lake');
  farmTile.owner='player';
  farmTile.building={id:'existing-farm',type:'farm',level:1,builtAtTick:state.tick};
  return state;
}

test('policy escapes the camp progression deadlock when the desired granary is still locked',()=>{
  const state=makeDeadlockedCamp();
  const legal=legalCivilizationActions(state);
  assert.equal(legal.some(action=>action.type==='build'),true,'a lawful expansion build must exist');
  assert.equal(legal.some(action=>action.type==='build'&&action.building==='granary'),false,'granary must still be locked below hamlet');
  const decision=decideCivilizationAction(state);
  assert.equal(decision.action.type,'build');
  assert.notEqual(decision.action.key,'reserve');
  assert.equal(decision.intent.fallbackUsed,false);
  assert.match(decision.intent.goal,/grow|expand|tier|settlement/i);
});

test('legacy r2-v1 snapshots remain loadable after the policy version advances',()=>{
  const runtime=CivilizationRuntime.create({maxRunDays:5000},'legacy-policy-snapshot');
  for(let i=0;i<8;i++)runtime.step();
  const snapshot=createCivilizationSnapshot(runtime);
  snapshot.deterministicVersion='civilization-r2-v1';
  const restored=restoreCivilizationSnapshot(snapshot);
  assert.deepEqual(restored.state,runtime.state);
  assert.deepEqual(restored.rng.snapshot(),runtime.rng.snapshot());
  assert.equal(restored.getNextEventSequence(),runtime.getNextEventSequence());
});
