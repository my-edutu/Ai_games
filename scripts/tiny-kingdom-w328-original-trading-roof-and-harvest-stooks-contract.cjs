'use strict';
// W328: executed original production geometry, not screenshots or a count-only
// assertion. Strictly presentational original farm and market work corridor.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const script=html.match(/<script(?:\\s[^>]*)?>([\\s\\S]*?)<\\/script>/i)?.[1];
assert(script,'production inline game missing');
new vm.Script(script,{filename:'tiny-kingdom-index.js'});
const start=html.indexOf('function grainwardMarketArcadePlan(){'),
 end=html.indexOf('// W258 ONE authentic medieval district',start);
assert(start>=0&&end>start);
const marketCode=html.slice(start,end);
const data=[],faces=[],stats={};
const ctx={data,Math,MARKET_STALLS:[{x:-5.4,z:2.25},{x:4.45,z:2.95},{x:4.30,z:8.50},{x:-5.75,z:8.70}],
 marketQuarterStats:stats,MATERIAL:{ROOF:1,WOOD:2,PLASTER:3},
 rgb:x=>x,terrain:()=>.25,marketStallProfile:i=>({eave:[4.2,3.98,3.25,3.04][i]}),
 materialScope:(m,fn)=>{ctx.current=m;fn()},
 quad:(a,b,c,d,color)=>{for(const pt of [a,b,c,d])assert(pt.every(Number.isFinite));faces.push({material:ctx.current,pts:[a,b,c,d]});data.length+=60;}
};
vm.createContext(ctx);
vm.runInContext(marketCode+'\\ngrainwardTradeArcade();',ctx);
assert.equal(stats.grainwardArcadeSpans,2);
assert.equal(stats.arcadeRoofTileFaces,64);
assert.equal(stats.arcadeRoofUndersides,8);
assert.equal(stats.arcadeTimberFaces,10);
assert.equal(stats.grainwardArcadeTriangles,164);
assert.equal(faces.filter(f=>f.material===1).length,64);
assert.equal(faces.filter(f=>f.material===3).length,8);
assert.equal(faces.filter(f=>f.material===2).length,10);
assert(faces.every(f=>f.pts.every(pt=>pt[1]>2.30)),'market aisle must remain free for real people and loaded carts');
assert.equal(stats.grainwardArcadeNoPosts,true);
assert.equal(vm.runInContext('physicalMarketArcadeRoofVolumes().length',ctx),8);
const grainStart=html.indexOf('function grainShocks(){'),
 grainEnd=html.indexOf('function fieldScarecrow(){',grainStart);
assert(grainStart>=0&&grainEnd>grainStart);
const grainCode=html.slice(grainStart,grainEnd),mesh=[],farmScene={bundles:0};
const grain={Math,data:mesh,farmScene,MATERIAL:{FOLIAGE:1,WOOD:2},
 rgb:x=>x,terrain:()=>0,materialScope:(m,fn)=>fn(),
 quad:()=>{mesh.length+=60},
 box:()=>{mesh.length+=360},
 taperedBranch:()=>{throw Error('old toy stalk tubes must be gone')},
 cone:()=>{throw Error('old cone spike must be gone')}};
vm.createContext(grain);vm.runInContext(grainCode+'\\ngrainShocks();',grain);
assert.equal(farmScene.bundles,4);
assert.equal(farmScene.grainShockStems,28);
assert.equal(farmScene.grainShockTriangles,160);
assert(farmScene.grainShockTriangles+stats.grainwardArcadeTriangles<500,
 'original live work corridor should recover headroom rather than inflate the 160k budget');
assert(!/people\\.push\\(|city\\.push\\(|Math\\.random\\(/.test(marketCode+grainCode));
console.log('W328 actual game geometry PASS: 64 joined clay roof tiles, open 2 merchant arcades; 4 original 7-sheaf bound harvest stooks; no new actors, economy or GPU buffers. Live A/B and hardware FPS NOT PROVEN');
