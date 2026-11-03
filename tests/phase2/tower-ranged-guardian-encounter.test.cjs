'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {TowerRuntime} = require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const {createTowerObservation} = require('../../dist/games/infinite-tower-climb/src/ai/observation.js');
const {chooseTowerAction} = require('../../dist/games/infinite-tower-climb/src/ai/policy.js');

function guardianDuel(){
  const runtime = TowerRuntime.create({launchFloor:10,maxTicks:5000,noProgressTicks:1800},
    'live-pulse-guardian-arena',{policy:'autonomous'});
  const state = structuredClone(runtime.state);
  const cap = state.chunks[0].platforms.find(platform=>platform.id===`f${state.floor}:cap`);
  const guardian = state.enemies.find(enemy=>enemy.active&&enemy.kind==='guardian');
  assert.ok(cap&&guardian,'the fixture must use the actual generated cap and source guardian');
  const p=state.player;
  p.position={x:cap.x+cap.width/2,y:cap.y+cap.height+p.halfHeight};
  p.velocity={x:0,y:0};p.grounded=true;p.groundedPlatformId=cap.id;
  const towards=p.position.x>state.config.worldWidth/2?-1:1;
  guardian.position={x:p.position.x+towards*130000,y:p.position.y};
  guardian.telegraphUntilTick=0;guardian.cooldown=20;
  p.facing=towards;p.abilityCooldown=0;
  state.enemies=[guardian];state.projectiles=[];state.chunks[0].hazards=[];
  state.build.upgradeIds.push('pulse-shot');state.ai.recentHeights=[];
  return {runtime,state,guardian,cap};
}

test('earned pulse enables a real long-range cap guardian shot instead of waiting for melee',()=>{
  const {runtime,state,guardian}=guardianDuel();
  const d=chooseTowerAction(state,createTowerObservation(state));
  assert.equal(d.intent.mode,'engaging-enemy');
  assert.equal(d.action.attack,false,'a distant shot must not fabricate a melee hit');
  assert.equal(d.action.ability,true);
  assert.ok(Math.abs(state.player.position.x-guardian.position.x)>state.config.attackReach);
  const count=state.stats.projectilesFired;
  runtime.state=state;
  runtime.step();
  assert.equal(runtime.state.stats.projectilesFired,count+1,
    'a genuine action reaches the authoritative combat projectile system');
});

test('guardian cap does not waste ranged shot on wrong-height or cooldown-blocked targets',()=>{
  const {state,guardian}=guardianDuel();
  guardian.position.y+=guardian.halfHeight+3600;
  assert.equal(chooseTowerAction(state,createTowerObservation(state)).action.ability,false);
  guardian.position.y=state.player.position.y;
  state.player.abilityCooldown=8;
  assert.equal(chooseTowerAction(state,createTowerObservation(state)).action.ability,false);
  state.player.abilityCooldown=0;
  state.build.upgradeIds=[];
  assert.equal(chooseTowerAction(state,createTowerObservation(state)).action.ability,false);
});

test('safe cap edge correction wins over a tempting shot that would point backwards',()=>{
  const {state,guardian,cap}=guardianDuel();
  const p=state.player;
  p.position.x=cap.x+cap.width-p.halfWidth-2000;
  p.facing=1;p.velocity.x=0;
  guardian.position.x=p.position.x+80000;
  guardian.position.y=p.position.y;
  const d=chooseTowerAction(state,createTowerObservation(state));
  assert.equal(d.intent.mode,'engaging-enemy');
  assert.equal(d.action.move,-1,'the edge forces a source-safe inward step');
  assert.equal(d.action.ability,false,'physics would turn the protagonist away before firing');
});

test('ordinary same-floor shooter can be engaged from a real safe distant supported lane',()=>{
  const {state}=guardianDuel();
  const p=state.player;
  state.enemies=[{...state.enemies[0],id:'distant-shooter',kind:'shooter',
    position:{x:p.position.x+85000,y:p.position.y},
    facing:-1,telegraphUntilTick:0,cooldown:20}];
  p.facing=1;p.velocity.x=0;
  const before=JSON.stringify(state);
  const choice=chooseTowerAction(state,createTowerObservation(state));
  assert.equal(choice.intent.mode,'engaging-enemy');
  assert.equal(choice.action.attack,false);
  assert.equal(choice.action.ability,true,'a physical shot fires without pausing for melee distance');
  assert.equal(choice.action.move,0,'the temporary shot cannot override the launch graph');
  assert.equal(JSON.stringify(state),before,'AI choice leaves authoritative source immutable');
  assert.equal(chooseTowerAction(state,createTowerObservation(state),{tactical:false}).action.ability,false,
    'frozen historical policy is not rewritten');
});

test('wrong facing or cooldown veto shots; legal mid-air shooting cannot steal landing controls',()=>{
  const {state}=guardianDuel();
  const p=state.player;
  state.enemies=[{...state.enemies[0],id:'distant-shooter',kind:'shooter',
    position:{x:p.position.x+85000,y:p.position.y},
    facing:-1,telegraphUntilTick:0,cooldown:20}];
  p.facing=-1;
  assert.equal(chooseTowerAction(state,createTowerObservation(state)).action.ability,false);
  // Tactical airborne combat is now earned AND legal. It must preserve the
  // original physical landing command instead of imposing ground-only rules.
  p.facing=1;p.grounded=false;p.groundedPlatformId=undefined;
  p.state='airborne';p.velocity={x:0,y:-3500};
  p.position.y+=40000;
  state.enemies[0].position.y=p.position.y;
  state.ai.targetPlatformId=state.chunks[0].platforms.at(-1).id;
  const withoutEnemy=structuredClone(state);withoutEnemy.enemies=[];
  const landing=chooseTowerAction(withoutEnemy,createTowerObservation(withoutEnemy));
  const duel=chooseTowerAction(state,createTowerObservation(state));
  assert.ok(['air-control','settling-landing'].includes(duel.intent.mode),
    'the aerial controller owns the actual physical descent');
  for(const key of ['move','dash','jump'])assert.equal(duel.action[key],landing.action[key],
    'a real shot cannot override '+key+' while landing');
  p.abilityCooldown=10;
  assert.equal(chooseTowerAction(state,createTowerObservation(state)).action.ability,false);
});
