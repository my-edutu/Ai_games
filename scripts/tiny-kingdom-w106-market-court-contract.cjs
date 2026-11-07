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
assert.match(square,/w106-worn-market-surface/);
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
const context={data,MARKET_SQUARE:{cx:-1,cz:4.9,rx:7.55,rz:7.05},
 terrain,biomeHash:random,rgb:n=>n,marketQuarterStats:stats,
 materialScope:(_,fn)=>fn(),MATERIAL:{ROAD:3},
 tri:(a,b,c)=>append([a,b,c],1),quad:(a,b,c,d)=>append([a,b,c,d],2)};
vm.createContext(context);
vm.runInContext(square+'\n'+court+'\nmarketCobblestoneSquare();marketReceivingCourt();',context);
assert.ok(stats.pavingStones>=180&&stats.pavingStones<=260);
assert.equal(stats.mortarTriangles,64);
assert.equal(stats.entryPathStones,42);
assert.equal(stats.marketWheelPassages,22);
assert.equal(stats.marketDrainSegments,22);
assert.equal(stats.receivingDrainSegments,14);
assert.equal(stats.surfaceTriangles+stats.receivingCourtTriangles,data.length/30);
assert.ok(points.every(p=>p[1]<.30&&p[1]>-.30),'public court must remain ground level');
assert.ok(data.length/30<900,'market-ground geometry budget');
console.log('W106 PASS full inline game JS parses; '+JSON.stringify({
 source:'actual-original-market',pavingStones:stats.pavingStones,
 groundTriangles:data.length/30,marketWheelPassages:stats.marketWheelPassages,
 receivingDrains:stats.receivingDrainSegments,authorityModified:false,
 note:'Source/geometry contract only, NOT WebGL or visual-perception evidence'}));
