'use strict';
// W389 Phase 1: the four EXISTING trades must connect physically to the real
// W388 receiving market, without adding actors, stock or a second GPU pass.
// This is a geometry/topology contract, NOT a subjective visual quality PASS.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const head=html.indexOf('function marketShopfrontThresholds(){');
const end=html.indexOf('function marketQuarter(){',head);
assert(head>=0&&end>head,'missing physical original shopfront entrances');
const market=html.slice(end,html.indexOf('/* The supplies on sale',end));
assert.match(market,/marketShopfrontThresholds\(\)/,
 'actual four shopfronts must share the original construction-dirty civic mesh');
const stallBegin=html.indexOf('const MARKET_STALLS=Object.freeze([');
const stallEnd=html.indexOf('// G103:',stallBegin);
assert(stallBegin>=0&&stallEnd>stallBegin,'expected original four authoritative stalls');
const stalls=vm.runInNewContext(html.slice(stallBegin,stallEnd)+'\nMARKET_STALLS');
assert.equal(stalls.length,4,'never create replacement or fictitious merchants');
const terrain=(x,z)=>.13*Math.sin(x*.32)*Math.cos(z*.24)+.015*Math.sin(z*.41+x*.17);
const data=[],faces=[],stats={};
const context={MARKET_STALLS:stalls,marketQuarterStats:stats,data,
 terrain,rgb:x=>x,MATERIAL:{STONE:4,ROAD:2},
 materialScope:(_,fn)=>fn(),quad:(a,b,c,d,tone)=>{
  assert([a,b,c,d].every(p=>p.length===3&&p.every(Number.isFinite)));
  faces.push({a,b,c,d,tone});
  for(let i=0;i<60;i++)data.push(0);
 }};
vm.createContext(context);
vm.runInContext(html.slice(head,end)+'\nmarketShopfrontThresholds();',context);
assert.equal(stats.shopfronts,4);
assert.equal(stats.flagstones,32);
assert.equal(stats.edgeStones,16);
assert.equal(stats.triangles,96);
assert.equal(data.length/30,stats.triangles);
assert.equal(faces.length,48);
assert.equal(stats.extraGpuBuffers,0);
assert.equal(stats.authorityModified,false);
assert.equal(stats.collisionsModified,false);
assert.equal(stats.inventedShops,0);
assert.equal(stats.inventedTransactions,0);
for(const f of faces){
 const v=[f.a,f.b,f.c,f.d];
 const cy=v.reduce((a,p)=>a+p[1],0)/4;
 const cx=v.reduce((a,p)=>a+p[0],0)/4;
 const cz=v.reduce((a,p)=>a+p[2],0)/4;
 assert(cy-terrain(cx,cz)>.03&&cy-terrain(cx,cz)<.15,
  'all four working shopfronts sit directly on original terrain');
 const ny=(f.b[2]-f.a[2])*(f.c[0]-f.a[0])-
          (f.b[0]-f.a[0])*(f.c[2]-f.a[2]);
 assert(ny>0,'market paving cannot disappear through backface culling');
 assert(Math.abs(cx+1)>1.4,
  'never obstruct the exact x=-1 genuine receiving courier corridor');
}
console.log('W389 original four-trade ground frontages PASS: '+JSON.stringify({
 shops:stats.shopfronts,flagstones:stats.flagstones,edgeStones:stats.edgeStones,
 triangles:stats.triangles,partOfExistingCivicVbo:true,visualGate:'NOT PROVEN'}));
