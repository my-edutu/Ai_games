'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const lens = import(pathToFileURL(path.resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/duel-lens.mjs')).href);
test('real portrait duel body-size recovery never purchases a cropped actor, opponent or core', async () => {
  const { acceptObservedDuelDolly: accept } = await lens;
  const p = { aspect: 390 / 844, actorBefore: [.1, -.01, .4, .11],
    actorAfter: [.11, -.01, .4, .122], guardianBefore: [-.2, .03, .5, .17],
    guardianAfter: [-.19, .03, .5, .183], actorCoreClear: true,
    guardianCoreClear: true, radiusBefore: 61, radiusAfter: 60.2 };
  assert.equal(accept(p), true);
  assert.equal(accept({ ...p, aspect: 16/9 }), false);
  assert.equal(accept({ ...p, actorCoreClear: false }), false);
  assert.equal(accept({ ...p, guardianCoreClear: false }), false);
  assert.equal(accept({ ...p, radiusAfter: 29.5 }), false);
  assert.equal(accept({ ...p, radiusAfter: 58 }), false);
  assert.equal(accept({ ...p, actorBefore: [.1, 0, .4, .22] }), false);
  assert.equal(accept({ ...p, actorAfter: [.77, 0, .4, .124] }), false);
  assert.equal(accept({ ...p, guardianAfter: [.9, .03, .5, .2] }), false);
  assert.equal(accept({ ...p, guardianAfter: [-.19, .03, .5, .15] }), false);
  assert.equal(accept({ ...p, actorAfter: [.11, 0, .4, .11001] }), false);
  assert.equal(accept({ ...p, actorAfter: [NaN, 0, .4, .122] }), false);
  assert.equal(accept({ ...p, actorAfter: [.11, 0, 1.6, .122] }), false);
});
test('real scene requires source guardian, reduced motion gate and rollback', () => {
  const scene = fs.readFileSync(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/scene.mjs'), 'utf8');
  assert.match(scene, /acceptObservedDuelDolly/);
  assert.match(scene, /sourceGuardian\.health > 0/);
  assert.match(scene, /!options\.reducedMotion && !options\.stale/);
  assert.match(scene, /towerCoreSightlineClear\(camera\.position, guardianRescuePoint, 23\.5\)/);
  assert.match(scene, /duelDollyApplications/);
  assert.match(scene, /camera\.position\.copy\(duelPreviousCamera\)/);
});
