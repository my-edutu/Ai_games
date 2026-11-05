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

test('already-fired physical enemy bolt after telegraph is witnessed without invented shooter attribution',()=>{
 const base=w(40,5,'imminent');
 const shot={id:'hostile:bolt',x:200000,y:300000,vx:9000,vy:0,
   coincidentNotAttributed:true};
 const real={...base,sourceGuardianTelegraph:false,sourceLiveEnemyBolt:shot,
   renderedLiveHostile:{sourceTick:40,projectileId:shot.id,instancedMarkers:4}};
 const r=assess([real,real]);
 assert.equal(r.sourceWitnessSamples,2,'repeated observation is still a source sample');
 assert.equal(r.sourceLiveEnemyBoltTicks,1,'same tick and projectile are unique');
 assert.equal(r.sourceLiveHazardOverlapTicks,1,'charging source shutter is present');
 assert.equal(r.sourceMatched3dLiveEnemyBoltTicks,1,'exact same source tick, ID and 3D instances');
 assert.equal(r.sourceMatched3dLiveHazardOverlapTicks,1);
 assert.equal(r.verdict,'NOT EVALUATED','telemetry is not an independent quality score');
});
test('rendered bolt from wrong tick/identity cannot manufacture current-source physical proof',()=>{
 const shot={id:'bolt',x:200000,y:300000,vx:9000,vy:0,
   coincidentNotAttributed:true};
 const candidate={...w(50,4,'imminent'),sourceLiveEnemyBolt:shot,
   renderedLiveHostile:{sourceTick:49,projectileId:shot.id,instancedMarkers:4}};
 const first=assess([candidate]);
 assert.equal(first.sourceLiveEnemyBoltTicks,1);
 assert.equal(first.sourceMatched3dLiveEnemyBoltTicks,0);
 const wrong={...candidate,renderedLiveHostile:{sourceTick:50,
   projectileId:'unrelated',instancedMarkers:4}};
 assert.equal(assess([wrong]).sourceMatched3dLiveEnemyBoltTicks,0);
 const invisible={...candidate,renderedLiveHostile:{sourceTick:50,
   projectileId:'bolt',instancedMarkers:0}};
 assert.equal(assess([invisible]).sourceMatched3dLiveEnemyBoltTicks,0);
 const invalid={...candidate,sourceLiveEnemyBolt:{...shot,
   coincidentNotAttributed:false}};
 assert.equal(assess([invalid]).sourceLiveEnemyBoltTicks,0);
 assert.equal(assess(null).sourceLiveEnemyBoltTicks,0);
});
