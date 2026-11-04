'use strict';
// Crossfire source-camera contract: full-body playable actors must never be
// sacrificed to center an urgent shutter. These pure tests are not a full
// motion blind assessment or a supported-device frame-time measurement.
const test=require('node:test'), assert=require('node:assert/strict');
const path=require('node:path'), {pathToFileURL}=require('node:url');
const url=pathToFileURL(path.resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/action-staging.mjs')).href;
const loaded=import(url);
const base={
  aspect:390/844, actorBefore:[-.21,.08,0,.17],
  actorAfter:[-.25,.08,0,.17],
  guardianBefore:[.35,.09,0,.19],
  guardianAfter:[.32,.09,0,.19],
  hazardBefore:[.9,.1,0], hazardAfter:[.72,.1,0],
  actorCoreClear:true, guardianCoreClear:true, hazardCoreClear:true,
};
test('real near-shutter focus improvement is allowed with two fully legible bodies',async()=>{
  const {guardedCrossfireAimGain}=await loaded;
  assert.ok(guardedCrossfireAimGain(base)>.05);
  assert.ok(guardedCrossfireAimGain({...base,aspect:960/600})>.05);
  assert.equal(guardedCrossfireAimGain({...base,
    hazardBefore:[.62,.2,0]}),0,'already readable trap needs no camera nudge');
});
test('full climber helmet and boots, guardian and current landing always veto a bad nudge',async()=>{
  const {guardedCrossfireAimGain}=await loaded;
  assert.equal(guardedCrossfireAimGain({...base,
    actorAfter:[-.82,.08,0,.17]}),0,'cropped body');
  assert.equal(guardedCrossfireAimGain({...base,
    guardianAfter:[.35,.70,0,.2]}),0,'cropped guardian');
  assert.equal(guardedCrossfireAimGain({...base,
    landingBefore:[.2,.15,0], landingAfter:[.92,.15,0]}),0,
    'an airborne landing already on screen may not be traded away');
  assert.ok(guardedCrossfireAimGain({...base,
    landingBefore:[.2,.15,0],landingAfter:[.22,.15,0]})>0);
  assert.equal(guardedCrossfireAimGain({...base,actorCoreClear:false}),0);
  assert.equal(guardedCrossfireAimGain({...base,hazardCoreClear:false}),0);
  assert.equal(guardedCrossfireAimGain({...base,
    hazardAfter:[.72,.1,1.7]}),0,'behind camera or far clip');
});
test('no new camera cue from repeated, invalid, stale or non-improving snapshots',async()=>{
  const {guardedCrossfireAimGain}=await loaded;
  assert.equal(guardedCrossfireAimGain({...base,
    hazardAfter:base.hazardBefore}),0);
  assert.equal(guardedCrossfireAimGain({...base,
    hazardAfter:[.99,.1,0]}),0);
  assert.equal(guardedCrossfireAimGain({...base,
    actorAfter:[NaN,.1,0,.17]}),0);
  assert.equal(guardedCrossfireAimGain({...base,aspect:0}),0);
});
