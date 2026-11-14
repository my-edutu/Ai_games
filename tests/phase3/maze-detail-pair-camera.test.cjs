'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = path.resolve(__dirname, '../../public/ai-maze-escape/scene.js');
const moduleUrl = require('node:url').pathToFileURL(
  path.resolve(__dirname, '../../public/ai-maze-escape/map-view.mjs')).href;

test('real narrow Detail guardian staging uses the public pair balance, not a hidden actor or weaker crop threshold', () => {
  const scene = fs.readFileSync(source, 'utf8');
  const stage = scene.indexOf('const frameThreat=publicEncounterFrameWeight(');
  const balance = scene.indexOf("if (cameraMode === 'detail' && !result && closestThreat?.strength", stage);
  const target = scene.indexOf('targetHeight = cameraMode === \'detail\'', stage);
  assert.ok(stage >= 0 && balance > stage && target > balance,
    'the genuine public Detail encounter must balance both silhouettes before projection');
  const scope = scene.slice(balance, target);
  assert.match(scope, /publicPortraitGuardianBalance\(/);
  assert.match(scope, /desiredTarget\.x \+= pairBalance\.x/);
  assert.match(scope, /desiredTarget\.z \+= pairBalance\.z/);
  assert.match(scope, /aspect >= \.35 && aspect < \.60/);
  assert.match(scope, /followCameraOffset/);
  assert.match(scene, /fullyInFrame:left>=-\.95 && right<=\.95/);
});

test('the original narrow Detail optical aim keeps a wide actual shell and Pip within strict camera margins', async () => {
  const {publicPortraitGuardianBalance} = await import(moduleUrl);
  const hero = {x:-2, z:0}, guardian = {x:3.2, z:0};
  const focus = {x:0, z:0}, view = {x:15, z:18};
  const screenX = (p, target) => ((p.x-target.x)*view.z-(p.z-target.z)*view.x)
    / Math.hypot(view.x,view.z);
  const horizontalSpan = 4.40; // Actual prior ultra-narrow Detail horizontal world half-span
  assert.ok((screenX(guardian, focus)+1.8)/horizontalSpan > .95,
    'a guardian center alone must not count as a complete model');
  const balance = publicPortraitGuardianBalance(320/740, 1, hero, guardian, focus, view);
  const shifted = {x:focus.x+balance.x, z:focus.z+balance.z};
  assert.ok((screenX(guardian, shifted)+1.8)/horizontalSpan <= .95,
    'the physical guardian envelope must fit, not just its center');
  assert.ok((screenX(hero, shifted)-1.10)/horizontalSpan >= -.95,
    'reframing cannot sacrifice Pip to save Thornback');
  assert.deepEqual(publicPortraitGuardianBalance(844/390, 1, hero, guardian, focus, view),
    {x:0,z:0}, 'landscape cannot gain an unrequested portrait correction');
  assert.deepEqual(publicPortraitGuardianBalance(320/740, 0, hero, guardian, focus, view),
    {x:0,z:0}, 'unknown/undisclosed guardian attention cannot move the camera');
  assert.deepEqual(publicPortraitGuardianBalance(320/740, 1, hero, {x:NaN,z:0}, focus, view),
    {x:0,z:0}, 'invalid or unavailable public positions must not move the camera');
});
