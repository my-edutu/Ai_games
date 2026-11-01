'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {TowerRuntime} = require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const {createTowerObservation} = require('../../dist/games/infinite-tower-climb/src/ai/observation.js');
const {chooseTowerAction} = require('../../dist/games/infinite-tower-climb/src/ai/policy.js');

function capStandoff() {
  const runtime = TowerRuntime.create({launchFloor:10,maxTicks:5000,noProgressTicks:1800}, 'guardian-cap-standoff', {policy:'autonomous'});
  const state = structuredClone(runtime.state);
  const cap = state.chunks[0].platforms.at(-1);
  const guardian = state.enemies.find(enemy => enemy.active && enemy.kind === 'guardian');
  assert.ok(cap && guardian, 'launch floor must include a real cap and guardian');
  state.enemies = [guardian];
  state.player.position = {x:cap.x+cap.width-state.player.halfWidth-2000, y:cap.y+cap.height+state.player.halfHeight};
  state.player.velocity = {x:0,y:0};
  state.player.grounded = true;
  state.player.groundedPlatformId = cap.id;
  state.player.facing = -1;
  state.ai.recentHeights = Array(48).fill(state.height);
  assert.ok(Math.abs(state.player.position.y-guardian.position.y) < state.player.halfHeight+guardian.halfHeight+10000, 'guardian is vertically reachable from the cap');
  assert.ok(Math.abs(state.player.position.x-guardian.position.x) > state.config.attackReach, 'starting point reproduces the distant standoff');
  return {runtime,state,guardian,cap};
}

test('cap-bound guardian is pursued instead of repeating a stalled recovery or waiting', () => {
  const {state,guardian} = capStandoff();
  const decision = chooseTowerAction(state,createTowerObservation(state));
  assert.equal(decision.intent.mode, 'engaging-enemy');
  assert.equal(decision.action.move, -1);
  assert.equal(decision.action.attack, false);
  assert.match(decision.intent.summary,/guardian/i);
});

test('once within melee reach, cap guardian engagement brakes rather than walking off the edge', () => {
  const {state,guardian,cap} = capStandoff();
  state.player.position.x = Math.max(cap.x+state.player.halfWidth+1000,guardian.position.x+26000);
  assert.ok(Math.abs(state.player.position.x-guardian.position.x)<=state.config.attackReach);
  const decision = chooseTowerAction(state,createTowerObservation(state));
  assert.equal(decision.intent.mode,'engaging-enemy');
  assert.equal(decision.action.move,0,'preserve safe cap footing while attacking the guardian');
  assert.equal(decision.action.attack,true);
});

test('a deterministic live floor-10 guardian gate can be resolved without bypassing combat', () => {
  const {runtime,state} = capStandoff();
  runtime.state = state;
  for (let i=0; i<700 && runtime.state.floor===10 && runtime.state.lifecycle==='running'; i++) runtime.step();
  assert.equal(runtime.state.stats.guardiansDefeated,1,JSON.stringify({floor:runtime.state.floor,tick:runtime.state.tick,lifecycle:runtime.state.lifecycle,ai:runtime.state.ai,guardian:runtime.state.enemies.find(e=>e.kind==='guardian')}));
  assert.ok(runtime.state.floor>=11,'guardian defeat must open the real floor gate');
  assert.equal(runtime.state.stats.technicalOutcomes,0);
});
