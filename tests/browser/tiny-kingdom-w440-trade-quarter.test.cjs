'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
function between(a,b){const x=html.indexOf(a),y=html.indexOf(b,x);assert.ok(x>=0&&y>x,'Production source missing '+a);return html.slice(x,y)}
test('W440: market-home 3D director uses only original finite occupied homes and trade center',()=>{
 const plan=new Function(between('function planRealMarketHomeDistrict(','function requestRealMarketHomeDistrict()')+';return planRealMarketHomeDistrict')();
 const homes=[[0,10,0],[-3,11,1],[1,12,0],[-4,9,0],[2,9,1],[-6,9,2],[3,8,0],[-24,-4,1],[16,-11,2]];
 const old=JSON.stringify(homes),market=[-1,10.2],p=plan(homes,market,390,844),desktop=plan(homes,market,1024,640);
 assert.equal(p.stage,'market-home-district');assert.equal(p.realHomes,9);assert.equal(p.districtHomeCount,3);
 assert.ok(p.inspectedHomeIndices.every(i=>i>=0&&i<7));assert.ok(p.zoom>=27&&p.zoom<=35);
 assert.ok(desktop.zoom>=20&&desktop.zoom<=30);assert.deepEqual(p.market,market);
 assert.equal(JSON.stringify(homes),old);assert.equal(p.newCitizens,0);
 assert.equal(p.newTransactions,0);assert.equal(p.newMeshes,0);assert.equal(p.authorityChanged,false);
 assert.throws(()=>plan([],market,390,844),/actual homes/);
 assert.throws(()=>plan([[NaN,1]],market,390,844),/finite actual homes/);
});
test('W440: existing mobile controls + actual physical sightline, not world state editing',()=>{
 assert.match(html,/id="camera-market-homes"/);
 assert.match(html,/aria-controls="camera-home camera-market-homes/);
 assert.match(html,/button\('camera-market-homes',requestRealMarketHomeDistrict\)/);
 assert.match(html,/case 'd':case 'D':requestRealMarketHomeDistrict\(\)/);
 assert.match(html,/getMarketHomeDistrictPlanAudit:/);
 const director=between('function requestRealMarketHomeDistrict(){','function requestSettlementOverview(){');
 assert.match(director,/safeFreeOrbit\(plan\.yaw,plan\.pitch,plan\.zoom,plan\.focus\)/);
 assert.match(director,/getActiveDeliveries\(\)/);
 assert.match(director,/deliveryReceipts\.filter/);
 assert.match(director,/freeCameraReturn/);
 assert.doesNotMatch(director,/(?:state\.food\s*[+*/-]?=|people\.push|city\.push|deliveryReceipts\.push|step\()/);
});
test('W442: a genuinely loaded food courier near real market joins occupied-homes camera without staging actors',()=>{
 const plan=new Function(between('function planRealMarketHomeDistrict(','function requestRealMarketHomeDistrict()')+';return planRealMarketHomeDistrict')();
 const homes=[[0,10,0],[-3,11,1],[1,12,0],[-4,9,0],[2,9,1],[14,3,0]];
 const market=[-1,10.2],baseline=plan(homes,market,390,844);
 const genuine={id:'fixture-original-1',citizen:'Real Worker',resource:'food',amount:2.5,stage:'unloading',x:7,z:10.1};
 const unrelated=[{...genuine,id:'wood-1',resource:'wood'},
  {...genuine,id:'remote-1',x:70,z:90},
  {...genuine,id:'empty',amount:0},
  {...genuine,id:'resting',stage:'resting'}];
 assert.equal(plan(homes,market,390,844,unrelated).observedLiveCargo,null);
 const original=JSON.stringify([homes,market,genuine]);
 const framed=plan(homes,market,390,844,[...unrelated,genuine]);
 assert.equal(framed.observedLiveCargo.id,genuine.id);
 assert.equal(framed.observedLiveCargo.citizen,genuine.citizen);
 assert.equal(framed.observedLiveCargo.stage,'unloading');
 assert.equal(framed.observedLiveCargoIsAuthoritative,true);
 assert.ok(framed.focus[0]>baseline.focus[0]);
 assert.ok(framed.zoom<=35&&framed.zoom>=27);
 assert.equal(framed.newCitizens,0);assert.equal(framed.newTransactions,0);
 assert.equal(JSON.stringify([homes,market,genuine]),original);
 assert.throws(()=>plan(homes,market,390,844,{}),/loads must be an array/);
 const source=between('function requestRealMarketHomeDistrict(){','function requestSettlementOverview(){');
 assert.match(source,/const loads=getActiveDeliveries\(\)/);
 assert.match(source,/canvas\.clientWidth,canvas\.clientHeight,loads/);
 assert.match(html,/#camera-tools\[data-expanded="false"\] > #camera-market-homes/);
});
