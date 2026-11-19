'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const begin=html.indexOf('function planOriginalMobileMarketArrival(');
const end=html.indexOf('function getOriginalMobileMarketArrivalAudit(){',begin);
assert(begin>0&&end>begin,'must test actual production camera');
const snippet=html.slice(begin,end);
const make=new Function(
 'city','DELIVERY_MARKET','getActiveDeliveries','planRealMarketHomeDistrict',
 'safeFreeOrbit','canvas','window','terrain','freeCameraSightline',
 'followCameraRoofs','followRayBlockers','physicalCameraProjection','people',
 'let framesDrawn=0,yaw=.7,pitch=.88,zoom=56,focusPoint=[0,0],presentationEpoch=0,lastFrozenFrameKey="initial",freeCameraLastClear=null;'+
 'let originalMobileArrivalAudit={attempted:false,applied:false,visibleOccupiedHomeLots:[]};'+
 snippet+
 'return {planOriginalMobileMarketArrival,applyOriginalMobileMarketArrival,getState:()=>({yaw,pitch,zoom,focusPoint,originalMobileArrivalAudit,presentationEpoch})};'
);
function fixture(mode='clear',width=390){
 const city=[[2,9,0],[7,7,1],[10,10,2]],market={food:[-1,10]};
 const deliveries=[{citizen:'Real farmer',x:1,z:8,amount:2,id:'a',resource:'food',stage:'travel'}];
 const people=[{name:'Real farmer',x:.5,z:9.5}];
 const district=()=>({focus:[5,9],yaw:2.15,pitch:.94,zoom:35,realHomes:3,
   inspectedHomeLots:[[2,9],[7,7],[10,10]],inspectedHomeIndices:[0,1,2],
   observedLiveCargo:deliveries[0]});
 const physical=view=>mode.startsWith('blocked')?{clear:false}:{
   clear:true,eye:[view.focus[0]+Math.sin(view.yaw)*Math.cos(view.pitch)*view.zoom,
     .25+Math.sin(view.pitch)*view.zoom,
     view.focus[1]+Math.cos(view.yaw)*Math.cos(view.pitch)*view.zoom],
   foregroundSceneCover:.1,dominantCover:.05};
 const orbit=(a,p,z,f)=>({yaw:a,pitch:p,zoom:z,
   focus:mode==='blocked-stale'?[30,30]:f.slice()});
 return {city,market,deliveries,people,
  g:make(city,market,()=>deliveries,district,orbit,
   {clientWidth:width,clientHeight:width===390?844:768},{},()=>0,
   physical,()=>[],()=>0,
   ()=>({tanHorizontal:.46,tanVertical:1.0}),people)};
}
test('actual projected market frame and original citizen replace roof-first mobile arrival',()=>{
 const {city,market,deliveries,people,g}=fixture();
 const before=JSON.stringify({city,market,deliveries,people});
 const plan=g.planOriginalMobileMarketArrival(390,844);
 assert(plan.zoom>=16&&plan.zoom<=24);
 assert.deepEqual(plan.firstHome,[2,9]);
 assert.equal(g.applyOriginalMobileMarketArrival(),true);
 const {originalMobileArrivalAudit:a,focusPoint,zoom}=g.getState();
 assert.equal(a.arrivalKind,'physically-scored-receiving-court');
 assert.equal(a.composition.source,'w470-original-physical-market-workday-composition');
 assert.equal(a.composition.physicallySurveyedAngles,14);
 assert(a.composition.safeMarketCompositions>0);
 assert.equal(a.composition.realMarketOnScreen,true);
 assert.equal(a.composition.actualCitizensInFrame,1);
 assert.equal(a.composition.actualCitizen,'Real farmer');
 assert(a.composition.actualCitizenScreenHeight>0);
 assert.equal(a.visibleOccupiedHomeLots.length,3);
 assert.equal(a.authoritativeChanges,false);
 assert(zoom<plan.zoom);
 assert.deepEqual(focusPoint,market.food);
 assert.equal(JSON.stringify({city,market,deliveries,people}),before);
});
test('physically blocked market uses original safe fallback without claiming visible actors',()=>{
 const {g}=fixture('blocked');
 assert.equal(g.applyOriginalMobileMarketArrival(),true);
 const a=g.getState().originalMobileArrivalAudit;
 assert.equal(a.arrivalKind,'safe-previous-district-fallback');
 assert.equal(a.composition.safeMarketCompositions,0);
 assert.equal(a.composition.realMarketOnScreen,false);
 assert.equal(a.composition.actualCitizensInFrame,0);
});
test('unrelated old last-clear eye is never accepted as physically safe market',()=>{
 const {g}=fixture('blocked-stale');
 assert.equal(g.applyOriginalMobileMarketArrival(),false);
 assert.equal(g.getState().zoom,56);
 assert.equal(g.getState().originalMobileArrivalAudit.applied,false);
});
test('desktop and nonportrait view leave original village opening untouched',()=>{
 const {g}=fixture('clear',1024);
 assert.equal(g.planOriginalMobileMarketArrival(1024,768),null);
 assert.equal(g.applyOriginalMobileMarketArrival(),false);
});
