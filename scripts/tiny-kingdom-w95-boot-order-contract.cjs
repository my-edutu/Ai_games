'use strict';
// W95: startup-order safety; only the live browser can certify the actual frame.
// The current bundled game must initialize ALL top-level lexical bindings,
// camera instrumentation, render controls and worker economy before start().
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/);
assert(script,'Missing the original complete inline game');
const source=script[1];
new vm.Script(source,{filename:'tiny-kingdom-source.js'});
const boot=source.indexOf('queueMicrotask(start);const mat4multiply=');
const oldBoot=source.indexOf('start();const mat4multiply=');
const api=source.indexOf('window.__tinyKingdom=');
const render=source.indexOf('requestAnimationFrame(render);window.__tinyKingdom=');
const declaration=source.indexOf('let courierPostRepairCount=0,courierPostRepairLast=null;');
assert(boot>=0&&oldBoot<0,
 'The game must schedule start after inline script initialization (not synchronously)');
assert(declaration>=0&&declaration<boot,
 'The real courier camera repair state must be declared prior to startup');
assert(boot<render&&render<api,
 'Schedule boot before RAF registration; first game RAF sees initialized world');
assert(!source.includes('queueMicrotask(()=>start())'),
 'Keep direct, auditable once-only boot scheduling');
// Read-only safety: the fixed-step, jobs, trades and save/replay paths are intact.
for(const signature of ['function step(', 'function completeActualDelivery(',
 'function exportSnapshot(', 'function restoreSnapshot(', 'function render(now)']){
 assert(source.includes(signature),signature+' missing from original game');
}
console.log('W95 game startup-order source contract PASS; browser proof still required');
