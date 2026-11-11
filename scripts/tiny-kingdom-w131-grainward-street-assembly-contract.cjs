'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const game=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const begin=game.indexOf('<script>'),end=game.indexOf('</script>',begin);
assert(begin>0&&end>begin,'real game script exists');
new Function(game.slice(begin+8,end));
for(const symbol of ['grainwardMasonryFacing','grainwardMarketArcadePlan','grainwardTradeArcade'])
 assert(game.includes('function '+symbol+'('),'W131 missing connected original architecture: '+symbol);
// The genuine W237 route now lies between the original house's masonry and
// lot calls. Assert the full contiguous real-home renderer, never an obsolete
// adjacent pair that would prohibit a physically joined doorstep.
const homeStart=game.indexOf('function renderCachedHomeLot('),
 homeEnd=game.indexOf('// W78:',homeStart);
assert(homeStart>=0&&homeEnd>homeStart,'real retained house rendering exists');
const homeBuild=game.slice(homeStart,homeEnd);
assert(/grainwardInhabitedLot\(x,z,k,index,isCompact\);\s*inhabitedStreetFootway\(x,z,k,index\);\s*grainwardMasonryFacing\(x,z,k,index,isCompact\);/.test(homeBuild),
 'original occupied masonry and walkable connected threshold must be in the SAME cached house, in source order');
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
const make=new Function('data','terrain','COMPACT_HOUSE_HEIGHTS','compactHouseArchetype','rgb','materialScope','MATERIAL','quad','villageVisualLod','houseVisualProfile',game.slice(masonStart,masonEnd)+';return grainwardMasonryFacing');
// W152 original style-0 detailed house uses a 1.90m eave, not a mock new lot.
const mason=make(mesh,()=>.3,[2.08,2.94,2.47,3.16],()=>0,c=>[c,c,c],(m,f)=>f(),{STONE:5,WOOD:6},quad,lod,(_x,_z,_variant,compact)=>({height:compact?2.08:1.90}));
assert.equal(mason(-10,-7,0,0,false),36,'real household has bounded credible masonry');
assert.equal(lod.grainwardPortalThresholds,2,'one genuine door each side');
assert.equal(mesh.length%30,0,'real triangle stride');
for(const t of wallTriangles){
 if(Math.abs(t.n[2])>1e-7){
  const side=Math.sign(t.a[2]-(-7));
  assert(t.n[2]*side>1e-7,'outward-facing gable / masonry, not invisible inside faces');
 }
}

// Exercise the ORIGINAL connected market-shelter geometry, including upward
// roof face orientation under actual WebGL back-face culling. Synthetic mesh
// only here; browser WebGL, counters and authoritative economy remain separate.
const civicEnd=game.indexOf('function renderCachedHomeLot(',stop);
assert(civicEnd>stop,'actual static arcade occupies cached town build');
const arcadeMesh=[],roofFaces=[],marketAudit={};
let material=0;
const ROOF_MATERIAL=7;
const arcadeQuad=(a,b,c,d)=>{
 const u=b.map((v,i)=>v-a[i]),v=c.map((v,i)=>v-a[i]);
 const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
 assert([a,b,c,d,n].flat().every(Number.isFinite),'nonfinite market roof');
 assert(Math.hypot(...n)>1e-7,'degenerate market roof panel');
 if(material===ROOF_MATERIAL)roofFaces.push(n);
 for(let i=0;i<60;i++)arcadeMesh.push(0);
};
const arcadeLimb=(a,b)=>{
 assert([...a,...b].every(Number.isFinite),'nonfinite anchored oak truss');
 for(let i=0;i<240;i++)arcadeMesh.push(0);
};
const buildArcade=new Function('data','MARKET_STALLS','terrain',
 'marketStallProfile','rgb','materialScope','MATERIAL','quad',
 'limbSegment','marketQuarterStats',
 game.slice(start,civicEnd)+';return grainwardTradeArcade;');
const runArcade=buildArcade(arcadeMesh,stalls,()=>.25,
 index=>({eave:index<2?3:2.16}),c=>[c,c,c],
 (m,draw)=>{const prior=material;material=m;draw();material=prior},
 {ROOF:ROOF_MATERIAL,WOOD:6},arcadeQuad,arcadeLimb,marketAudit);
const drawnArcade=runArcade();
assert.equal(drawnArcade,96,'small, bounded market-span material cost');
assert.equal(marketAudit.grainwardArcadeSpans,2);
assert.equal(marketAudit.grainwardArcadeNoPosts,true);
assert.equal(arcadeMesh.length/30,drawnArcade);
assert.equal(roofFaces.length,8);
for(const normal of roofFaces)assert(normal[1]>1e-7,
 'open market roof must face upward under actual WebGL backface culling');

console.log('W131 original market corridor plan and full executable game parse PASS; actual WebGL/day120 evidence separate');

// W238 uses the SAME real retained occupied home corridor and collision oracle.
require('./tiny-kingdom-w238-occupied-street-join-contract.cjs');
