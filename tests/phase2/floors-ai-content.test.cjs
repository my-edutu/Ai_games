'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {FloorsRuntime}=require('../../dist/games/ai-vs-1000-floors/src/runtime/run.js');
const {sectorForFloor,enemyDefinition,hazardDefinition,moduleDefinition,bossDefinition,isCheckpointFloor,isWardenFloor,FLOORS_MODULES}=require('../../dist/games/ai-vs-1000-floors/src/content/catalogue.js');
const {chooseProductionAction}=require('../../dist/games/ai-vs-1000-floors/src/ai/policy.js');
const {listLegalActions,actionKey}=require('../../dist/games/ai-vs-1000-floors/src/rules/step.js');
const {runFloorsCampaign}=require('../../dist/games/ai-vs-1000-floors/src/testing/campaign.js');

test('ten sectors cover the full 1,000-floor ascent with cadence truth',()=>{
  const ids=new Set();
  for(let floor=1;floor<=1000;floor++) ids.add(sectorForFloor(floor).id);
  assert.equal(ids.size,10);
  assert.equal(sectorForFloor(1).id,'intake-vaults');
  assert.equal(sectorForFloor(1000).id,'architects-spine');
  assert.equal(isCheckpointFloor(25),true);
  assert.equal(isCheckpointFloor(26),false);
  assert.equal(isWardenFloor(100),true);
  assert.equal(isWardenFloor(900),true);
  assert.equal(isWardenFloor(1000),false);
});

test('production catalogue exposes bounded enemy hazard module and boss families',()=>{
  const enemies=['sentinel','striker','leech','warden','architect'].map(enemyDefinition);
  const hazards=['spike','heat','beam','null','storm','snare'].map(hazardDefinition);
  assert.equal(new Set(enemies.map(x=>x.id)).size,5);
  assert.equal(new Set(hazards.map(x=>x.id)).size,6);
  assert.equal(FLOORS_MODULES.length,12);
  for(const module of FLOORS_MODULES){assert.equal(moduleDefinition(module.id).id,module.id);assert.ok(module.maxStacks>=1&&module.maxStacks<=3)}
  const wardens=Array.from({length:10},(_,i)=>bossDefinition((i+1)*100));
  assert.equal(new Set(wardens.map(x=>x.id)).size,10);
  assert.equal(bossDefinition(1000).id,'the-architect');
});

test('production policy only returns exact legal actions over an adversarial corpus',()=>{
  for(let i=0;i<30;i++){
    const runtime=FloorsRuntime.create({maxTicksPerFloor:900},`phase2-policy-${i}`,{policy:'production'});
    for(let step=0;step<180&&runtime.state.lifecycle==='running';step++){
      const decision=chooseProductionAction(runtime.state);
      const legal=listLegalActions(runtime.state);
      assert.ok(legal.some(action=>actionKey(action)===actionKey(decision.action)),`${i}:${step}:${decision.reason}`);
      assert.ok(decision.expansions<=runtime.state.config.maxPlannerExpansions);
      runtime.step(decision.action);
    }
  }
});

test('campaign is deterministic, bounded, and separates technical outcomes',()=>{
  const one=runFloorsCampaign({seeds:16,maxTicks:2500,seedPrefix:'phase2-campaign'});
  const two=runFloorsCampaign({seeds:16,maxTicks:2500,seedPrefix:'phase2-campaign'});
  assert.deepEqual(one,two);
  assert.equal(one.invalidActions,0);
  assert.equal(one.invalidFloors,0);
  assert.equal(one.replayDivergence,0);
  assert.ok(one.maxPlannerExpansions<=512);
  assert.equal(one.runs,16);
  assert.ok(one.sectorsSeen>=1&&one.sectorsSeen<=10);
});
