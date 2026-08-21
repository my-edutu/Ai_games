'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const battle=require('../../dist/games/ai-battle-royale/src/index.js');

test('presentation run tokens differ when a reused run id starts a different seed',()=>{
  const config=battle.createBattleConfig({width:24,height:18,combatantCount:4,lootCount:8,maxTicks:120,zoneFirstShrinkTick:30,zoneShrinkInterval:30,supplyDropEvery:40,noProgressTicks:50,voteWindowEvery:60,voteWindowTicks:15});
  const first=new battle.BattleRoyaleRuntime(config,'boundary-seed-a','reused-external-run');
  const second=new battle.BattleRoyaleRuntime(config,'boundary-seed-b','reused-external-run');
  const firstSnapshot=battle.createBattleRenderSnapshot(first.state,first.state.events);
  const secondSnapshot=battle.createBattleRenderSnapshot(second.state,second.state.events);
  assert.notEqual(firstSnapshot.runToken,secondSnapshot.runToken);
});
