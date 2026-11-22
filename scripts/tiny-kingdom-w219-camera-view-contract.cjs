'use strict';
// W219 Phase 1 RED-first: exact production helper must reuse immutable physical
// camera geometry across camera-only views, but immediately see REAL moving
// courier AABB changes, building growth and save/restore changes.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const first=html.indexOf('let cameraOcclusionViewKey=');
const last=html.indexOf('function getCameraArchitectureResidencyAudit()',first);
assert.ok(first>=0&&last>first,'RED: no bounded original camera-volume assembly');
const exact=html.slice(first,last);
const factory=new Function('realCourierCartCameraVolumes',
 exact+'\nreturn {plan:cameraOcclusionView,audit:()=>({builds:cameraOcclusionViewBuilds,reuses:cameraOcclusionViewReuses})};');
let realCarts=[];
const {plan,audit}=factory(()=>realCarts.map(row=>({...row})));
const staticHomes=[{kind:'home',x:-4,z:2,rx:1.5,rz:1.2,bottom:0,top:4.5}];
const initial=plan('home@1',staticHomes);
assert.equal(initial.length,1);
assert.deepEqual(initial[0],staticHomes[0]);
assert.strictEqual(plan('home@1',staticHomes),initial,'same genuine scene must keep exact indexed array identity');
assert.equal(audit().builds,1);assert.equal(audit().reuses,1);
realCarts=[{kind:'courier-cart',x:1,z:9,rx:.5,rz:.5,bottom:0,top:1,deliveryId:22}];
const loaded=plan('home@1',staticHomes);
assert.notStrictEqual(loaded,initial,'real loaded cart must invalidate view');
assert.equal(loaded.length,2);assert.equal(loaded[1].x,1);
assert.strictEqual(plan('home@1',staticHomes),loaded);
realCarts=[{...realCarts[0],x:1.25,z:8.75}];
const walked=plan('home@1',staticHomes);
assert.notStrictEqual(walked,loaded,'actual cart motion must not reuse stale physical volumes');
assert.equal(walked[1].x,1.25);
const growth=plan('home@2',[...staticHomes,{kind:'home',x:8,z:5,rx:2,rz:2,bottom:0,top:5}]);
assert.notStrictEqual(growth,walked,'real growth and restorable town must invalidate building volumes');
assert.equal(growth.length,3);
assert.equal(growth[1].x,8);
realCarts=[];
const unloaded=plan('home@2',[...staticHomes,{kind:'home',x:8,z:5,rx:2,rz:2,bottom:0,top:5}]);
assert.equal(unloaded.length,2,'unloaded freight cannot persist in camera occlusion');
assert.ok(audit().builds>=5&&audit().reuses>=2);
assert.match(html,/return cameraOcclusionView\(topology,cameraArchitectureResidentVolumes\)/,
 'both static fast path and true rebuild must use same retained assembly');
console.log('W219 PASS: exact helper has one bounded original-view buffer, motion-aware delivery invalidation, growth and unload preservation.');
