'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {summarizeTowerCrossfire:assess}=require('../../scripts/tower-crossfire-evidence.cjs');
const w=(tick,charge,kind)=>({
 runToken:'r',floor:8,tick,atMs:1000+50*tick,
 sourceHazards:[{id:'shutter',active:kind==='active',chargeTicksRemaining:charge}],
 renderedPressure:{sourceTick:tick,instances:16,
 crossfirePrewarnings:kind==='prelude'?1:0,
 crossfireWarnings:kind==='imminent'?1:0,
 activeHazards:kind==='active'?1:0}});
test('physical prelude/charge/impact telemetry never produces quality PASS',()=>{
 const r=assess([w(10,11,'prelude'),w(16,5,'imminent'),w(21,0,'active')]);
 assert.equal(r.sourceUniqueHazardTicks,3);
 assert.equal(r.fullSourcePhaseSequenceSeen,true);
 assert.equal(r.verdict,'NOT EVALUATED');
});
test('missing phase, duplicate tick and invalid source cannot manufacture a sequence',()=>{
 const a=w(10,11,'prelude'), invalid={...w(12,0,'active'),runToken:''};
 const r=assess([a,a,invalid]);
 assert.equal(r.sourceUniqueHazardTicks,1);
 assert.equal(r.fullSourcePhaseSequenceSeen,false);
 assert.equal(assess(null).sourceWitnessSamples,0);
});
test('a stale renderer tick never authenticates observed 3D action',()=>{
 const a=w(16,4,'imminent');a.renderedPressure.sourceTick=17;
 const r=assess([a]);
 assert.equal(r.sourcePhaseTicks.imminent,1);
 assert.equal(r.sourceMatched3dPhaseTicks.imminent,0);
});
