const test = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const source = pathToFileURL(path.resolve(__dirname,'../../public/infinite-tower-climb/visuals/presented-phase-latch.mjs')).href;
const frame=(runToken,tick,floor,scene='normal')=>({snapshot:{runToken,tick,floor,lifecycle:scene,publicChecksum:`${runToken}-${tick}`},scene});
test('ordinary source floor waits for EXACT source-object Three.js submission',async()=>{
 const {createPresentedPhaseLatch}=await import(source); const latch=createPresentedPhaseLatch();
 const eight=frame('r',440,8),nine=frame('r',451,9);
 latch.accept(eight); assert.equal(latch.visible(),null);
 assert.equal(latch.submitted({...eight.snapshot}),null);
 assert.equal(latch.submitted(eight.snapshot),eight);
 latch.accept(nine); assert.equal(latch.visible(),eight);
 assert.equal(latch.submitted(eight.snapshot),null);
 assert.equal(latch.visible(),eight);
 assert.equal(latch.submitted(nine.snapshot),nine);
 assert.equal(latch.visible(),nine);
});
test('source frames skipped by software renderer cannot create fake HUD frames',async()=>{
 const {createPresentedPhaseLatch}=await import(source); const latch=createPresentedPhaseLatch();
 const a=frame('r',10,8),b=frame('r',12,8),c=frame('r',16,9);
 latch.accept(a);latch.accept(b);latch.accept(c);
 assert.equal(latch.submitted(a.snapshot),null);assert.equal(latch.submitted(b.snapshot),null);
 assert.equal(latch.submitted(c.snapshot),c);
 assert.equal(latch.diagnostics().supersededUnsubmitted,2);
});
test('authentic terminal source remains available without graphics and retained for new run',async()=>{
 const {createPresentedPhaseLatch}=await import(source); const latch=createPresentedPhaseLatch();
 const normal=frame('r',100,10),result=frame('r',120,10,'result'),next=frame('next',0,0);
 latch.accept(normal);latch.submitted(normal.snapshot);
 latch.accept(result);assert.equal(latch.immediate(result),result);
 assert.equal(latch.visible(),result);
 latch.accept(next);assert.equal(latch.visible(),result);
 latch.clear();assert.equal(latch.visible(),null);assert.equal(latch.pending(),false);
});
