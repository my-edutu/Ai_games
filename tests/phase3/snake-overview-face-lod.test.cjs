'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');

test('overview face uses bounded diffuse shaders; close detail retains every original PBR surface', async () => {
  const THREE = await import('three');
  const { createSerpent } = await import('../../public/snake-stream/serpent.mjs');
  const serpent = createSerpent(THREE);
  const names = [
    'Inset eye rim', 'Ivory eye', 'Amber iris', 'Deep pupil',
    'Unified cream lower jaw', 'Recessed oral interior',
    'Attached mouth corners', 'Paired recessed nostrils', 'Tongue stem',
  ];
  const faces = names.map(name => {
    const mesh = serpent.group.getObjectByName(name);
    assert.ok(mesh?.isMesh, 'missing authored face: ' + name);
    assert.equal(mesh.material.type, 'MeshStandardMaterial', 'original detailed PBR: ' + name);
    return [mesh, mesh.material, name];
  });
  const glint = serpent.group.getObjectByName('Paired eye catchlights');
  assert.equal(glint.material.type, 'MeshBasicMaterial', 'unlit catchlights must stay bright');
  const originalGlint = glint.material;
  const head = serpent.group.getObjectByName('Continuous tapered skull and neck');
  const paths = [
    [{ x: 0, z: 0 }, { x: 0, z: -1 }, { x: 1, z: -1 }, { x: 2, z: -1 }],
    [{ x: 10, z: 8 }, { x: 10, z: 9 }],
  ];
  const budget = serpent.stats();
  const low = new Map();
  try {
    serpent.update(paths, { detail: 'low', time: 1, delta: 1 / 60, direction: { x: 0, z: 1 } });
    for (const [mesh, original, name] of faces) {
      const cheap = mesh.material;
      low.set(mesh, cheap);
      assert.equal(cheap.type, 'MeshLambertMaterial', 'low face diffuse: ' + name);
      assert.notStrictEqual(cheap, original, 'detail material not mutated');
      assert.equal(cheap.color.getHex(), original.color.getHex(), 'same authored color');
      assert.equal(cheap.map, original.map, 'same map provenance');
      assert.equal(cheap.vertexColors, original.vertexColors, 'baked jaw-cheek tint remains');
      assert.equal(cheap.transparent, original.transparent, 'alpha intent remains');
      assert.equal(cheap.depthWrite, original.depthWrite, 'occlusion remains');
      assert.equal(cheap.side, original.side, 'cheek sidedness remains');
      assert.ok(!cheap.bumpMap && !cheap.roughnessMap, 'no per-fragment micro maps');
    }
    assert.equal(head.material.type, 'MeshLambertMaterial', 'skull uses earlier proven low LOD');
    assert.strictEqual(glint.material, originalGlint);
    const lowBudget = serpent.stats();
    assert.equal(lowBudget.textures, budget.textures, 'no extra texture objects');
    assert.equal(lowBudget.geometries, budget.geometries, 'same triangle buffers');
    assert.equal(lowBudget.bufferBytes, budget.bufferBytes, 'same immutable buffer budget');
    assert.ok(lowBudget.materials > 0 && lowBudget.materials - budget.materials === 0, 'all LOD materials allocated at construction');
    for (let n = 0; n < 140; n++) {
      const detail = n % 3 === 0 ? 'high' : 'low';
      serpent.update(paths, {
        detail, time: n * 0.017, delta: 0.017, direction: { x: 0, z: 1 },
        reducedMotion: n % 7 === 0, eating: (n % 9) / 9,
        food: { x: 1, z: -1 }, runToken: 'same-authoritative-run',
      });
      for (const [mesh, original] of faces)
        assert.strictEqual(mesh.material, detail === 'high' ? original : low.get(mesh), 'palette is fixed across view switches');
      for (const key of ['textures', 'geometries', 'materials', 'bufferBytes'])
        assert.equal(serpent.stats()[key], budget[key], 'bounded ' + key);
      assert.equal(serpent.stats().paths, 2, 'no path across portal-separated fragments');
      assert.equal(serpent.stats().truncated, false);
      assert.strictEqual(glint.material, originalGlint);
    }
    serpent.update(paths, { detail: 'high', reducedMotion: true });
    for (const [mesh, original] of faces) assert.strictEqual(mesh.material, original, 'detailed PBR preserved under reduced motion');
    serpent.update([], { detail: 'low' });
    assert.equal(serpent.group.getObjectByName('Continuous sculpted serpent body').geometry.drawRange.count, 0, 'empty snapshot draws no snake');
  } finally { serpent.dispose(); serpent.dispose(); }
  assert.equal(serpent.stats().disposed, true);
});
