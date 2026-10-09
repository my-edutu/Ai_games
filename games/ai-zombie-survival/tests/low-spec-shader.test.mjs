import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {lowSpecFragmentSource,selectMaterialShaderPath} from '../web/low-spec-shader.js';

test('software GPU selection is explicit, hardware keeps cinematic material path',()=>{
  for(const name of ['Google SwiftShader','llvmpipe (LLVM 16)','Software Rasterizer','swrast'])
    assert.equal(selectMaterialShaderPath(name),'low-spec',name);
  for(const name of ['NVIDIA GeForce RTX 4070','Apple M3','AMD Radeon RX 7900'])
    assert.equal(selectMaterialShaderPath(name),'cinematic',name);
});
test('software fragment shader retains depth cues and avoids expensive fragment operations',()=>{
  assert.match(lowSpecFragmentSource,/#version 300 es/);
  for(const varying of ['vColor','vNormal','vPosition','uEye','uFogColor','uLight','uNight','uFog'])
    assert.match(lowSpecFragmentSource,new RegExp('\\b'+varying+'\\b'));
  assert.match(lowSpecFragmentSource,/dot\(delta,delta\)/);
  assert.match(lowSpecFragmentSource,/fragColor=vec4\(mix\(graded,uFogColor,haze\),1\.0\)/);
  assert.doesNotMatch(lowSpecFragmentSource,/\b(?:pow|exp|sin|cos|texture|reflect|distance)\s*\(/,
    'software path must not reintroduce costly per-fragment functions');
});
test('real WebGL renderer routes software and hardware through distinct shaders',async()=>{
  const source=await readFile(new URL('../web/gauntlet3d.js',import.meta.url),'utf8');
  assert.match(source,/isSoftwareGPU\s*\?\s*lowSpecFragmentSource\s*:/);
  assert.match(source,/shaderPath=selectMaterialShaderPath\(rendererLabel\)/);
  assert.match(source,/shaderPath,phase:game\.time\.phase/);
  assert.match(source,/materialSpecular\(/,'hardware GGX path must remain present');
});
