'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const cameraPolicy = import(pathToFileURL(path.resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/guardian-camera-safety.mjs')).href);

test('guardian rescue only accepts actual dual-subject improvement on an exterior stage', async () => {
  const { guardianFramePressure, actorFramePressure, guardianCameraRecoveryBlend,
    acceptGuardianCameraRescue } = await cameraPolicy;
  const portrait = 390 / 844;
  const actor = [0.12, -.03, .7];
  const before = [1.38, .2, .6], after = [.98, .19, .6];
  assert.ok(guardianFramePressure(before, portrait) > .5);
  assert.ok(guardianFramePressure(after, portrait) <
    guardianFramePressure(before, portrait));
  const basis = { aspect: portrait, guardianBefore: before,
    guardianAfter: after, actorBefore: actor, actorAfter: [.14, -.04, .7],
    actorCoreClear: true, guardianCoreClear: true };
  assert.equal(acceptGuardianCameraRescue(basis), true);
  assert.equal(acceptGuardianCameraRescue({
    ...basis, actorAfter: [1.04, 0, .7] }), false,
    'never rescue the guardian by throwing the real climber offscreen');
  assert.equal(acceptGuardianCameraRescue({
    ...basis, guardianCoreClear: false }), false,
    'the solid tower core can conceal an in-frame enemy');
  assert.equal(acceptGuardianCameraRescue({
    ...basis, guardianAfter: [1.37, .2, .6] }), false,
    'tiny camera jitter must not repeatedly change the lens');
  assert.equal(acceptGuardianCameraRescue({
    ...basis, guardianBefore: [.1, .1, .6] }), false,
    'an already readable guardian must not trigger recovery');
  assert.equal(acceptGuardianCameraRescue({
    ...basis, actorBefore: [1.3, 0, .6] }), false,
    'actor recovery remains the higher-priority stage');
  assert.equal(guardianCameraRecoveryBlend(.8, -1), 0);
  assert.equal(guardianCameraRecoveryBlend(Infinity, 1), 0);
  assert.equal(guardianCameraRecoveryBlend(0, .05), 0);
  assert.ok(guardianCameraRecoveryBlend(.8, .05) > 0);
  assert.ok(guardianCameraRecoveryBlend(1e9, 3) <= .3);
  assert.equal(guardianFramePressure([NaN, 0, 0], portrait), Infinity);
  assert.equal(guardianFramePressure([0, 0, 0], 16/9), 0);
  assert.ok(actorFramePressure([.81, 0, .7], portrait) > 0,
    'native phone actor framing must be stricter than the guardian margin');
  assert.equal(acceptGuardianCameraRescue({
    ...basis, actorAfter: [.81, 0, .7],
  }), false, 'a handsome guardian close-up cannot push the climber out of 78% safe frame');
  assert.equal(actorFramePressure([0, 0, .7], portrait), 0);
});

test('scene connects guardian rescue to observed actor, guardian and authentic lens', () => {
  const scene = fs.readFileSync(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/scene.mjs'), 'utf8');
  assert.match(scene, /guardianCameraRecoveryBlend/);
  assert.match(scene, /acceptGuardianCameraRescue/);
  assert.match(scene, /followComposition\?\.guardianStaged/);
  assert.match(scene, /towerCoreSightlineClear\(camera\.position, guardianRescuePoint, 23\.5\)/);
  assert.match(scene, /guardianRescueBlend: Number\(guardianRescueBlend\.toFixed\(4\)\)/);
});
