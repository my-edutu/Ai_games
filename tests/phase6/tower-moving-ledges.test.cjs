'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const {createTowerRenderSnapshot}=require('../../dist/games/infinite-tower-climb/src/presentation/snapshot.js');
const {platformAtTick}=require('../../dist/games/infinite-tower-climb/src/generation/chunks.js');

test('public moving ledges exactly match the physics step for every tick',()=>{
  const rt=TowerRuntime.create({launchFloor:1},'visual-contact-regression',{policy:'oracle-test'});
  const state=structuredClone(rt.state);
  const chunk=state.chunks.find(c=>c.floor===state.floor);
  assert.ok(chunk,'current chunk exists');
  const moving=chunk.platforms.find(p=>p.kind==='moving');
  assert.ok(moving,'floor one has a moving ledge fixture');
  const originalPlatform=JSON.stringify(moving);
  const coords=[];
  for(const tick of [0,1,8,15,23,31,47,64]){
    state.tick=tick;
    const snapshot=createTowerRenderSnapshot(state);
    const projected=snapshot.platforms.find(p=>p.id===moving.id);
    const expected=platformAtTick(moving,tick);
    assert.deepEqual({x:projected.x,y:projected.y},{x:expected.x,y:expected.y},'visible platform must match authoritative collision geometry at tick '+tick);
    assert.equal(snapshot.tick,tick);
    assert.ok(Object.isFrozen(snapshot.platforms));
    coords.push(projected.x);
  }
  assert.ok(new Set(coords).size>1,'moving platform must visibly change position');
  assert.equal(JSON.stringify(moving),originalPlatform,'render snapshots cannot mutate chunk platform motion');
});

test('fixed platform coordinates remain unchanged in every public snapshot',()=>{
  const rt=TowerRuntime.create({launchFloor:1},'fixed-platform-evidence');
  const state=structuredClone(rt.state);
  const chunk=state.chunks.find(c=>c.floor===state.floor);
  const fixed=chunk.platforms.find(p=>p.kind==='solid');
  for(const tick of [0,17,130]){
    state.tick=tick;
    const p=createTowerRenderSnapshot(state).platforms.find(e=>e.id===fixed.id);
    assert.equal(p.x,fixed.x);assert.equal(p.y,fixed.y);
    assert.equal(p.width,fixed.width);assert.equal(p.height,fixed.height);
  }
});
