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
// Real exterior guardian-lock geometry. The inner walk-through threshold
// rejects older synthetic anchors floating at radius ~21.4, as it should.
const anchorAngle = .24, outerLockRadius = 27.78;
const anchor = Object.freeze({ x: Math.sin(anchorAngle)*outerLockRadius,
  y: 17.5, z: Math.cos(anchorAngle)*outerLockRadius, angle: anchorAngle });
const expectedWalkableFocus = () => [
  anchor.x - (outerLockRadius - 25)*Math.sin(anchor.angle),
  anchor.y - 2 + 2.6,
  anchor.z - (outerLockRadius - 25)*Math.cos(anchor.angle),
];

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
    assert.deepEqual(effect.diagnostics().focusPosition, expectedWalkableFocus());
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
    assert.ok(effect.group.getObjectByName('ObservedWalkableGuardianThreshold'),
      'an added physical doorway must be present on the same actual grounded cap lane');
    assert.equal(meshCount, 20, 'the source-grounded inlay and threshold meshes must remain exactly bounded and non-colliding');
    assert.equal(effect.diagnostics().fragmentInstances, 8);
    assert.ok(effect.focusPoint()?.y > anchor.y + .5);
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
  assert.equal(new Set(disposed).size, 7, 'all owned geometries including the machined source gate and guardian armor are released');
});


test('real floor-eight victory-to-nine passage leaves the actor visible through open machined bronze slots', async () => {
  const [THREE, { createTowerGuardianPassage, createMachinedGuardianLeafGeometry }] = await loaded;
  const originalLeaf = createMachinedGuardianLeafGeometry(THREE);
  try {
    assert.equal(originalLeaf.type, 'ExtrudeGeometry');
    assert.equal(originalLeaf.parameters.shapes.holes.length, 3,
      'the arch needs actual depth-through windows, not transparency-painted holes');
    originalLeaf.computeBoundingBox();
    assert.ok(originalLeaf.boundingBox.min.z < 0 && originalLeaf.boundingBox.max.z > 0);
  } finally { originalLeaf.dispose(); }
  const effect = createTowerGuardianPassage(THREE);
  const { previous, next } = frames();
  const inputBefore = JSON.stringify({ previous, next });
  try {
    assert.equal(effect.begin(previous, next, anchor), true,
      'no decorative floor-nine victory without the actual source guardian');
    effect.update(.06);
    const outer = effect.group.getObjectByName('ClearedPassageBronzeLeaf');
    const inner = effect.group.getObjectByName('WalkableSourceCapRetractingBronzeLeaves');
    const gate = effect.diagnostics().physicallyWalkableThreshold;
    assert.ok(outer?.isMesh && inner?.isInstancedMesh);
    assert.equal(outer.geometry, inner.geometry, 'outer and grounded doors use one machined geometry');
    assert.equal(outer.geometry.parameters.shapes.holes.length, 3);
    assert.equal(outer.material, inner.material, 'both display layers share source-driven opacity');
    assert.ok(outer.material.transparent && !outer.material.depthWrite);
    assert.ok(outer.material.opacity <= .26 && outer.material.opacity > 0,
      'real handoff must not revive a solid portrait-sized bronze slab');
    assert.equal(gate.originalThroughCutLeafWindows, 3);
    assert.equal(gate.collider, false);
    assert.equal(gate.sourceSimulationSealActive, false);
    assert.equal(JSON.stringify({ previous, next }), inputBefore,
      'decorative passage cannot rewrite authoritative snapshots');
    effect.update(0, { stale: true });
    assert.equal(outer.material.opacity, gate.gatewayLeafAlpha,
      'stale presentation cannot animate a second floor clearance');
  } finally { effect.dispose(); }
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
  assert.match(source, /sourceWalkProgress = liveExit &&[\s\S]*?passage\.diagnostics\(\)\.inlayProgress/,
    'the continuous guardian-to-gate camera lead must come from actual unlocked source walking');
  assert.match(source, /const physicalEscort = Math\.max\(releaseWeight, walkwayLead\)/,
    'physical source walking may extend, but must not displace, the original defeat framing');
  assert.match(source, /const walkwayLead = Math\.max\(0, Math\.min\(\.34,/,
    'the source-derived escort remains deliberately bounded and cannot command an arbitrary camera cut');
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

test('real source-defeated guardian collapses as a rig while the power connection breaks toward the gate', async () => {
  const [THREE,{createTowerGuardianPassage}] = await loaded;
  const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
  const guardian={id:'f8:guardian',kind:'guardian',active:false,
    health:0,x:176000,y:3250000,halfHeight:18000};
  const source={runToken:'earned-break',floor:8,tick:220,lifecycle:'running',guardianExitX:cap.x+Math.floor(cap.width*.76),
    worldWidth:480000,chunkBaseY:2880000,player:{health:4,x:cap.x},
    platforms:[cap],enemies:[guardian]};
  const fx=createTowerGuardianPassage(THREE);
  try{
    assert.equal(fx.unlock(source,anchor),true);
    const armor=fx.group.getObjectByName('WitnessedGuardianDefeatArmor');
    const conduit=fx.group.getObjectByName('WitnessedGuardianPowerBreak');
    const shockwave=fx.group.getObjectByName('WitnessedGuardianDefeatShockwave');
    assert.ok(shockwave?.isMesh);
    assert.equal(armor.count,12);assert.equal(conduit.count,8);
    assert.equal(shockwave.visible,true);
    assert.equal(shockwave.castShadow,false);
    assert.equal(shockwave.userData.collider,undefined);
    assert.equal(shockwave.position.x,armor.position.x,
      'the release impulse belongs to the observed defeated body, not the new floor');
    assert.equal(shockwave.position.z,armor.position.z);
    const originalRadius=shockwave.scale.x, originalOpacity=shockwave.material.opacity;
    assert.equal(conduit.castShadow,false);assert.equal(conduit.userData.collider,undefined);
    const first=new THREE.Matrix4(),second=new THREE.Matrix4();
    armor.getMatrixAt(0,first);armor.getMatrixAt(10,second);
    assert.notDeepEqual(first.elements,second.elements,
      'helmet and boots are distinct physical parts of a complete boss silhouette');
    conduit.getMatrixAt(7,first);
    const before=[...first.elements];
    fx.update(.55);
    conduit.getMatrixAt(7,first);
    assert.notDeepEqual(first.elements,before,'the last source-released segment physically reels to the gate');
    assert.ok(shockwave.scale.x>originalRadius && shockwave.material.opacity<originalOpacity,
      'physical defeat has an expanding, dissipating on-floor impact');
    const radius=shockwave.scale.x, opacity=shockwave.material.opacity;
    const age=fx.diagnostics().defeatAgeSeconds;
    fx.update(.45,{stale:true});
    assert.equal(fx.diagnostics().defeatAgeSeconds,age,
      'stale observations cannot advance a staged defeat');
    assert.equal(shockwave.scale.x,radius);
    assert.equal(shockwave.material.opacity,opacity);
    // The renderer deliberately limits every presentation update to 0.5s.
    // Advance real bounded frames instead of assuming a large dt skips time.
    fx.update(.5); fx.update(.5); fx.update(.2);
    assert.equal(conduit.visible,false);
    assert.equal(conduit.count,0);
    assert.equal(shockwave.visible,false, 'defeat impulse retires while permanent armor remains');
    assert.equal(armor.count,12,'fallen original armor remains during real walking');
    fx.clear();
    assert.equal(armor.count,0);assert.equal(conduit.count,0);
    assert.equal(shockwave.visible,false, 'restart clears all source-earned visual state');
    assert.equal(fx.diagnostics().guardianDefeatSourcePosition,null);
    assert.equal(fx.unlock({...source,tick:221,
      enemies:[{...guardian,active:true,health:1}]},anchor),false,
      'living guardian cannot fabricate a defeat or power rupture');
  }finally{fx.dispose();}
});

test('earned guardian exit embeds a source-aligned 3D cap inlay which follows actual walking, not animation time', async () => {
  const [THREE,{createTowerGuardianPassage}] = await loaded;
  const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
  const guardian={id:'f8:guardian',kind:'guardian',active:false,
    health:0,x:176000,y:3250000,halfHeight:18000};
  const source={runToken:'earned-inlay',floor:8,tick:220,lifecycle:'running',guardianExitX:cap.x+Math.floor(cap.width*.76),
    worldWidth:480000,chunkBaseY:2880000,
    player:{health:4,x:cap.x+cap.width*.38},platforms:[cap],enemies:[guardian]};
  const fx=createTowerGuardianPassage(THREE);
  try {
    assert.equal(fx.unlock(source,anchor),true);
    const inlay=fx.group.getObjectByName('WitnessedGuardianCapWalkwayInlay');
    assert.ok(inlay?.isInstancedMesh,'the earned source cap has actual 3D wayfinding architecture');
    assert.equal(inlay.count,12);
    assert.equal(inlay.userData.collider,undefined,'wayfinding metal cannot fabricate platform collisions');
    assert.equal(inlay.castShadow,false);
    fx.group.updateMatrixWorld(true);
    const local=new THREE.Matrix4(),world=new THREE.Matrix4();
    inlay.getMatrixAt(0,local);
    world.multiplyMatrices(inlay.matrixWorld,local);
    const actual=new THREE.Vector3().setFromMatrixPosition(world);
    const y=(cap.y+cap.height+500-source.chunkBaseY)/10000;
    assert.ok(Math.abs(actual.y-y)<.0001,
      'the guide lies on the witnessed platform top, not above an invented bridge');
    const radius=Math.hypot(actual.x,actual.z);
    assert.ok(radius>=22.4 && radius<=27.18,
      'the lit lane is embedded inside the real cap render deck, never outside its radial edge');
    assert.equal(fx.diagnostics().inlaySourceTick,220);
    assert.ok(fx.diagnostics().inlayProgress<.01);
    const next={...source,tick:223,player:{...source.player,x:cap.x+cap.width*.74}};
    assert.equal(fx.unlock(next,anchor),true);
    assert.ok(fx.diagnostics().inlayProgress>.9,
      'the real climber moving toward the unlocked exit advances the physical path light');
    assert.equal(fx.diagnostics().inlaySourceTick,223);
    assert.equal(fx.unlock({...source,tick:221},anchor),true);
    assert.equal(fx.diagnostics().inlaySourceTick,223,
      'late source frames cannot visually rewind earned walking');
    assert.equal(fx.unlock({...next,tick:224,
      player:{health:4,x:Number.NaN}},anchor),true,
      'an incomplete transport sample must not suppress the genuine earned gate');
    assert.equal(fx.diagnostics().inlaySourceTick,223,
      'nonfinite movement cannot poison instanced render colors');
    assert.ok(fx.diagnostics().inlayProgress>.9);
    fx.clear();
    assert.equal(inlay.visible,false);
    assert.equal(inlay.count,0);
    assert.equal(fx.diagnostics().inlayProgress,0);
    assert.equal(fx.diagnostics().inlaySourceTick,-1);
  } finally { fx.dispose(); }
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
    assert.equal(effect.group.getObjectByName('WitnessedGuardianDefeatShockwave').visible,false,
      'reduced motion retains the static defeated armor without a traveling flash');
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
    runToken:'authentic-run',floor:8,tick:210,lifecycle:'running',guardianExitX:cap.x+Math.floor(cap.width*.76),
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
  const far = {runToken:'earned-traverse',floor:8,tick:210,lifecycle:'running',guardianExitX:cap.x+Math.floor(cap.width*.76),
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


test('source-defeated guardian crumbles during earned cap traversal, not after the new floor', async () => {
  const [THREE, { createTowerGuardianPassage, observedUnlockedGuardianCap }] = await loaded;
  const cap = { id: 'f8:cap', x: 115200, y: 8 * 360000 + 332000,
    width: 249600, height: 12000 };
  const guardian = { id: 'f8:guardian', kind: 'guardian', active: false,
    health: 0, x: cap.x + 65000,
    y: cap.y + cap.height + 18000, halfHeight: 18000 };
  const source = Object.freeze({
    runToken: 'real-armor-landing', floor: 8, tick: 214, lifecycle: 'running',guardianExitX:cap.x+Math.floor(cap.width*.76),
    chunkBaseY: 8 * 360000, worldWidth: 480000,
    player: Object.freeze({ x: cap.x + 110000, health: 3 }),
    platforms: Object.freeze([Object.freeze(cap)]),
    enemies: Object.freeze([Object.freeze(guardian)]),
  });
  assert.ok(observedUnlockedGuardianCap(source));
  const effect = createTowerGuardianPassage(THREE);
  try {
    assert.equal(effect.unlock(source, anchor), true);
    assert.equal(effect.diagnostics().stage, 'earned-open');
    assert.equal(effect.diagnostics().guardianDefeatPieces, 12,
      'a genuine source-zero-HP body produces physical defeat on the same floor');
    const r = 27.65, theta = (guardian.x / source.worldWidth - .5) * 2.2;
    const expected = [Math.sin(theta) * r,
      (guardian.y - guardian.halfHeight + 9000 - source.chunkBaseY) / 10000,
      Math.cos(theta) * r];
    for (const [index, value] of expected.entries())
      assert.ok(Math.abs(effect.diagnostics().guardianDefeatSourcePosition[index] - value) < 1e-7);
    const pieces = effect.group.getObjectByName('WitnessedGuardianDefeatArmor');
    const matrix = new THREE.Matrix4();
    pieces.getMatrixAt(8, matrix);
    const first = [...matrix.elements];
    effect.update(.45);
    pieces.getMatrixAt(8, matrix);
    assert.notDeepEqual(matrix.elements, first,
      'the real armor falls before the actual source floor transition');
    const age = effect.diagnostics().defeatAgeSeconds;
    assert.equal(effect.unlock({ ...source, tick: 215 }, anchor), true);
    assert.equal(effect.diagnostics().defeatAgeSeconds, age,
      'duplicate source snapshots cannot replay a defeated guardian collapse');
    const next = { runToken: source.runToken, floor: 9, tick: 222,
      lifecycle: 'running', enemies: [] };
    const rebase = source.chunkBaseY + 360000;
    const rebasedGuardian = { x: expected[0],
      y: expected[1] - 36, z: expected[2] };
    assert.equal(effect.begin(source, next, anchor, rebasedGuardian), true);
    assert.equal(effect.diagnostics().defeatAgeSeconds, age,
      'cross-floor passage cannot reset guardian defeat presentation time');
    effect.group.updateMatrixWorld(true);
    assert.ok(pieces.getWorldPosition(new THREE.Vector3()).distanceTo(
      new THREE.Vector3(rebasedGuardian.x, rebasedGuardian.y,
        rebasedGuardian.z)) < 1e-5);
    effect.update(.2);
    assert.ok(effect.diagnostics().defeatAgeSeconds > age);
    effect.clear();
    assert.equal(effect.diagnostics().guardianDefeatPieces, 0);
    assert.equal(effect.diagnostics().defeatAgeSeconds, 0);
    assert.equal(effect.unlock({ ...source, enemies: [{ ...guardian, active: true, health: 1 }] },
      anchor), false);
    assert.equal(effect.group.visible, false,
      'living, unearned guardian cannot create a defeat memorial');
  } finally { effect.dispose(); }
});


test('one continuous source-owned camera escort observes defeated body, then the physical exit', async () => {
  const [THREE, { createTowerGuardianPassage }] = await loaded;
  const cap = { id: 'f8:cap', x: 115200, y: 8 * 360000 + 332000,
    width: 249600, height: 12000 };
  const defeated = { id: 'f8:guardian', kind: 'guardian', active: false,
    health: 0, x: cap.x + 54000,
    y: cap.y + cap.height + 18000, halfHeight: 18000 };
  const snapshot = {
    runToken: 'source-camera-escort', lifecycle: 'running',guardianExitX:cap.x+Math.floor(cap.width*.76),
    tick: 240, floor: 8, worldWidth: 480000,
    chunkBaseY: 8 * 360000, player: {
      health: 5, x: cap.x + 90000,
    }, platforms: [cap], enemies: [defeated],
  };
  const effect = createTowerGuardianPassage(THREE);
  try {
    assert.equal(effect.unlock(snapshot, anchor), true);
    assert.ok(effect.diagnostics().sourceMeasuredDefeatFocusWeight > .1);
    const early = effect.focusPoint().clone();
    assert.ok(early.distanceTo(new THREE.Vector3(...expectedWalkableFocus())) > .1,
      'early camera acknowledges the real defeated guardian');
    // A renderer rejects oversized elapsed slices; measure a normal-speed
    // sequence instead of assuming one huge delta advances presentation time.
    for (let i = 0; i < 3; i++) effect.update(.5);
    assert.equal(effect.diagnostics().sourceMeasuredDefeatFocusWeight, 0);
    assert.deepEqual(effect.focusPoint().toArray(), expectedWalkableFocus(),
      'continuous camera focus returns to the actual radius-25 walk-through opening');
    assert.equal(effect.unlock({ ...snapshot, tick: 241,
      player: { health: 5, x: cap.x + Math.floor(cap.width * .76) } },
      anchor), true);
    assert.equal(effect.diagnostics().sourceMeasuredApproachOpen, 1);
    assert.equal(effect.diagnostics().sourceMeasuredDefeatFocusWeight, 0);
    effect.clear();
    assert.equal(effect.focusPoint(), null);
    assert.equal(effect.diagnostics().sourceMeasuredDefeatFocusWeight, 0);
  } finally { effect.dispose(); }
});

test('only exact published source clearance can stage the earned 3D guardian threshold',async()=>{
  const [THREE,{observedUnlockedGuardianCap,observedPassageApproach,
    createTowerGuardianPassage}]=await loaded;
  const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
  const guardian={id:'f8:guardian',kind:'guardian',active:false,
    health:0,x:176000,y:3250000,halfHeight:18000};
  const legacy={runToken:'legacy-with-defeated-guardian',floor:8,tick:220,
    lifecycle:'running',worldWidth:480000,chunkBaseY:2880000,
    player:{health:3,x:220000},platforms:[cap],enemies:[guardian]};
  const exactExit=cap.x+Math.floor(cap.width*.76);
  const earned={...legacy,guardianExitX:exactExit};
  assert.ok(observedUnlockedGuardianCap(earned),
    'a defeated body plus the exact published source exit is a real earned opening');
  const effect=createTowerGuardianPassage(THREE);
  try{
    for(const invalid of [
      legacy,
      {...legacy,guardianExitX:undefined},
      {...legacy,guardianExitX:exactExit+1},
      {...legacy,guardianExitX:NaN},
      {...legacy,guardianExitX:exactExit+.5},
      {...legacy,guardianExitX:exactExit,
        platforms:[{...cap,width:cap.width+10000}]},
      {...earned,enemies:[{...guardian,active:true,health:1}]},
    ]){
      const before=JSON.stringify(invalid);
      assert.equal(observedUnlockedGuardianCap(invalid),null);
      assert.equal(effect.unlock(invalid,anchor),false);
      assert.equal(effect.group.visible,false);
      assert.equal(observedPassageApproach(invalid,{
        runToken:invalid.runToken,floor:8,cap}),0);
      assert.equal(JSON.stringify(invalid),before,'no source mutation');
    }
    assert.equal(effect.unlock(earned,anchor),true);
    assert.equal(effect.diagnostics().stage,'earned-open');
    assert.equal(effect.group.visible,true);
    const approaching={...earned,player:{...earned.player,x:exactExit-8000}};
    assert.ok(observedPassageApproach(approaching,
      observedUnlockedGuardianCap(approaching))>.5);
  }finally{effect.dispose();}
});
