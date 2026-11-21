'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {pathToFileURL} = require('node:url');

// Load the real authored Three.js world in Node, never a mocked sprite or
// simplified replacement. Keep the production vendor import paths intact.
async function loadWorld() {
  const root = path.resolve(__dirname, '../..');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'maze-key-shell-'));
  try {
    fs.mkdirSync(path.join(temp, 'vendor'));
    fs.writeFileSync(path.join(temp, 'package.json'), '{"type":"module"}');
    for (const file of ['world.js', 'gate-moment.mjs', 'map-view.mjs'])
      fs.copyFileSync(path.join(root, 'public/ai-maze-escape', file), path.join(temp, file));
    for (const file of ['three.module.js', 'three.core.js'])
      fs.copyFileSync(path.join(root, 'node_modules/three/build', file), path.join(temp, 'vendor', file));
    const module = await import(pathToFileURL(path.join(temp, 'world.js')).href);
    return {module, cleanup: () => fs.rmSync(temp, {recursive: true, force: true})};
  } catch (error) {
    fs.rmSync(temp, {recursive: true, force: true});
    throw error;
  }
}
const cell = {cell: 4, neighbors: [], blocked: false, trap: false, checkpoint: false, clue: false};
const publicState = (extra = {}) => ({
  runToken: 'real-key-shrine', tick: 1, width: 3, height: 3, currentCell: 4,
  cells: [cell], visibleCells: [4],
  keys: [{id: 'amber', cell: 4, collected: false}],
  inventory: [], doors: [], threats: [], exitCell: null, result: null,
  ...extra,
});

test('a genuine source-witnessed key unfolds four large rooted physical stone sails, not an invented item', async () => {
  const {module, cleanup} = await loadWorld();
  const world = module.createMazeWorld({balanced: true});
  const before = publicState();
  const after = publicState({
    tick: 2, keys: [{id: 'amber', cell: 4, collected: true}], inventory: ['amber'],
  });
  const original = [JSON.stringify(before), JSON.stringify(after)];
  const sails = () => Array.from({length: 4}, (_, index) =>
    world.group.getObjectByName('Hinged disclosed tide-shell sail ' + index));
  try {
    world.update(before);
    world.animate(0, {gateTime: 0, reducedMotion: false});
    const folded = sails();
    assert.ok(folded.every(Boolean), 'the folded physical mechanism already exists with the actual public key');
    for (const sail of folded) {
      assert.ok(Math.abs(sail.rotation.z - 1.16) < 1e-6);
      assert.equal(sail.children.filter(n => n.isMesh).length, 3,
        'each mechanically connected sail must include genuine Three.js masonry');
      assert.equal(sail.parent.name.startsWith('Physical shrine petal'), true);
      assert.ok(sail.children.every(node => !node.isMesh || node.geometry.attributes.position.count > 20));
    }
    world.update(after);
    world.animate(0, {gateTime: 0, reducedMotion: false});
    assert.ok(sails().every(s => Math.abs(s.rotation.z - 1.16) < 1e-6),
      'the witnessed change begins with the fully folded, connected assembly');
    world.animate(.65, {gateTime: .65, reducedMotion: false});
    assert.ok(sails().every(s => s.rotation.z > 0 && s.rotation.z < 1.16),
      'the source-bound physical hinge must visibly open during the witnessed beat');
    world.animate(1.3, {gateTime: 1.3, reducedMotion: false});
    assert.ok(sails().every(s => Math.abs(s.rotation.z) < 1e-6),
      'the large sculpted sails must finish unfolded without a second reward');
    assert.equal(world.stats().geometryCount <= 16, true);
    assert.equal(world.stats().materialCount <= 26, true);
    assert.deepEqual([JSON.stringify(before), JSON.stringify(after)], original,
      'pure graphics may not mutate public snapshots or autonomous authority');
    world.update({...after, runToken: 'fresh', tick: 1, cells: [], visibleCells: [], keys: [], inventory: []});
    assert.ok(sails().every(s => !s), 'new run and unknown public cells must never inherit a visible shrine');
  } finally {
    world.dispose();
    cleanup();
  }
});

test('already collected keys are a static finished sculpture; reduced motion is final and does not invent an animation', async () => {
  const {module, cleanup} = await loadWorld();
  const world = module.createMazeWorld({balanced: true});
  try {
    const remembered = publicState({
      keys: [{id: 'amber', cell: 4, collected: true}], inventory: ['amber'],
    });
    world.update(remembered);
    world.animate(0, {gateTime: 0, reducedMotion: true});
    const sails = Array.from({length: 4}, (_, index) =>
      world.group.getObjectByName('Hinged disclosed tide-shell sail ' + index));
    assert.ok(sails.every(s => s && s.rotation.z === 0),
      'a remembered collected key stays fully opened with no manufactured current-run pickup');
    world.animate(100, {gateTime: 100, reducedMotion: true});
    assert.ok(sails.every(s => s.rotation.z === 0));
    world.update(publicState({
      runToken: 'unknown', tick: 1, cells: [], visibleCells: [], keys: [],
    }));
    assert.equal(world.group.getObjectByName('Hinged disclosed tide-shell sail 0'), undefined);
  } finally {
    world.dispose();
    cleanup();
  }
});
