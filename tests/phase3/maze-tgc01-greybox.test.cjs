'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '../..');
const three = pathToFileURL(path.join(root, 'node_modules/three/build/three.module.js')).href;
const source = fs.readFileSync(path.join(root, 'public/ai-maze-escape/world.js'), 'utf8');
const production = import('data:text/javascript;base64,' + Buffer.from(source
  .replace("'./vendor/three.module.js'", JSON.stringify(three))
  .replace("'./gate-moment.mjs'", JSON.stringify(pathToFileURL(path.join(root, 'public/ai-maze-escape/gate-moment.mjs')).href))
  .replace("'./map-view.mjs'", JSON.stringify(pathToFileURL(path.join(root, 'public/ai-maze-escape/map-view.mjs')).href)))
  .toString('base64'));

function disclosedCourt() {
  const ids = [];
  for (let row = 4; row <= 7; row++) for (let col = 6; col <= 10; col++) ids.push(row * 17 + col);
  const cells = ids.map(cell => ({ cell, visible: true, confidencePermille: 1000,
    neighbors: ids.filter(other => Math.abs(other % 17 - cell % 17)
      + Math.abs(Math.floor(other / 17) - Math.floor(cell / 17)) === 1),
    blocked: false, trap: false, clue: false, checkpoint: false, visits: 1 }));
  return { layoutId: 'guardian-court-v1', runToken: 'court-fixture', lifecycle: 'running',
    tick: 5, width: 17, height: 11, currentCell: 92, cells,
    visibleCells: ids, discoveredCells: ids, keys: [], doors: [], threats: [],
    inventory: [], exitCell: null };
}

test('authored court ordinary terrain stays below the two actors and spans only disclosed walkable cells', async () => {
  const { createMazeWorld, cellHeight, cellPosition } = await production;
  const THREE = await import(three);
  const snapshot = disclosedCourt(), serialized = JSON.stringify(snapshot);
  const world = createMazeWorld({ balanced: true });
  try {
    world.update(snapshot);
    const terrain = world.group.children[1];
    const bounds = new THREE.Box3().setFromObject(terrain);
    const floor = cellHeight(92, 17, 11);
    assert.ok(bounds.max.y <= floor + .51,
      `Ordinary court masonry must not rise through the actor shot: ${bounds.max.y - floor}`);
    assert.deepEqual(world.stats().renderedCells, snapshot.discoveredCells);
    const ray = new THREE.Raycaster();
    for (const [a, b] of [[92, 93], [93, 94], [93, 110]]) {
      const p = cellPosition(a, 17, 11), q = cellPosition(b, 17, 11);
      ray.set(new THREE.Vector3((p.x + q.x) / 2, floor + .1, (p.z + q.z) / 2),
        new THREE.Vector3(0, -1, 0));
      const hit = ray.intersectObject(terrain, true)[0];
      assert.ok(hit && Math.abs(hit.point.y - floor) < .025,
        'A reciprocal same-tier open edge must be a continuous, level real deck');
    }
    assert.equal(JSON.stringify(snapshot), serialized, 'Presentation cannot rewrite topology');
    const hidden = { ...snapshot, runToken: 'hidden-court',
      cells: [{ ...snapshot.cells[0], neighbors: [] }],
      visibleCells: [74], discoveredCells: [74], currentCell: 74 };
    world.update(hidden);
    assert.deepEqual(world.stats().renderedCells, [74], 'Layout identity does not reveal the room');
    const single = new THREE.Box3().setFromObject(world.group.children[1]);
    assert.ok(single.getSize(new THREE.Vector3()).x < 2.8);
    assert.ok(single.getSize(new THREE.Vector3()).z < 2.8);
  } finally { world.dispose(); }
});

test('authored court keeps solid closed boundaries and does not alter procedural presentation', async () => {
  const { createMazeWorld, cellHeight, cellPosition } = await production;
  const THREE = await import(three);
  const snapshot = disclosedCourt(), world = createMazeWorld({ balanced: true });
  try {
    // The center edge is deliberately SEALED in both authoritative public cells.
    snapshot.cells.find(c => c.cell === 92).neighbors = [75, 91, 109];
    snapshot.cells.find(c => c.cell === 93).neighbors = [76, 94, 110];
    world.update(snapshot);
    const p = cellPosition(92, 17, 11), floor = cellHeight(92, 17, 11);
    const ray = new THREE.Raycaster(new THREE.Vector3(p.x, floor + .25, p.z),
      new THREE.Vector3(1, 0, 0), 0, 2.4);
    const hits = ray.intersectObject(world.group.children[1], true);
    assert.ok(hits.length > 0 && hits[0].distance < 1.4, 'A real sealed edge remains an opaque physical wall');
    world.update({ ...snapshot, layoutId: undefined, runToken: 'procedural-reference' });
    const ordinary = new THREE.Box3().setFromObject(world.group.children[1]);
    assert.ok(ordinary.max.y > floor + .51, 'Existing procedural scene is not globally replaced');
  } finally { world.dispose(); }
});


test('authored stone deck has actual glazed closed boundaries and low clue instruments',async()=>{
  const {createMazeWorld}=await production;
  const snapshot=disclosedCourt(),world=createMazeWorld({balanced:true});
  snapshot.cells.find(c=>c.cell===92).clue=true;
  try{
    world.update(snapshot);
    let glass=false,lowClue=null;
    world.group.traverse(node=>{
      if(node.isInstancedMesh&&node.material?.name==='Disclosed sea-glass mosaic')glass=true;
      if(node.name==='Disclosed Tideglass inset clue medallion')lowClue=node;
    });
    assert.equal(glass,true);
    assert.ok(lowClue);
    const THREE=await import(three);
    const bounds=new THREE.Box3().setFromObject(lowClue);
    assert.ok(bounds.getSize(new THREE.Vector3()).y<.2,'no upright clue blocks the counter');
    assert.deepEqual(world.stats().renderedCells,snapshot.discoveredCells);
  }finally{world.dispose();}
});
