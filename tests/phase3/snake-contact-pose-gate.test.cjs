'use strict';
const {historicalRendererGitBlob} = require('../helpers/snake-t1-living-archive.cjs');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), crypto = require('node:crypto');
const { stripR49Contact } = require('../helpers/snake-r49-contact-archive.cjs');
const file = path.resolve(__dirname, '../../public/snake-stream/renderer.mjs');
const hash = historicalRendererGitBlob;
function syncFrom(source) {
  const context = {};
  vm.runInNewContext(source.replace(/^import .*;\n/gm, '').replace(/^export /gm, '') + '\nthis.sync = syncContactShadowInstances;', context);
  assert.equal(typeof context.sync, 'function');
  return context.sync;
}
test('R49 contact upload gate preserves exact R48 renderer source and all portal-separated matrix bytes', async () => {
  const THREE = await import('three');
  const currentSource = fs.readFileSync(file, 'utf8');
  const oldSource = stripR49Contact(currentSource);
  assert.equal(hash(oldSource), 'ab6c17109846f1c607a6d1be0e936d4efb87ff8a', 'exact GitHub pre-R49 renderer blob');
  assert.equal(stripR49Contact(oldSource), oldSource, 'reversible source is idempotent');
  const oldSync = syncFrom(oldSource), newSync = syncFrom(currentSource);
  function make() {
    const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial(), 2048);
    mesh.count = 0;
    const pivot = new THREE.Object3D(); pivot.rotation.x = -Math.PI / 2;
    return { mesh, pivot };
  }
  const old = make(), fresh = make();
  const pathsA = Object.freeze([
    Object.freeze([{x:3,z:4},{x:3.5,z:4.25}].map(Object.freeze)),
    Object.freeze([{x:-6,z:2},{x:-6.5,z:2}].map(Object.freeze)),
  ]);
  const pathsB = Object.freeze([
    Object.freeze([{x:3.25,z:4},{x:3.75,z:4.25}].map(Object.freeze)),
    Object.freeze([{x:-6,z:2}].map(Object.freeze)),
  ]);
  const longPath = Object.freeze([Object.freeze(Array.from({length:2050},(_,i)=>Object.freeze({x:i/9,z:i/11}))),
    Object.freeze([{x:999,z:999}].map(Object.freeze))]);
  const fixtures = [
    {paths:pathsA,upload:true},
    {paths:pathsA,upload:false},
    {paths:JSON.parse(JSON.stringify(pathsA)),upload:false},
    {paths:pathsB,upload:true},
    {paths:pathsB,upload:false},
    {paths:[],upload:false},
    {paths:pathsA,upload:true},
    {paths:longPath,upload:true},
    {paths:longPath,upload:false},
    {paths:pathsB,upload:true},
  ];
  const unchangedInput = JSON.stringify(fixtures);
  let oldTotal=0,newTotal=0;
  try {
    for (let i=0;i<fixtures.length;i++) {
      const {paths,upload} = fixtures[i];
      const version = fresh.mesh.instanceMatrix.version;
      old.mesh.instanceMatrix.clearUpdateRanges();
      fresh.mesh.instanceMatrix.clearUpdateRanges();
      const before = oldSync(old.mesh, old.pivot, paths);
      const after = newSync(fresh.mesh, fresh.pivot, paths);
      oldTotal += before; newTotal += after;
      assert.equal(fresh.mesh.count, old.mesh.count, 'same visible portal-separated contacts: '+i);
      const bytes = fresh.mesh.count * 16 * Float32Array.BYTES_PER_ELEMENT;
      assert.equal(before, bytes, 'old R38 always requested visible prefix: '+i);
      assert.equal(after, upload ? bytes : 0, 'only changed pose requests upload: '+i);
      assert.equal(fresh.mesh.instanceMatrix.version, version + Number(upload && bytes>0), 'no duplicate version bump: '+i);
      assert.equal(fresh.mesh.instanceMatrix.updateRanges.length, Number(upload && bytes>0), 'no duplicate update range: '+i);
      if (upload && bytes) {
        assert.equal(fresh.mesh.instanceMatrix.updateRanges[0].start,0);
        assert.equal(fresh.mesh.instanceMatrix.updateRanges[0].count,fresh.mesh.count*16);
      }
      const left=Buffer.from(old.mesh.instanceMatrix.array.buffer,old.mesh.instanceMatrix.array.byteOffset,bytes);
      const right=Buffer.from(fresh.mesh.instanceMatrix.array.buffer,fresh.mesh.instanceMatrix.array.byteOffset,bytes);
      assert.equal(Buffer.compare(left,right),0,'exact same float32 matrices: '+i);
      assert.ok(after<=2048*16*4,'bounded transfer: '+i);
    }
    assert.equal(fresh.mesh.count,3,'later path returns after capacity cap');
    assert.ok(newTotal<oldTotal,'real duplicate GPU upload requests avoided');
    assert.equal(fresh.mesh.instanceMatrix.array.byteLength,131072,'same long-snake capacity');
    assert.equal(JSON.stringify(fixtures),unchangedInput,'public motion remains immutable');
  } finally {
    for(const {mesh} of [old,fresh]) { mesh.geometry.dispose(); mesh.material.dispose(); mesh.dispose(); }
  }
});
