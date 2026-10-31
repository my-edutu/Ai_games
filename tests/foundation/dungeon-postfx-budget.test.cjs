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

test('optional bloom reduces its own offscreen workload after genuine slow render frames',async()=>{
 const {planPostFXBudget,adaptPostFXPixelCap}=await load();
 const full=850000;
 assert.equal(adaptPostFXPixelCap(full,28),full,'fast GPU keeps original fidelity cap');
 assert.equal(adaptPostFXPixelCap(full,0),full,'invalid or absent frame duration cannot downshift');
 const slow=adaptPostFXPixelCap(full,1800);
 assert.ok(slow>=180000&&slow<400000,'software-WebGL stall must substantially cut bloom work');
 const next=planPostFXBudget(1440,900,1.6,slow);
 assert.equal(next.maxPixels,slow);
 assert.ok(next.renderPixels>0&&next.renderPixels<=slow);
 assert.ok(adaptPostFXPixelCap(slow,1800)<slow,'repeated stalls should step down again');
 assert.equal(adaptPostFXPixelCap(180000,1800),180000,'minimum GPU texture budget is finite');
 assert.equal(adaptPostFXPixelCap(slow,20),slow,'recovery never causes resolution oscillation');
});
test('browser scene really measures expensive composer frames and applies downshift without misreporting bloom',()=>{
 const app=fs.readFileSync(path.join(__dirname,'../../public/ai-dungeon/app.js'),'utf8');
 assert.match(app,/adaptPostFXPixelCap/);
 assert.match(app,/postFXFrameStart\s*=\s*performance\.now\(\)/);
 assert.match(app,/composer\.render\(\)/);
 assert.match(app,/adaptPostFXPixelCap\(bloomPixelCap,performance\.now\(\)-postFXFrameStart\)/);
 assert.match(app,/planPostFXBudget\(w,h,renderer\.getPixelRatio\(\),bloomPixelCap\)/);
});

test('optional bloom bypasses persistent measured software-WebGL stalls but never disables a fast frame',async()=>{
 const {postFXStallAction}=await load();
 assert.deepEqual(postFXStallAction(24,2),{slowStreak:0,disable:false});
 assert.deepEqual(postFXStallAction(0,2),{slowStreak:0,disable:false});
 assert.deepEqual(postFXStallAction(NaN,2),{slowStreak:0,disable:false});
 assert.deepEqual(postFXStallAction(1800,0),{slowStreak:1,disable:false});
 assert.deepEqual(postFXStallAction(1800,1),{slowStreak:2,disable:true});
 assert.deepEqual(postFXStallAction(2900,0),{slowStreak:1,disable:true});
 assert.deepEqual(postFXStallAction(700,999999),{slowStreak:3,disable:true});
 for(const ms of [1,60,349,649,650])assert.equal(postFXStallAction(ms,0).disable,false);
 for(const ms of [-1,NaN,Infinity,-Infinity])assert.equal(postFXStallAction(ms,3).disable,false);
});
test('real WebGL renderer uses measured stall protection and exposes honest direct-3D fallback',()=>{
 const app=fs.readFileSync(path.join(__dirname,'../../public/ai-dungeon/app.js'),'utf8');
 assert.match(app,/postFXStallAction\(bloomRenderMs,bloomSlowStreak\)/);
 assert.match(app,/postFXStatus='performance-fallback'/);
 assert.match(app,/bloomAutoDisabled=true/);
 assert.match(app,/postFXEnabled=false/);
 assert.match(app,/postFXAutoDisabled:bloomAutoDisabled/);
});
