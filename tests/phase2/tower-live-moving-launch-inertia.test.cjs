'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const {stepTowerPhysics}=require('../../dist/games/infinite-tower-climb/src/physics/step.js');
const {platformAtTick}=require('../../dist/games/infinite-tower-climb/src/generation/chunks.js');
const idle={move:0,jump:false,dash:false,attack:false,ability:false};
function setup(phase=0,live=true){
  const state=structuredClone(TowerRuntime.create({
    maxTicks:3500,noProgressTicks:1800,
    guardianArenaHazards:live,guardianSecondWind:live
  },'moving-deck-takeoff-source').state);
  const deck={id:'f0:moving-launch',kind:'moving',
    x:165000,y:195000,width:115000,height:10000,
    motion:{axis:'x',range:35000,speed:2500,phase}};
  state.chunks[0].platforms=[deck];
  state.chunks[0].hazards=[];state.enemies=[];state.projectiles=[];state.pickups=[];
  const today=platformAtTick(deck,state.tick);
  state.player.position={x:today.x+deck.width/2,
    y:today.y+today.height+state.player.halfHeight};
  state.player.velocity={x:0,y:0};
  state.player.grounded=true;state.player.groundedPlatformId=deck.id;
  state.player.state='standing';
  return {state,deck};
}
test('live autonomous climber inherits moving deck takeoff speed without double displacement',()=>{
  const {state,deck}=setup(0);
  const original=structuredClone(state);
  const dx=platformAtTick(deck,1).x-platformAtTick(deck,0).x;
  assert.equal(dx,2500);
  const launched=stepTowerPhysics(state,{...idle,jump:true});
  assert.deepEqual(state,original);
  assert.equal(launched.integrityFailure,undefined);
  assert.equal(launched.state.player.grounded,false);
  assert.equal(launched.state.player.position.x,original.player.position.x+dx);
  assert.equal(launched.state.player.velocity.x,dx);
  const continued=stepTowerPhysics(launched.state,idle);
  assert.equal(continued.state.player.position.x,original.player.position.x+2*dx);
});
test('leftward moving deck hands off negative horizontal speed on real jump',()=>{
  const {state,deck}=setup(20);
  const dx=platformAtTick(deck,1).x-platformAtTick(deck,0).x;
  assert.equal(dx,-2500);
  const launched=stepTowerPhysics(state,{...idle,jump:true});
  assert.equal(launched.integrityFailure,undefined);
  assert.equal(launched.state.player.position.x,state.player.position.x+dx);
  assert.equal(launched.state.player.velocity.x,dx);
});
test('walking/idle hero remains attached to the moving deck until takeoff',()=>{
  const {state,deck}=setup();
  const dx=platformAtTick(deck,1).x-platformAtTick(deck,0).x;
  const held=stepTowerPhysics(state,idle);
  assert.equal(held.integrityFailure,undefined);
  assert.equal(held.state.player.position.x,state.player.position.x+dx);
  assert.equal(held.state.player.velocity.x,0);
  assert.equal(held.state.player.groundedPlatformId,deck.id);
});
test('frozen unflagged replay retains previous no-inertia launch physics',()=>{
  const {state,deck}=setup(0,false);
  const dx=platformAtTick(deck,1).x-platformAtTick(deck,0).x;
  const launched=stepTowerPhysics(state,{...idle,jump:true});
  assert.equal(launched.state.player.position.x,state.player.position.x+dx);
  assert.equal(launched.state.player.velocity.x,0);
});
test('stable platform never grants fictitious horizontal launch energy',()=>{
  const {state}=setup();
  delete state.chunks[0].platforms[0].motion;
  const launched=stepTowerPhysics(state,{...idle,jump:true});
  assert.equal(launched.state.player.position.x,state.player.position.x);
  assert.equal(launched.state.player.velocity.x,0);
});
