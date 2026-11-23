'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

async function setup() {
  const THREE = await import('three');
  const { createWorld } = await import('../../public/snake-stream/world.mjs');
  const world = createWorld(THREE, { width: 28, height: 16 });
  const snapshot = { obstacles: [18], hazards: [{ cell: 33, active: true, phase: 1 }],
    portals: [{ entry: 46, exit: 380 }], food: { cell: 55, kind: 'normal' } };
  world.update(snapshot, { time: 1 });
  return { world, snapshot, meshes: world.group.children.filter(mesh => mesh.isInstancedMesh) };
}

const versions = meshes => meshes.map(mesh => [mesh.instanceMatrix.version, mesh.instanceColor?.version || 0]);

test('countdown-only changes do not upload unchanged trap or portal transforms', async () => {
  const { world, snapshot, meshes } = await setup();
  try {
    const before = versions(meshes);
    for (let phase = 2; phase < 7; phase++) world.update({ ...snapshot,
      hazards: [{ ...snapshot.hazards[0], phase }] }, { time: phase });
    assert.deepEqual(versions(meshes), before, 'an invisible phase change must not dirty GPU instance buffers');
    assert.equal(world.group.getObjectByName('Flowing water').material.uniforms.time.value, 6,
      'cosmetic animation must remain independent of stable props');
  } finally { world.dispose(); }
});

test('trap activation updates trap geometry without invalidating stable scenery props', async () => {
  const { world, snapshot, meshes } = await setup();
  try {
    assert.equal(typeof world.propRevision, 'function');
    const revision = world.propRevision();
    const stable = meshes.filter(mesh => mesh.userData.cachedProp);
    const hazards = meshes.filter(mesh => !mesh.userData.cachedProp);
    assert.equal(stable.length, 6);
    assert.equal(hazards.length, 5);
    const beforeStable = versions(stable), beforeHazards = versions(hazards);
    const beforeCounts = hazards.map(mesh => mesh.count);
    world.update({ ...snapshot, hazards: [{ cell: 33, active: false, phase: 7 }] });
    assert.equal(world.propRevision(), revision);
    assert.deepEqual(versions(stable), beforeStable);
    assert.notDeepEqual(versions(hazards), beforeHazards);
    assert.notDeepEqual(hazards.map(mesh => mesh.count), beforeCounts,
      'activation changes actual warning/spike geometry, not just a counter');
    for (const mesh of stable) assert.equal(mesh.castShadow, false,
      'caching must not add a stale obstacle/portal cast shadow');
  } finally { world.dispose(); }
});

test('obstacle and portal changes invalidate cached props, including complete removal', async () => {
  const { world, snapshot, meshes } = await setup();
  try {
    assert.equal(typeof world.propRevision, 'function');
    const stable = meshes.filter(mesh => mesh.userData.cachedProp);
    let revision = world.propRevision();
    const before = versions(stable);
    const moved = { ...snapshot, obstacles: [20, 24], portals: [{ entry: 60, exit: 400 }] };
    const original = JSON.stringify(moved);
    world.update(moved);
    assert.equal(world.propRevision(), revision + 1);
    assert.notDeepEqual(versions(stable), before);
    assert.equal(world.stats().obstacles, 2);
    assert.equal(world.stats().portalEnds, 2);
    assert.equal(JSON.stringify(moved), original);
    revision = world.propRevision();
    world.update({ ...moved, portals: [], obstacles: [] });
    assert.equal(world.propRevision(), revision + 1);
    for (const mesh of stable) assert.equal(mesh.count, 0);
    revision = world.propRevision();
    world.update({ ...moved, portals: [], obstacles: [] });
    assert.equal(world.propRevision(), revision, 'empty props stabilize instead of rebuilding forever');
  } finally { world.dispose(); }
});
