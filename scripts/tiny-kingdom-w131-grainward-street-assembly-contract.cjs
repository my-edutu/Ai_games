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
const masonStart=game.indexOf('function grainwardMasonryFacing(');
const masonEnd=game.indexOf('function grainwardMarketArcadePlan(',masonStart);
assert(masonStart>=0&&masonEnd>masonStart,'real house facade geometry');
const wallTriangles=[],mesh=[],lod={grainwardMasonryHomes:0,grainwardPortalThresholds:0,grainwardMasonryTriangles:0};
const quad=(a,b,c,d)=>{
 const v=b.map((n,i)=>n-a[i]),w=c.map((n,i)=>n-a[i]);
 const n=[v[1]*w[2]-v[2]*w[1],v[2]*w[0]-v[0]*w[2],v[0]*w[1]-v[1]*w[0]];
 assert([a,b,c,d,n].flat().every(Number.isFinite),'nonfinite original wall surface');
 assert(Math.hypot(...n)>1e-7,'degenerate hand-laid masonry');
 wallTriangles.push({a,n});for(let k=0;k<60;k++)mesh.push(0);
};
const make=new Function('data','terrain','COMPACT_HOUSE_HEIGHTS','compactHouseArchetype','rgb','materialScope','MATERIAL','quad','villageVisualLod',game.slice(masonStart,masonEnd)+';return grainwardMasonryFacing');
const mason=make(mesh,()=>.3,[2.08,2.94,2.47,3.16],()=>0,c=>[c,c,c],(m,f)=>f(),{STONE:5,WOOD:6},quad,lod);
assert.equal(mason(-10,-7,0,0,false),36,'real household has bounded credible masonry');
assert.equal(lod.grainwardPortalThresholds,2,'one genuine door each side');
assert.equal(mesh.length%30,0,'real triangle stride');
for(const t of wallTriangles){
 if(Math.abs(t.n[2])>1e-7){
  const side=Math.sign(t.a[2]-(-7));
  assert(t.n[2]*side>1e-7,'outward-facin gable / masonry, not invisible inside faces');
 }
}

console.log('W131 original market corridor plan and full executable game parse PASS; actual WebGL/day120 evidence separate');
