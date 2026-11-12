'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {classifyD04DynamicRendererPair,SOURCE}=require('../browser/dungeon-d04-dynamic-render-pair.cjs');

const scene=tick=>({run:1,floor:1,tick,checksum:'state-'+tick});
const manifest=()=>Array.from({length:6},(_,i)=>({
 stageIndex:i,scene:scene(i+2),hpLossCount:i===2?1:0
}));
const record=(mode,stageIndex,renderMs=20,overrides={})=>({
 source:SOURCE,mode,stageIndex,seed:'visual-room-art-18',
 viewport:{width:1440,height:900},frameId:stageIndex+10,
 scene:scene(stageIndex+2),camera:'tactical',focusedHeroId:'ranger',
 cameraPosition:{x:-2.5,y:23.5,z:-1.5},cameraAim:{x:-6,y:0,z:-6},
 postFX:'direct',softwareWebGL:true,renderMs,drawCalls:450,
 stageWallMs:50,vfxDrawCalls:mode==='d04'?6:null,
 vfxReservedInstances:mode==='d04'?104:null,...overrides
});
const make=()=>({
 expected:manifest(),
 legacy:Array.from({length:6},(_,i)=>record('legacy',i,20+i)),
 d04:Array.from({length:6},(_,i)=>record('d04',i,24+i))
});

test('matched real dynamic state transitions expose honest distribution and observed HP damage',()=>{
 const result=classifyD04DynamicRendererPair(make());
 assert.equal(result.status,'MATCHED_DYNAMIC_RENDER_DIAGNOSTIC_ONLY');
 assert.equal(result.matchedStages,6);
 assert.equal(result.hpLossStagesMatched,1);
 assert.equal(result.legacy.p50Ms,22);
 assert.equal(result.d04.p50Ms,26);
 assert.equal(result.paired.p50DeltaMs,4);
 assert.equal(result.causedByD04,null);
 assert.equal(result.sampleSynchronized,false);
});
test('missing or mismatched dynamic states cannot be paired by nearby tick',()=>{
 const data=make();
 data.d04[2].scene.checksum='other';
 data.d04.splice(3,1);
 const result=classifyD04DynamicRendererPair(data);
 assert.equal(result.matchedStages,4);
 assert.deepEqual(result.excludedStages,[2,3]);
 assert.equal(result.hpLossStagesMatched,0);
 assert.equal(result.status,'INSUFFICIENT_MATCHED_DYNAMIC_FRAMES');
 assert.equal(result.paired,null);
});
test('duplicate stage submissions cannot be cherry-picked for a favorable low render cost',()=>{
 const data=make();
 data.d04.push(record('d04',2,0.01,{frameId:100}));
 const result=classifyD04DynamicRendererPair(data);
 assert.equal(result.hpLossStagesMatched,0);
 assert.equal(result.status,'INSUFFICIENT_MATCHED_DYNAMIC_FRAMES');
 assert.deepEqual(result.excludedStages,[2]);
});
test('non-monotonic frame receipts and out-of-order stage indexes are not silently realigned',()=>{
 const data=make();
 data.d04[3].frameId=data.d04[2].frameId;
 data.legacy[4].stageIndex=5;
 const result=classifyD04DynamicRendererPair(data);
 assert.equal(result.status,'INSUFFICIENT_MATCHED_DYNAMIC_FRAMES');
 assert.ok(result.excludedStages.includes(3));
 assert.ok(result.excludedStages.includes(4));
});
test('camera mismatch, fabricated source and viewport mismatch remain explicit exclusions',()=>{
 const data=make();
 data.d04[0].cameraPosition.x+=10;
 data.d04[1].source='synthetic-control';
 data.d04[2].viewport.width=390;
 const result=classifyD04DynamicRendererPair(data);
 assert.equal(result.status,'INSUFFICIENT_MATCHED_DYNAMIC_FRAMES');
 assert.deepEqual(result.excludedStages,[0,1,2]);
});
test('a series with no actual HP decrease cannot claim it exercised combat impact',()=>{
 const data=make();
 data.expected.forEach(x=>x.hpLossCount=0);
 const result=classifyD04DynamicRendererPair(data);
 assert.equal(result.status,'INSUFFICIENT_DYNAMIC_AUTHORITY');
 assert.equal(result.paired,null);
});
test('VFX resource budget violations remain visible and prevent a diagnostic pass',()=>{
 const data=make();
 data.d04[2].vfxDrawCalls=8;
 data.d04[4].vfxReservedInstances=105;
 const result=classifyD04DynamicRendererPair(data);
 assert.equal(result.status,'D04_VISUAL_BUDGET_VIOLATION');
 assert.equal(result.budgetViolations.length,2);
 assert.equal(result.hpLossStagesMatched,1);
});
test('a genuine 2-second render stall is retained rather than trimmed or capped',()=>{
 const data=make();
 data.d04[2].renderMs=2050;
 const result=classifyD04DynamicRendererPair(data);
 assert.equal(result.status,'MATCHED_DYNAMIC_RENDER_DIAGNOSTIC_ONLY');
 assert.equal(result.d04.worstMs,2050);
 assert.equal(result.paired.worstPositiveDeltaMs,2028);
});
test('missing timing, impossible elapsed time and invalid epoch reject stage evidence',()=>{
 const data=make();
 data.d04[0].renderMs=null;
 data.d04[1].stageWallMs=-3;
 data.d04[2].scene.run=2;
 const result=classifyD04DynamicRendererPair(data);
 assert.equal(result.status,'INSUFFICIENT_MATCHED_DYNAMIC_FRAMES');
 assert.deepEqual(result.excludedStages,[0,1,2]);
});
