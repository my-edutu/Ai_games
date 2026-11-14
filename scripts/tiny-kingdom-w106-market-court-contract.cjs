'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(script,'complete playable game script');
new vm.Script(script[1],{filename:'tiny-kingdom-inline-game.js'});
const between=(start,end)=>{
 const a=html.indexOf(start),b=html.indexOf(end,a);
 assert.ok(a>=0&&b>a,'expected contiguous game function: '+start);
 return html.slice(a,b);
};
const square=between('function marketCobblestoneSquare(){','function marketTimberCart(');
const court=between('function marketReceivingCourt(){','// W87: the SAME four real market stalls');
const exchange=between('// W106 continue the SAME market economy','/* G095: central market');
// W207 retains the original same-seed, walkable public court while converting
// the uniform rectangle grid into separated, irregular clay-and-stone setts.
assert.match(square,/w208-natural-clay-market-and-freight-wagonway/);
assert.match(square,/marketWheelPassages/);
assert.match(square,/marketDrainSegments/);
assert.match(court,/receivingDrainSegments/);
assert.match(exchange,/w106-original-open-timber-weighing-exchange/);
assert.doesNotMatch(exchange,/const tent=/);
assert.doesNotMatch(exchange,/for\(let i=0;i<4;i\+\+\)/);
assert.match(html,/getCentralExchangeAudit:.*centralExchangeStats/);
assert.match(html,/farmMarketStreet\(\)/);
assert.match(html,/marketToRealHomeStreet\(\)/);
const points=[],data=[],stats={pavingStones:0,mortarTriangles:0,entryPathStones:0};
const append=(positions,triangles)=>{
 for(const q of positions){
  assert.equal(q.length,3);
  assert.ok(q.every(Number.isFinite),'finite ground geometry');
  points.push(q);
 }
 for(let i=0;i<triangles*30;i++)data.push(0);
};
const terrain=(x,z)=>.13*Math.sin(x*.32)*Math.cos(z*.24);
const random=x=>{const f=Math.sin(x*12.9898)*43758.5453;return f-Math.floor(f);};
// W166 isolated market-ground test: the real W158 freight node is verified
// separately. Do not require its world/navigation dependencies in this
// geometry-only scope, nor claim the stub proves the transfer aisle.
const transferSites=[];
const context={grainwardTransferNode:site=>{
 assert.equal(site,'market');transferSites.push(site);
 return {site,source:'external-real-freight-node-tested-separately',triangles:0};
},data,MARKET_SQUARE:{cx:-1,cz:4.9,rx:7.55,rz:7.05},
 terrain,biomeHash:random,rgb:n=>n,marketQuarterStats:stats,
 materialScope:(_,fn)=>fn(),MATERIAL:{ROAD:3},
 tri:(a,b,c)=>append([a,b,c],1),quad:(a,b,c,d)=>append([a,b,c,d],2)};
vm.createContext(context);
vm.runInContext(square+'\n'+court+'\nmarketCobblestoneSquare();marketReceivingCourt();',context);
assert.deepEqual(transferSites,['market'],'receiving court calls one actual independent transfer node');
assert.ok(stats.pavingStones>=90&&stats.pavingStones<=165,'irregular stones over real uncluttered clay');
// W129 replaces the unsafe 64 long radial slices with 224 short terrain-conforming faces.
// Retain the original strict <900-triangle floor/receiving-court cap below.
assert.equal(stats.mortarTriangles,224);
assert.equal(stats.entryPathStones,42);
assert.equal(stats.marketWheelPassages,22);
assert.equal(stats.marketDrainSegments,22);
assert.equal(stats.receivingDrainSegments,14);
assert.equal(stats.surfaceTriangles+stats.receivingCourtTriangles,data.length/30);
assert.ok(points.every(p=>p[1]<.30&&p[1]>-.30),'public court must remain ground level');
assert.ok(data.length/30<900,'market-ground geometry budget');
// RED: the first W106 west clay plane was wound downwards and therefore
// invisible from the actual top-down game camera with BACK culling enabled.
// GREEN: west reverses vertex order, east stays unchanged; roof is visible
// from above on both real sides, without double-sided GPU overdraw.
assert.match(exchange,/if\(side<0\)quad\(edge1,ridge1,ridge0,edge0,tone\)/);
assert.match(exchange,/else quad\(edge0,ridge0,ridge1,edge1,tone\)/);
function roofUpNormal(side,reverse){
 const e0=[side*1.58,2.35,-1.16],r0=[0,3.14,-1.16],
  r1=[0,3.14,1.16],e1=[side*1.58,2.35,1.16];
 const p=reverse?[e1,r1,r0,e0]:[e0,r0,r1,e1];
 const a=p[0],b=p[1],c=p[2];
 return (b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]);
}
assert.ok(roofUpNormal(-1,false)<0,'historical west roof was back-facing');
assert.ok(roofUpNormal(-1,true)>0,'western clay slope faces upwards');
assert.ok(roofUpNormal(1,false)>0,'eastern clay slope faces upwards');
console.log('W106 PASS full inline game JS parses; '+JSON.stringify({
 source:'actual-original-market',pavingStones:stats.pavingStones,
 groundTriangles:data.length/30,marketWheelPassages:stats.marketWheelPassages,
 receivingDrains:stats.receivingDrainSegments,authorityModified:false,
 note:'Source/geometry contract only, NOT WebGL or visual-perception evidence'}));
