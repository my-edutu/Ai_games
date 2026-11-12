'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {classifyD04RendererPair}=require('../browser/dungeon-d04-render-cost-pair.cjs');

const frame=(mode,frameId,renderMs,overrides={})=>({
 source:'actual-DungeonRuntime-ThreeJS-postWebGL-diagnostics',
 mode,seed:'visual-room-art-18',viewport:{width:1440,height:900},
 frameId,scene:{run:1,floor:1,tick:4,checksum:'92c5595b'},
 camera:'tactical',focusedHeroId:'vanguard',
 cameraPosition:{x:2,y:7,z:9},cameraAim:{x:0,y:0,z:0},
 postFX:'direct',softwareWebGL:true,renderMs,drawCalls:100,...overrides
});
const pair=(legacy=[19,20,21],d04=[23,24,25])=>({
 legacy:legacy.map((ms,i)=>frame('legacy',i+2,ms)),
 d04:d04.map((ms,i)=>frame('d04',i+3,ms,{drawCalls:106}))
});
test('paired actual post-WebGL renderer measurements report diagnostic overhead, not proof of causation',()=>{
 const result=classifyD04RendererPair(pair());
 assert.equal(result.status,'MATCHED_RENDER_DIAGNOSTIC_ONLY');
 assert.equal(result.matchedFrames,3);
 assert.equal(result.legacy.p50Ms,20);
 assert.equal(result.d04.p50Ms,24);
 assert.equal(result.paired.p50DeltaMs,4);
 assert.equal(result.paired.p50DrawCallDelta,6);
 assert.equal(result.sampleSynchronized,false);
 assert.equal(result.causedByD04,null);
});
test('a checksum or camera discrepancy cannot produce a matched frame or a performance score',()=>{
 const data=pair();
 data.d04[0].scene.checksum='not-the-authoritative-snapshot';
 data.d04[1].cameraPosition.x+=4;
 data.d04[2].postFX='bloom';
 const result=classifyD04RendererPair(data);
 assert.equal(result.status,'INSUFFICIENT_MATCHED_RENDER_FRAMES');
 assert.equal(result.matchedFrames,0);
 assert.equal(result.legacy,null);
 assert.equal(result.d04,null);
 assert.equal(result.paired,null);
});
test('different viewport, source, software rendering mode or hero is not comparable',()=>{
 const data=pair();
 data.d04[0].viewport.width=390;
 data.d04[1].source='fabricated-scene';
 data.d04[2].softwareWebGL=false;
 assert.equal(classifyD04RendererPair(data).matchedFrames,0);
 data.d04[2].softwareWebGL=true;
 data.d04[2].focusedHeroId='wildshadow';
 assert.equal(classifyD04RendererPair(data).matchedFrames,0);
});
test('repeated/stale frame identities and negative or missing timings never count',()=>{
 const data=pair([19,20,21,22],[23,24,25,26]);
 data.legacy[2].frameId=data.legacy[1].frameId;
 data.d04[2].renderMs=-1;
 data.d04[3].renderMs=null;
 const result=classifyD04RendererPair(data);
 assert.equal(result.matchedFrames,2);
 assert.equal(result.status,'INSUFFICIENT_MATCHED_RENDER_FRAMES');
});
test('outliers and negative paired deltas remain visible rather than being clipped',()=>{
 const result=classifyD04RendererPair(pair([20,40,90],[25,39,190]));
 assert.equal(result.status,'MATCHED_RENDER_DIAGNOSTIC_ONLY');
 assert.equal(result.paired.worstPositiveDeltaMs,100);
 assert.equal(result.paired.p50DeltaMs,5);
 assert.equal(result.paired.minimumDeltaMs,-1);
 assert.equal(result.d04.worstMs,190);
});
test('empty, synthetic, and insufficient captures are explicitly unverified',()=>{
 assert.equal(classifyD04RendererPair({}).status,'INSUFFICIENT_MATCHED_RENDER_FRAMES');
 const data=pair([20,30],[25,35]);
 assert.equal(classifyD04RendererPair(data).status,'INSUFFICIENT_MATCHED_RENDER_FRAMES');
 data.legacy[0].source='synthetic-2d-canvas';
 assert.equal(classifyD04RendererPair(data).matchedFrames,1);
});
