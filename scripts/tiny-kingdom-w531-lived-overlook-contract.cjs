'use strict';
// Phase-1 red/green source-level camera test. Run: node scripts/tiny-kingdom-w531-lived-overlook-contract.cjs
// Uses the production helpers unchanged against physically admitted mock
// views; never alters the actual saved/autonomous world.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const start=html.indexOf('// W531 Phase-1 integrated farm / granary');
const end=html.indexOf('function recoverGrowingTownSpectatorCamera(){',start);
assert(start>=0&&end>start,'W531 production overview helpers must exist');
const originalHomes=[[2,4,1],[4,7,0],[8,4,3]];
const makeContext=(width,physical)=>({
 FARMSTEAD:{fields:[[19,26,-1,4]],granary:[12,5]},
 canvas:{clientWidth:width},city:originalHomes.map(row=>row.slice()),
 people:[{name:'Real Farmer'},{name:'Actual Courier'}],
 freeCameraSightline:physical,Math,Number,Infinity
});
let probes=0;
const context=makeContext(1024,(view)=>{
 probes++;
 if(view.focus[0]===2&&view.focus[1]===4)
  return {clear:false};
 const market=view.focus[0]===0&&view.focus[1]===5;
 return {clear:true,screenOccupiedByBuildings:market?.26:.12,
  screenDominantBuilding:market?.06:.17,
  foregroundSceneCover:market?.18:.31};
});
const api=vm.runInNewContext(html.slice(start,end)+
 '({chooseLivedTownOverview,livedTownOverviewCost,getLivedTownOverviewAudit})',context);
const chosen=api.chooseLivedTownOverview(
 {yaw:.7,pitch:1.2,zoom:43,focus:[0,0]},[]);
assert(chosen,'at least one physically safe populated market view exists');
assert.equal(chosen.physicalDistrict,'receiving-market-and-street');
assert(chosen.pitch<.7,'human readable low-angle view');
assert(probes<=36,'bounded one-time world projection surveys');
assert.deepEqual(context.city,originalHomes,'real households are unchanged');
assert.equal(context.people.length,2,'no new or hidden worker');
assert.equal(api.getLivedTownOverviewAudit().selected,0,'pure choice does not claim gameplay');
const allBlocked=makeContext(390,()=>({clear:false}));
const absent=vm.runInNewContext(html.slice(start,end)+
 '({chooseLivedTownOverview})',allBlocked);
assert.equal(absent.chooseLivedTownOverview(
 {yaw:.7,pitch:1.2,zoom:43,focus:[0,0]},[]),null,
 'blocked mobile survey does not film through roofs');
assert.equal(api.livedTownOverviewCost(
 {clear:true,screenOccupiedByBuildings:.2,screenDominantBuilding:.8,
  foregroundSceneCover:.1},{pitch:.5,zoom:35},true),Infinity);
console.log('W531 real-town overview source and safety contract PASS');
