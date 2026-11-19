'use strict';
/**
 * Session 03 RED-first contracts for a genuine SAME-TICK native rAF shoe pair.
 * All numbers below are synthetic contract fixtures, not after-change GLB
 * measurements, a floor plant, a hit, or a corrected animation.
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {auditOriginalSourceRafSolePair:pair}=require(
 '../browser/dungeon-session03-original-skin-pair.cjs');
const shoe=(x,z,yHeel,yToe)=>({
 heel:[x,yHeel,z],toe:[x,yToe,z+.15]
});
const sample=(over={})=>({
 actorId:'vanguard',sourceInstanceId:'licensed-original-GLB-clone',
 sourceClip:'Walking_A',sourceClipTime:.31,sourceClipDuration:1.04,
 sourceWeight:1,authorityTick:8,checksum:'a-real-public-checksum',
 frame:101,visible:true,timeMs:1000,rootWorld:[0,0,0],
 sourceWeaponGrip:{socketName:'handslotr',attachedToGripSocket:true},
 sourceSolePatchWorld:{
  left:shoe(-.16,-.2,-.022,-.022),
  right:shoe(.16,-.2,.19,-.09)
 },
 ...over
});
const next=()=>sample({
 frame:102,timeMs:1050,sourceClipTime:.36,rootWorld:[.003,0,0],
 sourceSolePatchWorld:{
  left:shoe(-.157,-.2,-.022,-.022),
  right:shoe(.158,-.2,.188,-.078)
 }
});
test('RED-first: original clone, next native frame, unchanged public tick and real four weighted shoes yield only diagnostic data',()=>{
 const r=pair({before:sample(),after:next(),floorTopY:-.02});
 assert.equal(r?.eligible,true);
 assert.equal(r.frameDelta,1);
 assert.ok(Math.abs(r.elapsedSeconds-.05)<1e-9);
 assert.ok(Math.abs(r.rootTravelMeters-.003)<1e-9);
 assert.ok(Math.abs(r.shoes.right.afterToeBurialMeters-.058)<1e-9);
 assert.ok(Math.abs(r.shoes.right.swingToeLiftMeters-.012)<1e-9);
 assert.ok(Math.abs(r.shoes.left.heelSlideRelativeToRootMeters)<1e-10);
 assert.equal(r.contactLocked,false);
 assert.equal(r.plantCertified,false,'two skinned samples alone cannot prove a legal foot plant');
});
test('RED-first: no pair across different source clones, public ticks, checksum, clips, weapon grips or unordered renderer frames',()=>{
 const invalid=[
  [{sourceInstanceId:'replaced-rig'},'different-source-instance'],
  [{authorityTick:9},'different-authority-tick'],
  [{checksum:'another-tick'},'different-authority-checksum'],
  [{sourceClip:'Idle'},'not-original-walking-source'],
  [{sourceWeight:.7},'unowned-source-walk'],
  [{frame:101},'not-consecutive-render-frame'],
  [{frame:108},'not-consecutive-render-frame'],
  [{sourceWeaponGrip:{attachedToGripSocket:false,socketName:'handslotr'}},'source-hand-grip-not-attached'],
  [{visible:false},'not-visible'],
  [{timeMs:1900},'invalid-render-interval'],
  [{sourceSolePatchWorld:{left:shoe(0,0,0,0),right:{toe:[0,0,0]}}},'invalid-original-skinned-shoes'],
  [{rootWorld:[NaN,0,0]},'invalid-source-root'],
  [{actorId:'another-actor'},'different-source-actor']
 ];
 for(const [change,reason] of invalid){
  const r=pair({before:sample(),after:{...next(),...change},floorTopY:-.02});
  assert.equal(r?.eligible,false,JSON.stringify(change));
  assert.equal(r?.reason,reason,JSON.stringify(change));
 }
});
test('RED-first: stationary, teleport-sized and reversed source-time samples cannot fabricate ground motion',()=>{
 const invalid=[
  [{rootWorld:[0,0,0]},'no-witnessed-root-travel'],
  [{rootWorld:[.7,0,0]},'discontinuous-source-root'],
  [{sourceClipTime:-.1},'invalid-source-clip-time']
 ];
 for(const [change,reason] of invalid){
  const r=pair({before:sample(),after:{...next(),...change},floorTopY:-.02});
  assert.equal(r?.eligible,false);
  assert.equal(r?.reason,reason);
 }
 assert.equal(pair({before:null,after:next(),floorTopY:-.02}).eligible,false);
 assert.equal(pair({before:sample(),after:null,floorTopY:-.02}).eligible,false);
});
