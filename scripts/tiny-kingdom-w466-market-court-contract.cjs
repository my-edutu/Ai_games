'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const begin=html.indexOf('function planOriginalMobileMarketArrival(');
const end=html.indexOf('function getOriginalMobileMarketArrivalAudit(){',begin);
assert(begin>0&&end>begin,'must test actual production camera');
const snippet=html.slice(begin,end);
const make=new Function('city','DELIVERY_MARKET','getActiveDeliveries','planRealMarketHomeDistrict','safeFreeOrbit','canvas','window',`
 let framesDrawn=0,yaw=.7,pitch=.88,zoom=56,focusPoint=[0,0],presentationEpoch=0,lastFrozenFrameKey='initial';
 let originalMobileArrivalAudit={attempted:false,applied:false};
 ${snippet}
 return {planOriginalMobileMarketArrival,applyOriginalMobileMarketArrival,
  getState:()=>({yaw,pitch,zoom,focusPoint,originalMobileArrivalAudit,presentationEpoch})};
`);
function fixture(orbit,width=390){
 const city=[[2,9,0],[7,7,1],[10,10,2],[9,14,1]],market={food:[-1,10]};
 const deliveries=[{citizen:'Real farmer',x:1,z:8,amount:2,id:'a',resource:'food',stage:'travel'}];
 const district=()=>({focus:[5,9],yaw:2.15,pitch:.94,zoom:35,realHomes:4,
  inspectedHomeLots:[[2,9],[7,7],[10,10]],inspectedHomeIndices:[0,1,2],
  observedLiveCargo:deliveries[0]});
 return {city,market,deliveries,g:make(city,market,()=>deliveries,district,orbit,
  {clientWidth:width,clientHeight:width===390?844:768},{})};
}
test('real mobile first frame anchors market AND nearest occupied threshold without touching authority',()=>{
 const {city,market,deliveries,g}=fixture((a,p,z,f)=>({yaw:a,pitch:p,zoom:z,focus:f.slice()}));
 const before=JSON.stringify({city,market,deliveries});
 const plan=g.planOriginalMobileMarketArrival(390,844);
 assert(plan.zoom>=16&&plan.zoom<=24,'near human-scale world focus');
 assert.deepEqual(plan.firstHome,[2,9]);
 assert(Math.hypot(plan.focus[0]-market.food[0],plan.focus[1]-market.food[1])<4);
 assert.equal(g.applyOriginalMobileMarketArrival(),true);
 const audit=g.getState().originalMobileArrivalAudit;
 assert.equal(audit.arrivalKind,'near-court');
 assert.equal(audit.visibleOccupiedHomeLots.length,3);
 assert.equal(audit.authoritativeChanges,false);
 assert.equal(JSON.stringify({city,market,deliveries}),before);
});
test('blocked market close-up never lies with unrelated last-clear camera',()=>{
 const wide=fixture((a,p,z,f)=>({
  yaw:a,pitch:p,zoom:z,focus:f[0]<2?[30,30]:f.slice()
 })).g;
 assert.equal(wide.applyOriginalMobileMarketArrival(),true);
 assert.equal(wide.getState().originalMobileArrivalAudit.arrivalKind,'wide-district-recovery');
 const blocked=fixture(()=>({yaw:0,pitch:0,zoom:20,focus:[30,30]})).g;
 assert.equal(blocked.applyOriginalMobileMarketArrival(),false);
 assert.equal(blocked.getState().zoom,56);
});
test('desktop and nonportrait view leave original village opening untouched',()=>{
 const {g}=fixture(()=>null,1024);
 assert.equal(g.planOriginalMobileMarketArrival(1024,768),null);
 assert.equal(g.applyOriginalMobileMarketArrival(),false);
});
