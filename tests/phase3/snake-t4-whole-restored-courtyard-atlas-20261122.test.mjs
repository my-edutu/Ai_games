import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import * as THREE from 'three';
import { createWorld } from '../../public/snake-stream/world.mjs';
import * as courtyard from '../../public/snake-stream/courtyard-ecology.mjs';

const finalHash = bytes => createHash('sha256').update(bytes).digest('hex');
const originalFinalHashes = new Map([
  ['8x8','228119078758c2a6adf8a02e7a0635e8627b7ce10764f902653605eafc29bd89'],
  ['28x16','c28b8600a3867a7495247d1971120c74a31433fe9fa1ae7e9ab5f0a4caf068ed'],
  ['40x24','e344810bd75eeff56105f025bf73677f3444b57d741736d917ec190c8796cc42'],
]);
function createRealCourtyard(width,height) {
  const world=createWorld(THREE,{width,height});
  try {
    const ecology=courtyard.createCourtyardEcology(THREE,{width,height,world});
    const map=world.group.getObjectByName('Ruins / c3c4ad')?.material?.map;
    assert.ok(map?.image?.data instanceof Uint8Array);
    return {world,ecology,map,dispose(){ecology.dispose();world.dispose();}};
  } catch(e) {world.dispose();throw e;}
}

test('T4 complete courtyard art recovers original final 2MiB biome surface on three real boards with exact hashes, fresh live GPU texture and zero source authority changes',()=>{
  assert.equal(typeof courtyard.courtyardAtlasRecoveryTelemetry,'function',
    'a bounded CPU-only recovery path must exist for the entire completed 524288-pixel authored courtyard, not just the first-pass atlas');
  for(const [width,height] of [[8,8],[28,16],[40,24]]){
    const first=createRealCourtyard(width,height);
    const second=createRealCourtyard(width,height);
    try {
      const expected=originalFinalHashes.get(`${width}x${height}`);
      assert.equal(finalHash(first.map.image.data),expected);
      assert.equal(finalHash(second.map.image.data),expected,'recovery must be exactly the original final painted courtyard, not a substitute texture');
      assert.notStrictEqual(first.map,second.map,'each real 3D world independently owns its GPU texture');
      assert.notStrictEqual(first.map.image.data,second.map.image.data,'same-board recovered world must not alias another live GPU pixel buffer');
      assert.deepEqual(first.ecology.stats().stoneAtlas,second.ecology.stats().stoneAtlas,
        'full original courtyard heritage/provenance statistics cannot be weakened or changed');
      for (const world of [first.world,second.world]) {
        const stats=world.stats();
        assert.equal(stats.staticMeshes,13);
        assert.equal(stats.drawObjects,33);
        assert.equal(stats.textures,4);
        assert.equal(stats.obstacles,0);
        assert.equal(stats.hazards,0);
      }
      const after=courtyard.courtyardAtlasRecoveryTelemetry();
      assert.ok(after.hits>=1,'the second real scene must reuse original final authored pixels, not run the original 2MiB pigment bake again');
      assert.ok(after.entries<=3);
      assert.ok(after.retainedCpuBytes<=3*1024*512*4);
      const recoveredFirstPixel=second.map.image.data[0];
      first.map.image.data[0]^=255;
      assert.equal(second.map.image.data[0],recoveredFirstPixel,'art cache and independent worlds do not share writable buffers');
    } finally{first.dispose();second.dispose();}
  }
});

test('T4 complete physical courtyard cache is bounded, deterministic and evicts oldest board without preserving active GPU resources',()=>{
  assert.equal(typeof courtyard.courtyardAtlasRecoveryTelemetry,'function');
  const cold=createRealCourtyard(12,10);
  try {
    const stats=courtyard.courtyardAtlasRecoveryTelemetry();
    assert.equal(stats.entries,3);
    assert.equal(stats.retainedCpuBytes,3*1024*512*4);
    assert.equal(stats.maxEntries,3);
    assert.equal(stats.lastReused,false,'new actual board must not use a stale other-board final painted map');
  }finally{cold.dispose();}
  const evicted=createRealCourtyard(8,8);
  try {
    assert.equal(courtyard.courtyardAtlasRecoveryTelemetry().lastReused,false,'oldest board must be rebaked after LRU eviction');
    assert.equal(finalHash(evicted.map.image.data),originalFinalHashes.get('8x8'));
  }finally{evicted.dispose();}
});

test('T4 untrusted/unmarked textures cannot be replaced using a cached approved world atlas',()=>{
  assert.equal(typeof courtyard.courtyardAtlasRecoveryTelemetry,'function');
  const original=createRealCourtyard(8,8);
  const foreign=createWorld(THREE,{width:8,height:8});
  try {
    const map=foreign.group.getObjectByName('Ruins / c3c4ad').material.map;
    map.userData={};
    map.image.data[0]^=255;
    const eco=courtyard.createCourtyardEcology(THREE,{width:8,height:8,world:foreign});
    try {
      assert.equal(courtyard.courtyardAtlasRecoveryTelemetry().lastReused,false,
        'unmarked/test-modded texture must regrade supplied bytes, never silently overwrite them with prior scene cached pixels');
      assert.notEqual(finalHash(map.image.data),originalFinalHashes.get('8x8'));
    }finally{eco.dispose();}
  }finally{original.dispose();foreign.dispose();}
});
