'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const modulePath = path.resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/guardian-gate-intrusion.mjs');
const scenePath = path.resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/scene.mjs');
const rect = (left, right, bottom, top, depth) =>
  [[left,bottom,depth],[left,top,depth],[right,bottom,depth],[right,top,depth]];

test('live guardian camera sees dominant full-height gate even when it misses actor silhouettes', async () => {
  const { guardianGateScreenDominance } = await import('file://' + modulePath);
  const hero = rect(-.74,-.52,-.2,.3,13);
  const guardian = rect(-.38,-.17,-.2,.32,15);
  const massiveLock = rect(.05,.68,-1.5,1.6,11);
  const quietSide = rect(.79,.96,-1.5,1.6,11);
  assert.ok(guardianGateScreenDominance(hero,guardian,massiveLock) > .25);
  assert.ok(guardianGateScreenDominance(hero,guardian,quietSide) <
    guardianGateScreenDominance(hero,guardian,massiveLock) * .5);
});

test('behind-actor gateway is distinguishable from a nearer obstructing structure', async () => {
  const { guardianGateScreenDominance } = await import('file://' + modulePath);
  const hero = rect(-.32,-.08,-.24,.22,16);
  const guardian = rect(.12,.38,-.22,.32,17);
  const foreground = rect(-.22,.52,-.9,.9,12);
  const background = rect(-.22,.52,-.9,.9,34);
  assert.ok(guardianGateScreenDominance(hero,guardian,foreground) >
    guardianGateScreenDominance(hero,guardian,background));
  assert.equal(guardianGateScreenDominance(hero,guardian,
    rect(1.1,1.5,-.2,.3,12)), 0);
  assert.equal(guardianGateScreenDominance(hero,guardian,[[NaN,0,1]]),0);
});

test('source-fighter camera also protects both actual subjects from edge-only framing', async () => {
  const { guardianDuelEdgePressure } = await import('file://' + modulePath);
  const centerHero = rect(-.25,-.06,-.2,.2,16);
  const centerGuardian = rect(.06,.26,-.2,.25,17);
  const edgeHero = rect(-.9,-.73,-.2,.2,16);
  const edgeGuardian = rect(.70,.9,-.2,.25,17);
  assert.ok(guardianDuelEdgePressure(edgeHero,edgeGuardian) >
    guardianDuelEdgePressure(centerHero,centerGuardian));
});

test('shipped live camera scores the real gate footprint, not only bounding-box intersection', () => {
  const source = fs.readFileSync(scenePath,'utf8');
  assert.match(source,/guardianGateScreenDominance/);
  assert.match(source,/guardianDuelEdgePressure/);
  assert.match(source,/gateDominance\s*\*\s*[0-9]+/);
  assert.match(source,/duelEdgePressure\s*\*\s*[0-9]+/);
  assert.match(source,/contactGuardian\s*&&\s*gate/);
});
