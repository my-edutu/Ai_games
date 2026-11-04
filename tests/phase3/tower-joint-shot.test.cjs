'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const ROOT = path.resolve(__dirname, '../..');
const policyPath = path.join(ROOT, 'public/infinite-tower-climb/visuals/joint-shot.mjs');
const modulePromise = import(pathToFileURL(policyPath).href);
const body = (x, y, half = .12) => [x, y, 0, half];
const pair = (actorBefore, guardianBefore, actorAfter, guardianAfter, rest = {}) => ({
  aspect: 390 / 844, actorBefore, guardianBefore, actorAfter, guardianAfter,
  actorCoreClear: true, guardianCoreClear: true, ...rest,
});

test('joint portrait correction measurably rescues a genuine two-body crop', async () => {
  const { guardedJointShotGain, observedJointBodyPressure } = await modulePromise;
  const props = pair(body(-.92, .07), body(.95, .03),
    body(-.70, .05), body(.73, .02));
  assert.ok(observedJointBodyPressure(props.actorBefore, props.aspect) > 0);
  assert.ok(observedJointBodyPressure(props.guardianBefore, props.aspect, 'guardian') > 0);
  const saved = JSON.stringify(props);
  assert.ok(guardedJointShotGain(props) > .05);
  assert.equal(JSON.stringify(props), saved, 'read-only camera policy cannot modify replay source');
});

test('a crop rescue may help an unreadable guardian only if the protected actor remains safe', async () => {
  const { guardedJointShotGain } = await modulePromise;
  assert.ok(guardedJointShotGain(pair(body(.12, 0), body(.98, .06),
    body(.12, 0), body(.72, .02))) > 0);
  assert.equal(guardedJointShotGain(pair(body(.12, 0), body(.98, .06),
    body(.88, 0), body(.72, .02))), 0,
    'guardian close-up cannot push a formerly legible hero out of safe range');
  assert.equal(guardedJointShotGain(pair(body(.9, 0), body(.1, 0),
    body(.70, 0), body(.9, 0))), 0,
    'hero rescue cannot trade away a legible guardian');
});

test('a bounded correction preserves an already visible authentic airborne landing', async () => {
  const { guardedJointShotGain } = await modulePromise;
  const base = pair(body(-.92, .07), body(.95, .03),
    body(-.70, .05), body(.73, .02), {
      landingBefore: [.35, .40, 0], landingAfter: [.4, .43, 0],
    });
  assert.ok(guardedJointShotGain(base) > 0);
  assert.equal(guardedJointShotGain({
    ...base, landingAfter: [.95, .43, 0],
  }), 0, 'do not lose an actual visible destination for a cinematic boss shot');
  assert.equal(guardedJointShotGain({
    ...base, landingCoreClear: false,
  }), 0, 'never stage a touchdown through the stone tower core');
});

test('scene source cannot promote an offscreen, fake or unsafe proposed camera', async () => {
  const { guardedJointShotGain } = await modulePromise;
  const props = pair(body(-.92, .07), body(.95, .03),
    body(-.70, .05), body(.73, .02));
  for (const extra of [
    { actorCoreClear: false }, { guardianCoreClear: false },
    { aspect: 960/600 }, { aspect: 0 },
    { actorAfter: body(NaN, .1) },
    { guardianAfter: [.73, .02, 1.2, .12] },
  ]) assert.equal(guardedJointShotGain({ ...props, ...extra }), 0);
  assert.equal(guardedJointShotGain(pair(body(.15, 0), body(.3, 0),
    body(.12, 0), body(.29, 0))), 0, 'avoid jitter on already readable frames');
  assert.equal(guardedJointShotGain(pair(body(-.92, .07), body(.95, .03),
    body(-.90, .07), body(.93, .03))), 0,
    'no micro camera oscillation for insignificant crop reductions');
});

test('real submitted-stage integration uses the existing route lens and respects accessibility', () => {
  const source = fs.readFileSync(path.join(ROOT,
    'public/infinite-tower-climb/visuals/scene.mjs'), 'utf8');
  assert.match(source, /from '.\/joint-shot\.mjs'/);
  assert.match(source, /guardedJointShotGain\(\{/);
  assert.match(source, /followTowerCamera\(camera\.position, destination, jointBlend\)/);
  assert.match(source, /followTowerFocus\(lookAt, focus, jointBlend\)/);
  assert.match(source, /!options\.reducedMotion && !options\.stale/);
  assert.match(source, /towerCoreSightlineClear\(camera\.position, guardianRescuePoint, 23\.5\)/);
  assert.ok(source.indexOf('guardedJointShotGain({') <
    source.indexOf('world.protectRouteSightlines(camera,'),
  'camera must settle before current-scene real-world occlusion is solved');
  assert.doesNotMatch(policyPath, /gameplay|rules|engine/);
});
