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
