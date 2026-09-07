'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {NamedRng}=require('../../dist/packages/seeded-rng/src/index.js');
const {parseCivilizationConfig}=require('../../dist/games/ai-civilization/src/config/schema.js');
const {createInitialCivilizationState}=require('../../dist/games/ai-civilization/src/index.js');
const {decideCivilizationAction,legalCivilizationActions}=require('../../dist/games/ai-civilization/src/ai/policy.js');

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
