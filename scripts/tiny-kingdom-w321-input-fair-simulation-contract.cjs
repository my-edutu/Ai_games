'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const script=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script,'running game script required');new Function(script);
const begin=script.indexOf('function drainRenderTickBacklog(');
const end=script.indexOf('// W70: real WebGL GPU elapsed time',begin);
assert.ok(begin>0&&end>begin,'real cooperative simulation spine required');
const ctx={FIXED_STEP:1/30,performance:{now:()=>0},Number,Math,Error,
 swiftGpu:true,gpuAvailable:true,dragging:false,streetHeld:new Set(),
 frozen:false,accumulator:0,simulationCatchupToken:0,simulationCatchupQueued:false,
 renderTicksExecuted:0,renderBacklogFrames:0,renderMaxPendingTicks:0,speed:1,
 setTimeout:()=>{throw Error('source test must not schedule real timers')}};
vm.createContext(ctx);vm.runInContext(script.slice(begin,end),ctx,{timeout:2500});
assert.equal(ctx.softwareCameraGestureActive(),false);
assert.equal(ctx.interactiveSimulationBudget(),16);
ctx.dragging=true;
assert.equal(ctx.softwareCameraGestureActive(),true);
assert.equal(ctx.interactiveSimulationBudget(),4);
ctx.dragging=false;ctx.streetHeld.add('ArrowUp');
assert.equal(ctx.interactiveSimulationBudget(),4);
ctx.streetHeld.clear();
const step=ctx.FIXED_STEP;
function drain(budget){
 let elapsed=0,n=0,debt=step*80;
 while(debt>=step){
  const run=ctx.drainRenderTickBacklogTimeboxed(debt,()=>{n++;elapsed+=3},64,budget,()=>elapsed);
  assert.ok(run.executed>0);debt=run.remaining;
  assert.ok(n<=80,'must not fabricate fixed steps');
 }
 return {n,debt};
}
const regular=drain(16),interactive=drain(4);
assert.equal(regular.n,80,'normal cooperative path preserves every tick');
assert.equal(interactive.n,80,'camera-active path preserves every tick');
assert.ok(Math.abs(regular.debt-interactive.debt)<1e-9);
let count=0,clock=0;
const gesture=ctx.drainRenderTickBacklogTimeboxed(step*50,()=>{count++;clock+=3},64,ctx.interactiveSimulationBudget(),()=>clock);
assert.equal(gesture.executed,6,'normal 16ms drain is unchanged');
ctx.dragging=true;count=0;clock=0;
const during=ctx.drainRenderTickBacklogTimeboxed(step*50,()=>{count++;clock+=3},64,ctx.interactiveSimulationBudget(),()=>clock);
assert.equal(during.executed,2,'camera gesture yields rather than consuming full 16ms');
assert.ok(during.remaining>gesture.remaining,'unused debt retained for later completion');
assert.match(script,/const softwareInteractive=\(swiftGpu\|\|!gpuAvailable\)&&softwareCameraGestureActive\(\)/);
assert.match(script,/SOFT_CAMERA_INPUT_SLICE_MS:SOFT_SIMULATION_SLICE_MS/);
assert.match(script,/const inputPriority=softwareCameraGestureActive\(\)/);
assert.match(script,/if\(drained.pendingTicks\)\{renderBacklogFrames\+\+;scheduleSoftwareDebtDrain\(\)\}/);
assert.match(script,/if\(frozen\)resetSoftwareDebtDrain\(\)/);
console.log('W321 actual-source PASS: 4ms input-aware software simulation vs ordinary 16ms; all earned fixed ticks retained; camera responsiveness and hardware FPS still NOT PROVEN.');
