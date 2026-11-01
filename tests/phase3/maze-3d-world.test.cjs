'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { MazeRuntime } = require('../../dist/games/ai-maze-escape/src/runtime/run.js');
const { buildMazeRenderSnapshot } = require('../../dist/games/ai-maze-escape/src/presentation/snapshot.js');
const source = fs.readFileSync(path.resolve(__dirname, '../../public/ai-maze-escape/world.js'), 'utf8');
const three = pathToFileURL(path.resolve(__dirname, '../../node_modules/three/build/three.module.js')).href;
const modulePromise = import(`data:text/javascript;base64,${Buffer.from(source.replace("'./vendor/three.module.js'", JSON.stringify(three))).toString('base64')}`);
const fixture = (cells) => ({ runToken: 'terrace-fixture', width: 7, height: 9, currentCell: 24, cells, visibleCells: cells.map(c => c.cell), discoveredCells: cells.map(c => c.cell), doors: [], keys: [], threats: [], exitCell: null });

test('terrace stairs join disclosed legal passages and never disclose hidden neighbors', async () => {
  const { createMazeWorld, sampleGroundHeight, cellPosition, cellHeight } = await modulePromise;
  const low = {cell: 24, neighbors: [17]}, high = {cell: 17, neighbors: [24]};
  const known = fixture([low, high]), world = createMazeWorld({balanced: true});
  world.update(known);
  assert.deepEqual(world.stats().stairEdges, [[24, 17]]);
  const a = cellPosition(24, 7, 9), b = cellPosition(17, 7, 9);
  let previous = cellHeight(24, 7, 9);
  for (let i = 0; i <= 240; i++) {
    const progress = i / 240;
    const ground = sampleGroundHeight(a.x + (b.x - a.x) * progress, a.z + (b.z - a.z) * progress, known);
    assert.ok(ground >= previous - 1e-8);
    assert.ok(ground - previous <= .175001);
    previous = ground;
  }
  assert.equal(previous, cellHeight(17, 7, 9));
  const hidden = fixture([low]);
  world.update(hidden);
  assert.deepEqual(world.stats().renderedCells, [24]);
  assert.deepEqual(world.stats().stairEdges, []);
  assert.equal(sampleGroundHeight(a.x, a.z - .8, hidden), cellHeight(24, 7, 9));
  world.update(fixture([{...low, neighbors: []}, {...high, neighbors: []}]));
  assert.deepEqual(world.stats().stairEdges, []);
  world.dispose(); world.dispose();
  assert.equal(world.stats().geometryCount, 0);
  assert.equal(world.stats().materialCount, 0);
  assert.equal(world.stats().textureCount, 0);
});

test('successive real runs retain only disclosed geometry and fixed shared resources', async () => {
  const { createMazeWorld } = await modulePromise;
  for (const balanced of [false, true]) {
    const world = createMazeWorld({balanced});
    const budget = world.stats();
    assert.ok(budget.geometryCount <= 12 && budget.materialCount <= 24 && budget.textureCount <= 4);
    for (let run = 0; run < 6; run++) {
      const runtime = MazeRuntime.create({width: 13, height: 9, profile: 'loops', keyCount: 1, threatCount: 1, visibilityRadius: 3}, `3d-resources-${run}`);
      for (let tick = 0; tick < 18; tick++) {
        const snapshot = buildMazeRenderSnapshot(runtime.state), before = JSON.stringify(snapshot);
        world.update(snapshot); world.animate(tick / 3, {reducedMotion: tick % 2 === 0});
        const stats = world.stats(), known = new Map(snapshot.cells.map(cell => [cell.cell, cell]));
        assert.deepEqual(stats.renderedCells, snapshot.cells.map(cell => cell.cell));
        for (const [low, high] of stats.stairEdges) assert.ok(known.has(low) && known.has(high) && known.get(low).neighbors.includes(high));
        assert.equal(stats.geometryCount, budget.geometryCount);
        assert.equal(stats.materialCount, budget.materialCount);
        assert.equal(stats.textureCount, budget.textureCount);
        assert.equal(JSON.stringify(snapshot), before);
        if (snapshot.result) break;
        runtime.step();
      }
    }
    world.dispose();
    assert.equal(world.group.children.length, 0);
  }
});


test('a publicly observed locked gate has an unmistakable seal and an open gate clears the passage', async () => {
  const { createMazeWorld } = await modulePromise;
  const world = createMazeWorld({balanced: true});
  const cells = [{cell: 24, neighbors: [25]}, {cell: 25, neighbors: [24]}];
  const door = {id: 'public-gate', a: 24, b: 25, open: false, requiredKeyId: 'observed-key'};
  const closed = {...fixture(cells), doors: [door]};
  const original = JSON.stringify(closed);
  const initialBudget = world.stats();
  world.update(closed);
  const barrier = world.group.getObjectByName('Disclosed sealed gate');
  assert.ok(barrier, 'a disclosed closed door must have a modeled blockage');
  const bars = barrier.getObjectByName('Withdrawable gate bars');
  const seal = barrier.getObjectByName('Closed crossed barrier');
  assert.equal(bars.visible, true);
  assert.equal(seal.children.length, 2, 'two crossing braces should read as a closed gate from the follow camera');
  assert.ok(seal.children.every(child => child.isMesh && child.visible));
  assert.ok(seal.children.every(child => child.position.z > .2),
    'both warning diagonals must sit ahead of the bars, toward the +X/+Z follow camera');
  const lock = bars.getObjectByName('Physical recessed keyhole');
  assert.ok(lock, 'the gate must have a modeled physical socket, not just a floating key crest');
  assert.equal(lock.userData.keyState, 'unknown', 'an undisclosed key cannot appear to be carried');
  assert.equal(lock.children.length, 7, 'the face retains layered hardware and a two-part physical keyhole');
  const crown = lock.getObjectByName('Recessed keyhole crown');
  const throat = lock.getObjectByName('Recessed keyhole throat');
  assert.ok(crown?.isMesh && throat?.isMesh, 'the actual socket has a modeled round crown and continuous throat');
  assert.equal(crown.material, throat.material, 'the recessed keyhole has one dark, connected silhouette');
  assert.ok(crown.scale.x >= .15 && throat.scale.y >= .30,
    'both portions remain legible at gameplay scale rather than returning to a tiny pinhole');
  assert.ok(crown.position.z > .82 && throat.position.z > .82,
    'the actual recessed opening is front-facing, ahead of the sealed bars');
  assert.ok(crown.position.y - crown.scale.y <= throat.position.y + throat.scale.y / 2,
    'the crown and throat must visibly meet instead of reading as detached dots');
  assert.ok(lock.position.x >= .5 && lock.position.z >= .14,
    'the accessible socket sits on the camera-facing side stile, away from the crossed barrier');
  const keyholeRing = lock.children.find(part => part.geometry?.type === 'TorusGeometry');
  assert.ok(keyholeRing?.scale.x >= .22,
    'the physical keyhole must retain enough modeled silhouette for the portrait encounter');
  assert.ok(lock.children.some(part => part.position.z > .7),
    'the readable lock socket must be in front of the crossed seal, facing the camera');
  assert.equal(barrier.getObjectByName('Disclosed matching key emblem'), undefined,
    'the modeled lock cannot advertise a matching collectible that remains undisclosed');

  // Wordless key/lock causality must reflect *only* a public matching key.
  // The collectible's octagonal bow reappears on the gate, without revealing
  // any hidden key or declaring the barrier open before authoritative state.
  const knownKey = {...closed, keys: [{id: 'observed-key', cell: 24, collected: false}]};
  world.update(knownKey);
  const observedCrest = world.group.getObjectByName('Disclosed matching key emblem');
  assert.ok(observedCrest, 'an already observed matching key may appear on its lock crest');
  assert.equal(observedCrest.userData.keyState, 'observed');
  assert.equal(world.group.getObjectByName('Physical recessed keyhole').userData.keyState, 'observed',
    'an observed but uncollected key has the ordinary gold keyhole');
  assert.ok(observedCrest.position.z > .2, 'the shared key icon faces the actual camera');
  assert.ok(observedCrest.children.length >= 6, 'the emblem is fully modeled, not a placeholder');
  world.update({...knownKey, keys: [{id: 'unrelated', cell: 24, collected: false}]});
  assert.equal(world.group.getObjectByName('Disclosed matching key emblem'), undefined,
    'a different observed key must not be linked to this gate');

  const carriedKey = {...knownKey,
    keys: [{id: 'observed-key', cell: 24, collected: true}], inventory: ['observed-key']};
  world.update(carriedKey);
  const carriedCrest = world.group.getObjectByName('Disclosed matching key emblem');
  assert.ok(carriedCrest, 'public inventory may show that the exact gate key is carried');
  assert.equal(carriedCrest.userData.keyState, 'carried');
  const carriedLock = world.group.getObjectByName('Physical recessed keyhole');
  assert.equal(carriedLock.userData.keyState, 'carried');
  const {Vector3} = await import(three);
  const realSocket=carriedLock.localToWorld(new Vector3(0,.92,.89));
  assert.ok(world.matchingPublicSocket(door.a,door.b,new Vector3())?.distanceTo(realSocket)<1e-8,
    'the target is the actual modeled socket, not a guessed gate center');
  assert.ok(world.matchingPublicSocket(door.b,door.a,new Vector3())?.distanceTo(realSocket)<1e-8,
    'reversed public edge endpoints resolve the identical physical socket');
  assert.equal(world.matchingPublicSocket(door.a,26,new Vector3()),null,
    'another known edge cannot reuse the wrong lock');
  const socketRing = carriedLock.children.find(child => child.geometry?.type === 'TorusGeometry');
  assert.ok(socketRing && socketRing.material.emissive.g > .4 && socketRing.scale.x >= .3,
    'only the correctly carried matching key turns a physically larger keyhole rim mint');
  assert.equal(carriedLock.getObjectByName('Recessed keyhole crown').material,
    carriedLock.getObjectByName('Recessed keyhole throat').material,
    'matching-key highlight cannot fill the dark physical opening or suggest an open passage');
  assert.ok(world.group.getObjectByName('Closed crossed barrier'),
    'possessing the key must NEVER withdraw a gate that authority still reports closed');
  world.update({...carriedKey, inventory: []});
  assert.equal(world.matchingPublicSocket(door.a,door.b,new Vector3()),null,
    'lost matching key must invalidate its pose target');
  assert.equal(world.group.getObjectByName('Disclosed matching key emblem'), undefined,
    'inventory-only changes must invalidate the crest rather than leaving a stale hint');
  world.update({...carriedKey, doors: [{...door, open: true}]});
  assert.equal(world.matchingPublicSocket(door.a,door.b,new Vector3()),null,
    'truly open door cannot supply closed-lock target');
  assert.equal(world.group.getObjectByName('Disclosed matching key emblem'), undefined,
    'the key motif and obstruction both disappear when the real gate opens');

  // The same local near face is +Z for north/south openings and rotates to +X
  // for east/west openings, matching the fixed isometric camera offset.
  const northSouth = {...fixture([{cell: 24, neighbors: [31]}, {cell: 31, neighbors: [24]}]),
    doors: [{...door, a: 24, b: 31}]};
  world.update(northSouth);
  const vertical = world.group.getObjectByName('Disclosed sealed gate');
  assert.ok(vertical, 'the other gate orientation stays source-disclosed and modeled');
  assert.ok(vertical.getObjectByName('Closed crossed barrier').children.every(child => child.position.z > .2));
  assert.ok(vertical.getObjectByName('Recessed keyhole crown') && vertical.getObjectByName('Recessed keyhole throat'),
    'both cardinal gate orientations retain the same modeled keyhole');

  world.update({...closed, doors: [{...door, open: true}]});
  assert.equal(world.group.getObjectByName('Disclosed sealed gate'), undefined);
  const opened = world.group.getObjectByName('Disclosed open gate');
  assert.ok(opened, 'opened doors preserve their architectural frame');
  assert.equal(opened.getObjectByName('Withdrawable gate bars').visible, false);
  assert.equal(opened.getObjectByName('Closed crossed barrier'), undefined,
    'the warning obstruction must disappear when authority reports the gate open');
  assert.equal(opened.getObjectByName('Physical recessed keyhole'), undefined,
    'an actually opened gate must not keep the locked socket visible');

  world.update({...closed, cells: [{cell: 26, neighbors: []}]});
  assert.equal(world.group.getObjectByName('Disclosed sealed gate'), undefined,
    'a door that is absent from public knowledge cannot gain a world-space marker');
  const finalBudget = world.stats();
  assert.equal(finalBudget.geometryCount, initialBudget.geometryCount);
  assert.equal(finalBudget.materialCount, initialBudget.materialCount);
  assert.equal(JSON.stringify(closed), original, 'presentation must never mutate public state');
  world.dispose();
});
