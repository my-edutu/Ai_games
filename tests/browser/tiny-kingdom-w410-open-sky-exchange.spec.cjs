'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const begin=html.indexOf('const EXCHANGE_CANOPY=Object.freeze(');
const end=html.indexOf('/* G095:',begin);
assert.ok(begin>=0&&end>begin,'real original market and physical collision source must exist');
const source=html.slice(begin,end);
function realExchange(){
 const ctx={terrain:()=>0,Math,Number};vm.createContext(ctx);
 vm.runInContext(source,ctx,{timeout:1500});
 return {canopy:vm.runInContext('EXCHANGE_CANOPY',ctx),volumes:ctx.physicalVillageExchangeVolumes()};
}
test('W410 RED -> GREEN: a real roofless trading aisle between two connected structural canopy wings',()=>{
 const {canopy,volumes}=realExchange();
 assert.ok(canopy.openSkyHalfWidth>=1.05&&canopy.openSkyHalfWidth<=1.4,
  'actual human-size central trade bay is sunlit and open to camera');
 assert.ok(canopy.supportX>canopy.openSkyHalfWidth+.45&&canopy.supportX<canopy.roofX);
 assert.ok(canopy.roofZ>canopy.supportZ&&canopy.roofX>=2.1);
 const posts=volumes.filter(v=>v.kind==='village-market-post');
 const roof=volumes.filter(v=>v.kind==='village-market'||v.kind==='village-market-roof');
 const counter=volumes.find(v=>v.kind==='village-market-counter');
 assert.equal(posts.length,4,'all four original LOAD-BEARING timber posts physically exist');
 assert.equal(roof.length,4,'both weather-cover wings have two real slope bands each');
 assert.ok(counter&&counter.rx*2>=2.3&&counter.rz*2<.85,
  'original central stone-footed weighing table stays at original coordinates');
 assert.ok(roof.every(v=>Math.abs(v.x)-v.rx>=canopy.openSkyHalfWidth-.07),
  'no rendering OR collision roof is permitted across the genuine center trade aisle');
 assert.ok(posts.every(v=>Math.abs(Math.abs(v.x)-canopy.supportX)<1e-8));
 assert.ok(volumes.every(v=>Number.isFinite(v.x)&&Number.isFinite(v.z)&&
  v.rx>0&&v.rz>0&&v.top>v.bottom));
});
test('W410 material structure is real sunlit split roof and lower original merchant counter, never hidden architecture or fake commerce',()=>{
 assert.match(source,/centralExchangeStats\.openSkyTradeWidthMetres=/);
 assert.match(source,/EXCHANGE_CANOPY\.openSkyHalfWidth/);
 assert.match(source,/renderOriginalMarketExchangeJoinery\(x,y,z\)/);
 assert.match(source,/centralExchangeStats\.originalPostsRetained=centralExchangeStats\.originalPostPositions===4/);
 assert.doesNotMatch(source,/\.style\.display\s*=|\.visible\s*=false/);
 assert.doesNotMatch(source,/Math\.random|state\.food\s*=|state\.gold\s*=|citizen\.activity\s*=/);
});