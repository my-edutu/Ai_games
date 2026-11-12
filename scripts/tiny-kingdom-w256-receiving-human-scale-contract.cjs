'use strict';
// The actual W255 market film frequently shows a counter and posts instead of
// the real courier's hands. Test the physical truth of a readable witness.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
function extract(name){
 const at=src.indexOf('function '+name+'(');
 assert(at>=0,'Missing original production '+name);
 const end=src.indexOf('\n}',at);
 assert(end>at,'Cannot extract production '+name);
 return src.slice(at,end+2);
}
const f=extract('realReceiptCameraFocus');
const world={Math,terrain:()=>.2,
 isMarketUnloading:p=>p.delivery?.stage==='unloading',
 getMarketParcelDeliveryPose:()=>({citizen:'Bram',escrowed:true,
  wrist:[-.48,1.15,10.2],citizenFacingRadians:2.2,
  parcels:[{contact:'wrist-to-dock',index:0,position:[-.75,.93,10.71]}]})};
vm.runInNewContext(f,world);
const actor={name:'Bram',x:-.75,z:10.10,
 delivery:{id:'Bram:32',resource:'food',stage:'unloading',escrowed:true}};
const genuine=world.realReceiptCameraFocus(actor);
assert(genuine&&genuine.contact==='wrist-to-dock'&&genuine.authorityModified===false);
assert.deepEqual(Array.from(genuine.parcelPosition),[-.75,.93,10.71],
 'Live market camera must have actual parcel, not a fictional target');
assert.deepEqual(Array.from(genuine.wristPosition),[-.48,1.15,10.2],
 'Unloading must expose the real animated wrist to camera visibility');
assert.equal(world.realReceiptCameraFocus({...actor,delivery:{...actor.delivery,stage:'travel'}}),null);
assert.equal(world.realReceiptCameraFocus({...actor,delivery:{...actor.delivery,escrowed:false}}),null);
const policy=extract('isReadableMarketHandoffShot');
const cx={};vm.runInNewContext(policy,cx);
const shot={blockers:0,eyeCollision:{clear:true},foregroundSceneCover:.11,
 foregroundCargoCover:.05,foregroundVegetationCover:.10,vegetationFaceBlockers:0,
 projectedWorkerHeightFraction:.26,marketPostSightline:{centerCover:.01}};
const framing={handBlockers:0,foregroundCitizenBlockers:0,blockedBodyRays:1,
 cameraProximityWarnings:0};
assert.equal(cx.isReadableMarketHandoffShot(shot,framing,true,false),true);
assert.equal(cx.isReadableMarketHandoffShot({...shot,blockers:1},framing,true,false),false);
assert.equal(cx.isReadableMarketHandoffShot(shot,{...framing,handBlockers:2},true,false),false);
assert.equal(cx.isReadableMarketHandoffShot({...shot,marketPostSightline:{centerCover:.18}},framing,true,false),false);
assert.equal(cx.isReadableMarketHandoffShot(shot,framing,false,false),false);
assert.match(src,/realMarketAim\?\[realMarketAim\.wristPosition,realMarketAim\.parcelPosition\]:\[\]/,
 'True receiving hands and sack must participate in real body/obstruction camera survey');
assert.match(src,/receivingBest\|\|clearHomewardBest/,
 'Real human-scale receiving camera must be considered in final selected physical view');
console.log('W256 PASS authentic worker-and-escrowed-parcel body rays, physically clear camera selection, no invented delivery');
