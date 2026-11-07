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
  // The original solid bronze BoxGeometry contract is obsolete. Inspect the
  // REAL Three.js geometry/instance on the source-held gateway instead: no
  // decorative depth hole or opened gate can grant collision clearance.
  const THREE = await import('../../node_modules/three/build/three.module.js');
  const { createTowerGuardianPassage } = await modulePromise;
  const effect = createTowerGuardianPassage(THREE);
  try {
    const arch = effect.group.getObjectByName('WalkableSourceCapArchAndBraces');
    const leaves = effect.group.getObjectByName('WalkableSourceCapRetractingBronzeLeaves');
    const outer = effect.group.getObjectByName('ClearedPassageBronzeLeaf');
    assert.equal(arch?.isInstancedMesh, true);
    assert.equal(arch.count, 6);
    assert.equal(leaves?.isInstancedMesh, true);
    assert.equal(leaves.count, 2);
    assert.equal(leaves.geometry, outer.geometry,
      'the inner source-grounded doorway and exterior lock share real original leaf geometry');
    assert.equal(leaves.geometry.parameters.shapes.holes.length, 3,
      'a machined portal remains physically open in depth instead of filling the action frame');
    assert.equal(leaves.userData.collider, undefined);
    assert.equal(leaves.castShadow, false);
    assert.equal(effect.group.getObjectByName('SourceLockedGuardianVerticalEnergyLattice')?.isInstancedMesh, true,
      'visible source-locked simulation clearance remains independent of presentation-only leaves');
  } finally { effect.dispose(); }
  assert.match(source, /poseWalkableLeaves\(opened\)/);
  assert.match(source, /threshold\.position\.set\(0, -2, GUARDIAN_PASSAGE_RADII\.deck - GUARDIAN_PASSAGE_RADII\.lock\)/);
  assert.match(source, /const locked = stage === 'guardian-locked'/);
  assert.match(source, /const opened = locked \? 0 : still \? 1 : Math\.max\(approachOpen,/,
    'the live lock must remain shut, while only the earned approach can physically open it');
});
