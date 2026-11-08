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

test('software WebGL starts with direct rendering only for known CPU rasterizers',async()=>{
 const {isSoftwareWebGLRenderer}=await load();
 for(const name of [
  'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)',
  'Google SwiftShader',
  'llvmpipe (LLVM 18.1.8, 256 bits)',
  'Mesa softpipe',
  'Software Rasterizer'
 ])assert.equal(isSoftwareWebGLRenderer(name),true,name);
 for(const name of [
  'ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Direct3D11)',
  'Apple M3',
  'AMD Radeon RX 7600',
  'WebKit WebGL','',null,undefined,34
 ])assert.equal(isSoftwareWebGLRenderer(name),false,String(name));
});

test('running renderer avoids eager FX allocation on known software WebGL but keeps deliberate opt-in',()=>{
 const app=fs.readFileSync(path.join(__dirname,'../../public/ai-dungeon/app.js'),'utf8');
 assert.match(app,/isSoftwareWebGLRenderer\(webglRendererName\)/);
 assert.match(app,/postFXEnabled=!reduced&&!softwareWebGL/);
 assert.match(app,/if\(postFXEnabled\)initializePostFX\(\)/);
 assert.match(app,/if\(!composer\)initializePostFX\(\)/);
 assert.match(app,/softwareWebGL,/);
});


test('foreground frame-delivery sample keeps bounded, truthful p50/p95/p99 and worst gap',async()=>{
 const {createFrameIntervalProbe}=await load();
 const probe=createFrameIntervalProbe(5);
 for(const t of [0,16,32,48,1048,1064,1080])probe.observe(t);
 const s=probe.summary();
 assert.equal(s.sampleCount,5);
 assert.equal(s.capacity,5);
 assert.equal(s.p50Ms,16);
 assert.equal(s.p95Ms,1000);
 assert.equal(s.p99Ms,1000);
 assert.equal(s.worstMs,1000);
 assert.equal(s.slowFramesOver650Ms,1);
 for(let i=0;i<20;i++)probe.observe(1100+i*16);
 assert.equal(probe.summary().sampleCount,5,'long streams cannot grow the frame-history allocation');
 assert.equal(probe.summary().worstMs,16,'old stalls leave the rolling evidence window');
});

test('frame-delivery telemetry rejects invalid clocks and bounds huge suspension gaps',async()=>{
 const {createFrameIntervalProbe}=await load();
 const probe=createFrameIntervalProbe(4);
 for(const v of [NaN,Infinity,-1])probe.observe(v);
 assert.equal(probe.summary().sampleCount,0);
 probe.observe(0);probe.observe(16);probe.resetClock();
 probe.observe(500000);probe.observe(600001);
 const s=probe.summary();
 assert.equal(s.sampleCount,2,'tab visibility reset cannot invent a hidden-tab frame interval');
 assert.equal(s.worstMs,60000);
 assert.equal(s.clampedGaps,1);
 assert.ok(Object.values(s).every(Number.isFinite));
});

test('running Three.js spectator observes real animation frame delivery and exposes only read-only telemetry',()=>{
 const app=fs.readFileSync(path.join(__dirname,'../../public/ai-dungeon/app.js'),'utf8');
 assert.match(app,/createFrameIntervalProbe/);
 assert.match(app,/frameDeliveryProbe\.observe\(t\)/);
 assert.match(app,/frameDeliveryProbe\.summary\(\)/);
 assert.match(app,/frameDelivery:frameDeliveryReport/);
});

test('software direct 3D raster budget protects the live spectator without changing hardware quality',async()=>{
 const {planDirectRenderBudget}=await load();
 const slow=planDirectRenderBudget(1440,900,1.6,true,650000);
 assert.equal(slow.shadows,false);
 assert.ok(slow.renderPixels>0&&slow.renderPixels<=650000,JSON.stringify(slow));
 assert.ok(slow.pixelRatio>0&&slow.pixelRatio<1);
 const gpu=planDirectRenderBudget(1440,900,1.6,false,650000);
 assert.equal(gpu.shadows,true);
 assert.equal(gpu.pixelRatio,1.6,'do not degrade recognized hardware merely because CPU software fallback exists');
 const phone=planDirectRenderBudget(390,844,3,true,650000);
 assert.ok(phone.renderPixels<=650000);
 assert.ok(phone.pixelRatio<=1,'software mobile GPU must not multiply physical pixels by CSS DPR');
 for(const [w,h,dpr] of [[0,0,0],[-1,Infinity,NaN],[7680,4320,4]]){
  const b=planDirectRenderBudget(w,h,dpr,true,650000);
  assert.ok(b.renderPixels>=1&&b.renderPixels<=650000,JSON.stringify(b));
 }
});

test('measured direct 3D stall downshifts only bounded software framebuffer work',async()=>{
 const {adaptDirectRenderPixelCap}=await load();
 assert.deepEqual(adaptDirectRenderPixelCap(650000,16,0),{maxPixels:650000,slowStreak:0,downshift:false});
 assert.deepEqual(adaptDirectRenderPixelCap(650000,0,2),{maxPixels:650000,slowStreak:0,downshift:false});
 assert.deepEqual(adaptDirectRenderPixelCap(650000,NaN,2),{maxPixels:650000,slowStreak:0,downshift:false});
 assert.deepEqual(adaptDirectRenderPixelCap(650000,1200,0),{maxPixels:422000,slowStreak:1,downshift:true});
 assert.deepEqual(adaptDirectRenderPixelCap(650000,500,1),{maxPixels:650000,slowStreak:2,downshift:false});
 assert.deepEqual(adaptDirectRenderPixelCap(650000,500,2),{maxPixels:422000,slowStreak:3,downshift:true});
 assert.deepEqual(adaptDirectRenderPixelCap(200000,1500,3),{maxPixels:200000,slowStreak:3,downshift:false});
});

test('actual live WebGL renderer caps only CPU rasterization and reports real downshift evidence',()=>{
 const app=fs.readFileSync(path.join(__dirname,'../../public/ai-dungeon/app.js'),'utf8');
 assert.match(app,/planDirectRenderBudget\(/);
 assert.match(app,/renderer\.setPixelRatio\(directBudget\.pixelRatio\)/);
 assert.match(app,/renderer\.shadowMap\.enabled=directBudget\.shadows/);
 assert.match(app,/moon\.castShadow=directBudget\.shadows/);
 assert.match(app,/adaptDirectRenderPixelCap\(directRenderPixelCap,directRenderMs,directSlowStreak\)/);
 assert.match(app,/directRenderBudget:directBudget/);
 assert.match(app,/directDownshifts,/);
});


test('fractional software WebGL surface never repeatedly reallocates the same real backing buffer',async()=>{
 const {planRenderSurfaceUpdate:plan}=await load();
 const original={cssWidth:1440,cssHeight:832,pixelRatio:.736,
  appliedWidth:1440,appliedHeight:832,appliedPixelRatio:.736,backingWidth:1059,backingHeight:612};
 assert.equal(Math.round(1440*.736),1060,'old app incorrectly expects this width');
 assert.equal(Math.floor(1440*.736),1059,'WebGLRenderer uses floored backing dimensions');
 for(let i=0;i<1000;i++){
  const p=plan(original);assert.equal(p.valid,true);
  assert.equal(p.setSize,false);assert.equal(p.setPixelRatio,false);
  assert.equal(p.resizeComposer,false);assert.equal(p.updateProjection,false);
 }
});
test('mobile software DPR and hardware DPR preserve existing WebGL framebuffer sizes',async()=>{
 const {planRenderSurfaceUpdate:plan}=await load();
 for(const [w,h,dpr] of [[390,844,.779],[390,844,1],[1440,832,1.5]]){
  const p=plan({cssWidth:w,cssHeight:h,pixelRatio:dpr,appliedWidth:w,appliedHeight:h,
   appliedPixelRatio:dpr,backingWidth:Math.floor(w*dpr),backingHeight:Math.floor(h*dpr)});
  assert.equal(p.valid,true);assert.equal(p.setSize,false);assert.equal(p.resizeComposer,false);
 }
});
test('legitimate CSS resize updates canvas/composer/projection without extra DPR modification',async()=>{
 const {planRenderSurfaceUpdate:plan}=await load();
 const p=plan({cssWidth:390,cssHeight:844,pixelRatio:.779,appliedWidth:1440,
  appliedHeight:832,appliedPixelRatio:.779,backingWidth:1059,backingHeight:612});
 assert.equal(p.setSize,true);assert.equal(p.resizeComposer,true);
 assert.equal(p.updateProjection,true);assert.equal(p.setPixelRatio,false);
});
test('measured DPR downshift uses Three.js setPixelRatio instead of duplicate canvas setSize',async()=>{
 const {planRenderSurfaceUpdate:plan}=await load();
 const p=plan({cssWidth:1440,cssHeight:832,pixelRatio:.55,appliedWidth:1440,
  appliedHeight:832,appliedPixelRatio:.736,backingWidth:1059,backingHeight:612});
 assert.equal(p.setPixelRatio,true);assert.equal(p.setSize,false);
 assert.equal(p.resizeComposer,true);assert.equal(p.updateProjection,false);
});
test('unexpected WebGL buffer loss repairs canvas once and invalid sizes never resize',async()=>{
 const {planRenderSurfaceUpdate:plan}=await load();
 const p=plan({cssWidth:1440,cssHeight:832,pixelRatio:.736,appliedWidth:1440,
  appliedHeight:832,appliedPixelRatio:.736,backingWidth:1,backingHeight:1});
 assert.equal(p.setSize,true);assert.equal(p.resizeComposer,true);assert.equal(p.updateProjection,false);
 for(const bad of [{},{cssWidth:0,cssHeight:844,pixelRatio:1},
  {cssWidth:1440,cssHeight:NaN,pixelRatio:1},{cssWidth:1440,cssHeight:832,pixelRatio:Infinity}]){
  const o=plan(bad);assert.equal(o.valid,false);assert.equal(o.setSize,false);
  assert.equal(o.setPixelRatio,false);assert.equal(o.resizeComposer,false);
 }
});
test('actual world renderer uses surface mutation arbitration and exposes resize counts',()=>{
 const app=fs.readFileSync(path.join(__dirname,'../../public/ai-dungeon/app.js'),'utf8');
 assert.match(app,/planRenderSurfaceUpdate\(/);
 assert.match(app,/if\(surfaceUpdate\.setSize\)/);
 assert.match(app,/if\(surfaceUpdate\.updateProjection\)/);
 assert.match(app,/surfaceResizes:\{renderer:surfaceRendererResizes/);
 assert.doesNotMatch(app,/canvas\.width!==Math\.round\(w\*renderer\.getPixelRatio\(\)\)/);
});


test('software delivery governor retains full resolution on fast or isolated slow frames',async()=>{
 const {createSoftwareDeliveryBudgetGovernor}=await load(),gate=createSoftwareDeliveryBudgetGovernor();
 for(let i=0;i<120;i++){
  const d=gate.observe({intervalMs:16.7,renderMs:8,pixelCap:650000});
  assert.equal(d.maxPixels,650000);assert.equal(d.change,false);
 }
 for(const gap of [1600,1700,1800])
  assert.equal(gate.observe({intervalMs:gap,renderMs:10,pixelCap:650000}).maxPixels,650000);
});
test('four continuous real foreground stalls trial lower software pixels, six improved frames retain it',async()=>{
 const {createSoftwareDeliveryBudgetGovernor}=await load(),gate=createSoftwareDeliveryBudgetGovernor();
 let cap=650000,d;
 for(const gap of [1800,1900,1700,1800]){
  d=gate.observe({intervalMs:gap,renderMs:10,pixelCap:cap});cap=d.maxPixels;
 }
 assert.equal(cap,520000);assert.equal(d.status,'testing');
 for(let i=0;i<6;i++){d=gate.observe({intervalMs:900,renderMs:12,pixelCap:cap});cap=d.maxPixels;}
 assert.equal(d.status,'validated');assert.equal(cap,520000);
 assert.equal(gate.stats().successfulTrials,1);
});
test('unimproved software capture automatically restores image quality and never oscillates',async()=>{
 const {createSoftwareDeliveryBudgetGovernor}=await load(),gate=createSoftwareDeliveryBudgetGovernor();
 let cap=650000,d;
 for(let i=0;i<4;i++){d=gate.observe({intervalMs:1800,renderMs:10,pixelCap:cap});cap=d.maxPixels;}
 assert.equal(cap,520000);
 for(let i=0;i<6;i++){d=gate.observe({intervalMs:1850,renderMs:10,pixelCap:cap});cap=d.maxPixels;}
 assert.equal(d.status,'restored');assert.equal(cap,650000);
 for(let i=0;i<40;i++){d=gate.observe({intervalMs:2000,renderMs:10,pixelCap:cap});cap=d.maxPixels;}
 assert.equal(cap,650000);assert.equal(d.status,'locked');
 assert.equal(gate.stats().rejectedTrials,1);
});
test('hidden, invalid and synchronous render-bound events are not delivery optimization evidence',async()=>{
 const {createSoftwareDeliveryBudgetGovernor}=await load(),gate=createSoftwareDeliveryBudgetGovernor();
 for(let i=0;i<3;i++)gate.observe({intervalMs:1800,renderMs:10,pixelCap:650000});
 assert.equal(gate.observe({intervalMs:30000,renderMs:10,pixelCap:650000,visible:false}).status,'hidden');
 for(let i=0;i<2;i++)assert.equal(gate.observe({intervalMs:1800,renderMs:10,pixelCap:650000}).change,false);
 assert.equal(gate.observe({intervalMs:3000,renderMs:700,pixelCap:650000}).status,'render-bound');
 assert.equal(gate.observe({intervalMs:NaN,renderMs:10,pixelCap:650000}).status,'invalid');
 gate.reset();assert.equal(gate.stats().trialActive,false);
});


test('aborted software capture trial restores true image quality when synchronous drawing becomes slow',async()=>{
 const {createSoftwareDeliveryBudgetGovernor}=await load(),gate=createSoftwareDeliveryBudgetGovernor();
 let cap=650000,d;
 for(let i=0;i<4;i++){d=gate.observe({intervalMs:1800,renderMs:12,pixelCap:cap});cap=d.maxPixels}
 assert.equal(cap,520000,'four genuine RAF gaps begin one bounded trial');
 d=gate.observe({intervalMs:2100,renderMs:470,pixelCap:cap});
 assert.equal(d.maxPixels,650000,'an unvalidated trial must never strand visual degradation');
 assert.equal(d.change,true);assert.equal(d.status,'restored');
 assert.equal(gate.stats().trialActive,false);
 assert.equal(gate.stats().rejectedTrials,1);
});
test('tab suspension aborts unverified software resolution trial instead of resuming indefinitely degraded',async()=>{
 const {createSoftwareDeliveryBudgetGovernor}=await load(),gate=createSoftwareDeliveryBudgetGovernor();
 let cap=650000;
 for(let i=0;i<4;i++)cap=gate.observe({intervalMs:1800,renderMs:12,pixelCap:cap}).maxPixels;
 const d=gate.observe({intervalMs:8000,renderMs:8,pixelCap:cap,visible:false});
 assert.equal(d.maxPixels,650000);assert.equal(d.change,true);
 assert.equal(gate.stats().trialActive,false);
});
test('invalid benchmark evidence aborts unverified quality reduction and does not fabricate success',async()=>{
 const {createSoftwareDeliveryBudgetGovernor}=await load(),gate=createSoftwareDeliveryBudgetGovernor();
 let cap=650000;
 for(let i=0;i<4;i++)cap=gate.observe({intervalMs:1800,renderMs:12,pixelCap:cap}).maxPixels;
 const d=gate.observe({intervalMs:NaN,renderMs:8,pixelCap:cap});
 assert.equal(d.maxPixels,650000);assert.equal(d.change,true);
 assert.equal(gate.stats().successfulTrials,0);assert.equal(gate.stats().rejectedTrials,1);
});
test('viewport reset restores original cap only for unverified trial, not accepted or unrelated software budget',async()=>{
 const {createSoftwareDeliveryBudgetGovernor}=await load();
 const gate=createSoftwareDeliveryBudgetGovernor();
 assert.equal(gate.reset(),null,'no active trial cannot inject arbitrary resolution');
 let cap=650000;
 for(let i=0;i<4;i++)cap=gate.observe({intervalMs:1800,renderMs:12,pixelCap:cap}).maxPixels;
 assert.equal(cap,520000);
 assert.equal(gate.reset(),650000);
 assert.equal(gate.stats().trialActive,false);
 assert.equal(gate.reset(),null);
});
