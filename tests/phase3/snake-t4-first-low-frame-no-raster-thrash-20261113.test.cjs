'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const src=fs.readFileSync(path.resolve(__dirname,'../../public/snake-stream/renderer.mjs'),'utf8');
const start='// BEGIN T4 FIRST-LOW-FRAME PLAN';
const end='// END T4 FIRST-LOW-FRAME PLAN';
function planner(){
  const begin=src.indexOf(start),finish=src.indexOf(end,begin+start.length);
  assert.ok(begin>=0&&finish>begin,'source-exact low-mode raster policy exists');
  const scope=vm.createContext({});
  vm.runInContext(src.slice(begin+start.length,finish).replace('export function ', 'function ')+'\nthis.plan=planInitialLowModeRaster;',scope,{timeout:1000});
  return scope.plan;
}
test('the original low-tier desktop uses its existing measured eventual 0.4 drawing buffer before any expensive live world/shadow/cache submissions',()=>{
  const plan=planner();
  assert.equal(plan({width:1878,height:1038,pixelRatio:0.75,quality:'low'}),0.4);
  assert.equal(plan({width:1878,height:1038,pixelRatio:0.4,quality:'low'}),0.4);
  assert.equal(plan({width:1878,height:1038,pixelRatio:0.3,quality:'low'}),0.3);
  const firstResize=src.slice(src.indexOf('function resize()'),src.indexOf('function applyQuality'));
  assert.match(firstResize,/planInitialLowModeRaster\(\{\s*width,\s*height,\s*pixelRatio: startupRatio,\s*quality\s*\}\)/);
  assert.ok(firstResize.indexOf('planInitialLowModeRaster(')<firstResize.indexOf('renderer.setSize(width, height, false)'));
  assert.match(src,/renderPresentation\(\);[\s\S]*?frameGate\.submitted\(\);/);
});
test('the low-tier first paint leaves useful phone and ordinary balanced full-quality images untouched',()=>{
  const plan=planner();
  for(const [width,height,ratio,quality] of [[390,844,1.5,'low'],[1280,720,0.75,'low'],[1878,1038,0.75,'balanced'],[1878,1038,1,'balanced'],[1878,1038,0.4,'balanced']]){
    assert.equal(plan({width,height,pixelRatio:ratio,quality}),ratio);
  }
  assert.equal(plan({width:NaN,height:1000,pixelRatio:1,quality:'low'}),1);
  assert.equal(plan({width:1878,height:1038,pixelRatio:Infinity,quality:'low'}),Infinity);
});
test('already-adapted low quality must not recreate all cache and shadow resources at the same raster',()=>{
  const section=src.slice(src.indexOf('function applyQuality('),src.indexOf('  applyQuality();'));
  assert.match(section,/const ratioChanged = Math\.abs\(renderer\.getPixelRatio\(\) - pixelRatio\) > 1e-5;/);
  assert.match(section,/if \(ratioChanged\) renderer\.setPixelRatio\(pixelRatio\);/);
  assert.match(section,/if \(!ratioChanged && !shadowChanged\) return;/);
  assert.ok(section.indexOf('if (!ratioChanged && !shadowChanged) return;')<section.indexOf('invalidateStaticCache()'));
  assert.match(src,/function draw\(frame, previousFrame, alpha, timestamp, settings = \{\}\)/);
});
