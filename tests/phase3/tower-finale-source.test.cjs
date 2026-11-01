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
    assert.equal(effect.group.children.length,4);
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
  const disposals=[];
  effect.group.traverse(object => {
    if(object.geometry)object.geometry.addEventListener('dispose',()=>disposals.push(object.name));
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
  assert.equal(disposals.length,4,'all four geometries disposed exactly once');
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
