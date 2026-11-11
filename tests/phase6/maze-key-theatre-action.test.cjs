'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {pathToFileURL} = require('node:url');

// Exercise the actual production Three world, not a surrogate visual.
// Installed Three and the unchanged production imports run in a disposable
// ESM tree exactly as the existing key-shell and world contract tests do.
async function loadWorld() {
  const root = path.resolve(__dirname, '../..');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'maze-key-theatre-'));
  try {
    fs.mkdirSync(path.join(temp, 'vendor'));
    fs.writeFileSync(path.join(temp, 'package.json'), '{"type":"module"}');
    for (const file of ['world.js', 'gate-moment.mjs', 'map-view.mjs'])
      fs.copyFileSync(path.join(root, 'public/ai-maze-escape', file), path.join(temp, file));
    for (const file of ['three.module.js', 'three.core.js'])
      fs.copyFileSync(path.join(root, 'node_modules/three/build', file), path.join(temp, 'vendor', file));
    const module = await import(pathToFileURL(path.join(temp, 'world.js')).href);
    return {module, cleanup: () => fs.rmSync(temp, {recursive: true, force: true})};
  } catch (e) {
    fs.rmSync(temp, {recursive: true, force: true});
    throw e;
  }
}

const publicCell = {cell: 4, neighbors: [], blocked: false, trap: false, checkpoint: false, clue: false};
const snapshot = (extra = {}) => ({
  runToken: 'physical-theatre-a', tick: 1, currentCell: 4,
  width: 3, height: 3, cells: [publicCell], visibleCells: [4],
  keys: [{id: 'amber', cell: 4, collected: false}], inventory: [],
  doors: [], threats: [], exitCell: null, result: null, ...extra
});
function shutters(world) {
  return [-1, 1].map(side =>
    world.group.getObjectByName('Public key-theatre hinged shutter ' + side));
}

test('the actual witnessed key opens two large, rooted 3D panels without altering game authority', async () => {
  const {module, cleanup} = await loadWorld();
  const world = module.createMazeWorld({balanced: true});
  const before = snapshot();
  const after = snapshot({
    tick: 2, keys: [{id: 'amber', cell: 4, collected: true}], inventory: ['amber']
  });
  const sourceBefore = JSON.stringify(before), sourceAfter = JSON.stringify(after);
  try {
    world.update(before);
    world.animate(0, {gateTime: 0, reducedMotion: false});
    const theatre = world.group.getObjectByName('Disclosed key tide-theatre');
    assert.ok(theatre && theatre.isGroup, 'the scene must contain a physical theatre at the actual key');
    assert.equal(theatre.parent.name, 'In-cell treasure dais');
    assert.equal(theatre.children.filter(n => n.isMesh).length, 9,
      'there are nine substantial, physically rooted frame and crest pieces');
    const closed = shutters(world);
    assert.ok(closed.every(Boolean));
    for (const panel of closed) {
      assert.equal(panel.parent, theatre, 'each physical shutter pivots on the rooted theatre');
      assert.equal(panel.children.filter(n => n.isMesh).length, 5,
        'each full-sized panel is made of actual Three.js geometry');
      assert.equal(panel.rotation.y, 0, 'an uncollected key cannot falsely trigger the reveal');
      assert.ok(panel.children.some(n => n.isMesh && n.scale.y >= 1.2),
        'the main shutter must have a native-view substantial silhouette');
    }
    world.update(after);
    world.animate(0, {gateTime: 0, reducedMotion: false});
    assert.ok(shutters(world).every(p => Math.abs(p.rotation.y) < 1e-6));
    world.animate(.55, {gateTime: .55, reducedMotion: false});
    const midway = shutters(world);
    assert.ok(midway[0].rotation.y > .1 && midway[0].rotation.y < .92,
      'left wing opens sideways only after the witnessed true collection');
    assert.ok(midway[1].rotation.y < -.1 && midway[1].rotation.y > -.92,
      'right wing mirrors the left and stays physically connected');
    world.animate(1.3, {gateTime: 1.3, reducedMotion: false});
    assert.ok(shutters(world).every((p, i) =>
      Math.abs(p.rotation.y - (i === 0 ? .92 : -.92)) < 1e-6));
    assert.ok(world.stats().geometryCount <= 16 && world.stats().materialCount <= 26,
      'the authored effect reuses the original fixed resource pool');
    assert.deepEqual([JSON.stringify(before), JSON.stringify(after)], [sourceBefore, sourceAfter],
      'rendering is not allowed to mutate the public truth');
    world.update(snapshot({runToken: 'new-private-run', tick: 1,
      cells: [], visibleCells: [], keys: [], inventory: []}));
    assert.ok(shutters(world).every(s => !s), 'no ghost theatre in an undisclosed new run');
  } finally {
    world.dispose();
    cleanup();
  }
});

test('remembered collection does not play a fabricated beat; reduced motion settles real shutters', async () => {
  const {module, cleanup} = await loadWorld();
  const world = module.createMazeWorld({balanced: true});
  try {
    const remembered = snapshot({
      keys: [{id: 'amber', cell: 4, collected: true}], inventory: ['amber']
    });
    world.update(remembered);
    world.animate(0, {gateTime: 0, reducedMotion: true});
    assert.ok(shutters(world).every((panel, i) => panel &&
      Math.abs(panel.rotation.y - (i === 0 ? .92 : -.92)) < 1e-6));
    world.animate(45, {gateTime: 45, reducedMotion: true});
    assert.ok(shutters(world).every((panel, i) =>
      Math.abs(panel.rotation.y - (i === 0 ? .92 : -.92)) < 1e-6));
    world.update(snapshot({runToken: 'second', tick: 1, keys: [], inventory: [],
      cells: [], visibleCells: []}));
    assert.ok(shutters(world).every(s => !s));
  } finally {
    world.dispose();
    cleanup();
  }
});


test('true witnessed pickup unveils the physical key stage, then retracts six tall rooted pieces before the next encounter',async()=>{
  const {module,cleanup}=await loadWorld();
  const world=module.createMazeWorld({balanced:true});
  const before=snapshot(),after=snapshot({tick:2,keys:[{id:'amber',cell:4,collected:true}],inventory:['amber']});
  const frozen=[JSON.stringify(before),JSON.stringify(after)];
  try{
    world.update(before);world.animate(0,{gateTime:0,reducedMotion:false});
    assert.ok(Math.abs(world.group.getObjectByName('Disclosed key tide-theatre').position.y)<1e-9,
      'the real theatre remains exactly at resting height until its key is collected');
    world.update(after);
    const stage=world.group.getObjectByName('Disclosed key tide-theatre');
    const reliquary=world.group.getObjectByName('Public tide-shell reliquary crown');
    const petals=Array.from({length:4},(_,i)=>world.group.getObjectByName('Physical shrine petal '+i));
    assert.ok(stage&&reliquary&&petals.every(Boolean));
    world.animate(1.2,{gateTime:1.2,reducedMotion:false});
    assert.ok(Math.abs(stage.position.y)<1e-9&&Math.abs(reliquary.position.y)<1e-9,
      'the original 1.22 second witnessed collection ceremony must not be cropped');
    world.animate(1.77,{gateTime:1.77,reducedMotion:false});
    assert.ok(stage.position.y<-.1&&stage.position.y>-2.5,
      'the physical structure descends smoothly after the real pickup');
    assert.ok(petals.every(p=>p.position.y<.38&&p.position.y>-2.22));
    world.animate(2.4,{gateTime:2.4,reducedMotion:false});
    assert.ok(Math.abs(stage.position.y+2.6)<1e-6&&Math.abs(reliquary.position.y+2.6)<1e-6);
    assert.ok(petals.every(p=>Math.abs(p.position.y-(.38-2.6))<1e-6));
    assert.ok(world.group.getObjectByName('Disclosed spent key shrine'),
      'the truthful empty stone pedestal stays behind after the tall sculpture leaves');
    assert.equal(world.group.getObjectByName('Disclosed golden key'),undefined);
    assert.ok(world.stats().geometryCount<=16&&world.stats().materialCount<=26);
    assert.deepEqual([JSON.stringify(before),JSON.stringify(after)],frozen);
    world.update(snapshot({runToken:'new-run',tick:1,cells:[],visibleCells:[],keys:[],inventory:[]}));
    assert.equal(world.group.getObjectByName('Disclosed key tide-theatre'),undefined);
  }finally{world.dispose();cleanup()}
});

test('already collected key and reduced motion begin with a sunken shrine, never a fabricated fresh pickup',async()=>{
  const {module,cleanup}=await loadWorld();
  const world=module.createMazeWorld({balanced:true});
  const already=snapshot({keys:[{id:'amber',cell:4,collected:true}],inventory:['amber']});
  try{
    world.update(already);
    world.animate(0,{gateTime:0,reducedMotion:true});
    const stage=world.group.getObjectByName('Disclosed key tide-theatre');
    assert.ok(stage&&Math.abs(stage.position.y+2.6)<1e-6);
    world.animate(21,{gateTime:21,reducedMotion:true});
    assert.ok(Math.abs(stage.position.y+2.6)<1e-6);
    assert.equal(world.group.getObjectByName('Disclosed golden key'),undefined);
    assert.equal(already.keys[0].collected,true);
  }finally{world.dispose();cleanup()}
});
