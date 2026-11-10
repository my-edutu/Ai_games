'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sourcePath = path.resolve(__dirname, '../../public/infinite-tower-climb/visuals/scene.mjs');
const modulePath = path.resolve(__dirname, '../../public/infinite-tower-climb/visuals/guardian-gate-intrusion.mjs');
const corners = (left, right, bottom, top, depth) => [
  [left, bottom, depth], [left, top, depth],
  [right, bottom, depth], [right, top, depth],
];
test('source camera ranks genuine lock foreground competition as an encounter obstruction', async () => {
  const { guardianGateSilhouetteInterference } = await import('file://' + modulePath);
  const hero = corners(-.28, -.04, -.16, .2, 15);
  const guardian = corners(.35, .52, -.22, .25, 18);
  const inFront = corners(-.34, .05, -.35, .45, 11);
  const outside = corners(.76, .98, -.4, .5, 11);
  const behind = corners(-.34, .05, -.35, .45, 27);
  assert.equal(guardianGateSilhouetteInterference(hero, guardian, inFront), 1);
  assert.equal(guardianGateSilhouetteInterference(hero, guardian, outside), 0);
  assert.ok(guardianGateSilhouetteInterference(hero, guardian, behind) <
    guardianGateSilhouetteInterference(hero, guardian, inFront));
  assert.ok(guardianGateSilhouetteInterference(hero, guardian, behind) > 0,
    'even a behind-actor grid may compete visually, but must not count as foreground');
  assert.equal(guardianGateSilhouetteInterference(hero, guardian, [[NaN, 0, 4]]), 0);
});
test('authentic two-body score protects guardian as well as climber', async () => {
  const { guardianGateSilhouetteInterference } = await import('file://' + modulePath);
  const hero = corners(-.8, -.55, -.25, .24, 20);
  const guardian = corners(.16, .36, -.4, .42, 24);
  assert.ok(guardianGateSilhouetteInterference(hero, guardian,
    corners(.13, .39, -.5, .5, 15)) > .9);
});
test('live encounter director consumes projection depth, not merely a decorative gate-in-frame bonus', () => {
  const scene = fs.readFileSync(sourcePath, 'utf8');
  assert.match(scene, /guardianGateSilhouetteInterference/);
  assert.match(scene, /gateIntrusion/);
  assert.match(scene, /gateIntrusion\s*\*\s*4[0-9]/);
  assert.match(scene, /contactGuardian\s*&&\s*gate/);
});
