'use strict';
// W94 source guard for the real page error in failed matched browser
// evidence run 42173219539; source-only, never an FPS or LOOK/PLAY PASS.
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const inline=html.match(/<script>([\s\S]*?)<\/script>/);
assert(inline,'Expected original complete inline 3D game script');
new vm.Script(inline[1],{filename:'tiny-kingdom-inline-game.js'});
const source=inline[1];
const boot=source.indexOf('queueMicrotask(start);const mat4multiply=');
assert(!source.includes('start();const mat4multiply='),
 'Synchronous early start would expose later camera bindings to the TDZ');
const counter=source.indexOf('let courierPostRepairCount=0,courierPostRepairLast=null;');
assert(boot>=0&&counter>=0,'Missing the authentic game boot or courier camera repair counters');
assert(counter<boot,
 'Browser TDZ: courierPostRepairCount must be initialized before the deferred genuine game start()');
assert(source.includes('courierPostRepairCount=0;courierPostRepairLast=null;daybreakReturn=null'),
 'World reset must clear the camera repair state without changing simulation');
console.log('W94 startup SOURCE contract PASS (real browser tests still required)');
