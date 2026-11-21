'use strict';
// W204: exercise the SAME receipt-gated production market camera survey.
// This is a contract, not an independently judged running-game A/B.
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const open=html.indexOf('<script>'),close=html.indexOf('</script>',open);
assert(open>=0&&close>open,'actual game inline script is present');
new vm.Script(html.slice(open+8,close));
const start=html.indexOf('function projectMarketReceiptShelves(');
const end=html.indexOf('function chooseRealGrainHomeLens(home){',start);
assert(start>=0&&end>start,'the real physical two-shelf projector, witness and key invalidation are present');
const section=html.slice(start,end);
assert(section.includes('creditedAtUnloading===true')&&
 section.includes('row.resource===\'food\'')&&
 section.includes('row.job===\'farmer\''),
 'only a credited true food parcel owned by a real farmer can frame the market');
assert(section.includes('physicalFollowEyeClearance')&&
 section.includes('followRayBlockers')&&
 section.includes('foregroundSceneProjection')&&
 section.includes('foregroundVegetationProjection'),
 'the exact physical live market and canopy visibility is surveyed');
const valid={id:'grain:14',resource:'food',job:'farmer',
 citizen:'Bram',amount:3.024,creditedAtUnloading:true,time:204};
const ctx={
 physicalCameraProjection:()=>({tanHorizontal:.75,tanVertical:.59}),
 marketCourierPostSightline:()=>({centerCover:.02}),
 deliveryReceipts:[valid],FARM_MARKET_STREET_DESTINATION:[-1,10.2],
 terrain:()=>0,city:[[0,1,0],[1,2,1]],
 canvas:{clientWidth:390,clientHeight:844},
 followCameraRoofs:()=>[],
 physicalFollowEyeClearance:()=>({clear:true}),
 followRayBlockers:(eye)=>eye[0]>3?1:0,
 foregroundVegetationProjection:(eye)=>({
  cover:eye[2]>15?.34:.04,faceBlockers:0}),
 foregroundSceneProjection:(eye)=>({
  cover:eye[0]<-4?.43:.07,cargoCover:0}),
 grainJourney:{marketWitness:false,marketLens:null,marketAttempt:null},
 lastFollowShot:{stale:true},liveShotPlanCache:{stale:true}
};
vm.runInNewContext(section+'\nthis.W204={chooseRealMarketReceiptLens,marketReceiptLensKey,updateRealMarketReceiptWitness}',ctx);
const w=ctx.W204;
assert.equal(w.chooseRealMarketReceiptLens('no-such-receipt'),null,'no unrelated market scene');
const shot=w.chooseRealMarketReceiptLens('grain:14');
assert(shot,'one actual credited receipt has a physically clear candidate');
assert.equal(shot.receiptId,'grain:14');
assert(Math.abs(shot.anchor[0]+.075)<1e-9&&Math.abs(shot.anchor[1]-11.03)<1e-9,
 'the actual two receipt shelves, not the old courier navigation stop, are centered');
assert.equal(shot.source,'actual-receipt-original-market-two-shelf-physical-camera');
assert.equal(shot.authorityChanged,false);
assert(shot.clearShots>0&&shot.checkedShots<=108,'bounded physical survey');
assert.equal(shot.occludingRoofRays,0);
assert.equal(shot.visibleShelves,2,'the original physical storage shelves must BOTH be framed');
assert(shot.minHeightFraction>=.018,'both real shelves must be visually legible');
assert(shot.postCover<.25,'do not conceal the genuine stock behind market posts');
assert(shot.sceneCover<.34&&shot.canopyCover<.27,'original court is readable');
ctx.grainJourney.marketLens=null;
const plan={stage:'received',receiptId:'grain:14',
 hasActualReceipt:true,linkedToReceipt:true};
assert.equal(w.updateRealMarketReceiptWitness(plan),true);
assert.equal(ctx.grainJourney.marketLens.receiptId,'grain:14');
const prior=ctx.grainJourney.marketLens;
assert.equal(w.updateRealMarketReceiptWitness(plan),true);
assert.equal(ctx.grainJourney.marketLens,prior,'unchanged authority + world cannot replan on every video frame');
assert.equal(w.updateRealMarketReceiptWitness({...plan,stage:'provisioning'}),false,
 'a genuine household trade returns the camera to its real buyer');
assert.equal(ctx.grainJourney.marketLens,null);
assert.equal(w.updateRealMarketReceiptWitness({...plan,hasActualReceipt:false}),false,
 'a receipt without authoritative confirmation cannot produce market evidence');
ctx.deliveryReceipts[0]={...valid,creditedAtUnloading:false};
assert.equal(w.chooseRealMarketReceiptLens('grain:14'),null,
 'an uncredited or fabricated parcel must never open the market witness');
ctx.deliveryReceipts[0]=valid;
ctx.followRayBlockers=()=>2;
assert.equal(w.chooseRealMarketReceiptLens('grain:14'),null,
 'a physically blocked market must NEVER be filmed as a clear handoff');
assert(html.includes('updateRealMarketReceiptWitness(plan);'));
assert(html.includes('else if(market){')&&
 html.includes('grainJourney.marketLens?.receiptId===grainJourney.deliveryId'),
 'the actual renderer and camera target share the receipt-locked world lens');
assert(html.includes('marketReceiptSightline:plan?.stage===\'received\''));
ctx.followRayBlockers=()=>0;
ctx.marketCourierPostSightline=()=>({centerCover:.40});
assert.equal(w.chooseRealMarketReceiptLens('grain:14'),null,
 'all physical lens candidates obscured by real market posts must be rejected');
ctx.marketCourierPostSightline=()=>({centerCover:.02});
ctx.physicalCameraProjection=()=>({tanHorizontal:0,tanVertical:0});
assert.equal(w.chooseRealMarketReceiptLens('grain:14'),null,
 'zero or degenerate physical projection cannot fake visible receiving shelves');
console.log('W204 original receipt-gated two-shelf physical market camera PASS; no invented stock or occluded shots; hardware FPS and visual transformation NOT PROVEN.');
