'use strict';
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');

// P0 visual evidence: the original portrait guardian video has large bronze
// non-colliding clockwork pylons behind the two real combatants at ticks
// 305-317. This test assesses ACTUAL world mesh origins, not a screenshot or
// a fabricated character/gameplay state.
const ROOT = path.resolve(__dirname, '../..');
const sourcePath = path.join(ROOT, 'public/infinite-tower-climb/visuals/world.mjs');
const source = fs.readFileSync(sourcePath, 'utf8');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'tower-cap-clearspan-'));
after(() => fs.rmSync(temp, { recursive: true, force: true }));

function layout() {
  const prefix = 'export function clockworkCapActionClearSpan(';
  const start = source.indexOf(prefix);
  assert.ok(start !== -1, 'a named layout must own the whole physical open cap, not untracked angle patches');
  const end = source.indexOf('\n}\n', start);
  assert.ok(end > start, 'layout helper must be a self-contained pure function');
  return vm.runInNewContext(source.slice(start, end + 2).replace('export ', '') +
    '; clockworkCapActionClearSpan');
}

test('authentic clockwork guardian cap has a physical 1.1rad two-body daylight corridor', () => {
  const cap = layout();
  const current = cap('clockwork', 45);
  assert.equal(current.pylons.length, 3);
  assert.equal(current.geology.length, 3);
  // Full shaft footprints must clear the camera-facing action arc, not only
  // their center angles. Original route is on radius 23.4..27.2, outside them.
  for (const p of current.pylons) {
    assert.ok(p.r + p.R < 23.4, 'structural art may not become a walkable-route collider');
    const halfArc = Math.asin(Math.min(.999, p.R / p.r));
    const center = Math.abs(Math.atan2(Math.sin(p.a), Math.cos(p.a)));
    assert.ok(center - halfArc > 1.12, 'full clockwork tower shaft must stay behind the battle sightline');
    assert.ok(p.top > 45 && p.bottom < -20, 'monumental load-bearing silhouette retained');
  }
  for (const [a, y, width, h, depth] of current.geology) {
    assert.ok(Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) -
      Math.asin(Math.min(.999, Math.max(width, depth) / (2 * 16.1))) > 1.12,
      'full high geological mass must stay out of guardian action sky window');
    assert.ok(h >= 60 && width >= 5 && depth >= 6, 'no mass deleted to fake a clear scene');
    assert.ok(Number.isFinite(y));
  }
});

test('other biome load paths remain unchanged; clockwork still terminates in grounded roof supports', () => {
  const cap = layout();
  assert.deepEqual(Array.from(cap('foundry',45).pylons, p => p.a), [-.66,.67,-.18]);
  assert.deepEqual(Array.from(cap('ruins',45).geology, r => r[0]), [-1.12,1.18,2.5]);
  assert.deepEqual(Array.from(cap('storm',45).pylons, p => p.a), [-.66,.67,-.18]);
  assert.equal(cap('clockwork',45).overheadLinks.length,3,
    'three relocated structural feet must have real crown load paths');
  assert.match(source,/const capStructure=clockworkCapActionClearSpan\(theme,height\)/,
    'live 3D build must consume the exact tested physical cap layout');
  assert.match(source,/for\(const link of capStructure\.overheadLinks\)/,
    'the original 3D scene must construct its canopy connections');
});

test('the actual batched Three.js cap leaves the body-height forward arc open', async () => {
  const threeURL = pathToFileURL(path.join(ROOT,
    'node_modules/three/build/three.module.js')).href;
  const rootURL = pathToFileURL(path.join(ROOT,
    'public/infinite-tower-climb/visuals'));
  const imports = {
    "'/tower/vendor/three.module.js'": threeURL,
  };
  for (const local of ['coordinates','world-surface','scene-hierarchy',
    'mesh-provenance','guardian-passage','guardian-transmission-layout']) {
    imports["'./" + local + ".mjs'"] =
      pathToFileURL(path.join(ROOT,'public/infinite-tower-climb/visuals',local+'.mjs')).href;
  }
  let patched = source;
  for (const [original, replacement] of Object.entries(imports)) {
    assert.ok(patched.includes(original), 'world browser import moved: ' + original);
    patched = patched.replace(original, JSON.stringify(replacement));
  }
  const modulePath = path.join(temp, 'world.mjs');
  fs.writeFileSync(modulePath, patched);
  const [THREE, { createTowerWorld }] = await Promise.all([
    import(threeURL),import(pathToFileURL(modulePath).href),
  ]);
  const world = createTowerWorld();
  try {
    world.update({
      runToken:'guardian-cap-clearspan-case',tick:300,lifecycle:'running',
      floor:8,theme:'clockwork',worldWidth:480000,
      chunkBaseY:8*360000,chunkHeight:360000,
      platforms:[],hazards:[],enemies:[],
    },0,0,{quality:'low'});
    world.group.updateWorldMatrix(true,true);
    const point = new THREE.Vector3(), matrix = new THREE.Matrix4();
    let ownedFaces=0, observed=0;
    world.group.traverse(mesh => {
      if (!mesh.isMesh) return;
      const owners = mesh.geometry?.userData?.originalTriangleOwners ?? [];
      if (!owners.length) return;
      matrix.copy(mesh.matrixWorld);
      const positions=mesh.geometry.getAttribute('position');
      const index=mesh.geometry.index;
      for (const owner of owners) {
        const names=owner.authoringPath ?? [];
        if (!names.includes('tapered-structural-pylon') &&
            !names.includes('ClockworkOpenGeologicalSupportTies')) continue;
        ownedFaces += owner.endFace - owner.startFace;
        const stride = Math.max(1, Math.floor((owner.endFace-owner.startFace)/15));
        for (let face=owner.startFace;face<owner.endFace;face+=stride) {
          for (let corner=0;corner<3;corner++) {
            const at=face*3+corner;
            point.fromBufferAttribute(positions,index?index.getX(at):at).applyMatrix4(matrix);
            if (point.y < 14 || point.y > 40) continue;
            observed++;
            const theta=Math.abs(Math.atan2(point.x,point.z));
            assert.ok(theta > 1.09,
              'real meshed cap column intrudes on the source-combat viewing corridor: ' + theta);
          }
        }
      }
    });
    assert.ok(ownedFaces > 200, 'actual batched pylon/post geometry remains present');
    assert.ok(observed > 15, 'cap-height physical opening was evaluated against real triangles');
  } finally {
    world.dispose();
  }
});