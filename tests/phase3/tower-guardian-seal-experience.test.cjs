'use strict';
// Source-backed guardian cap progression: actual tower meshes and the live
// source's present guardian state, not an illustration or a mocked WebGL shot.
// Structural safety checks do not count as Gauntlet LOOKS/FEELS/PLAYS votes.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '../..');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'tower-guardian-seal-'));
// Keep the shipping observer as an actual local ESM dependency for the copied world fixture.
// Load the actual shipping source hierarchy and its transitive guardian dependency.
// The isolated world fixture moves ESM files into /tmp, so resolve only the
// relative guardian-stage import back to the unchanged repository module.
fs.writeFileSync(path.join(scratch, 'scene-hierarchy.mjs'),
  fs.readFileSync(path.join(root, 'public/infinite-tower-climb/visuals/scene-hierarchy.mjs'), 'utf8')
    .replace("'./guardian-shot-stage.mjs'", JSON.stringify(pathToFileURL(path.join(root,
      'public/infinite-tower-climb/visuals/guardian-shot-stage.mjs')).href))
    .replace("'./guardian-passage.mjs'", JSON.stringify(pathToFileURL(path.join(root,
      'public/infinite-tower-climb/visuals/guardian-passage.mjs')).href)));
const threeUrl = pathToFileURL(path.join(root, 'node_modules/three/build/three.module.js')).href;
const coordsUrl = pathToFileURL(path.join(root, 'public/infinite-tower-climb/visuals/coordinates.mjs')).href;
const surfaceUrl = pathToFileURL(path.join(root, 'public/infinite-tower-climb/visuals/world-surface.mjs')).href;
const source = fs.readFileSync(path.join(root, 'public/infinite-tower-climb/visuals/world.mjs'), 'utf8')
  .replace("'/tower/vendor/three.module.js'", JSON.stringify(threeUrl))
  .replace("'./coordinates.mjs'", JSON.stringify(coordsUrl))
  .replace("'./crossfloor-arrival.mjs'", JSON.stringify(pathToFileURL(path.join(path.resolve(__dirname, '../..'), 'public/infinite-tower-climb/visuals/crossfloor-arrival.mjs')).href))
  .replace("'./original-clockwork-architecture-palette.mjs'", JSON.stringify(pathToFileURL(require.resolve('../../public/infinite-tower-climb/visuals/original-clockwork-architecture-palette.mjs')).href))
  .replace("'./source-physical-arrival-palette.mjs'", JSON.stringify(pathToFileURL(path.join(path.resolve(__dirname, '../..'), 'public/infinite-tower-climb/visuals/source-physical-arrival-palette.mjs')).href))
  .replace("'./guardian-passage.mjs'", JSON.stringify(pathToFileURL(path.join(root, 'public/infinite-tower-climb/visuals/guardian-passage.mjs')).href))
  .replace("'./world-surface.mjs'", JSON.stringify(surfaceUrl))
  .replace("'./guardian-transmission-layout.mjs'", JSON.stringify(pathToFileURL(path.join(root, 'public/infinite-tower-climb/visuals/guardian-transmission-layout.mjs')).href))
  .replace("'./mesh-provenance.mjs'", JSON.stringify(pathToFileURL(path.join(root, 'public/infinite-tower-climb/visuals/mesh-provenance.mjs')).href));
fs.writeFileSync(path.join(scratch, 'world.mjs'), source);
const loaded = import(pathToFileURL(path.join(scratch, 'world.mjs')).href);
test.after(() => fs.rmSync(scratch, { recursive: true, force: true }));

function frame({active = true, floor = 8, guardian = true, runToken = 'genuine-gate-run'} = {}) {
  const base = floor * 360000;
  return {
    runToken, floor, theme: 'ruins', worldWidth: 480000,
    guardianExitX: guardian ? 145000 + Math.floor(190000 * .76) : undefined,
    chunkBaseY: base, chunkHeight: 360000, lifecycle: 'running',
    platforms: [{
      id: `f${floor}:cap`, kind: 'oneway', x: 145000, width: 190000,
      y: base + 324000, height: 12000,
    }],
    hazards: [],
    enemies: guardian ? [{
      id: `f${floor}:guardian`, kind: 'guardian',
      x: 230000, y: base + 350000, health: active ? 8 : 0,
      maxHealth: 8, active,
    }] : [],
  };
}
function named(root, name) {
  let found = null;
  root.traverse(object => { if (object.name === name) found = object; });
  return found;
}

test('a genuine living guardian owns a closed, dimensional world-space seal, not a HUD promise', async () => {
  const { createTowerWorld } = await loaded;
  const world = createTowerWorld();
  try {
    const sourceFrame = frame(), before = JSON.stringify(sourceFrame);
    world.update(sourceFrame, .016, 0, { quality: 'low' });
    const gate = named(world.group, 'AuthoritativeGuardianGate');
    const left = named(world.group, 'GuardianSealWingLeft');
    const right = named(world.group, 'GuardianSealWingRight');
    const crest = named(world.group, 'ObservedGuardianLockCrest');
    const conduit = named(world.group, 'GuardianEncounterConduit');
    const capstan = named(world.group, 'GuardianGateCapstan');
    const tension = named(world.group, 'GuardianCounterweightTension');
    assert.ok(capstan && tension?.isInstancedMesh && tension.count === 2,
      'an actual source-powered drum and exactly two tension lines belong to the 3D guardian gate');
    assert.ok(Math.abs(capstan.rotation.z)<1e-12,
      'an undamaged real guardian cannot visibly turn a victory drum');
    assert.equal(tension.userData.collider,undefined);
    assert.ok(gate && left && right && crest, 'the real world contains an original 3D door and lock');
    assert.ok(conduit?.isMesh && !conduit.castShadow && !conduit.receiveShadow,
      'the real HP conduit is a physical, shadow-free mesh in the guardian cap');
    assert.ok(Math.abs(conduit.scale.z - .18) < 1e-12,
      'no damage leaves only an inset lock socket; the path cannot claim a win');
    assert.equal(conduit.userData.collider, undefined);
    assert.ok(named(world.group,'GuardianCounterweightLeft') && named(world.group,'GuardianCounterweightRight'),
      'the source-powered lock uses real paired 3D counterweights');
    assert.equal(left.position.x, 0);
    assert.equal(right.position.x, 0);
    assert.ok(crest.isMesh && crest.geometry.attributes.position.count >= 6,
      'the crest is physical faceted geometry, not a flat status decal');
    const inset = named(world.group, 'GuardianGateInset');
    assert.ok(inset, 'the 3D gate has its own inward architectural mounting');
    inset.updateWorldMatrix(true, false);
    const THREE = await import(threeUrl);
    const anchor = inset.getWorldPosition(new THREE.Vector3());
    const { GUARDIAN_CAP_CORRIDOR: corridor } = await import(coordsUrl);
    const sealRadius = Math.hypot(anchor.x, anchor.z);
    assert.ok(Math.abs(sealRadius - corridor.visibleSealRadius) < 1e-9,
      'the source-powered living seal is physically mounted at the shared cap corridor');
    assert.ok(sealRadius > corridor.coreOcclusionRadius &&
      sealRadius >= corridor.deckMin && sealRadius < corridor.climberPathRadius &&
      corridor.climberPathRadius < corridor.deckMax,
      'the seal is visible outside the occluding tower core but behind the source walker');
    assert.equal(world.diagnostics().guardianGates[0].unlocked, false);
    assert.equal(JSON.stringify(sourceFrame), before, '3D cannot edit authoritative snapshots');
    let dynamicMeshes = 0;
    gate.traverse(object => {
      if (object.isMesh) {
        dynamicMeshes++;
        assert.equal(object.castShadow, false, 'the gate must not multiply shadow-map submissions');
      }
    });
    assert.ok(dynamicMeshes >= 12 && dynamicMeshes <= 26,
      `one bounded gate, source conduit and counterweights (actual meshes: ${dynamicMeshes})`);
    const masonryBatches = gate.children.filter(child => child.name === 'rigid-material-batch');
    assert.equal(masonryBatches.length, 2,
      'guardian portal piers, lintel and rails are consolidated into two shadow-free rigid material draws');
    for (const batch of masonryBatches) {
      assert.equal(batch.isMesh, true);
      assert.equal(batch.castShadow, false);
      assert.equal(batch.receiveShadow, false);
    }
    assert.ok(gate.getObjectByName('GuardianSealWingLeft') &&
      gate.getObjectByName('GuardianCounterweightRight') &&
      gate.getObjectByName('GuardianEncounterConduit') &&
      gate.getObjectByName('GuardianGateCapstan') &&
      gate.getObjectByName('GuardianCounterweightTension'),
      'only inert masonry is batched; all genuine source-driven components stay articulated');
  } finally { world.dispose(); }
});

// These are the actual source-locked moving gate leaves, not a HUD mockup.
// Test physical daylight through the bronze and intact steel at a rib.
// A genuine guardian still owns the lock; the screen cannot become a fake exit.
test('source-locked bronze gate retains physical bars but lets genuine combat be seen through its window', async () => {
  const {createTowerWorld}=await loaded;
  const THREE=await import(threeUrl);
  const world=createTowerWorld();
  try {
    world.update(frame(),.016,0,{quality:'low'});
    const left=named(world.group,'GuardianSealWingLeft');
    const right=named(world.group,'GuardianSealWingRight');
    const grille=named(world.group,'GuardianSealBronzeLatticeLeft');
    const other=named(world.group,'GuardianSealBronzeLatticeRight');
    assert.ok(grille?.isInstancedMesh && other?.isInstancedMesh,
      'both authoritative bronze doors have physically open windows, not an opaque animated panel');
    assert.equal(grille.count,6);
    assert.equal(other.count,6);
    assert.equal(grille.userData.collider,undefined);
    left.updateWorldMatrix(true,true);
    function castAt(localX,localY) {
      const a=left.localToWorld(new THREE.Vector3(localX,localY,1.5));
      const b=left.localToWorld(new THREE.Vector3(localX,localY,-1.5));
      return new THREE.Raycaster(a,b.clone().sub(a).normalize(),0,3)
        .intersectObject(grille,false);
    }
    assert.equal(castAt(-.86,1.1).length,0,
      'daylight crosses real open steel in the upper-cap action window');
    assert.ok(castAt(-1.54,1.1).length>0,
      'the source-locked gate still has a physical supporting bar');
    assert.equal(left.position.x,0);
    assert.equal(right.position.x,0);
    assert.equal(world.diagnostics().guardianGates[0].unlocked,false,
      'perforated visual doors cannot earn or simulate victory');
  } finally {world.dispose();}
});

// The original portrait camera probes at source ticks 298-343 identified
// a TRUE opaque rigid-batched clockwork structural pylon behind the guardian.
// It must no longer fill the exact previously blocked cap fighting rays.
test('authored clockwork load-bearing pylon leaves the observed upper-cap portrait corridor clear',async()=>{
  const {createTowerWorld}=await loaded;
  const world=createTowerWorld();
  try {
    world.update({...frame(),theme:'clockwork'},.016,0,{quality:'low'});
    let pylonTriangles=0,blockedVertices=0;
    world.group.traverse(object=>{
      if(object.name!=='rigid-material-batch')return;
      const pos=object.geometry.attributes.position;
      for(const owner of object.geometry.userData.originalTriangleOwners||[]){
        if(owner.authoringGeometry!=='LatheGeometry'||
          !owner.authoringPath.includes('tapered-structural-pylon'))continue;
        pylonTriangles+=owner.endFace-owner.startFace;
        for(let face=owner.startFace;face<owner.endFace;face++)for(let vertex=0;vertex<3;vertex++){
          const i=face*3+vertex,x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
          if(x>=5.5&&x<=10.5&&z>=12&&z<=19&&y>=33&&y<=45)blockedVertices++;
        }
      }
    });
    assert.ok(pylonTriangles>=1200,'real tower structural pylons are still part of the authored 3D world');
    assert.equal(blockedVertices,0,
      'no rigid-batched original structural pylon may repopulate the measured guardian view obstruction');
    assert.equal(world.diagnostics().guardianGates[0].unlocked,false,
      'world-art clearance must not touch source victory or gate locking');
  } finally {world.dispose();}
});

test('an authentic guardian defeat opens BOTH world-space doors and its distinct source-bound crest', async () => {
  const { createTowerWorld } = await loaded;
  const world = createTowerWorld();
  try {
    world.update(frame(), .016, 0, { quality: 'low' });
    const left = named(world.group, 'GuardianSealWingLeft');
    const right = named(world.group, 'GuardianSealWingRight');
    const crest = named(world.group, 'ObservedGuardianLockCrest');
    const leftWeight = named(world.group,'GuardianCounterweightLeft');
    const rightWeight = named(world.group,'GuardianCounterweightRight');
    const conduit = named(world.group,'GuardianEncounterConduit');
    const capstan = named(world.group,'GuardianGateCapstan');
    const tension = named(world.group,'GuardianCounterweightTension');
    const overhead = named(world.group,'GuardianOverheadTransmission');
    const THREE = await import(threeUrl);
    const cableMatrix = new THREE.Matrix4();
    const cableScale = new THREE.Vector3();
    const cablePosition = new THREE.Vector3();
    const cableQuaternion = new THREE.Quaternion();
    // Measure BOTH actual 3D cable endpoints against the source-driven
    // counterweight sockets, not a historical drum height constant. The
    // outboard overhead transmission must never leave floating cables during
    // damaged, defeated, restarted or reduced-motion states.
    const assertAttachedCables = phase => {
      const sockets = [];
      world.group.traverse(object => {
        if (object.name === 'GuardianSealCableSocket') sockets.push(object);
      });
      assert.equal(sockets.length, 2, phase + ': two distinct mechanical sockets');
      for (const [index,carriage] of [leftWeight,rightWeight].entries()) {
        const socket = sockets.find(item => item.parent === carriage);
        assert.ok(socket, phase + ': cable socket is owned by its real counterweight');
        tension.getMatrixAt(index,cableMatrix);
        cableMatrix.decompose(cablePosition,cableQuaternion,cableScale);
        assert.ok(cableScale.y > 0 && Number.isFinite(cableScale.y),
          phase + ': source-coupled cable has finite positive span');
        assert.ok(Math.abs(cablePosition.x - socket.position.x) < 1e-5,
          phase + ': cable and weight occupy the same outboard bay');
        assert.ok(Math.abs(cablePosition.y + cableScale.y / 2 - overhead.position.y) < 1e-5,
          phase + ': cable top stays coupled to the real overhead drive');
        assert.ok(Math.abs(cablePosition.y - cableScale.y / 2 -
          (socket.position.y + carriage.position.y)) < 1e-5,
          phase + ': cable bottom follows actual moved counterweight socket');
      }
      tension.getMatrixAt(0,cableMatrix);
      cableMatrix.decompose(cablePosition,cableQuaternion,cableScale);
      return cableScale.y;
    };
    const closedCableLength = assertAttachedCables('full-health lock');
    // Authentic elevated geometry: socket y=8.85 and overhead y=10.35.
    // The 1.50m hanging line is not the retired floor-level 4-6m cable.
    assert.ok(closedCableLength > 1.45 && closedCableLength < 1.55,
      'source-raised outboard winch starts with a real 1.50m taut cable');
    const spools = named(world.group,'GuardianCounterweightSpoolPulleys');
    assert.equal(spools?.count,2,
      'two physically attached overhead drive pulleys use one instanced draw');
    const originalSpool = new THREE.Matrix4();
    spools.getMatrixAt(0,originalSpool);
    assert.ok(Math.abs(leftWeight.position.y)<1e-12, 'left counterweight starts physically closed');
    assert.ok(Math.abs(rightWeight.position.y)<1e-12, 'right counterweight starts physically closed');
    // The real authority commonly transfers floors on the decisive hit.
    // Prior guardian damage MUST show visible progression while the source
    // guardian still lives; a post-death animation alone may never be seen.
    const hurt = frame();
    hurt.enemies[0].health = 2;
    const beforeHurt = JSON.stringify(hurt);
    for (let i = 0; i < 8; i++) world.update(hurt, .05, i * .05, { quality: 'low' });
    assert.ok(left.position.x < -.9 && left.position.x > -2.7,
      'the genuine lost guardian HP must split the bronze doors before defeat');
    assert.ok(right.position.x > .9 && right.position.x < 2.7);
    assert.ok(leftWeight.position.y < -1 && leftWeight.position.y > -2.35,
      'real guardian HP mechanically lowers the visible counterweights');
    assert.ok(capstan.rotation.z > 1.8,
      'observed real guardian damage visibly turns the winch');
    const damagedCableLength = assertAttachedCables('living guardian damage');
    const turningSpool = new THREE.Matrix4();
    spools.getMatrixAt(0,turningSpool);
    assert.ok(!turningSpool.equals(originalSpool),
      'only observed guardian HP loss turns the real drive spool');
    assert.ok(damagedCableLength > closedCableLength + 1,
      'real health loss extends both physical cable spans along the descending sockets');
    assert.equal(leftWeight.position.y,rightWeight.position.y,
      'the pair cannot disagree on authoritative gate progress');
    assert.ok(conduit.scale.z > 1.2 && conduit.scale.z < 1.5,
      'real guardian damage grows the core-visible conduit across the supported cap');
    const { GUARDIAN_CAP_CORRIDOR: corridor } = await import(coordsUrl);
    assert.ok(conduit.position.z + conduit.scale.z * .5 + corridor.visibleSealRadius < corridor.deckMax,
      'the source-linked conduit must never overshoot the real outer cap rim');
    assert.equal(world.diagnostics().guardianGates[0].unlocked, false,
      'damaging an active enemy cannot claim the guardian gate is cleared');
    assert.equal(JSON.stringify(hurt), beforeHurt);
    // An inactive but still-living guardian cannot masquerade as victory:
    // authority and the 3D lock must require the SAME zero-HP defeat.
    const interrupted = frame({ active: false });
    interrupted.enemies[0].health = 3;
    world.update(interrupted, .05, .4, { quality: 'low' });
    assert.equal(world.diagnostics().guardianGates[0].unlocked, false,
      'inactive positive-HP guardian never grants the visible earned doorway');
    const release = frame({ active: false });
    const before = JSON.stringify(release);
    for (let i = 0; i < 20; i++) world.update(release, .05, i * .05, { quality: 'low' });
    assert.ok(left.position.x < -2.7 && right.position.x > 2.7,
      'the visible passage must physically clear in both directions');
    assert.ok(crest.rotation.z > 1.5, 'the actual lock geometry changes state');
    assert.ok(leftWeight.position.y < -2.3 && rightWeight.position.y < -2.3,
      'an actual finished guardian fully releases the heavy mechanical weights');
    const defeatedCableLength = assertAttachedCables('earned guardian victory');
    assert.ok(defeatedCableLength > damagedCableLength + 1,
      'only a true source-defeated guardian extends the cable to the full weight travel');
    assert.equal(world.diagnostics().guardianGates[0].unlocked, true);
    assert.ok(conduit.scale.z > 2.25 && conduit.scale.z < 2.3,
      'authentic defeated guardians complete the supported cap-to-threshold conduit');
    assert.equal(JSON.stringify(release), before, 'the observed source remains immutable');
    world.update(frame({ active: true }), .05, 2, { quality: 'low' });
    assert.equal(world.diagnostics().guardianGates[0].unlocked, false);
    assertAttachedCables('same-floor live reversal');
    assert.ok(Math.abs(left.position.x) < 2.8, 'the same-floor live reversal must not stick open');
  } finally { world.dispose(); }
});

test('no invented guardian means no gate; high/low switches and a new run restore from real state', async () => {
  const { createTowerWorld } = await loaded;
  const world = createTowerWorld();
  try {
    world.update(frame({ guardian: false }), .016, 0, { quality: 'low' });
    assert.equal(named(world.group, 'AuthoritativeGuardianGate'), null);
    assert.equal(world.diagnostics().guardianGates.length, 0);
    world.update(frame({ active: false, floor: 9 }), .016, 1, { quality: 'high' });
    assert.equal(world.diagnostics().guardianGates[0].opening, 1,
      'recovery must not re-lock a guardian already defeated in the source');
    world.update(frame({ active: true, floor: 9, runToken: 'new-run' }), .016, 2, { quality: 'low' });
    assert.equal(world.diagnostics().guardianGates[0].opening, 0,
      'restart must not retain an earlier victory animation');
    assert.equal(named(world.group, 'GuardianSealWingLeft').position.x, 0);
    assert.ok(Math.abs(named(world.group, 'GuardianEncounterConduit').scale.z - .18) < 1e-12,
      'a genuinely new source run starts with a closed progression conduit');
    assert.equal(named(world.group, 'GuardianGateCapstan').rotation.z,0,
      'new run must not retain a preceding guardian capstan turn');
  } finally { world.dispose(); }
});

// The guardian stands on the final lower approach platform, not at the
// midpoint of the much wider cap. Stage its actual mechanical lock where
// a viewer can see the opponent and causal gate in one local encounter.
// This is a presentation layout check, never a visual-quality PASS.
test('guardian approach anchors one stationary physical gate without relocating the actual cap or checkpoint', async () => {
  const { createTowerWorld } = await loaded;
  const { guardianGateAnchorX, angleFor } = await import(coordsUrl);
  const world = createTowerWorld();
  try {
    const sourceFrame = frame(), base = sourceFrame.floor * 360000;
    sourceFrame.platforms.unshift({
      id: `f${sourceFrame.floor}:p6`, kind: 'oneway', x: 45000,
      y: base + 300000, width: 120000, height: 10000,
    });
    sourceFrame.enemies[0] = { ...sourceFrame.enemies[0],
      x: 105000, y: base + 328000, halfHeight: 18000 };
    const cap = sourceFrame.platforms.find(platform => platform.id.endsWith(':cap'));
    const original = JSON.stringify(sourceFrame);
    const x = guardianGateAnchorX(sourceFrame, cap);
    assert.equal(x, sourceFrame.guardianExitX,
      'source-authored clearance anchors the real lock, never enemy movement');
    assert.ok(x > cap.x + cap.width / 2 && x < cap.x + cap.width,
      'the source-backed gate remains on the actual traversable cap rather than a staged midpoint');
    world.update(sourceFrame, .016, 0, { quality: 'low' });
    const gate = named(world.group, 'AuthoritativeGuardianGate');
    const deck = named(world.group, `platform:f${sourceFrame.floor}:cap`);
    assert.ok(gate && deck, 'distinct world-space gateway and authoritative cap exist');
    assert.ok(Math.abs(gate.rotation.y - (angleFor(x, sourceFrame.worldWidth) + Math.PI/2)) < 1e-9,
      'the original bronze arch faces the deterministic X-travel crossing plane, not the radial wall');
    assert.ok(Math.abs(deck.rotation.y - angleFor(cap.x + cap.width / 2, sourceFrame.worldWidth)) < 1e-9,
      'unchanged collision-aligned deck remains centered on its actual source coordinates');
    assert.equal(world.diagnostics().guardianGates[0].anchorX, x);
    const patrol = { ...sourceFrame, enemies: [{ ...sourceFrame.enemies[0], x: 145000, health: 3 }] };
    assert.equal(guardianGateAnchorX(patrol, cap), x,
      'enemy movement and damage never drag the stone architecture around');
    world.update(patrol, .05, .05, { quality: 'low' });
    assert.ok(Math.abs(gate.rotation.y - (angleFor(x, sourceFrame.worldWidth) + Math.PI/2)) < 1e-9);
    world.update(patrol, .05, .10, { quality: 'high', reducedMotion: true });
    assert.equal(world.diagnostics().guardianGates[0].anchorX, x,
      'quality rebuild and still-motion presentation reconstruct the same authentic gate');
    assert.equal(JSON.stringify(sourceFrame), original, 'camera/world may not mutate replay snapshots');
    assert.equal(guardianGateAnchorX(frame({guardian:false}), cap),
      cap.x + cap.width / 2,
      'legacy source WITHOUT a guardian cannot invent the new earned cap exit');
    assert.equal(guardianGateAnchorX(frame(), cap),
      cap.x + Math.floor(cap.width * .76),
      'the actual on-cap guardian shares its source-derived exit with fixed-step game rules');
  } finally { world.dispose(); }
});

test('the actual world gate gives earned grounded arrival a clear bronze threshold before presentation time catches up', async () => {
  const {createTowerWorld}=await loaded;
  const world=createTowerWorld();
  try {
    const live=frame(), cap=live.platforms[0];
    live.player={x:cap.x};
    world.update(live,.016,0,{quality:'low'});
    const wing=named(world.group,'GuardianSealWingLeft');
    assert.ok(wing);
    const sourceClear=frame({active:false});
    sourceClear.enemies[0].health=0; // A real observed defeated body, not merely an inactive fixture.
    const realExit=cap.x+Math.floor(cap.width*.76);
    sourceClear.player={x:realExit-8000};
    world.update(sourceClear,.016,.016,{quality:'low'});
    assert.ok(wing.position.x < -2.7,
      'source-confirmed defeat + authentic arrival opens real 3D masonry immediately');
    assert.equal(world.diagnostics().guardianGates[0].unlocked,true);
    assert.equal(sourceClear.player.x,realExit-8000);
    const nextRun=frame({active:true,runToken:'fresh-second-run'});
    nextRun.player={x:cap.x};
    world.update(nextRun,.05,.066,{quality:'low'});
    // A new run rebuilds the floor-owned meshes. The previously captured wing
    // is intentionally detached; inspect the ACTIVE gate, not stale geometry.
    const freshWing=named(world.group,'GuardianSealWingLeft');
    assert.ok(freshWing && freshWing!==wing,
      'a genuine restart owns a fresh source-locked gateway');
    assert.equal(freshWing.position.x,0,
      'a newly active guardian starts with fully closed live bronze leaves');
    assert.equal(world.diagnostics().guardianGates[0].unlocked,false);
  }finally{world.dispose();}
});

test('unflagged and mismatched old guardians cannot create a world-space victory lock',async()=>{
  const {createTowerWorld}=await loaded;
  const genuine=frame();
  const cap=genuine.platforms[0];
  const exactExit=cap.x+Math.floor(cap.width*.76);
  assert.equal(genuine.guardianExitX,exactExit);
  for(const [name,source,present] of [
    ['legacy-no-source-exit',{...genuine,guardianExitX:undefined},false],
    ['wrong-exit',{...genuine,guardianExitX:exactExit+12000},false],
    ['absent-guardian',{...genuine,enemies:[]},false],
    ['other-floor-guardian',{...genuine,enemies:[{...genuine.enemies[0],floor:7}]},false],
    ['authenticated-cap-exit',genuine,true],
  ]){
    const before=JSON.stringify(source);
    const world=createTowerWorld();
    try{
      world.update(source,.016,0,{quality:'low'});
      assert.equal(!!named(world.group,'AuthoritativeGuardianGate'),present,
        name+' must honor source-authenticated guardian cap gating');
      assert.equal(world.diagnostics().guardianGates.length,present?1:0);
      assert.equal(JSON.stringify(source),before);
    }finally{world.dispose();}
  }
});


// The original unmodified 9924ca01 portrait danger WebM still masks the
// climber behind the live exterior bronze wheel/counterweight superstructure
// around native 20s, even though the redundant *inner* gate was removed.
// Keep this second gate's source-powered mechanism, but place its moving
// masses on flanking machinery bays and the upper crown, never in the central
// climber/guardian sightline. Geometry is real and source feedback persists;
// this scoped regression is NOT footage/independent quality acceptance.
test('source-powered exterior lock keeps the live duel open beneath its elevated flanking transmission', async () => {
  const { createTowerWorld } = await loaded;
  const world = createTowerWorld();
  try {
    const living = { ...frame(), theme:'clockwork', tick: 390 };
    world.update(living, .016, 0, {quality:'low'});
    const gate = named(world.group, 'AuthoritativeGuardianGate');
    const drum = gate.getObjectByName('GuardianGateCapstan');
    const beam = gate.getObjectByName('GuardianOverheadTransmission');
    const left = gate.getObjectByName('GuardianCounterweightLeft');
    const right = gate.getObjectByName('GuardianCounterweightRight');
    assert.ok(drum && beam && left && right, 'true HP-driven transmission remains on the live cap');
    assert.ok(drum.position.y >= 6.8,
      'central drum must clear the 0–5m live climber/guardian combat air');
    assert.ok(beam.position.y >= 6.7,
      'cross-gate transmission must be OVER the live duel, not a mid-body occluder');
    const leftWeight = left.getObjectByName('GuardianSealCounterweight');
    const rightWeight = right.getObjectByName('GuardianSealCounterweight');
    assert.ok(leftWeight && rightWeight);
    assert.ok(leftWeight.position.x <= -6.4 && rightWeight.position.x >= 6.4,
      'both large counterweight blocks belong to flanking bays, outside central fighter silhouettes');
    assert.ok(Math.abs(drum.rotation.z) < .000001 && !world.diagnostics().guardianGates[0].unlocked,
      'living guardian still physically owns the locked gateway and has not paid the source win');
    world.update({...living,tick:391,enemies: living.enemies.map(enemy => ({
      ...enemy,health:0,active:false
    }))}, .3, 1, {quality:'low'});
    assert.ok(drum.rotation.z > 0, 'a source-earned defeat still turns the original transmission');
    assert.equal(world.diagnostics().guardianGates[0].unlocked,true,
      'a truly defeated zero-HP guardian still releases the exterior lock');
  } finally { world.dispose(); }
});
