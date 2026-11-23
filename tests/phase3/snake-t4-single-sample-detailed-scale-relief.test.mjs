import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createSerpent, installSingleSampleScaleRelief} from '../../public/snake-stream/serpent.mjs';

const meshes = hero => [
  hero.group.getObjectByName('Continuous sculpted serpent body'),
  hero.group.getObjectByName('Continuous tapered skull and neck'),
];

test('detailed scale relief uses a single original atlas lookup with Three native tangent normal', () => {
  const material = new THREE.MeshStandardMaterial({bumpMap: new THREE.DataTexture(new Uint8Array(16), 2, 2), bumpScale: 0.028});
  assert.equal((THREE.ShaderChunk.bumpmap_pars_fragment.match(/texture2D\(\s*bumpMap\s*,/g) || []).length, 3,
    'pinned Three.js baseline must have three relief lookups');
  assert.equal(installSingleSampleScaleRelief(material, THREE), true);
  const shader = {fragmentShader: '#include <bumpmap_pars_fragment>\nvoid main() {}'};
  material.onBeforeCompile(shader);
  assert.equal((shader.fragmentShader.match(/texture2D\(\s*bumpMap\s*,/g) || []).length, 1);
  assert.match(shader.fragmentShader, /dFdx\(heightSample\)/);
  assert.match(shader.fragmentShader, /dFdy\(heightSample\)/);
  assert.match(shader.fragmentShader, /vec3 perturbNormalArb\(/);
  assert.equal(material.bumpScale, 0.028);
  assert.match(material.customProgramCacheKey(), /snake-scale-relief/);
  assert.equal(installSingleSampleScaleRelief(material, THREE), false, 'do not wrap the same material twice');
  material.dispose();
});

test('original detailed serpent retains pigment, relief, roughness and all four texture budgets', () => {
  const hero = createSerpent(THREE);
  try {
    const [body, skull] = meshes(hero);
    assert.ok(body && skull);
    assert.equal(hero.stats().textures, 4);
    for (const mesh of [body, skull]) {
      assert.strictEqual(mesh.material.bumpMap, mesh.material.roughnessMap);
      assert.equal(mesh.material.normalMap, null);
      assert.equal(mesh.material.bumpMap.image.width, 1024);
      assert.equal(mesh.material.bumpMap.image.height, 512);
      const shader = {fragmentShader: '#include <bumpmap_pars_fragment>'};
      mesh.material.onBeforeCompile(shader);
      assert.equal((shader.fragmentShader.match(/texture2D\(\s*bumpMap\s*,/g) || []).length, 1);
    }
    const path = [[{x:0,z:0},{x:1,z:0},{x:2,z:0},{x:3,z:0}]];
    hero.update(path, {detail:'low',time:0,reducedMotion:true,runToken:'public'});
    assert.ok(body.material.isMeshLambertMaterial);
    assert.equal(body.material.bumpMap, null);
    hero.update(path, {detail:'high',time:0,reducedMotion:true,runToken:'public'});
    assert.strictEqual(body.material.bumpMap, body.material.roughnessMap);
    assert.equal(hero.stats().textures, 4);
  } finally { hero.dispose(); }
});

test('unexpected Three shader versions do not patch or allocate extra GPU textures', () => {
  const material = new THREE.MeshStandardMaterial({bumpMap: new THREE.Texture()});
  const fallback = {ShaderChunk: {bumpmap_pars_fragment:'float incompatible() { return 0.0; }'}};
  const prior = material.onBeforeCompile;
  assert.equal(installSingleSampleScaleRelief(material, fallback), false);
  assert.strictEqual(material.onBeforeCompile, prior);
  material.dispose();
});
