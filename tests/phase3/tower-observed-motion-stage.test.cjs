'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

// Exercise shipped pure directors, not a separate invented animation model.
// Green contracts are safety only; they are not LOOKS/FEELS/PLAYS preferences.
const scene = fs.readFileSync(path.resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/scene.mjs'), 'utf8');
const begin = scene.indexOf('function createObservedTowerLightDirector()');
const end = scene.indexOf('function towerCoreSightlineClear(', begin);
assert.ok(begin >= 0 && end > begin);
const sandbox = vm.createContext({});
vm.runInContext(scene.slice(begin, end), sandbox);
const state = (tick, extra = {}) => ({
  runToken:'live-expedition', floor:8, tick, lifecycle:'running',
  player:{x:110000 + tick * 1250, y:81000 + tick * 1200,
    vx:6500, state:'airborne', health:5},
  enemies:[{kind:'guardian',active:true,maxHealth:8,health:8,telegraph:false}],
  dangerPermille:150, ...extra,
});

test('real guardian windup and health attrition gently lift the existing actor light', () => {
  const stage = sandbox.createObservedTowerLightDirector();
  assert.equal(stage.sample(state(30), .05).threat, 0);
  stage.sample(state(31, {enemies:[{kind:'guardian',active:true,maxHealth:8,health:6,telegraph:true}]}), .05);
  const cue = stage.sample(state(32, {enemies:[{kind:'guardian',active:true,maxHealth:8,health:6,telegraph:true}]}), .05);
  assert.ok(cue.threat > 0 && cue.threat <= 1);
  assert.ok(cue.armor > 0);
  assert.equal(cue, stage.cue, 'same allocation-free stage cue each render');
  assert.equal(stage.sample(state(33, {enemies:[]}), .05, false, true).threat, 0,
    'reduced motion never pulses bright danger lights');
  const reset = stage.sample(state(0, {runToken:'new-run', enemies:[]}), .05);
  assert.equal(reset.armor, 0, 'restart cannot inherit a wounded boss light');
});
test('every motion shard traces authentic consecutive snapshots, never prediction', () => {
  const wake = sandbox.createObservedTowerMotionLedger();
  const first=state(30), second=state(32);
  const copies=[JSON.stringify(first),JSON.stringify(second)];
  wake.accept(first,second);
  assert.equal(wake.samples.length,2);
  assert.equal(wake.samples[0].x,first.player.x);
  assert.equal(wake.samples[1].y,second.player.y);
  assert.equal(JSON.stringify(first),copies[0]);
  assert.equal(JSON.stringify(second),copies[1]);
  wake.accept(second,state(34));
  assert.equal(wake.samples.length,3);
  wake.accept(state(34),state(35,{floor:9}));
  assert.equal(wake.samples.length,0,'no ghost trail across floor geometry');
  wake.accept(state(35),state(36,{runToken:'new-run'}));
  assert.equal(wake.samples.length,0,'no ghost trail across restart');
});
test('old, noncontiguous and idle snapshots cannot become a fictional route', () => {
  const wake = sandbox.createObservedTowerMotionLedger();
  for(let tick=1;tick<50;tick++) wake.accept(state(tick-1),state(tick));
  assert.ok(wake.samples.length<=13);
  assert.ok(wake.samples.every(point=>49-point.tick<=18));
  wake.accept(state(50),state(65));
  assert.equal(wake.samples.length,0);
  wake.accept(state(70),state(69));
  assert.equal(wake.samples.length,0);
  wake.accept(state(80),state(81,{player:{...state(81).player,vx:0,state:'standing',
    x:state(80).player.x, y:state(80).player.y}}));
  assert.equal(wake.samples.length,0);
});
test('actual renderer uses one non-shadowing instanced echo and existing rim light', () => {
  assert.ok(scene.includes('motionEcho = new THREE.InstancedMesh'));
  assert.ok(scene.includes('motionEcho.castShadow = false'));
  assert.ok(scene.includes('motionLedger.accept(previous, next)'));
  assert.ok(scene.includes('rim.target.position.set(climber.group.position.x'));
  assert.ok(scene.includes('observedStageLight.sample(snapshot, dt'));
  assert.ok(scene.includes('!options.reducedMotion &&'));
});
