'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {FloorsRuntime}=require('../../dist/games/ai-vs-1000-floors/src/runtime/run.js');
const {chooseProductionAction}=require('../../dist/games/ai-vs-1000-floors/src/ai/policy.js');

const clone=value=>structuredClone(value);

function openState(seed){
  const state=clone(FloorsRuntime.create({baseEnemyBudget:0,maxEnemyBudget:1},seed,{policy:'production'}).state);
  const width=state.floor.width,height=state.floor.height,center=Math.floor(height/2)*width+Math.floor(width/2);
  state.player.cell=center;
  state.floor.start=center;
  state.floor.exit=center+2;
  state.floor.walls=[];
  state.floor.hazards=[];
  state.floor.rewardCells=[];
  state.floor.enemies=[];
  state.floor.mandatoryPath=[center,center+1,center+2];
  state.floor.objective='reach-exit';
  state.floor.objectiveComplete=true;
  return state;
}

test('critical health takes a zero-threat exit move instead of guarding in place forever',()=>{
  const state=openState('critical-health-escape');
  state.player.health=Math.floor(state.player.maxHealth*.25);
  const decision=chooseProductionAction(state);
  assert.equal(decision.action.kind,'move');
  assert.equal(decision.action.targetCell,state.player.cell+1);
  assert.equal(decision.reason,'critical-health-safe-route');
});

test('hazard lens never makes the same hazard route less desirable than having no lens',()=>{
  const base=openState('hazard-lens-routing'),direct=base.player.cell+1,width=base.floor.width;
  base.floor.hazards=[{id:'route-beam',kind:'beam',cell:direct,damage:2,period:6,phase:1}];
  base.floor.enemies=[{id:'distant-pressure',kind:'sentinel',cell:direct+width*2,health:4,maxHealth:4,attack:1,armor:1,telegraph:'idle',cooldown:0}];
  const withoutLens=chooseProductionAction(base);
  assert.equal(withoutLens.action.kind,'move');
  assert.equal(withoutLens.action.targetCell,direct);
  const withLensState=clone(base);withLensState.player.modules=['hazard-lens'];
  const withLens=chooseProductionAction(withLensState);
  assert.equal(withLens.action.kind,'move');
  assert.equal(withLens.action.targetCell,direct);
  assert.equal(withLens.reason,'threat-aware-route');
});
