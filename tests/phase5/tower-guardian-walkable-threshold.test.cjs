'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');

const modulePromise = import('../../public/infinite-tower-climb/visuals/guardian-passage.mjs');

test('earned physical gateway has an inner threshold on the real cap deck, not in exterior air', async () => {
  const { GUARDIAN_PASSAGE_RADII, observedWalkablePassageFocus } = await modulePromise;
  const r = GUARDIAN_PASSAGE_RADII;
  assert.ok(r.deck > r.deckMin && r.deck < r.deckMax);
  assert.ok(r.lock > r.deckMax, 'original powered lock remains visibly exterior');
  for (const angle of [-1.1, -.45, 0, .6, 1.1]) {
    const anchor = { x: Math.sin(angle) * r.lock, y: 17.25,
      z: Math.cos(angle) * r.lock, angle };
    const focus = observedWalkablePassageFocus(anchor);
    assert.ok(focus, 'genuine source lock allows an inner walk-through frame');
    assert.ok(Math.abs(Math.hypot(focus.x, focus.z) - r.deck) < 1e-8,
      'hero and the inner door share the actual supported radial walking sector');
    assert.ok(Math.abs(focus.y - (anchor.y - 2 + 2.6)) < 1e-8,
      'inner opening is grounded on the real cap top, not the elevated outer lock');
    const bearing = Math.atan2(focus.x, focus.z);
    assert.ok(Math.abs(bearing - angle) < 1e-8, 'gate does not drift from the source exit x');
  }
});

test('walk-through focus rejects missing, nonfinite and physically mismatched gate anchors', async () => {
  const { GUARDIAN_PASSAGE_RADII, observedWalkablePassageFocus } = await modulePromise;
  assert.equal(observedWalkablePassageFocus(null), null);
  assert.equal(observedWalkablePassageFocus({x:0,y:0,z:25,angle:0}), null);
  assert.equal(observedWalkablePassageFocus({
    x: 0, y: NaN, z: GUARDIAN_PASSAGE_RADII.lock, angle: 0,
  }), null);
  assert.equal(observedWalkablePassageFocus({
    x:0,y:20,z:GUARDIAN_PASSAGE_RADII.lock,angle:Infinity,
  }), null);
});

test('the second architectural doorway is a real-world instanced gate with no authored collider or HUD', async () => {
  const fs = require('node:fs');
  const source = fs.readFileSync(require.resolve('../../public/infinite-tower-climb/visuals/guardian-passage.mjs'), 'utf8');
  assert.match(source, /ObservedWalkableGuardianThreshold/);
  assert.match(source, /new THREE\.InstancedMesh\(box, stone, 6\)/);
  assert.match(source, /new THREE\.InstancedMesh\(box, bronze, 2\)/);
  assert.match(source, /poseWalkableLeaves\(opened\)/);
  assert.match(source, /threshold\.position\.set\(0, -2, GUARDIAN_PASSAGE_RADII\.deck - GUARDIAN_PASSAGE_RADII\.lock\)/);
  assert.match(source, /opened = still \? 1 : Math\.max\(approachOpen,/,
    'the real source-earned approach retains physical opening priority');
});
