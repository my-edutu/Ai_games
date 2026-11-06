'use strict';
// Source-pinned live recoil: real motion recovers after damage. Frozen
// unflagged replay and normal-speed browser/quality verdict are separate.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const {stepTowerPhysics}=require('../../dist/games/infinite-tower-climb/src/physics/step.js');
const {createTowerRenderSnapshot}=require('../../dist/games/infinite-tower-climb/src/presentation/snapshot.js');
const {STREAM_CONFIG}=require('../../scripts/serve-tower-stream.cjs');
const neutral={move:0,jump:false,dash:false,attack:false,ability:false};
function capState(overrides={}){
  const state=structuredClone(TowerRuntime.create({
    ...STREAM_CONFIG,launchFloor:8,...overrides
  },'guardian-recoil-contract',{policy:'autonomous'}).state);
  const cap=state.chunks.find(c=>c.floor===8).platforms.find(p=>p.id==='f8:cap');
  assert.ok(cap);
  const p=state.player;
  p.position={x:cap.x+Math.floor(cap.width/2),y:cap.y+cap.height+p.halfHeight};
  p.velocity={x:0,y:0};
  p.grounded=true;p.groundedPlatformId=cap.id;
  p.state='hurt';p.invulnerableTicks=20;p.health=Math.max(1,p.health);
  return {state,cap};
}
test('a real 250ms hurt beat releases into source-grounded run without clearing immunity',()=>{
  let {state,cap}=capState();
  for(let i=1;i<=4;i++){
    state=stepTowerPhysics(state,neutral).state;
    assert.equal(state.player.invulnerableTicks,20-i);
    assert.equal(state.player.state,'hurt');
    assert.equal(state.player.groundedPlatformId,cap.id);
  }
  state=stepTowerPhysics(state,{...neutral,move:1}).state;
  assert.equal(state.player.invulnerableTicks,15);
  assert.equal(state.player.state,'standing');
  assert.ok(state.player.velocity.x>0);
  assert.equal(state.player.grounded,true);
  const frame=createTowerRenderSnapshot(state,{includeWindupTicks:true});
  assert.equal(frame.player.grounded,true);
  assert.equal(frame.player.groundedPlatformId,cap.id);
  assert.equal(frame.player.state,'standing');
});
test('source hurt recovery in air cannot invent a floor contact',()=>{
  let {state}=capState();const p=state.player;
  p.grounded=false;p.groundedPlatformId=undefined;
  p.position.y+=50000;p.velocity.y=3000;p.invulnerableTicks=16;
  state=stepTowerPhysics(state,neutral).state;
  assert.equal(state.player.state,'airborne');
  assert.equal(state.player.grounded,false);
  const frame=createTowerRenderSnapshot(state,{includeWindupTicks:true});
  assert.equal(frame.player.grounded,false);
  assert.equal(frame.player.groundedPlatformId,undefined);
});
test('unflagged historical behaviour and public frame shape stay frozen',()=>{
  const {state}=capState({guardianArenaHazards:false});
  const original=createTowerRenderSnapshot(state);
  assert.equal(Object.hasOwn(original.player,'grounded'),false);
  assert.equal(Object.hasOwn(original.player,'groundedPlatformId'),false);
  state.player.invulnerableTicks=16;
  const after=stepTowerPhysics(state,neutral).state;
  assert.equal(after.player.state,'hurt');
  assert.equal(after.player.invulnerableTicks,15);
  const frame=createTowerRenderSnapshot(after);
  assert.equal(Object.hasOwn(frame.player,'grounded'),false);
});
