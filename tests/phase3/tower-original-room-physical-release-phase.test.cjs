'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const load=()=>import('../../public/infinite-tower-climb/visuals/source-returned-original-gateway-exit.mjs');
const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
const roofY=cap.y+cap.height,exitX=cap.x+Math.floor(cap.width*.76),crossX=exitX+16200;
const ground={id:'f9:ground',x:0,y:cap.y,width:480000,height:12000};
const raised={id:'f9:p2',x:319000,y:roofY+75000,width:90000,height:12000};
function fixture(){
 const s={floor:9,theme:'void',lifecycle:'running',runToken:'physical-release',tick:510,
   worldWidth:480000,player:{health:4,x:342296,y:roofY+98000+14000,
     halfWidth:9000,halfHeight:14000,grounded:false,groundedPlatformId:null,
     state:'airborne',vy:420},
   platforms:[ground,raised],
   lastGuardianCrossing:{runToken:'physical-release',fromFloor:8,toFloor:9,
     sourceTick:475,cap,exitX,crossingX:crossX,
     guardian:{kind:'guardian',health:0,active:false}}};
 const h={runToken:s.runToken,floor:9,oldCapId:cap.id,oldCapX:cap.x,
   oldCapWidth:cap.width,thresholdX:exitX,oldRoofY:roofY,
   sourceTick:477,crossingTick:475,firstWorldRenderTick:477,
   guardianGateRetained:true,verifiedObservedFloorAdvance:true,
   observedCrossingX:crossX,observedCrossingY:roofY+14000,
   observedHalfWidth:9000,observedHalfHeight:14000,
   submittedFrames:20,visibleSeconds:1.45,originalGatewayOpacity:.95,
   originalGallerySourceOpacity:.4,opticalExitSubmitted:false,
   firstRouteClearanceReturnTick:null,routeClearanceReturnedFrames:0,
   routeClearanceReturnedSeconds:0};
 const j={floor:9,runToken:s.runToken,proof:'recorded-source-gateway',
   structureDeferred:true,sourceTick:477,structuralVisibleReturns:12,
   structuralVisibleSeconds:1.1};
 return {s,h,j};
}
test('authentic first raised flight retains the OLD gateway/room until returned real landing',async()=>{
 const {sourceReturnedOriginalDepartureProgress:progress,
   sourceReturnedOriginalGatewayOpacity:opacity}=await load();
 const {s,h,j}=fixture();
 const first=progress(s,h);
 assert.ok(first>.45&&first<=.65,`first in-flight hero must not erase bronze room: ${first}`);
 assert.ok(opacity(s,h,j,0,true)>.32,
   'real returned violet shaft cannot make original gate disappear before physical raised-route contact');
 assert.equal(progress({...s,runToken:'restart'},h),null);
 assert.equal(progress({...s,lastGuardianCrossing:{...s.lastGuardianCrossing,
   guardian:{kind:'guardian',active:true,health:1}}},h),null);
});
test('actual platform-supported raised contact is necessary but not sufficient; use real returned frames',async()=>{
 const {sourceReturnedOriginalDepartureProgress:progress,
   sourceReturnedOriginalRouteClearance:clearance,
   sourceReturnedOriginalGatewayOpacity:opacity}=await load();
 const {s,h,j}=fixture();
 const firstContact={...s,tick:525,player:{...s.player,x:342296,
   y:raised.y+raised.height+14000,grounded:true,
   groundedPlatformId:'f9:p2',state:'standing',vy:0}};
 assert.equal(clearance(firstContact,h)?.platformId,'f9:p2');
 assert.equal(clearance({...firstContact,platforms:[ground]},h),null);
 assert.equal(clearance({...firstContact,player:{...firstContact.player,
   groundedPlatformId:'f9:fictional'}},h),null);
 assert.ok(progress(firstContact,h)<=.65,
   'source-only landed packet cannot instantly retire a still-returned old gate');
 const returned={...h,firstRouteClearanceReturnTick:525,
   routeClearanceReturnedFrames:1,routeClearanceReturnedSeconds:.05};
 assert.ok(progress(firstContact,returned)<=.66);
 const earned={...returned,routeClearanceReturnedFrames:10,
   routeClearanceReturnedSeconds:.75};
 assert.equal(progress(firstContact,earned),1);
 assert.equal(opacity(firstContact,earned,j,0,true),0);
 const tampered={...earned,firstRouteClearanceReturnTick:700};
 assert.ok(progress(firstContact,tampered)<=.65,
   'future/foreign source epochs cannot use a completed clearance lease');
});
test('world stores milestone exclusively on a successful actual GPU return; old room remains bounded',()=>{
 const w=fs.readFileSync(require.resolve('../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
 assert.match(w,/sourceReturnedOriginalRouteClearance\(snapshot,held\)/);
 assert.match(w,/held\.routeClearanceReturnedFrames/);
 assert.match(w,/held\.routeClearanceReturnedSeconds/);
 assert.match(w,/sourceReturnedGatewayDisplayDt\(/);
 assert.match(w,/held\.submittedFrames>=30/);
});
