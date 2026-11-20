'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const load=import('../../public/infinite-tower-climb/visuals/frame-sightline-memo.mjs');

test('one exact real-camera triangle query reuses only within same World frame',async()=>{
 const {createFrameSightlineMemo}=await load;
 const memo=createFrameSightlineMemo(3);
 let triangleProbes=0;
 const probe=()=>({active:true,score:triangleProbes++===0?2:0,
   bodyBlockedRays:1,gatewayBlockedRays:0});
 memo.beginFrame();
 const first=memo.read('run|tick476|camera1,2,3',probe);
 const again=memo.read('run|tick476|camera1,2,3',probe);
 assert.deepEqual(again,first);
 assert.notStrictEqual(again,first,'result is independent of the saved ray');
 again.score=-1;
 assert.equal(memo.read('run|tick476|camera1,2,3',probe).score,2);
 assert.equal(triangleProbes,1);
 memo.beginFrame();
 assert.equal(memo.read('run|tick476|camera1,2,3',probe).score,0);
 assert.equal(triangleProbes,2);
});
test('new material owner state must invalidate even an identical camera within the frame',async()=>{
 const {createFrameSightlineMemo}=await load;
 const memo=createFrameSightlineMemo();
 let score=5,calls=0;
 const probe=()=>{calls++;return {active:true,score};};
 memo.beginFrame();
 assert.equal(memo.read('run|tick500|camera',probe).score,5);
 score=0;
 assert.equal(memo.read('run|tick500|camera',probe).score,5);
 memo.invalidate();
 assert.equal(memo.read('run|tick500|camera',probe).score,0);
 assert.equal(calls,2);
 assert.equal(memo.diagnostics().invalidations,1);
});
test('bounded memory and failed safety witnesses cannot become fabricated passes',async()=>{
 const {createFrameSightlineMemo}=await load;
 for(const invalid of [0,-1,65,1.1,NaN])
   assert.throws(()=>createFrameSightlineMemo(invalid),RangeError);
 const memo=createFrameSightlineMemo(2);
 memo.beginFrame();
 let calls=0;
 const probe=()=>{calls++;return null;};
 assert.equal(memo.read('a',probe),null);
 assert.equal(memo.read('a',probe),null);
 memo.read('b',probe);memo.read('c',probe);memo.read('c',probe);
 assert.equal(calls,4,'no eviction can grant imaginary clearance');
 assert.equal(memo.diagnostics().retainedEntries,2);
});
test('World invalidates physical ray results on every frame and post-camera material pass',()=>{
 const world=fs.readFileSync(require.resolve('../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
 assert.match(world,/successorSightlineMemo\.beginFrame\(\)/);
 assert.match(world,/successorSightlineMemo\.invalidate\(\)/);
 assert.match(world,/successorSightlineMemo\.read\(key,exactRayQuery\)/);
 assert.match(world,/held\.originalGatewayOpacity,held\.originalGallerySourceOpacity/);
 assert.match(world,/frameScopedSuccessorSightlineMemo:successorSightlineMemo\.diagnostics\(\)/);
});
