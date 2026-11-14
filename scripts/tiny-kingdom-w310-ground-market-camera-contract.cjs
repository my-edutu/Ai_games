'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const start=source.indexOf('function physicalStreetLevelStallVolumes(){');
const end=source.indexOf('function followCameraRoofs(){',start);
assert(start>=0&&end>start,'W310 genuine street-level market camera model must exist');
assert(source.includes('roofs.push(...physicalStreetLevelStallVolumes());'),
 'existing physical camera must include all genuine trader counter/wooden screen bounds');
for(const kind of ['market-stall-counter','market-stall-screen','market-stall-upper-wall','market-stall-sign'])
 assert(source.includes("'"+kind+"'"),'missed actual rendered market foreground '+kind);
assert(source.includes('trueStreetLevelStallVolumes:'),
 'read-only physical camera audit must expose additional real bounds');
const stalls=[
 {x:-5.4,z:2.25,face:1},{x:4.45,z:2.95,face:1},
 {x:4.30,z:8.50,face:-1},{x:-5.75,z:8.70,face:-1}
];
const context={
 MARKET_STALLS:stalls,
 terrain:()=>0,
 marketStallProfile:i=>({structural:i<2,eave:[4.20,3.98,3.25,3.04][i]})
};
vm.runInNewContext(source.slice(start,end),context,{timeout:1000});
const boxes=context.physicalStreetLevelStallVolumes();
assert.equal(boxes.length,22,'4 real stalls require both counters, a rear screen, elevated wall(s) and the real sign');
assert(boxes.every(b=>Number.isFinite(b.x)&&Number.isFinite(b.z)&&
 b.rx>0&&b.rz>0&&b.top>b.bottom),'market camera bounds must all be physical');
const screens=boxes.filter(b=>b.kind==='market-stall-screen');
assert.equal(screens.length,4,'retain every original opaque lower trading screen');
for(const [i,stall] of stalls.entries()){
 const back=screens[i];
 assert.equal(back.x,stall.x);
 assert(Math.abs(back.z-(stall.z-stall.face*.84))<1e-8,
  'actual wooden rear panels follow authentic faces');
 assert(Math.abs(back.rx-1.225)<1e-8);
 assert(Math.abs(back.bottom-.17)<1e-8&&Math.abs(back.top-.84)<1e-8);
}
const upper=boxes.filter(b=>b.kind==='market-stall-upper-wall');
assert.equal(upper.length,6,'two original enclosed upper tradehouses and four original artisan side walls');
assert(!source.includes('new FakeCitizen('));
assert(source.includes('bottom:194px!important;'), '390px compact Supply control cannot cover real work caption');
console.log('W310 exact original market ground-level geometry and 390px workday composition source PASS; live-frame visibility remains separate.');
