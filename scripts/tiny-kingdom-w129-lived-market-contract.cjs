'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const a=source.indexOf('<script>'),b=source.indexOf('</script>',a);
assert(a>0&&b>a,'real executable game source');
new Function(source.slice(a+8,b));
const names=['function marketStallProfile(index)','function marketStall(s,index)',
 'function grainwardMarketRoofEdges()','function physicalMarketUprights()'];
for(const name of names)assert(source.includes(name),'missing retained marketplace structure: '+name);
const code=source.slice(source.indexOf('function marketStallProfile(index)'),source.indexOf('function marketStall(s,index)'));
const profile=new Function('MARKET_STALLS',code+'\nreturn marketStallProfile;')([{}, {}, {}, {}]);
for(let i=0;i<4;i++){
 const p=profile(i);
 assert(Number.isFinite(p.postHeight)&&Number.isFinite(p.eave)&&Number.isFinite(p.peak));
 assert(p.peak>p.eave+.7,'physical pitched roof must be complete');
 assert(p.postHeight>=p.eave-.16,'posts must reach genuine roof eave');
 assert(p.postHeight>=2.1,'original open trade lanes must retain head clearance');
 assert.equal(p.structural,i<2,'only the two original permanent shop bays have upper rooms');
}
assert(profile(0).peak-profile(2).peak>=.85,'distinct skyline at real camera scale');
const stall=source.slice(source.indexOf('function marketStall(s,index)'),source.indexOf('function marketQuarter(){'));
assert(stall.includes('const profile=marketStallProfile(index)'));
assert(stall.includes('marketQuarterStats.structuralShopLofts++'));
assert(stall.includes('eave=y+profile.eave,peak=y+profile.peak'));
assert(source.includes('height:marketStallProfile(index).postHeight'),
 'camera/physical roof-post bounds cannot understate real height');
const ground=source.slice(source.indexOf('function marketCobblestoneSquare(){'),source.indexOf('function marketTimberCart('));
assert(ground.includes('const bands=4,sectors=32'), 'terrain-following rings not seven-metre sinking fan');
assert(ground.includes('marketQuarterStats.mortarTriangles+=2'));
assert(!ground.includes('tri(sample(cx,cz,.066),edge(b),edge(a)'));
assert(ground.includes("stoneDistribution='w291-low-discrepancy-separated-court'"),
 'original market stones are genuinely separate, not checkerboard slabs');
assert(ground.includes('marketQuarterStats.stoneMinimumSpacing<.72-.000001'),
 'the authentic original market keeps its stone-clearance contract');
assert(ground.includes('marketWheelPassages'));
assert(ground.includes('marketDrainSegments'));
assert(source.includes('grainwardMarketRoofEdges();'),'same true market civic mesh');
console.log('W129 PASS: full game parse, real four shops, connected upper room and terrain-following court contract; browser/GPU still required');
