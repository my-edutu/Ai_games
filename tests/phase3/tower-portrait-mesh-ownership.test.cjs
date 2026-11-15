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
const originalDoorwayWitness = fs.readFileSync(path.join(ROOT,
  'public/infinite-tower-climb/visuals/threshold-occlusion-witness.mjs'), 'utf8');
// The production threshold module now imports the *actual* raised-platform
// source lifetime. Evaluate its production dependencies in a single lexical
// scope instead of substituting a mocked lease into the real ray observer.
const crossfloorSource = fs.readFileSync(path.join(ROOT,
  'public/infinite-tower-climb/visuals/crossfloor-arrival.mjs'), 'utf8');
const arrivalSource = fs.readFileSync(path.join(ROOT,
  'public/infinite-tower-climb/visuals/source-physical-arrival-palette.mjs'), 'utf8');

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
    set(origin,direction){assert.ok(Number.isFinite(origin.x+direction.z));return this;}
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
  class Vector3 {
    constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
    set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}
    copy(v){return this.set(v.x,v.y,v.z);}
    sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this;}
    length(){return Math.hypot(this.x,this.y,this.z);}
    multiplyScalar(k){this.x*=k;this.y*=k;this.z*=k;return this;}
  }
  const snapshot = {
    runToken:'actual-run',floor:8,theme:'clockwork',
    lifecycle:'running',tick:300,player:{health:5},
  };
  const sandbox = {
    THREE:{Raycaster,Vector2,Vector3},
    window:{__TOWER_MESH_OWNER_AUDIT__:true},
    snapshot, options:{stale:false}, 
    world:{retainedFilmHandoff:()=>null},
    climber:{group:{position:new Vector3(4,4,8)}},
    SCALE:10000,
    guardianTraversalGatePose:()=>({x:8,y:5,z:12}),
    lastSubmittedGuardian:{runToken:null,floor:null,tick:-1},
    camera:{
      aspect:390/844,near:.1, position:Object.assign(new Vector3(0,1,0),{toArray:()=>[0,1,0]}),
      updateMatrixWorld:()=>{matrixUpdates++;}
    },
    scene:{children:[physicalMesh],updateMatrixWorld:()=>{matrixUpdates++;}},
  };
  const context = vm.createContext(sandbox);
  // Load the SAME pure browser module, without replacing its behavior with
  // an invented ownership stub. The VM executes only the source module's
  // two exported pure functions, then the actual shipped owner observer.
  vm.runInContext(provenanceSource.replaceAll('export function ', 'function '), context);
  // The isolated VM evaluates the exact checked-in source validators with
  // their real old-cap receipt function, but no browser/simulation stubs.
  // Module imports/exports are transformed only at this CommonJS/VM seam.
  vm.runInContext('const observedSourceOriginalVisibilityWindow = (function(){\\n' +
    crossfloorSource.replace(/\\bexport\\s+/g, '') + '\\n' +
    arrivalSource.replace(/^import\\s+.*?;\\s*$/gm, '')
      .replace(/\\bexport\\s+/g, '') +
    '\\nreturn observedSourceOriginalVisibilityWindow;\\n})();', context);
  vm.runInContext(originalDoorwayWitness
    .replace(/^import\\s+.*?;\\s*$/gm, '')
    .replaceAll('export function ', 'function '), context);
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

test('owner probe is capture-only and rejects unproven successor floors, stale scenes and unproven desktop',()=>{
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

test('genuine HP-zero source and original gateway trace full body in desktop and portrait without altering source',()=>{
  const p=realProbeFixture();
  const s=p.snapshot;
  s.tick=442;s.worldWidth=1000000;s.guardianExitX=760000;
  s.player={health:5,x:760000,y:102000,halfWidth:4500,halfHeight:9800};
  s.platforms=[{id:'f8:cap',x:0,y:100000,width:1000000,height:2000}];
  s.enemies=[{kind:'guardian',active:false,health:0}];
  p.sandbox.camera.aspect=960/600;
  const original=JSON.stringify(s);
  const desktop=p.observe();
  assert.equal(desktop.length,1);
  assert.equal(desktop[0].probes.length,7);
  assert.equal(desktop[0].thresholdSource.kind,'actual-defeated-guardian-open-clockwork');
  assert.equal(desktop[0].probes[0].endpointKind,'real-body-centre');
  assert.equal(desktop[0].probes[5].endpointKind,'original-gate-centre');
  assert.equal(p.rays,7);
  assert.equal(JSON.stringify(s),original,'source play unchanged by ray evidence');
  s.floor=9;s.theme='void';s.tick=477;s.player.x=777000;
  s.lastGuardianCrossing={runToken:'actual-run',fromFloor:8,toFloor:9,
    guardian:{kind:'guardian',active:false,health:0},
    cap:{id:'f8:cap',y:100000,height:2000},
    exitX:760000,sourceTick:475};
  p.sandbox.world.retainedFilmHandoff=()=>({
    guardianGateRetained:true,runToken:'actual-run',floor:9,
    thresholdX:760000,oldRoofY:102000,sourceTick:475});
  p.sandbox.camera.aspect=390/844;
  const phone=p.observe();
  assert.equal(phone.length,1,'new genuine floor episode uses its own witness');
  assert.equal(phone[0].thresholdSource.kind,'immutable-defeated-guardian-original-gateway');
  assert.equal(phone[0].probes.length,7);
  assert.equal(p.rays,14);
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
