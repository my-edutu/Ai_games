'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const script=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script,'original running game source required');new Function(script);
const start=script.indexOf('function drainRenderTickBacklog('),
 end=script.indexOf('// W70: real WebGL GPU elapsed time',start);
assert.ok(start>0&&end>start,'actual fixed-step renderer required');
const ctx={FIXED_STEP:1/30,Number,Math,Error,
 performance:{now:()=>0},simulationCatchupToken:0,
 simulationCatchupQueued:false,swiftGpu:true,gpuAvailable:true,
 frozen:false,accumulator:0,speed:1,renderTicksExecuted:0,
 renderBacklogFrames:0,renderMaxPendingTicks:0,
 setTimeout:()=>{throw Error('must not schedule in isolated source test')}};
vm.createContext(ctx);vm.runInContext(script.slice(start,end),ctx,{timeout:2500});
const control=(debt,fn)=>ctx.drainRenderTickBacklog(debt,fn,64);
const limited=(debt,fn,budget,clock)=>ctx.drainRenderTickBacklogTimeboxed(debt,fn,64,budget,clock);
const STEP=ctx.FIXED_STEP;
{
 let time=0,ticks=0;
 const a=limited(STEP*80,()=>{ticks++;time+=4.5},16,()=>time);
 assert.equal(ticks,4,'long 390px simulation burst must yield promptly');
 assert.ok(a.remaining>STEP*75,'original owed authoritative ticks retained');
 assert.equal(a.hitBudget,true);
}
{
 let reference=STEP*90,cooperative=reference,base=[],observed=[],n=0;
 while(reference>=STEP){const r=control(reference,()=>base.push(base.length));assert.ok(r.executed);reference=r.remaining}
 while(cooperative>=STEP){
  let t=0;
  const r=limited(cooperative,()=>{observed.push(observed.length);t+=3},9,()=>t);
  assert.ok(r.executed>0,'heavy CPU must never lock up authoritative clock');
  cooperative=r.remaining;n++;assert.ok(n<96);
 }
 assert.deepEqual(observed,base,'same fixed ticks, same authoritative order');
 assert.ok(Math.abs(cooperative-reference)<1e-9,'no erased fixed-step debt');
}
{
 let t=0;const r=limited(STEP*40,()=>{t+=100},16,()=>t);
 assert.equal(r.executed,1,'always make one genuine simulation tick');
}
assert.throws(()=>limited(1,()=>{},0,()=>0),/budget/);
assert.throws(()=>limited(-1,()=>{},16,()=>0),/budget/);
assert.match(script,/if\(drained\.pendingTicks\)\{renderBacklogFrames\+\+;scheduleSoftwareDebtDrain\(\)\}/);
assert.match(script,/if\(frozen\)resetSoftwareDebtDrain\(\)/);
assert.match(script,/seed=83127;resetSoftwareDebtDrain\(\);accumulator=0/);
assert.match(script,/deliveryReceipts\.push\(\.\.\.q\.deliveryReceipts\);resetSoftwareDebtDrain\(\);accumulator=0/);
console.log('W320 actual fixed-step spine PASS: bounded frame work, 90 original earned ticks preserved in order, pause/reset cancellation; FPS/visual quality NOT PROVEN.');