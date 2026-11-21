'use strict';
// W245: test-first contract for a per-visible-field GPU budget that never
// culls real crops to disguise an over-budget scene. Read-only renderer only.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const match=html.match(/<script>([\s\S]*?)<\/script>/);
assert(match,'Expected the actual inline Tiny Kingdom game');
new vm.Script(match[1],{filename:'tiny-kingdom-original-game.js'});
const start=match[1].indexOf('function chooseBudgetedFarmPlotModes(');
assert(start>=0,'W245 source must select every original visible plot within a measured scene budget');
const end=match[1].indexOf('\nfunction disposeResidentFarmFields(',start);
assert(end>start,'W245 policy must precede original farm GPU lifetime');
const code=match[1].slice(start,end);
const choose=vm.runInNewContext(code+'\nchooseBudgetedFarmPlotModes',{});
const rows=[
 {plot:0,distance:10,wantsNear:true,nearTriangles:9000,farTriangles:6000,realWork:false},
 {plot:1,distance:13,wantsNear:true,nearTriangles:10000,farTriangles:6000,realWork:true}
];
const read=a=>JSON.parse(JSON.stringify(a));
let plan=read(choose(rows,16000));
assert.deepEqual(plan.modes,['far','near'],'The real worker retains its full planted detail ahead of an idle neighbour');
assert.equal(plan.totalTriangles,16000);
assert.equal(plan.minimumTriangles,12000);
assert.equal(plan.overBudget,false,'A premium must fit the actual available headroom');
plan=read(choose(rows,18000));
assert.deepEqual(plan.modes,['far','near']);
assert.equal(plan.totalTriangles,16000);
assert.equal(plan.overBudget,false);
plan=read(choose(rows,25000));
assert.deepEqual(plan.modes,['near','near']);
assert.equal(plan.totalTriangles,19000);
plan=read(choose(rows,11000));
assert.deepEqual(plan.modes,['far','far'],'Both authentic planted plots must remain visible even below minimum headroom');
assert.equal(plan.totalTriangles,12000);
assert.equal(plan.shortfall,1000);
assert.equal(plan.overBudget,true);
assert.deepEqual(read(choose([...rows].reverse(),18000)).modes,['near','far'],
 'Output must preserve the original visible plot order, not priority-sort geometry');
assert.throws(()=>choose([{...rows[0],nearTriangles:0}],16000),/invalid original plot/i);
assert.throws(()=>choose(rows,NaN),/invalid original field budget/i);
assert.match(match[1],/drawResidentFarmFields\(eye,planes,Math\.max\(0,160000-nonFieldTriangles\)\)/,
 'Rendering must use the actual current-frame NON-farm budget, not outdated LOD measurements');
assert.match(match[1],/farmFieldSceneBudgetAudit=\{/,'Record exact unhidden grow-town crop quality and budget overrun');
assert.match(match[1],/source:'real-complete-planted-farm-scene-budget'/,
 'Expose a read-only live farm budget audit for desktop, Day120, and 390px');
console.log('W245 focused RED/GREEN contract PASS: real worker detail first; every original plot kept; strict budget failures visible; original game parses. No WebGL/FPS claim.');
