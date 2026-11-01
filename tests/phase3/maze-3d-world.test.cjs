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


test('lagoon surface is a single deterministic bounded tileable visual resource', async () => {
  const {createMazeWorld} = await modulePromise;
  const world = createMazeWorld({balanced: true});
  const state = fixture([{cell: 24, neighbors: []}]);
  world.update(state);
  const texture = world.group.children[0].children[0]?.material.map;
  assert.ok(texture?.image?.data, 'actual shared backdrop has a color raster');
  const image = texture.image.data;
  assert.equal(image.length, 128 * 128 * 4, 'fixed raster memory budget');
  const range = new Set();
  for (let i = 0; i < image.length; i += 4) {
    assert.equal(image[i + 3], 255);
    range.add(image[i + 1]);
  }
  assert.ok(range.size >= 12, 'lagoon has modeled tonal depth beyond a flat fill');
  const before = Buffer.from(image);
  world.update(fixture([{cell: 24, neighbors: []}, {cell: 25, neighbors: []}]));
  assert.deepEqual(Buffer.from(texture.image.data), before,
    'public discoveries never mutate water pixels or disclose undiscovered topology');
  world.dispose();
});

test('dimension-only tide contours remain non-navigable and stable across private maze knowledge', async () => {
  const {createMazeWorld} = await modulePromise;
  const world = createMazeWorld({balanced: true}), budget = world.stats();
  const first = fixture([{cell:24,neighbors:[]}]);
  const original = JSON.stringify(first);
  world.update(first);
  const tide = world.group.children[0].getObjectByName('Dimension-only lagoon tide contours');
  assert.ok(tide?.isInstancedMesh && tide.count === 44,
    'the lagoon has one batched physical water-only current layer');
  assert.equal(tide.castShadow, false);
  // An unobstructed full-size water screenshot rejected the old large closed
  // round loops as collectible-like false affordances. Every public-only foam
  // contour must read as a narrow horizontal water stroke below the stage.
  const {Matrix4,Vector3,Quaternion} = await import(three);
  const transform = new Matrix4(), position = new Vector3(), rotation = new Quaternion(), scale = new Vector3();
  for(let i=0;i<tide.count;i++){
    tide.getMatrixAt(i,transform); transform.decompose(position,rotation,scale);
    assert.ok(scale.y < scale.x * .2, 'water marks are slim foam streaks, not collectible-like circular halos');
    assert.ok(position.y < -1.60 && position.y > -1.68, 'decorative tide marks remain below every stage floor');
  }
  const matrix = Array.from(tide.instanceMatrix.array);
  const tint = Array.from(tide.instanceColor.array);
  const exposed = fixture([{cell:24,neighbors:[25]}, {cell:25,neighbors:[24]}]);
  world.update(exposed);
  assert.equal(world.group.children[0].getObjectByName(tide.name), tide,
    'new public discoveries do not rebuild/reposition the dimension-only currents');
  assert.deepEqual(Array.from(tide.instanceMatrix.array), matrix);
  assert.deepEqual(Array.from(tide.instanceColor.array), tint);
  world.update({...exposed,runToken:'another-run',cells:[]});
  const rebuilt = world.group.children[0].getObjectByName(tide.name);
  assert.notEqual(rebuilt, tide, 'another run must replace and dispose the old instance object');
  assert.deepEqual(Array.from(rebuilt.instanceMatrix.array), matrix,
    'same public dimensions draw the exact same background regardless of secret layout');
  assert.deepEqual(world.stats().renderedCells, [], 'water contours cannot fabricate discovered floors');
  assert.equal(world.stats().geometryCount, budget.geometryCount);
  assert.equal(world.stats().materialCount, budget.materialCount);
  assert.equal(world.stats().textureCount, budget.textureCount);
  assert.equal(JSON.stringify(first), original);
  world.animate(32,{reducedMotion:true});
  world.animate(33,{reducedMotion:false});
  assert.deepEqual(Array.from(rebuilt.instanceMatrix.array), matrix,
    'cosmetic water contours require no moving CPU instance matrices in each frame');
  world.dispose();
  assert.equal(world.stats().geometryCount,0);
  assert.equal(world.stats().materialCount,0);
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


test('the original tide-rose crown belongs only to a genuinely disclosed exit', async () => {
  const {createMazeWorld} = await modulePromise;
  for (const balanced of [true, false]) {
    const world = createMazeWorld({balanced});
    const base = fixture([{cell:24, neighbors:[]}]);
    const discovered = {...base, exitCell:24};
    const unchanged = JSON.stringify(discovered);
    const initialResources = world.stats();
    world.update(base);
    assert.equal(world.group.getObjectByName('Disclosed exit tide rose'), undefined,
      'no golden destination sign before the exit is publicly known');
    world.update(discovered);
    const portal = world.group.getObjectByName('Disclosed exit portal');
    const crown = portal?.getObjectByName('Disclosed exit tide rose');
    assert.ok(crown?.isGroup, 'the discovered destination owns the modeled crown');
    const observatory = portal?.getObjectByName('Disclosed exit observatory');
    assert.ok(observatory?.isGroup, 'the public exit has a distinctive physical observatory stage');
    const watchtowers = observatory.children.filter(child => child.name === 'Disclosed exit watchtower');
    assert.equal(watchtowers.length, 2, 'the destination silhouette has two freestanding modeled watchtowers');
    assert.deepEqual(watchtowers.map(tower => tower.position.x), [-.96, .96],
      'balanced tower geometry frames rather than blocks the portal opening');
    assert.ok(watchtowers.every(tower => tower.position.z < -.54 && tower.children.length >= 9),
      'towers stay behind the portal opening and contain physical stone/bronze/lamp details');
    const floorDial = observatory.getObjectByName('Disclosed exit floor dial');
    assert.equal(floorDial?.children.length, 8,
      'the revealed destination has one physical low tide ring and seven original inlays');
    assert.ok(floorDial.children.every(piece => piece.position.y <= .03),
      'the floor dial cannot resemble a new raised or navigable platform');

    assert.equal(crown.children.length, 11, 'eight physical rays, two rims and a core');
    assert.equal(crown.children.filter(part => part.geometry?.type === 'ExtrudeGeometry').length, 8,
      'rays are real shared beveled 3D stone, not a screen-facing text or HUD glyph');
    assert.ok(crown.position.y > 2.8 && crown.position.z > -.54,
      'the clockwork landmark rises above the disclosed arch on the camera-facing side');
    assert.equal(world.stats().geometryCount, initialResources.geometryCount);
    assert.equal(world.stats().materialCount, initialResources.materialCount);
    assert.equal(JSON.stringify(discovered), unchanged,
      'decorations must never change the public game state');
    world.update({...discovered, exitCell:null});
    assert.equal(world.group.getObjectByName('Disclosed exit tide rose'), undefined,
      'reset/withdrawn public exit removes the entire marker');
    world.update({...discovered, cells:[{cell:25, neighbors:[]}]});
    assert.equal(world.group.getObjectByName('Disclosed exit tide rose'), undefined,
      'knowing an exit index without observing its actual cell cannot render it');
    world.dispose();
    assert.equal(world.stats().geometryCount, 0);
    assert.equal(world.stats().materialCount, 0);
  }
});


test('sculpted shore gardens remain restricted to known outer cells, with fixed resources', async () => {
  const {createMazeWorld} = await modulePromise;
  const onlyInterior = fixture([{cell:24,neighbors:[]}]);
  const wholeNorth = fixture(Array.from({length:7}, (_,cell) => ({cell,neighbors:[]})));
  for (const balanced of [true,false]) {
    const world = createMazeWorld({balanced});
    const budget = world.stats();
    world.update(onlyInterior);
    assert.equal(world.stats().coastalGardens, 0,
      'an observed room amid undisclosed cells must not plant invented shorelines');
    const before = JSON.stringify(wholeNorth);
    world.update(wholeNorth);
    const seen = world.stats();
    assert.deepEqual(seen.renderedCells, wholeNorth.cells.map(c => c.cell),
      'all sculpted terrain must still be limited to genuinely disclosed rooms');
    assert.ok(seen.coastalGardens > 0 && seen.coastalGardens <= 14,
      'coastal clusters are substantial yet limited to edges of known real cells');
    const foliage = world.group.children[1].children.find(child =>
      child.isInstancedMesh && child.material.name === 'Disclosed perimeter hanging fronds');
    assert.ok(foliage?.isInstancedMesh, 'perimeter foliage must use actual shared 3D geometry');
    assert.equal(foliage.count, (seen.coastalGardens + seen.wallGardens) * 4,
      'four repeated blade clusters per genuine public garden are batched, not created in render frames');
    assert.equal(seen.geometryCount, budget.geometryCount);
    assert.equal(seen.materialCount, budget.materialCount);
    assert.equal(seen.textureCount, budget.textureCount);
    assert.equal(JSON.stringify(wholeNorth), before,
      'scenery must never alter public simulation knowledge');
    world.animate(100, {reducedMotion:false});
    world.animate(101, {reducedMotion:true});
    assert.equal(world.stats().coastalGardens, seen.coastalGardens,
      'animation never creates new shoreline geometry');
    world.update(onlyInterior);
    assert.equal(world.stats().coastalGardens, 0,
      'known fringe is withdrawn when the disclosed snapshot no longer includes it');
    const remaining = world.group.children[1].children.find(child =>
      child.isInstancedMesh && child.material.name === 'Disclosed perimeter hanging fronds');
    assert.equal(remaining?.count || 0, world.stats().wallGardens * 4,
      'no stale external-coast blades survive a public withdrawal; actual known solid walls may retain their own plants');
    world.update({...wholeNorth,runToken:'separate-run'});
    assert.ok(world.stats().coastalGardens > 0, 'new runs rebuild only their own disclosed coast');
    world.dispose();
    assert.equal(world.stats().geometryCount,0);
    assert.equal(world.stats().materialCount,0);
    assert.equal(world.stats().coastalGardens,0);
    assert.equal(world.stats().wallGardens,0);
  }
});


test('lifted living-wall gardens never invent unknown passage topology', async () => {
  const {createMazeWorld} = await modulePromise;
  const world = createMazeWorld({balanced:true});
  const undecided = fixture([{cell:24,neighbors:[17,25,31,23]}]);
  const trulySealed = fixture([{cell:24,neighbors:[]}]);
  const before = JSON.stringify(undecided);
  world.update(undecided);
  assert.equal(world.stats().wallGardens,0,
    'all four publicly passable but undisclosed neighbors may not be falsely sealed or decorated');
  assert.equal(world.stats().coastalGardens,0,
    'an interior room is never a fictional shoreline');
  assert.deepEqual(world.stats().renderedCells,[24]);
  assert.equal(JSON.stringify(undecided),before);
  world.update(trulySealed);
  assert.ok(world.stats().wallGardens>0,
    'actual public blocked walls gain recognizable grounded hanging gardens');
  assert.equal(world.stats().coastalGardens,0);
  const foliage = world.group.children[1].children.find(child =>
    child.isInstancedMesh && child.material.name === 'Disclosed perimeter hanging fronds');
  assert.equal(foliage?.count, world.stats().wallGardens*4,
    'solid-wall fronds remain batched in the shared material');
  world.update(undecided);
  assert.equal(world.stats().wallGardens,0,
    'a newly disclosed open passage removes any stale solid-wall foliage');
  assert.equal(world.group.children[1].children.some(child =>
    child.isInstancedMesh && child.material.name === 'Disclosed perimeter hanging fronds'),false);
  world.dispose();
});

test('authored mineral courts decorate only disclosed safe floors using shared bounded resources', async () => {
  const {createMazeWorld}=await modulePromise;
  const whole=fixture(Array.from({length:63},(_,cell)=>({cell,neighbors:[]})));
  const original=JSON.stringify(whole);
  for(const balanced of [true,false]) {
    const world=createMazeWorld({balanced}), budget=world.stats();
    assert.ok(budget.materialCount<=24 && budget.geometryCount<=12);
    world.update(whole);
    const terrain=world.group.children[1];
    const mineral=terrain.children.filter(mesh => mesh.isInstancedMesh &&
      ['Disclosed mineral clay court','Disclosed sea-glass mosaic'].includes(mesh.material.name));
    assert.ok(mineral.length>=2, 'warm and cool court regions form physical instanced 3D surfaces');
    assert.ok(mineral.reduce((total,mesh)=>total+mesh.count,0)>8,
      'a true disclosed district receives visible grouped relief rather than tiny isolated particles');
    assert.deepEqual(world.stats().renderedCells,whole.cells.map(c=>c.cell));
    assert.equal(world.stats().geometryCount,budget.geometryCount);
    assert.equal(world.stats().materialCount,budget.materialCount);
    assert.equal(JSON.stringify(whole),original);
    world.animate(3,{reducedMotion:true});
    world.animate(4,{reducedMotion:false});
    assert.equal(world.stats().materialCount,budget.materialCount,
      'courtyard tesserae never allocate new materials during animation');
    world.update(fixture([]));
    assert.equal(terrain.children.length,0,'no mineral court appears without a real public cell');
    world.update(fixture([{cell:24,neighbors:[],trap:true}]));
    const muted=terrain.children.filter(mesh=>mesh.isInstancedMesh &&
      mesh.material.name==='Disclosed sea-glass mosaic');
    assert.equal(muted.length,0,'a public trap cell is not disguised as a decorative court');
    world.dispose();
    assert.equal(world.stats().materialCount,0);
    assert.equal(world.stats().geometryCount,0);
  }
});

test('three public terrace districts stay readable as physical, source-bounded court floors', async () => {
  const {createMazeWorld} = await modulePromise;
  const THREE = await import(three);
  const publicCells = fixture(Array.from({length:63}, (_,cell) => ({cell, neighbors:[]})));
  const original = JSON.stringify(publicCells);
  for (const balanced of [true,false]) {
    const world = createMazeWorld({balanced}), initial = world.stats();
    world.update(publicCells);
    const terrain = world.group.children[1], matrix = new THREE.Matrix4();
    const position = new THREE.Vector3(), rotation = new THREE.Quaternion(), scale = new THREE.Vector3();
    function floorInstances(materialName, expectedY) {
      let count = 0;
      for (const mesh of terrain.children) {
        if (!mesh.isInstancedMesh || mesh.material.name !== materialName) continue;
        for (let i = 0; i < mesh.count; i++) {
          mesh.getMatrixAt(i, matrix); matrix.decompose(position,rotation,scale);
          // Large actual paving, not the tiny decorative mosaic or wall inlay.
          if (scale.x >= 1.1 && scale.z >= 1.1 && Math.abs(position.y-expectedY)<.03) count++;
        }
      }
      return count;
    }
    assert.ok(floorInstances('Disclosed sunlit ivory terrace', 2.8-.035) >= 10,
      'upper disclosed level has substantial sunlit stone, not scattered white pixels');
    assert.ok(floorInstances('Disclosed mineral clay court', 1.4-.035) >= 10,
      'middle disclosed level forms a sustained warm red-clay court');
    assert.ok(floorInstances('Disclosed sea-glass mosaic', -.035) >= 10,
      'low disclosed level forms a real tidal-green court without a hidden path hint');
    assert.deepEqual(world.stats().renderedCells, publicCells.cells.map(c=>c.cell));
    assert.equal(JSON.stringify(publicCells), original, 'art never alters publicly supplied knowledge');
    assert.equal(world.stats().materialCount,initial.materialCount);
    assert.equal(world.stats().geometryCount,initial.geometryCount);
    world.animate(13,{reducedMotion:false}); world.animate(13,{reducedMotion:true});
    assert.equal(world.stats().materialCount,initial.materialCount,
      'no new material allocated in either animation path');
    world.update(fixture([{cell:24,neighbors:[]}]));
    assert.deepEqual(world.stats().renderedCells,[24]);
    assert.equal(floorInstances('Disclosed sea-glass mosaic',-.035),0,
      'a single mid-tier publicly disclosed room never paints unseen lower courts');
    world.update(fixture([]));
    assert.equal(terrain.children.length,0,'all terrace imagery withdraws with public knowledge');
    world.dispose();
    assert.equal(world.stats().geometryCount,0);
    assert.equal(world.stats().materialCount,0);
  }
});
