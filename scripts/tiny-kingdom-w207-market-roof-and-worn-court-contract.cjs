'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const script=source.match(/<script>([\s\S]*?)<\/script>/);
assert(script,'test the actual playable inline game, not a mocked replacement');
new vm.Script(script[1],{filename:'tiny-kingdom-W207.js'});
function section(a,b){
 const start=source.indexOf(a),end=source.indexOf(b,start);
 assert(start>=0&&end>start,'complete original source segment '+a);
 return source.slice(start,end);
}
const ground=section('function marketCobblestoneSquare(){','function marketTimberCart(');
assert.match(ground,/const\s+weatheredWidth=width\*\(\.60\+\.38\*biomeHash\(key\+131\)\)/,
 'irregular original worn market setts require actual geometric reduction, not recoloring');
assert.match(ground,/weatheredDepth=depth\*\(\.60\+\.36\*biomeHash\(key\+173\)\)/);
assert.match(ground,/const\s+drift=\(biomeHash\(key\+151\)-\.5\)\*\.29/);
assert.match(ground,/const\s+wander=\(biomeHash\(key\+191\)-\.5\)\*\.26/);
assert.match(ground,/marketQuarterStats\.surfaceModel='w208-natural-clay-market-and-freight-wagonway'/);
const interior=section('function marketReceivingRoofInterior(){','function marketReceivingDock(){');
assert.match(source,/marketReceivingRoofInterior\(\);\s*\/\/ W254/);
assert.match(source,/receivingSoffitPanels:marketQuarterStats\.receivingSoffitPanels/);
assert.match(source,/receivingSoffitRafters:marketQuarterStats\.receivingSoffitRafters/);
assert.match(source,/receivingSoffitTriangles:marketQuarterStats\.receivingSoffitTriangles/);
assert.doesNotMatch(interior,/state\.(food|wood|gold)\s*[+\-*/]?=/,
 'roof must not change authority');
const panels=[],timbers=[],data=[],stats={},terrain=(x,z)=>.10*Math.sin(x*.3)*Math.cos(z*.4);
const ctx={data,MATERIAL:{WOOD:6},marketQuarterStats:stats,
 MARKET_RECEIVING_HALL:Object.freeze({centerX:-.075,frontZ:10.77,backZ:12.45,halfWidth:3.02,eaveAboveGround:3.18,ridgeAboveGround:4.24,openSkyHalfWidth:1.16}),
 marketReceivingRoofDatum:()=>.23,
 rgb:n=>[n,n,n],materialScope:(_m,fn)=>fn(),
 quad:(a,b,c,d)=>{panels.push([a,b,c,d]);for(let i=0;i<60;i++)data.push(0);},
 limbSegment:(a,b,_radius,_color,sides)=>{timbers.push([a,b]);for(let i=0;i<sides*60;i++)data.push(0);}
};
vm.createContext(ctx);
vm.runInContext(interior+'\nmarketReceivingRoofInterior();',ctx);
assert.equal(panels.length,18,'real roof must cover BOTH existing slopes and 9 clay courses');
assert.equal(stats.receivingSoffitPanels,18);
assert.equal(stats.receivingSoffitRafters,6);
assert.equal(timbers.length,6);
assert.equal(stats.receivingSoffitTriangles,(data.length/30));
assert(stats.receivingSoffitTriangles<140,'Day-121 strict triangle safety');
for(const panel of panels){
 assert(panel.every(v=>v.length===3&&v.every(Number.isFinite)),'all roof vertices finite');
 const [a,b,c]=panel;
 const yNormal=(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]);
 assert(yNormal<-.00001,'interior oak soffit faces INSIDE the genuine grain hall, unlike sky-through one-sided roof');
 assert(Math.max(...panel.map(p=>p[1]))<4.60,'same roof and physical camera envelope');
}
for(const timber of timbers)assert(timber.every(p=>p.every(Number.isFinite)));
console.log('W207 source/geometry contract PASS: 18 actual inward-facing soffit panels, 6 oak rafters, same two receipt bays, organic stone/clay court, '+stats.receivingSoffitTriangles+' added triangles; real WebGL still required');
