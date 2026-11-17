const {test}=require('node:test');
const assert=require('node:assert/strict');
const mod=()=>import('../../public/ai-maze-escape/public-counter-moment.mjs');
const before={runToken:'r1',lifecycle:'running',tick:7,visibleCells:[72,91],
  threats:[{id:'threat-1',cell:91,lanternParried:false}]};
const after={...before,tick:8,visibleCells:[74,91],
  threats:[{id:'threat-1',cell:74,lanternParried:true}]};
test('earned counter from actual same-run PUBLIC tick, including real retreat cell',async()=>{
 const {publicGuardianCounterMoment,publicGuardianCounterHeld}=await mod();
 const m=publicGuardianCounterMoment(before,after);
 assert.deepEqual(m,{runToken:'r1',id:'threat-1',fromCell:91,cell:74,tick:8});
 assert.equal(publicGuardianCounterHeld({...m,until:2},after,1),true);
 assert.equal(publicGuardianCounterHeld({...m,until:2},after,2),false);
});
test('first-seen, replayed, skipped tick, different run cannot fabricate a parry',async()=>{
 const {publicGuardianCounterMoment:f}=await mod();
 assert.equal(f(null,after),null);
 assert.equal(f(after,after),null);
 assert.equal(f({...before,tick:6},after),null);
 assert.equal(f({...before,runToken:'older'},after),null);
 assert.equal(f({...before,threats:[]},after),null);
});
test('hidden old/new cell, anonymous guardian and terminal state reject cue',async()=>{
 const {publicGuardianCounterMoment:f,publicGuardianCounterHeld:h}=await mod();
 assert.equal(f({...before,visibleCells:[72]},after),null);
 assert.equal(f(before,{...after,visibleCells:[91]}),null);
 assert.equal(f(before,{...after,threats:[{cell:74,lanternParried:true}]}),null);
 assert.equal(f(before,{...after,lifecycle:'result'}),null);
 const m={...f(before,after),until:2};
 assert.equal(h(m,{...after,visibleCells:[91]},1),false);
 assert.equal(h(m,{...after,threats:[]},1),false);
 assert.equal(h(m,{...after,runToken:'r2'},1),false);
});
