'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const game=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const begin=game.indexOf('<script>'),end=game.indexOf('</script>',begin);
assert(begin>0&&end>begin,'real game script exists');
new Function(game.slice(begin+8,end));
for(const symbol of ['grainwardMasonryFacing','grainwardMarketArcadePlan','grainwardTradeArcade'])
 assert(game.includes('function '+symbol+'('),'W131 missing connected original architecture: '+symbol);
assert(/grainwardInhabitedLot\(x,z,k,index,isCompact\);\s*grainwardMasonryFacing\(x,z,k,index,isCompact\);/.test(game),
 'masonry must be part of each actual cached inhabited house, not a foreground prop');
assert(/grainwardMarketRoofEdges\(\);\s*grainwardTradeArcade\(\);/.test(game),
 'arcade must connect true market stalls in the retained civic geometry');
assert(game.includes("source:'W131-two-actual-market-stall-arcades'"),
 'read-only arcade audit and provenance required');
const start=game.indexOf('function grainwardMarketArcadePlan(');
const stop=game.indexOf('function grainwardTradeArcade(',start);
assert(start>0&&stop>start,'separable physical open-market arcade plan');
const stalls=[{x:-5.4,z:2.25},{x:4.45,z:2.95},{x:4.30,z:8.50},{x:-5.75,z:8.70}];
const plan=new Function('MARKET_STALLS','terrain','marketStallProfile',
 game.slice(start,stop)+';return grainwardMarketArcadePlan;')(
 stalls,()=>.25,index=>({eave:index<2?3.0:2.16,peak:index<2?4.05:2.92}));
const arcs=plan();
assert.equal(arcs.length,2,'two original public market side arcs');
for(const a of arcs){
 assert(a.z1-a.z0>3,'not an isolated ornamental porch');
 assert(a.minClearance>2.05,'real citizen overhead clearance');
 assert(Math.abs(a.outerX)>5.6,'trade court centre must remain completely open');
 assert(a.innerX*a.outerX>0,'arcades stay on outward stall edges');
 assert(a.realMarketEndpointA>=0&&a.realMarketEndpointB>=0);
}
assert(arcs[0].outerX<0&&arcs[1].outerX>0);
console.log('W131 original market corridor plan and full executable game parse PASS; actual WebGL/day120 evidence separate');
