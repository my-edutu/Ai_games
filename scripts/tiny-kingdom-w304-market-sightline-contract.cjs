#!/usr/bin/env node
'use strict';
// W304: actual original market entrance must frame the genuine grain handoff,
// never put a freestanding lintel across the physical courier sightline.
// Source-executed geometry gate; NOT equivalent-world A/B or GPU performance.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const script=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert(script,'playable original inline script absent');
new vm.Script(script,{filename:'living-valley.js'});
const from=html.indexOf('function marketQuarter(){');
const until=html.indexOf('/* The supplies on sale',from);
assert(from>0&&until>from,'original real market reconstruction missing');
const original=html.slice(from,until);
const gate={x:-1.35,z:13.25,postOffset:2.82,postWidth:.18,
 postHeight:3.62,beamHeight:3.48,beamWidth:5.84};
assert(html.includes('const MARKET_ENTRY_ARCH=Object.freeze('),
 'physical original market post contract must survive');
assert(html.includes("kind:'gateway'"),
 'physical camera must still see all genuine market uprights');
const boxes=[],beams=[],visited=[],data=[];
const mock={
 Math,data,MARKET_ENTRY_ARCH:gate,
 MARKET_STALLS:[{},{},{},{}],marketQuarterStats:{},
 MATERIAL:{STONE:1,WOOD:2,ROOF:3,PLASTER:4},rgb:n=>[n,n,n],
 terrain:()=>.12,materialScope:(_,fn)=>fn(),
 marketCobblestoneSquare:()=>visited.push('court'),
 marketStall:(_,i)=>visited.push('stall'+i),
 grainwardMarketRoofEdges:()=>visited.push('roof'),
 grainwardTradeArcade:()=>visited.push('arcade'),
 marketTimberCart:()=>visited.push('cart'),
 marketReceivingDock:()=>visited.push('receiving'),
 marketReceivingCourt:()=>visited.push('drains'),
 lantern:()=>{},
 box:(x,y,z,w,h,d)=>{assert([x,y,z,w,h,d].every(Number.isFinite));
  boxes.push({x,y,z,w,h,d});for(let i=0;i<360;i++)data.push(0);},
 limbSegment:(a,b,r)=>{assert([...a,...b,r].every(Number.isFinite));
  beams.push({a,b,r});for(let i=0;i<240;i++)data.push(0);}
};
vm.createContext(mock);
vm.runInContext(original+'\nmarketQuarter();',mock);
assert.deepEqual(visited,['court','stall0','stall1','stall2','stall3',
 'roof','arcade','cart','receiving','drains'],
 'same original complete merchant street and actual unloading market');
const atGate=boxes.filter(b=>Math.abs(b.z-gate.z)<.25);
const highCrossings=atGate.filter(b=>b.y>2.8&&b.w>3.5);
assert.equal(highCrossings.length,0,
 'original central freight witness must have open sky: no overhead crossbeam');
for(const side of [-1,1]){
 const x=gate.x+side*gate.postOffset;
 assert(atGate.some(b=>Math.abs(b.x-x)<.02&&
  Math.abs(b.w-gate.postWidth)<.01&&b.h>3.2),
  'retain BOTH exact original historic roadside posts for physical camera');
}
assert.equal(mock.marketQuarterStats.freightCrossBeams,0,
 'rendered source must certify zero bars above courier centerline');
assert.equal(mock.marketQuarterStats.openSkyFreightMarkers,2,
 'both original historic market-side architectural markers remain');
assert.equal(mock.marketQuarterStats.corridorClearWidth,
 gate.postOffset*2-gate.postWidth,
 'real original courier navigable clearance cannot narrow');
assert(mock.marketQuarterStats.totalTriangles>0&&
 mock.marketQuarterStats.totalTriangles<350,
 'standalone gateway geometry must remain bounded in existing civic buffer');
assert(!/people\.push\(|state\.(food|wood|gold)\s*[+\-]=|Math\.random\(/.test(original),
 'no invented market, stock, autonomous jobs or RNG');
console.log('W304 SOURCE PASS: authentic four-stall marketplace, original pair of genuine gateway posts, open-sky real grain courier sightline, no invented goods, bounded retained geometry. Running LOOK/FEEL/PLAY NOT PROVEN.');
