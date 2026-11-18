'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {pairOriginalSourceFrames}=require('../browser/dungeon-source-raf-pair.cjs');
const actor=(uuid='licensed-clone',mode='move')=>({id:'vanguard',kind:'vanguard',sourceInstanceId:uuid,
 mode,rootWorld:[0,0,0],sourceSolePatchWorld:{left:{heel:[0,0,0],toe:[0,0,.2]}}});
const f=(frame,tick=8,a=actor())=>({frame,tick,visible:true,actor:a});
test('genuine same-tick adjacent source frames preserve the original clone and browser index',()=>{
 const x=pairOriginalSourceFrames([f(10),f(11),f(12)],8,'vanguard');
 assert.equal(x.pairs.length,2);assert.deepEqual(x.pairs.map(p=>[p.beforeFrame,p.afterFrame]),[[10,11],[11,12]]);
 assert.ok(x.pairs.every(p=>p.before.sourceInstanceId==='licensed-clone'));
});
test('skipped frames, different tick, different imported rig, idle and invisibility cannot claim a witnessed move',()=>{
 const cases=[[[f(10),f(12)],'nonconsecutive-render-frame'],[[f(10),f(11,9)],'different-authority-tick'],
  [[f(10),f(11,8,actor('replacement'))],'different-original-source-rig'],
  [[f(10),f(11,8,actor('licensed-clone','idle'))],'not-witnessed-source-walk'],
  [[f(10),{...f(11),visible:false}],'not-visible'],
  [[f(10),f(10)],'nonconsecutive-render-frame']];
 for(const [frames,reason] of cases){const x=pairOriginalSourceFrames(frames,8,'vanguard');
  assert.equal(x.pairs.length,0);assert.equal(x.rejected[reason],1,reason);}
});
test('old untrusted multi-frame gaps cannot become ground-contact evidence',()=>{
 const x=pairOriginalSourceFrames([f(41),f(42),f(44),f(46)],8,'vanguard');
 assert.equal(x.pairs.length,1);assert.equal(x.rejected['nonconsecutive-render-frame'],2);
});
test('invalid samples fail closed without manufacturing an actor or event',()=>{
 for(const x of [null,[],42,{}])assert.equal(pairOriginalSourceFrames(x,8,'vanguard').pairs.length,0);
 assert.equal(pairOriginalSourceFrames([f(1),f(2)],-1,'vanguard').pairs.length,0);
 assert.equal(pairOriginalSourceFrames([f(1),f(2)],8,'').pairs.length,0);
});


// Original-GLB render cadence, not an encoded WebM packet frame rate.
// This contract must never treat held milestones, skipped native rAF frames,
// different source actors, or different authority ticks as fluid animation.
test('RED: real original source rAF cadence is measurable without inventing rendered frames',()=>{
 const {summarizeOriginalSourceRafCadence:measure}=
  require('../browser/dungeon-source-raf-pair.cjs');
 const s=(frame,ms,more={})=>({
  frame,tick:8,actorId:'vanguard',sourceClipName:'Walking_A',
  sourceInstanceId:'licensed-vanguard-1',
  visible:true,timeMs:ms,...more
 });
 const stable=measure([s(101,0),s(102,40),s(103,80),s(104,120)],8,'vanguard');
 assert.equal(stable.comparablePairs,3);
 assert.equal(stable.medianFrameGapMs,40);
 assert.equal(stable.p95FrameGapMs,40);
 assert.equal(stable.observedCallbackFps,25);
 assert.equal(stable.nativeMotionVerified,false,
  'even a true 25Hz screenshot cadence never certifies travelling soles or all six source rigs');
 assert.equal(stable.requestedCaptureFps,undefined,
  'MediaRecorder 24fps request is not true delivered WebGL animation evidence');
 const bad=measure([s(101,0),s(102,40,{tick:9}),
  s(105,100),s(106,105,{sourceInstanceId:'different-GLB'}),
  s(107,145,{visible:false}),s(108,180,{timeMs:NaN})],8,'vanguard');
 assert.equal(bad.comparablePairs,0);
 assert.ok(bad.rejectedPairs>=5);
 assert.equal(bad.observedCallbackFps,null);
 assert.equal(measure(null,8,'vanguard').comparablePairs,0);
});


test('RED: passive original rAF source ID must come from the live GLB binding, never copied from a prior audit',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const root=path.resolve(__dirname,'../..');
 const renderer=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const browser=fs.readFileSync(path.join(root,'tests/browser/dungeon-full-body-animation.spec.cjs'),'utf8');
 const binding=renderer.match(/sourceClipBindings:authored\.slice\(0,6\)\.map\(a=>\(\{[\s\S]*?\}\)\)/)?.[0]??'';
 assert.match(binding,/sourceInstanceId:a\.assetRoot\?\.uuid\?\?null/,
  'original source clone UUID must be read directly from each live source binding');
 const passive=browser.slice(browser.indexOf('async function captureOriginalPassiveRafCadence('),
  browser.indexOf('async function captureOriginalRafSourceFrames('));
 assert.match(passive,/sourceInstanceId:clip\?\.sourceInstanceId\?\?null/,
  'each observed rAF callback must use its own source binding UUID, never a pre-audit constant');
 assert.doesNotMatch(passive,/sourceInstanceId,\s*visible:/,
  'a copied source ID would fabricate same-clone evidence throughout the sample');
});
