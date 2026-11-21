'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const entry=import(pathToFileURL(path.join(root,
  'public/infinite-tower-climb/visuals/world-surface.mjs')).href);
const source=p=>fs.readFileSync(path.join(root,
  'public/infinite-tower-climb/visuals/'+p),'utf8');
function assemble(shaderFn){
  const shader={uniforms:{},
    vertexShader:'#include <begin_vertex>',
    fragmentShader:'#include <color_fragment>\n#include <roughnessmap_fragment>\n#include <normal_fragment_maps>'};
  shaderFn(shader);
  return shader;
}
test('real low-tier F9 stone samples original texture once instead of triple axis plus derivative normal',async()=>{
  const {applyStoneSurface}=await entry;
  const asset={texture:{name:'original-stone'},available:{value:1}};
  const original={};
  const low={};
  applyStoneSurface(original,asset);
  applyStoneSurface(low,asset,{sampling:'economy',scale:.085,strength:.36,relief:.01});
  const full=assemble(original.onBeforeCompile),cheap=assemble(low.onBeforeCompile);
  assert.equal((full.fragmentShader.match(/texture2D\(towerStoneMap/g)||[]).length,3);
  assert.equal((cheap.fragmentShader.match(/texture2D\(towerStoneMap/g)||[]).length,1);
  assert.match(full.fragmentShader,/dFdx\(/);
  assert.doesNotMatch(cheap.fragmentShader,/dFdx\(/);
  assert.doesNotMatch(cheap.fragmentShader,/towerStoneNormal\(/);
  assert.match(cheap.fragmentShader,/roughnessFactor/);
  assert.match(cheap.fragmentShader,/towerStoneLuminance/);
  assert.match(cheap.vertexShader,/USE_INSTANCING/);
  assert.equal(cheap.uniforms.towerStoneMap.value,asset.texture);
  assert.equal(cheap.uniforms.towerStoneAvailable,asset.available);
  assert.notEqual(original.customProgramCacheKey(),low.customProgramCacheKey());
});
test('shipping only low Void and same low offscreen prewarm use the axial program',()=>{
  const world=source('world.mjs'),prewarm=source('void-program-prewarm.mjs');
  assert.match(world,/sampling:theme==='void' && quality==='low' \? 'economy':'triplanar'/);
  assert.match(prewarm,/sampling:view.quality==='low' \? 'economy':'triplanar'/);
  assert.match(world,/function weather\(m\)\{return applyStoneSurface/);
  assert.match(prewarm,/renderer\.compileAsync\(scratch, camera, liveScene\)/);
  assert.match(world,/observedOriginalClockworkSuccessorDeck/);
  assert.match(world,/retainedEarnedCap\?\.guardianGateRetained===true/);
  assert.doesNotMatch(world,/snapshot\.player\.(?:x|y|health|grounded)\s*=/);
});
