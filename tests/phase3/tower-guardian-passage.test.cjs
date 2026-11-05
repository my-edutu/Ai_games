'use strict';
// The passage is triggered by REAL adjacent fixed-step source observations.
// These are safety/geometry checks, NEVER LOOKS/FEELS/PLAYS quality votes.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '../..');
const loaded = Promise.all([
  import(pathToFileURL(path.join(root, 'node_modules/three/build/three.module.js')).href),
  import(pathToFileURL(path.join(root, 'public/infinite-tower-climb/visuals/guardian-passage.mjs')).href),
]);
function frames() {
  const previous = Object.freeze({
    runToken: 'authentic-run', floor: 8, tick: 200, lifecycle: 'running',
    enemies: Object.freeze([{ id: 'f8:guardian', kind: 'guardian', active: true, health: 1 }]),
  });
  const next = Object.freeze({
    runToken: 'authentic-run', floor: 9, tick: 201, lifecycle: 'running',
    enemies: Object.freeze([]),
  });
  return { previous, next };
}
const anchor = Object.freeze({ x: 8.2, y: 17.5, z: 19.8, angle: .24 });

test('a witnessed living guardian and exact next-floor source are required; no fake clearance', async () => {
  const [, { observedGuardianPassage }] = await loaded;
  const { previous, next } = frames();
  assert.equal(observedGuardianPassage(previous, next), true);
  for (const source of [
    { ...next, runToken: 'second-run' },
    { ...next, floor: 8 },
    { ...next, floor: 10 },
    { ...next, tick: 200 },
    { ...next, tick: 199 },
    { ...next, lifecycle: 'intermission' },
  ]) assert.equal(observedGuardianPassage(previous, source), false);
  assert.equal(observedGuardianPassage({ ...previous, lifecycle: 'result' }, next), false);
  assert.equal(observedGuardianPassage({ ...previous, enemies: [] }, next), false);
  assert.equal(observedGuardianPassage({ ...previous,
    enemies: [{kind: 'guardian', active: false}] }, next), false);
  assert.equal(observedGuardianPassage({ ...previous,
    enemies: [{kind: 'sentinel', active: true}] }, next), false);
  assert.equal(JSON.stringify(previous).includes('guardian'), true,
    'the frozen public input must remain unmodified');
});

test('the real event creates a separated 3D bronze passage with bounded resources, never a collider', async () => {
  const [THREE, { createTowerGuardianPassage }] = await loaded;
  const { previous, next } = frames();
  const effect = createTowerGuardianPassage(THREE);
  try {
    assert.equal(effect.group.visible, false);
    assert.equal(effect.begin(previous, { ...next, floor: 11 }, anchor), false);
    assert.equal(effect.group.visible, false);
    assert.equal(effect.begin(previous, next, anchor), true);
    assert.deepEqual(effect.group.position.toArray(), [anchor.x, anchor.y, anchor.z]);
    assert.equal(effect.group.rotation.y, anchor.angle);
    effect.update(0);
    const left = effect.group.getObjectByName('ClearedPassageLeftLeaf');
    const right = effect.group.getObjectByName('ClearedPassageRightLeaf');
    const crest = effect.group.getObjectByName('ClearedPassageObservedLock');
    assert.ok(left && right && crest);
    assert.equal(left.position.x, -1.46);
    assert.equal(right.position.x, 1.46);
    assert.equal(crest.isMesh, true);
    const shards=effect.group.getObjectByName('WitnessedLockSplinters');
    assert.ok(shards?.isInstancedMesh, 'source-bound lock debris uses a single reusable draw');
    assert.equal(shards.count,8);
    const first=new THREE.Matrix4(),opened=new THREE.Matrix4();
    shards.getMatrixAt(0,first);
    effect.update(.5);
    shards.getMatrixAt(0,opened);
    assert.notDeepEqual(first.elements,opened.elements,
      'the physical splinters advance only through witnessed presentation time');
    assert.ok(left.position.x < -3 && right.position.x > 3,
      'genuine floor advance must drive a large, visible mechanical opening');
    assert.equal(effect.diagnostics().sourceTick, next.tick);
    assert.deepEqual(effect.diagnostics().anchorPosition, [anchor.x, anchor.y, anchor.z],
      'full-motion provenance reports the exact source-bound gate anchor and elevation');
    assert.deepEqual(effect.diagnostics().focusPosition, [anchor.x, anchor.y + 2.6, anchor.z]);
    assert.equal(effect.diagnostics().floor, next.floor);
    assert.ok(effect.cameraWeight() > 0 && effect.cameraWeight() < 1);
    let meshCount = 0;
    effect.group.traverse(object => {
      if (!object.isMesh) return;
      meshCount++;
      assert.equal(object.castShadow, false);
      assert.equal(object.receiveShadow, false);
      assert.equal(object.userData.collider, undefined);
    });
    assert.equal(meshCount, 14);
    assert.equal(effect.diagnostics().fragmentInstances, 8);
    assert.ok(effect.focusPoint()?.y > anchor.y + 2);
    assert.equal(effect.diagnostics().shadows, 0);
    for(let step=0;step<11;step++)effect.update(.25);
    assert.equal(effect.group.visible, false, 'the passage retires without a run/authority mutation');
    assert.equal(effect.diagnostics().runToken, null);
    assert.equal(effect.cameraWeight(), 0);
  } finally { effect.dispose(); }
});

test('stale transport and reduced motion cannot animate fake progress; context recovery disposes once', async () => {
  const [THREE, { createTowerGuardianPassage }] = await loaded;
  const { previous, next } = frames();
  const effect = createTowerGuardianPassage(THREE);
  const disposed = [];
  effect.group.traverse(object => {
    if (object.geometry) object.geometry.addEventListener('dispose', () => disposed.push(object.geometry.uuid));
  });
  assert.equal(effect.begin(previous, next, anchor), true);
  effect.update(.5, { stale: true });
  assert.equal(effect.diagnostics().ageSeconds, 0);
  effect.update(.1, { reducedMotion: true });
  const left = effect.group.getObjectByName('ClearedPassageLeftLeaf');
  const x = left.position.x;
  assert.ok(x < -3.4, 'motion preference shows a stable open shape, not a closed/ambiguous gate');
  assert.equal(effect.group.getObjectByName('WitnessedLockSplinters').visible,false,
    'reduced motion does not animate flying debris');
  effect.update(.2, { reducedMotion: true });
  assert.equal(left.position.x, x);
  assert.equal(effect.diagnostics().ageSeconds, .30000000000000004);
  effect.clear();
  assert.equal(effect.group.visible, false);
  effect.dispose();
  effect.dispose();
  assert.equal(effect.diagnostics().disposed, true);
  assert.equal(effect.group.children.length, 0);
  assert.equal(new Set(disposed).size, 6, 'all owned geometries including guardian armor are released');
});

test('the authentic guardian release stays aligned with the exposed source HP lock and skinned handoff', () => {
  const scene = fs.readFileSync(path.join(root, 'public/infinite-tower-climb/visuals/scene.mjs'), 'utf8');
  const circuit = fs.readFileSync(path.join(root, 'public/infinite-tower-climb/visuals/guardian-circuit.mjs'), 'utf8');
  const rig = fs.readFileSync(path.join(root, 'public/infinite-tower-climb/visuals/characters.mjs'), 'utf8');
  const gate = fs.readFileSync(path.join(root, 'public/infinite-tower-climb/visuals/guardian-passage.mjs'), 'utf8');
  assert.match(circuit, /source\.toY, source\.baseY, source\.width, 27\.78\)/,
    'the real guardian HP lock already occupies the outer tower surface');
  assert.match(scene, /const previousLock = clearedGuardian \? observedGuardianCircuit\(previous\) : null/,
    'a source-witnessed guardian and cap must exist before a visual release');
  assert.match(scene, /const gateY = previousLock\?\.toY \?\?\s+guardianCap\.y \+ guardianCap\.height \+ 20000/,
    'a living-lock handoff retains the source HP-lock elevation; defeated-body source retains the same cap height');
  assert.match(scene, /const guardianX = previousLock\?\.fromX \?\? defeated\.x/,
    'the source guardian body remains the old-floor anchor after its HP lock retires');
  assert.match(scene, /passage\.begin\(previous, next, pointFor\(gateAnchorX,\s+gateY, next\.chunkBaseY, next\.worldWidth, 27\.78\),[\s\S]*?pointFor\(guardianX, guardianY,[\s\S]*?next\.chunkBaseY, next\.worldWidth, 27\.65\)\)/,
    'both the source-linked old guardian and the physically earned exit use the same exterior depth');
  assert.match(scene, /guardianReleaseWeight: !options\.stale[\s\S]*?passage\.cameraWeight\(\)/,
    'only the source-witnessed passage provides the climber release weight');
  assert.match(rig, /const releasedGate = !dead && !hurt && !stale && !terminalKind &&[\s\S]*?!reducedMotion &&[\s\S]*?state\.guardianReleaseWeight/,
    'injury, combat, terminal and reduced motion must all veto the gate handoff pose');
  assert.match(gate, /wing\.rotation\.y = -side \* opened \* \.27/,
    'the earned bronze leaves must turn outward while they physically retract');
  assert.match(scene, /const relay = guardianCircuitSource &&\s+guardianCircuitSource\.guardianId === contactGuardian\?\.guardianId/,
    'a present guardian circuit is mandatory before comparing its ID');
});

test('the actual scene consumes source transitions and owns passage lifecycle on recovery', () => {
  const source = fs.readFileSync(path.join(root, 'public/infinite-tower-climb/visuals/scene.mjs'), 'utf8');
  assert.match(source, /observedGuardianPassage\(previous, next\)/);
  assert.match(source, /const guardianCap = clearedGuardian && previous\.platforms\?\.find/);
  assert.match(source, /platform\.id === `f\$\{previous\.floor\}:cap`/);
  assert.match(source, /const gateAnchorX = guardianGateAnchorX\(previous, guardianCap\)/);
  assert.match(source, /passage\.begin\(previous, next, pointFor\(gateAnchorX/);
  assert.match(source, /observedUnlockedGuardianCap\(next\)/,
    'an actual guardian death must show an earned, still-to-be-crossed exit before floor transition');
  assert.match(source, /passage\.unlock\(next, pointFor\(guardianGateAnchorX\(next, cap\)/,
    'the visual portal may never invent its own future passage destination');
  assert.match(source, /const gateY = previousLock\?\.toY \?\?\s+guardianCap\.y \+ guardianCap\.height \+ 20000/,
    'the old live HP-lock height survives the transition; after defeat its immutable cap is the source-backed fallback');
  assert.match(source, /passage\.begin\(previous, next, pointFor\(gateAnchorX,\s+gateY, next\.chunkBaseY/,
    'handoff must use the old source cap and its exterior gate—not the newly spawned climber');
  assert.doesNotMatch(source, /guardianCap\.y \+ guardianCap\.height, next\.chunkBaseY/,
    'the previous physical lock is elevated above the old platform');
  assert.doesNotMatch(source, /passage\.begin\(previous, next, pointFor\(next\.player\.x/);
  // A world-space continuity cue must come from the defeated SOURCE gate,
  // never from the new player's arbitrary location after a floor transition.
  assert.match(source, /scene\.remove\(world\.group, climber\.group, finale\.group, passage\.group, routeIntent\.group, landingApproach\.group, movingDeckSuspension\.group, hazardPressure\.group, guardianCircuit\.group, guardianShotStage\.group, guardianGuardStage\.group, atmosphere\.group, recoveryTransfer\.group\)/,
    'graphics recovery must retire all source-observed scene owners');
  assert.match(source, /passage\.dispose\(\)/);
  assert.match(source, /routeIntent\.dispose\(\)/, 'source choice trails must release their resources too');
  assert.match(source, /landingApproach\.dispose\(\)/, 'selected-deck architecture must retire on graphics recovery');
  assert.match(source, /movingDeckSuspension\.dispose\(\)/,
    'source-bound moving carriage must retire across GPU context loss');
  assert.match(source, /hazardPressure\.dispose\(\)/,
    'physical hazard charge resource must retire across GPU context loss');
  assert.match(source, /landingApproach\.clear\(\)/, 'selected-deck architecture clears on run restart');
  assert.match(source, /guardianCircuit\.dispose\(\)/, 'physical guardian/cap scene resources must dispose too');
  assert.match(source, /guardianShotStage\.dispose\(\)/, 'guardian shot telegraph resources must dispose too');
  assert.match(source, /guardianGuardStage\.dispose\(\)/, 'observed physical guard resources must also retire');
  assert.match(source, /guardianShotStage\.clear\(\)/, 'shot stage must clear on real run reset');
  assert.match(source, /atmosphere\.dispose\(\)/, 'source-bound biome weather must release all GPU owners');
  assert.match(source, /guardianCircuit\.update\(snapshot, options\)/);
  assert.match(source, /passage\.update\(dt, options\)/);
  assert.match(source, /passage: passage\.diagnostics\(\)/);
});

test('source-earned defeat retains the actual old guardian world position through the gate release', async () => {
  const [THREE, { createTowerGuardianPassage }] = await loaded;
  const { previous, next } = frames();
  const effect = createTowerGuardianPassage(THREE);
  const oldGuardian = { x: 12.6, y: 14.2, z: 22.3 };
  try {
    assert.equal(effect.begin(previous, next, anchor, oldGuardian), true);
    const armor = effect.group.getObjectByName('WitnessedGuardianDefeatArmor');
    assert.equal(armor.count, 12);
    assert.equal(armor.castShadow, false);
    assert.equal(armor.userData.collider, undefined);
    effect.group.updateMatrixWorld(true);
    assert.ok(armor.getWorldPosition(new THREE.Vector3()).distanceTo(
      new THREE.Vector3(oldGuardian.x, oldGuardian.y, oldGuardian.z)) < 1e-5);
    assert.deepEqual(effect.diagnostics().guardianDefeatSourcePosition,
      [oldGuardian.x, oldGuardian.y, oldGuardian.z]);
    const matrix = new THREE.Matrix4();
    armor.getMatrixAt(11, matrix);
    const before = [...matrix.elements];
    effect.update(.75);
    armor.getMatrixAt(11, matrix);
    assert.notDeepEqual(matrix.elements, before, 'real defeated armor must visibly collapse');
    effect.clear();
    assert.equal(armor.count, 0);
    assert.equal(effect.diagnostics().guardianDefeatSourcePosition, null);
    assert.equal(effect.begin(previous, next, anchor), true);
    assert.equal(armor.visible, false, 'missing real guardian anchor cannot fabricate armor');
  } finally { effect.dispose(); }
});

test('reduced motion presents a still, real defeat and no motion after stale transport', async () => {
  const [THREE, { createTowerGuardianPassage }] = await loaded;
  const { previous, next } = frames();
  const effect = createTowerGuardianPassage(THREE);
  try {
    effect.begin(previous, next, anchor, { x: 12, y: 17, z: 22 });
    effect.update(.1, { reducedMotion: true });
    const armor = effect.group.getObjectByName('WitnessedGuardianDefeatArmor');
    const still = Array.from(armor.instanceMatrix.array);
    effect.update(.45, { reducedMotion: true });
    effect.update(.3, { stale: true, reducedMotion: true });
    assert.deepEqual(Array.from(armor.instanceMatrix.array), still);
    assert.equal(effect.diagnostics().guardianDefeatPieces, 12);
  } finally { effect.dispose(); }
});

test('source-earned 3D gate stays visibly open during authentic cap traversal, then hands off without a false second closing', async () => {
  const [THREE, { createTowerGuardianPassage }] = await loaded;
  const effect = createTowerGuardianPassage(THREE);
  const cap = { id:'f8:cap',x:115200,y:8*360000+332000,width:249600,height:12000 };
  const earned = Object.freeze({
    runToken:'authentic-run',floor:8,tick:210,lifecycle:'running',
    worldWidth:480000,chunkBaseY:8*360000,player:{health:2},
    platforms:[cap],enemies:[{id:'f8:guardian',kind:'guardian',
      active:false,health:0,x:cap.x+60000,
      y:cap.y+cap.height+18000,halfHeight:18000}],
  });
  const next = {runToken:'authentic-run',floor:9,tick:225,
    lifecycle:'running',enemies:[]};
  try {
    assert.equal(effect.unlock({...earned,enemies:[{
      ...earned.enemies[0],active:true,health:1}]},anchor),false,
      'living guardian must not open the door');
    assert.equal(effect.group.visible,false);
    assert.equal(effect.unlock(earned,anchor),true);
    assert.equal(effect.diagnostics().stage,'earned-open');
    assert.equal(effect.diagnostics().floor,8,
      'an earned physical exit must remain on the current playable floor');
    effect.update(.5);
    let left = effect.group.getObjectByName('ClearedPassageLeftLeaf');
    assert.ok(left.position.x < -3,'the actual entrance opens before floor advancement');
    const aged=effect.diagnostics().ageSeconds;
    assert.equal(effect.unlock(earned,anchor),true,
      'duplicate public snapshot does not trigger another opening animation');
    assert.equal(effect.diagnostics().ageSeconds,aged);
    for(let step=0;step<12;step++)effect.update(.5);
    assert.equal(effect.group.visible,true,
      'door remains physically discoverable during a longer ordinary grounded walk');
    assert.ok(left.position.x < -3.5);
    assert.equal(effect.begin(earned,next,anchor),true);
    assert.equal(effect.diagnostics().stage,'handoff');
    effect.update(.05);
    assert.ok(left.position.x < -3.5,
      'the hard-earned gate does not snap shut on the real floor transition');
    for(let step=0;step<10;step++)effect.update(.5);
    assert.equal(effect.group.visible,false,
      'only the completed passage memory expires after a real floor transition');
    assert.equal(effect.cameraWeight(),0);
  } finally { effect.dispose(); }
});

test('a fast source-earned cap crossing opens the physical leaves ahead of the climber, without time or replay cheats', async () => {
  const [THREE, { createTowerGuardianPassage, observedPassageApproach,
    observedUnlockedGuardianCap }] = await loaded;
  const cap = Object.freeze({id:'f8:cap',x:115200,y:3212000,width:249600,height:12000});
  const guardian = Object.freeze({id:'f8:guardian',kind:'guardian',active:false,
    health:0,x:176000,y:3250000,halfHeight:18000});
  const far = {runToken:'earned-traverse',floor:8,tick:210,lifecycle:'running',
    worldWidth:480000,chunkBaseY:2880000,
    player:{health:2,x:cap.x},platforms:[cap],enemies:[guardian]};
  const atDoor = {...far,tick:211,player:{health:2,
    x:cap.x+Math.floor(cap.width*.76)-8000}};
  const frozen = JSON.stringify(atDoor);
  assert.equal(observedPassageApproach(far,observedUnlockedGuardianCap(far)),0);
  assert.equal(observedPassageApproach(atDoor,observedUnlockedGuardianCap(atDoor)),1);
  assert.equal(observedPassageApproach({...atDoor,runToken:'another'},
    observedUnlockedGuardianCap(far)),0,'another run cannot open a previous gate');
  const effect = createTowerGuardianPassage(THREE);
  try {
    assert.equal(effect.unlock(far,anchor),true);
    effect.update(.025);
    const leaf=effect.group.getObjectByName('ClearedPassageLeftLeaf');
    assert.ok(leaf.position.x> -3.4,'distant initial source release still has visible weight');
    assert.equal(effect.unlock(atDoor,anchor),true);
    effect.update(0);
    assert.ok(leaf.position.x< -3.49,
      'source-confirmed near contact clears the full 3D threshold before collision');
    assert.equal(effect.diagnostics().sourceMeasuredApproachOpen,1);
    assert.ok(effect.cameraWeight()>=.32,
      'the earned approach preserves a bounded real-door camera acknowledgment');
    effect.unlock({...far,tick:209},anchor);
    effect.update(.01);
    assert.ok(leaf.position.x< -3.49,'old or retreated snapshots never slam the door');
    assert.equal(JSON.stringify(atDoor),frozen,'source input remains immutable');
    assert.equal(effect.begin(atDoor,{runToken:'earned-traverse',floor:9,
      tick:212,lifecycle:'running',enemies:[]},anchor),true);
    effect.update(0);
    assert.ok(leaf.position.x< -3.49,'handoff retains the actual opened corridor');
    effect.clear();
    assert.equal(effect.diagnostics().sourceMeasuredApproachOpen,0);
    assert.equal(effect.cameraWeight(),0);
  } finally { effect.dispose(); }
});

// This is a source-integration contract, not a visual-quality verdict.
// Real portrait/desktop footage must still show actor AND unlocked passage.
test('source-earned cap arrival leads the same continuous portrait/desktop camera without predicting a victory', () => {
  const scene = fs.readFileSync(path.join(root, 'public/infinite-tower-climb/visuals/scene.mjs'), 'utf8');
  assert.match(scene, /const liveExit = !overview && !options\.stale &&[\s\S]*?observedUnlockedGuardianCap\(snapshot\)/,
    'only a live running climber observing a defeated guardian may lead the exit');
  assert.match(scene, /passage\.diagnostics\(\)\.stage === 'earned-open'[\s\S]*?observedPassageApproach\(snapshot, liveExit\)/,
    'camera approach is source-measured and stays on the genuine current floor');
  assert.match(scene, /arrivalFraming \* \(portrait \? \.30 : \.24\)/,
    'the narrow portrait lens needs extra doorway lead without a camera cut');
  assert.match(scene, /cameraRate = Math\.max\(cameraRate, 3\.8 \+ arrivalFraming \* 2\.4\)/,
    'genuine near-contact unlock accelerates only the camera response');
  assert.match(scene, /actorRescueFraction = recoverTowerActorView\(/,
    'the live actor rescue remains in control if the doorway shot crops the hero');
});
