'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
test('authentic 3-beat NOVA raises only source-backed carved floor; impact decays and reduced motion stays stable',async()=>{
 const source=fs.readFileSync('public/ai-dungeon/warden-tell-plan.js','utf8');
 const {planWardenTellStage,planWardenReliefBeat}=await import('data:text/javascript,'+encodeURIComponent(source));
 const beats=[3,2,1].map(turnsUntilImpact=>planWardenReliefBeat(planWardenTellStage({
  warning:true,shape:'NOVA',turnsUntilImpact
 })));
 assert.deepEqual(beats.map(b=>b.active),[true,true,true]);
 assert.ok(beats[0].lift<beats[1].lift&&beats[1].lift<beats[2].lift);
 assert.ok(beats[0].ember<beats[1].ember&&beats[1].ember<beats[2].ember);
 assert.ok(beats.every(b=>b.lift>0&&b.lift<=.06&&b.footprint>.90&&b.footprint<=1));
 const none=planWardenReliefBeat(planWardenTellStage(null));
 assert.equal(none.active,false);assert.equal(none.lift,0);
 const after=planWardenReliefBeat(planWardenTellStage(null),.36);
 const settled=planWardenReliefBeat(planWardenTellStage(null),.05);
 assert.ok(after.impact&&settled.impact&&after.lift>settled.lift);
 assert.equal(planWardenReliefBeat(planWardenTellStage(null),0).lift,0);
 const reduced=[3,2,1].map(turnsUntilImpact=>planWardenReliefBeat(planWardenTellStage({
  warning:true,shape:'NOVA',turnsUntilImpact
 },true),0,true));
 assert.ok(reduced.every(b=>b.lift===.018&&b.active));
 assert.equal(planWardenReliefBeat(planWardenTellStage(null),.25,true).lift,0);
 assert.equal(planWardenReliefBeat({warning:true,progress:Infinity}).active,false);
});
test('boss source relief remains authoritative, limited and never paints safe routes',()=>{
 const ritual=fs.readFileSync('public/ai-dungeon/warden-ritual.js','utf8');
 assert.match(ritual,/MAX_WARNING_TILES=48/);
 assert.match(ritual,/warning\.cells\.slice\(0,warningCount\)/);
 assert.match(ritual,/warningOffsets\[i\]=\{x:ox,z:oz\}/);
 assert.match(ritual,/marker\.position\.set\(ox,\.055\+stoneBeat\.lift,oz\)/);
 assert.match(ritual,/stoneBeat\.impact&&warningCount>0/);
 assert.match(ritual,/warningPerimeter\.count=warningBoundaryEdges/);
 assert.doesNotMatch(ritual,/Math\.random|game\.step\(/);
});
