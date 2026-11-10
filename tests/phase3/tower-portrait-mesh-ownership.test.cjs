'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '../..');
const rendererSource = fs.readFileSync(path.join(ROOT,
  'public/infinite-tower-climb/visuals/scene.mjs'), 'utf8');
const captureSource = fs.readFileSync(path.join(ROOT,
  'tests/browser/tower-live-motion.spec.cjs'), 'utf8');
const provenanceSource = fs.readFileSync(path.join(ROOT,
  'public/infinite-tower-climb/visuals/mesh-provenance.mjs'), 'utf8');

function realProbeFixture() {
  const first = rendererSource.indexOf('  // P0 source-authentic guardian film:');
  const end = rendererSource.indexOf('  function diagnostics() {', first);
  assert.ok(first > 0 && end > first, 'read the ACTUAL shipped scene owner probe');
  let rayCalls = 0, matrixUpdates = 0;
  const physicalMesh = {
    name: 'rigid-material-batch', isMesh: true, visible: true, type: 'Mesh',
    geometry: { type: 'BufferGeometry', userData: { originalTriangleOwners: [
      { startFace: 0, endFace: 12, authoringPath: ['tower-core'], authoringGeometry: 'LatheGeometry', authoringInstance: null },
      { startFace: 12, endFace: 21, authoringPath: ['clockwork-open-rim-fragment',
        'clockwork-upper-right-shoulder'], authoringGeometry: 'TorusGeometry', authoringInstance: null },
    ] } },
    material: { name: 'ClockworkCaseAlloy', visible: true, opacity: 1,
      color: { getHexString: () => 'abcdef' } },
    parent: { name: 'floor:8:clockwork', visible: true, parent: null },
  };
  class Raycaster {
    setFromCamera(ndc, camera) { assert.ok(Number.isFinite(ndc.x+ndc.y));
      assert.ok(camera); return this; }
    intersectObjects(children, recursive, target) {
      rayCalls++;
      assert.equal(recursive, true);
      assert.equal(children.length, 1);
      target.push({ object: physicalMesh, distance: 8.5,
        point: { toArray: () => [1, 2, 3] }, faceIndex: 19 });
    }
  }
  class Vector2 {set(x,y) { this.x=x;this.y=y;return this; }}
  const snapshot = {
    runToken:'actual-run',floor:8,theme:'clockwork',
    lifecycle:'running',tick:300,player:{health:5},
  };
  const sandbox = {
    THREE:{Raycaster,Vector2},
    window:{__TOWER_MESH_OWNER_AUDIT__:true},
    snapshot, options:{stale:false}, camera:{
      aspect:390/844,near:.1, position:{toArray:()=>[9,10,11]},
      updateMatrixWorld:()=>{matrixUpdates++;}
    },
    scene:{children:[physicalMesh],updateMatrixWorld:()=>{matrixUpdates++;}},
  };
  const context = vm.createContext(sandbox);
  // Load the SAME pure browser module, without replacing its behavior with
  // an invented ownership stub. The VM executes only the source module's
  // two exported pure functions, then the actual shipped owner observer.
  vm.runInContext(provenanceSource.replaceAll('export function ', 'function '), context);
  const observe = vm.runInContext(rendererSource.slice(first,end) +
    '\nobservedCameraMeshOwners',context);
  return { observe, snapshot, sandbox, get rays(){return rayCalls;},
    get matrices(){return matrixUpdates;} };
}

test('actual scene probe identifies source-ticked post-batch physical triangles, not just registered decorative gears',()=>{
  const probe=realProbeFixture();
  const frozen=JSON.stringify(probe.snapshot);
  const observed=probe.observe();
  assert.equal(observed.length,1);
  assert.equal(observed[0].tick,300);
  assert.equal(observed[0].probes.length,4);
  assert.equal(observed[0].probes[0].hits[0].path[0],'rigid-material-batch');
  assert.equal(observed[0].probes[0].hits[0].path[1],'floor:8:clockwork');
  assert.equal(observed[0].probes[0].hits[0].faceIndex,19);
  const owned=observed[0].probes[0].hits[0].originalAuthoring;
  assert.equal(owned.authoringPath[0], 'clockwork-open-rim-fragment',
    'source-ticked ray hit must now identify original authored rim');
  assert.equal(owned.authoringGeometry,'TorusGeometry');
  assert.equal(owned.partFaceIndex,7);
  assert.equal(owned.triangleCount,9);
  assert.equal(observed[0].probes[0].hits[0].material,'ClockworkCaseAlloy');
  assert.equal(probe.rays,4,'four known film rays, no unbounded diagnostic scan');
  // Diagnostics is also consumed by the production app every host poll.
  // Repeat reads must retain real source witnesses, without repeating rays.
  const repeated=probe.observe();
  assert.equal(repeated.length,1,'read the same genuine tick without consuming it');
  assert.equal(repeated[0].tick,300);
  assert.equal(probe.rays,4,'never raycast twice on the same source tick');
  probe.snapshot.tick=311;
  assert.equal(probe.observe().length,1,'12-tick throttle retains prior evidence');
  assert.equal(probe.rays,4);
  probe.snapshot.tick=312;
  assert.equal(probe.observe().length,2,'retain both distinct source tick witnesses');
  assert.deepEqual(Array.from(probe.observe(), w=>w.tick),[300,312]);
  assert.equal(probe.rays,8);
  assert.equal(JSON.stringify({...probe.snapshot,tick:300}),frozen,
    'never mutate the original gameplay run, health or combat');
});

test('owner probe is capture-only and refuses other floors, stale scenes and desktop',()=>{
  const p=realProbeFixture();
  p.sandbox.window.__TOWER_MESH_OWNER_AUDIT__=false;
  assert.equal(p.observe().length,0);
  p.sandbox.window.__TOWER_MESH_OWNER_AUDIT__=true;
  p.snapshot.floor=9;
  assert.equal(p.observe().length,0);
  p.snapshot.floor=8;p.sandbox.camera.aspect=960/600;
  assert.equal(p.observe().length,0);
  p.sandbox.camera.aspect=390/844;p.sandbox.options.stale=true;
  assert.equal(p.observe().length,0);
  assert.equal(p.rays,0,'no production, floor-nine, desktop or stale-game raycasts');
});

test('neutral original-video observer persists true camera-ray ownership separately from named clockwork',()=>{
  assert.match(rendererSource,/cameraRayMeshOwners: observedCameraMeshOwners\(\)/);
  assert.match(captureSource,/page\.addInitScript\(\(\) => \{ window\.__TOWER_MESH_OWNER_AUDIT__ = true; \}\)/);
  assert.match(captureSource,/observedCameraRayMeshOwners: Array\.isArray\(d\.cameraRayMeshOwners\)/);
  assert.match(captureSource,/cameraRayMeshOwnerSamples:meshOwnerSamples/);
  assert.match(captureSource,/OriginalGameplayVideoUnmodified|originalGameplayVideoUnmodified/);
  assert.doesNotMatch(rendererSource.slice(rendererSource.indexOf('  // P0 source-authentic guardian film:'),rendererSource.indexOf('  function diagnostics() {',rendererSource.indexOf('  // P0 source-authentic guardian film:'))),
    /snapshot\.player\.(x|y|health)\s*=/);
});
