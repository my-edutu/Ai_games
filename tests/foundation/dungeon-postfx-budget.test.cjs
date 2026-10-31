'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=path.join(__dirname,'../../public/ai-dungeon/postfx-budget.js');
async function load(){return import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(source,'utf8')).toString('base64'))}
test('desktop cinematic pass never exceeds 850k offscreen pixels',async()=>{
 const {planPostFXBudget}=await load();
 for(const dpr of [1,1.25,1.6,2,3]){
  const b=planPostFXBudget(1440,900,dpr);
  assert.ok(b.renderPixels<=850000,JSON.stringify(b));
  assert.ok(b.pixelRatio>0&&b.pixelRatio<=dpr);
  assert.equal(b.width,1440);assert.equal(b.height,900);
 }
});
test('mobile, extreme and invalid resolutions remain finite, bounded and nonzero',async()=>{
 const {planPostFXBudget}=await load();
 for(const [w,h,dpr] of [[390,844,3],[3840,2160,2],[7680,4320,4],[0,0,0],[Number.NaN,-2,Infinity]]){
  const b=planPostFXBudget(w,h,dpr);
  assert.ok(b.renderPixels>=1&&b.renderPixels<=850000,JSON.stringify(b));
  assert.ok(Number.isFinite(b.pixelRatio)&&b.pixelRatio>0);
 }
});
test('postFX budget only depends on viewport geometry and scale',async()=>{
 const {planPostFXBudget}=await load();
 assert.deepEqual(planPostFXBudget(1440,900,1.6),planPostFXBudget(1440,900,1.6));
});
