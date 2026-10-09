import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {hordeFragmentSource,inspectHordeSilhouette} from '../web/instanced-horde.js';

test('night infected use a readable rim and cheap software fog',()=>{
  const source=hordeFragmentSource('low-spec');
  for(const symbol of ['vNormal','vColor','vWorld','uEye','uFogColor','uNight','uFog'])
    assert.ok(source.includes(symbol),'missing '+symbol);
  assert.match(source,/rim\*=rim/);
  assert.match(source,/\.72\*uNight/);
  assert.match(source,/dot\(delta,delta\)\*uFog\*uFog/);
  assert.doesNotMatch(source,/(?:exp|pow|distance|texture|reflect)\s*\(/);
});
test('hardware keeps original cinematic horde fog and detailed geometry',()=>{
  assert.match(hordeFragmentSource('cinematic'),/exp\(-pow\(distance\(uEye,vWorld\)/);
  assert.ok(inspectHordeSilhouette().triangles>500);
});
test('real renderer passes its shader tier to horde and reports it',async()=>{
  const source=await readFile(new URL('../web/gauntlet3d.js',import.meta.url),'utf8');
  assert.match(source,/createInstancedHorde\(gl,\{maxInstances:500,shaderPath\}\)/);
  assert.match(source,/hordeShaderPath:distantHorde\.shaderPath/);
});
