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
 marketStallProfile:i=>({structural:i<2,eave:[4.20,3.98,3.25,3.04][i],peak:[5.58,5.25,4.39,4.16][i]})
};
const plan=source.indexOf('function originalMarketOpenRearScreenPlan(');
const planEnd=source.indexOf('function marketStall(s,index)',plan);
assert(plan>=0&&planEnd>plan,"the running game's honest thin timber back-screen plan");
vm.runInNewContext(source.slice(plan,planEnd)+source.slice(start,end),
 context,{timeout:1000});
const boxes=context.physicalStreetLevelStallVolumes();
assert.equal(boxes.length,46,'four original traders, 20 open boards, 4 real upper gables, 4 artisan vents and original counters/lofts/signs');
assert(boxes.every(b=>Number.isFinite(b.x)&&Number.isFinite(b.z)&&
 b.rx>0&&b.rz>0&&b.top>b.bottom),'market camera bounds must all be physical');
const screens=boxes.filter(b=>b.kind==='market-stall-screen');
assert.equal(screens.length,20,'each of four original stalls now uses five real open rear boards');
for(const [i,stall] of stalls.entries()){
 const planRows=context.originalMarketOpenRearScreenPlan(stall);
 assert.equal(planRows.length,5);
 const visible=screens.filter(row=>Math.abs(row.z-(stall.z-stall.face*.84))<1e-8);
 assert.equal(visible.length,5);
 for(const slat of planRows)assert(visible.some(row=>
  Math.abs(row.x-slat.x)<1e-8&&Math.abs(row.rx-slat.width*.5)<1e-8&&
  Math.abs(row.bottom-slat.bottom)<1e-8&&Math.abs(row.top-slat.top)<1e-8),
  'camera must see the exact real boards, not a fabricated opaque wall');
 assert(planRows.reduce((sum,row)=>sum+row.width*(row.top-row.bottom),0)<1.06,
  'literal empty gaps must replace the previous giant solid rear plank');
}
const upper=boxes.filter(b=>b.kind==='market-stall-upper-wall');
assert.equal(upper.length,6,'two original enclosed upper tradehouses and four original artisan side walls');
const gables=boxes.filter(b=>b.kind==='market-stall-rear-gable');
const vents=boxes.filter(b=>b.kind==='market-stall-artisan-vent');
assert.equal(gables.length,4,'the four real upper plaster gables block camera rays');
assert.equal(vents.length,4,'the two existing artisan shops preserve four physical louvers');
for(const [i,stall] of stalls.entries()){
 const wall=gables[i],profile=context.marketStallProfile(i);
 assert.equal(wall.x,stall.x);
 assert(Math.abs(wall.z-(stall.z-stall.face*.855))<1e-9);
 assert(Math.abs(wall.bottom-1.67)<1e-9&&Math.abs(wall.top-(profile.peak-.085))<1e-9);
}
assert(source.includes('const a=[x-1.20,y+1.67,rear]'),
 'real market rear plaster must open above worker eye height');
assert(source.includes('openRearScreenPanels:0,openRearScreenGaps:0'),
 'new exact market-screen counters must never be NaN after cache rebuild');
assert(!source.includes('new FakeCitizen('));
assert(source.includes('bottom:194px!important;'), '390px compact Supply control cannot cover real work caption');
console.log('W314 source PASS: market panels physically open behind actual work; opaque plaster, vents, all original inventory preserved. Running comparison NOT PROVEN.');
