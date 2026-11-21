'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const moduleUnderTest=import('../../public/infinite-tower-climb/visuals/source-synchronized-horizon.mjs');
const source=Object.freeze({runToken:'real-guardian-episode',floor:9,theme:'void',
  lifecycle:'running',tick:512,player:{health:3}});
const earned=Object.freeze({sourceBound:true,runToken:source.runToken,sourceTick:512,
  firstBearingReturnedFrames:6,maxOldHorizonWeight:.02});
const original=Object.freeze({sourceBound:true,sourceTick:512,
  kind:'physically-supported-returned-old-and-new-shaft',oldWeight:.76});

test('RED native seam: a returned Void bearing cannot spend the old-room sky lease ahead of original source-owned steel',async()=>{
  const {sourceReturnedSkyLeaseMaxOld:step,sourceSynchronizedHorizonWeight:weight}=await moduleUnderTest;
  // Before the fix a valid five-plus-return destination certificate cooled
  // all global lighting to 2% Clockwork while the real gateway/roof remained
  // 76% Clockwork: one native-frame violet architectural replacement.
  const first=step(source,1,earned,original,1);
  assert.equal(first,.76);
  assert.equal(weight(source,1,first,original,earned),.76);
  const remaining={...original,oldWeight:.44};
  const second=step(source,first,{...earned,maxOldHorizonWeight:0},remaining,1);
  assert.equal(second,.44,'real material retirement permits monotonically cooler light');
  assert.equal(weight(source,1,second,remaining,earned),.44);
  assert.equal(step(source,second,earned,null,1),.02,
    'after the genuine old-room certificate disappears, the already returned Void can cool');
});

test('no new shade or revived bronze sky from false source receipts, unrelated runs, stale ticks or restarts',async()=>{
  const {sourceReturnedSkyLeaseMaxOld:step,sourceSynchronizedHorizonWeight:weight}=await moduleUnderTest;
  assert.equal(step(source,.12,earned,original,1),.12,'never rewarm already earned Void light');
  assert.equal(weight(source,1,.12,original,earned),.12);
  assert.equal(step(source,1,{...earned,sourceTick:511},original,1),1);
  assert.equal(step(source,1,{...earned,runToken:'other'},original,1),1);
  assert.equal(step({...source,runToken:'next-run'},1,earned,original,1),1);
  assert.equal(step({...source,floor:8},1,earned,original,1),1);
  assert.equal(step({...source,lifecycle:'outcome'},1,earned,original,1),1);
  assert.equal(step({...source,player:{health:0}},1,earned,original,1),1);
  assert.equal(step(source,1,{...earned,sourceBound:false},original,1),1);
  assert.equal(step(source,1,{...earned,firstBearingReturnedFrames:1},original,1),1);
  assert.equal(step(source,1,earned,{...original,sourceBound:false},1),.02);
  assert.equal(step(source,1,earned,{...original,kind:'HUD-floor9'},1),.02);
  assert.equal(step(source,1,earned,{...original,sourceTick:511},1),.02);
  assert.equal(step(source,1,earned,original,NaN),.02);
});

test('the renderer consumes the same scene-owned, source-bound lease for sky, fog and lights',()=>{
  const scene=fs.readFileSync('public/infinite-tower-climb/visuals/scene.mjs','utf8');
  assert.match(scene,/sourceReturnedSkyLeaseMaxOld\(\s*snapshot,earnedVoidSkyLease\.maxOldWeight,earnedVoidHorizon,\s*certifiedHorizon,oldWeightBeforeVoid\)/);
  assert.match(scene,/sourceSynchronizedHorizonWeight\(snapshot,\s*oldWeightBeforeVoid,earnedVoidSkyLease\.maxOldWeight,\s*certifiedHorizon,earnedVoidHorizon\)/);
  for(const witness of ['scene.fog.color.copy(to.fog).lerp(from.fog,oldWeight)',
    'skyMaterial.uniforms.top.value.copy(to.top).lerp(from.top,oldWeight)',
    'renderer.toneMappingExposure=LIGHTING.void.exposure+'])
    assert(scene.includes(witness),witness);
  assert.doesNotMatch(scene,/snapshot\.player\.(?:x|y|health|grounded)\s*=/);
});
