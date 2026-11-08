'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const loaded = Promise.all([
  import(pathToFileURL(path.join(root, 'node_modules/three/build/three.module.js')).href),
  import(pathToFileURL(path.join(root, 'public/infinite-tower-climb/visuals/finale.mjs')).href),
]);
const hero = { x: 8, y: 30, z: -4 };
function state(lifecycle, runToken='auth-a', tick=900, result=null) {
  return Object.freeze({ lifecycle, runToken, tick, result });
}
test('real terminal and intermission render a bounded, spatial, source-gated 3D sequence', async () => {
  const [THREE, { createTowerFinale }] = await loaded;
  const effect = createTowerFinale(THREE);
  try {
    const origin = new THREE.Vector3(hero.x, hero.y, hero.z);
    effect.update(state('running'), origin, 0);
    assert.equal(effect.group.visible, false, 'ordinary ascent must not fabricate an outcome');
    effect.update(state('running', 'auth-a', 900, {reason:'still-playing',kind:'loss'}), origin, 1);
    assert.equal(effect.group.visible, false, 'result metadata without terminal source state is not a finale');
    effect.update(state('result','auth-a',900,{reason:'fall',kind:'game'}),origin,2);
    assert.equal(effect.group.visible, true);
    assert.deepEqual(effect.group.position.toArray(),[8,30,-4]);
    assert.equal(effect.diagnostics().runToken,'auth-a');
    assert.equal(effect.diagnostics().lifecycle,'result');
    assert.equal(effect.group.children.length,5);
    assert.equal(effect.diagnostics().stones,12);
    assert.equal(effect.diagnostics().resultKind,'game');
    assert.equal(effect.diagnostics().resultReason,'fall');
    assert.equal(effect.diagnostics().fragments,28);
    effect.update(state('intermission','auth-a',900,{reason:'fall',kind:'game'}),origin,3);
    assert.equal(effect.diagnostics().lifecycle,'intermission');
    effect.update(state('running','auth-b',0),origin,4);
    assert.equal(effect.group.visible,false,'authentic restart retires the visual');
    assert.equal(effect.diagnostics().runToken,null,'no prior terminal token leaks into a new run');
  } finally { effect.dispose(); }
});
test('reduced motion is stable, finite and frees all graphics resources on recovery', async () => {
  const [THREE, { createTowerFinale }] = await loaded;
  const effect = createTowerFinale(THREE);
  const terminal = state('intermission','auth-a',850,{kind:'technical',reason:'interrupted'});
  const origin = new THREE.Vector3(hero.x,hero.y,hero.z);
  const disposals=[], ownedGeometries=new Set();
  effect.group.traverse(object => {
    // The final earned-floor rungs reuse the interruption stones' geometry.
    // Observe each uniquely owned geometry once, not once per mesh observer.
    if(object.geometry && !ownedGeometries.has(object.geometry)){
      ownedGeometries.add(object.geometry);
      object.geometry.addEventListener('dispose',()=>disposals.push(object.geometry.uuid));
    }
  });
  effect.update(terminal,origin,0,{reducedMotion:true});
  const baseline=Array.from(effect.group.children[2].instanceMatrix.array);
  effect.update(terminal,origin,12,{reducedMotion:true});
  assert.deepEqual(Array.from(effect.group.children[2].instanceMatrix.array),baseline);
  for(const object of effect.group.children){
    if(!object.isInstancedMesh) continue;
    assert.ok(Array.from(object.instanceMatrix.array).every(Number.isFinite));
  }
  effect.dispose();effect.dispose();
  assert.equal(ownedGeometries.size,4,'the terminal stage shares four owned geometries across five meshes');
  assert.equal(disposals.length,ownedGeometries.size,'all uniquely owned geometries dispose exactly once');
  assert.equal(new Set(disposals).size,ownedGeometries.size,'no geometry is disposed twice');
  assert.equal(effect.diagnostics().disposed,true);
  assert.equal(effect.group.children.length,0);
});

test('a real loss, technical interruption and operator stop have distinct source-driven physical outcomes', async () => {
  const [THREE, { createTowerFinale }] = await loaded;
  const effect = createTowerFinale(THREE);
  const origin = new THREE.Vector3(hero.x, hero.y, hero.z);
  try {
    effect.update(state('result','loss-1',100,{kind:'game',reason:'fall'}),origin,0);
    const fallenColor = effect.group.children[0].material.color.getHex();
    assert.equal(effect.diagnostics().resultReason,'fall');
    assert.equal(effect.group.children[1].geometry.type,'TorusGeometry');
    effect.update(state('intermission','loss-1',100,{kind:'game',reason:'fall'}),origin,2.4);
    assert.ok(effect.group.children[1].position.y < 2.9, 'the crown visibly collapses, not a victory halo');
    effect.update(state('result','technical-2',50,{kind:'technical',reason:'integrity-quarantine'}),origin,3);
    assert.equal(effect.diagnostics().resultKind,'technical');
    assert.notEqual(effect.group.children[0].material.color.getHex(),fallenColor);
    const technicalColor=effect.group.children[0].material.color.getHex();
    effect.update(state('result','operator-3',10,{kind:'operator',reason:'operator-abort'}),origin,5);
    assert.notEqual(effect.group.children[0].material.color.getHex(),technicalColor);
    effect.update(state('result','untrusted',10,{kind:'unsupported',reason:'fake-win'}),origin,6);
    assert.equal(effect.group.visible,false,'only supported genuine source result kinds activate');
    assert.equal(effect.diagnostics().runToken,null);
  } finally {effect.dispose();}
});

test('the final sculpture witnesses cleared floors without inventing progress, and resets for a real new run', async () => {
  const [THREE, { createTowerFinale }] = await loaded;
  const effect = createTowerFinale(THREE);
  const origin = new THREE.Vector3(hero.x, hero.y, hero.z);
  try {
    const wonFloors = { ...state('result','source-floors',700,{kind:'game',reason:'timer-expired'}),
      progress: { floorsCleared: 3 } };
    effect.update(wonFloors,origin,1);
    const rungs = effect.group.getObjectByName('ObservedClearedFloorRungs');
    assert.ok(rungs?.isInstancedMesh, 'real height progress has original 3D floor rungs, not HUD text');
    assert.equal(rungs.count,8, 'low-tier render cost is capped at eight instances');
    assert.equal(effect.diagnostics().progressedFloors,3);
    assert.equal(effect.diagnostics().sourceBound,true);
    const earned = new THREE.Matrix4(), unearned = new THREE.Matrix4();
    rungs.getMatrixAt(2,earned); rungs.getMatrixAt(3,unearned);
    const earnedScale = new THREE.Vector3(), dormantScale = new THREE.Vector3();
    earned.decompose(new THREE.Vector3(),new THREE.Quaternion(),earnedScale);
    unearned.decompose(new THREE.Vector3(),new THREE.Quaternion(),dormantScale);
    assert.ok(earnedScale.y > dormantScale.y * 3,
      'only completed authoritative floors stand tall; unearned rungs remain stubs');
    effect.update({ ...wonFloors, progress:{ floorsCleared:0 } },origin,1.2);
    assert.equal(effect.diagnostics().progressedFloors,0, 'no floor credit survives a reset of the real source');
    effect.update(state('running','new-run',0),origin,2);
    assert.equal(effect.group.visible,false);
    assert.equal(effect.diagnostics().progressedFloors,0, 'terminal data does not leak into restart');
  } finally { effect.dispose(); }
});


test('real recorded health-loss memorial uses physically shaded debris, not bright unlit pink scribbles', async () => {
  const [THREE, { createTowerFinale }] = await loaded;
  const stage = createTowerFinale(THREE);
  const origin = new THREE.Vector3(hero.x,hero.y,hero.z);
  try {
    stage.update(state('intermission','observed-loss',336,{kind:'game',reason:'health-depleted'}),
      origin,3,{reducedMotion:false});
    assert.equal(stage.group.visible,true);
    for(const name of ['ObservedTerminalGroundWave','ObservedFallenExpeditionCrown',
        'ObservedShatteredRoute','ObservedInterruptedAscent']) {
      const object=stage.group.getObjectByName(name);
      assert.equal(object.material.type,'MeshStandardMaterial',
        name+' should receive real biome lights and tone mapping, unlike the observed bright pink unlit debris');
      assert.equal(object.material.toneMapped,true);
      assert.equal(object.material.depthTest,true);
      assert.equal(object.material.depthWrite,false);
      assert.ok(object.material.metalness<=.42 && object.material.roughness>=.52);
    }
    const stone=stage.group.getObjectByName('ObservedInterruptedAscent');
    assert.ok(stone.geometry.parameters.height<=1.05,
      'the recorded death scene should contain compact broken stone, not a forest of long pink cylinders');
    assert.equal(stage.diagnostics().stones,12);
    assert.equal(stage.diagnostics().fragments,28);
    assert.equal(stage.diagnostics().resultReason,'health-depleted');
  } finally {stage.dispose();}
});

test('authentic outcome keeps the real 3D memorial sightline beside the ended-run body through intermission, never across restart', async () => {
  const [THREE, { createTowerFinale }] = await loaded;
  const stage = createTowerFinale(THREE);
  const target = new THREE.Vector3();
  try {
    const hero = new THREE.Vector3(22, 100, 17);
    stage.update(state('running','run-a',800),hero,0);
    assert.equal(stage.sightlineAnchor(target),null,
      'ordinary ascent must not manufacture a terminal target');
    stage.update(state('result','run-a',800,{kind:'game',reason:'health-depleted'}),hero,1);
    const anchor = stage.sightlineAnchor(target);
    assert.equal(anchor,target,'reuse the camera target without allocating a second world entity');
    const expected = new THREE.Vector3(0,2.1,2.2).applyMatrix4(stage.group.matrixWorld);
    assert.ok(anchor.distanceTo(expected)<1e-8,
      'target must be the real memorial group transform, not a screen-space fake');
    assert.ok(anchor.distanceTo(hero)<5,'target remains near the original actor');
    stage.update(state('intermission','run-a',800,{kind:'game',reason:'health-depleted'}),hero,2);
    assert.equal(stage.sightlineAnchor(target),target);
    stage.update(state('running','run-b',0),hero,3);
    assert.equal(stage.sightlineAnchor(target),null,'new run must restore ordinary world opacity');
  } finally { stage.dispose(); }
  assert.equal(stage.sightlineAnchor(target),null,'disposed scene cannot retain an outcome mask');
});
