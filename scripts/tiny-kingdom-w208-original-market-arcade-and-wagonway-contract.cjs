'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const js=src.match(/<script>([\s\S]*?)<\/script>/);
assert(js,'actual original playable scene');new vm.Script(js[1]);
function between(a,b){const p=src.indexOf(a),q=src.indexOf(b,p);assert(p>=0&&q>p,a);return src.slice(p,q)}
const ground=between('function marketCobblestoneSquare(){','function marketTimberCart(');
assert.match(ground,/surfaceModel='w208-natural-clay-market-and-freight-wagonway'/);
assert.match(ground,/const\s+stoneCandidateKeep=biomeHash\(key\+273\)>?.\d+/);
assert.match(ground,/const\s+realWheelLane=Math\.abs\(x-3\.22\)/);
assert.match(src,/marketReceivingSideEnclosure\(\);\s*marketReceivingRoofInterior\(\);/,
 'do not undo original W207 inward roof; connect the same open grain hall');
const enclosure=between('function marketReceivingSideEnclosure(){','function marketReceivingRoofInterior(){');
assert.doesNotMatch(enclosure,/state\.(food|wood|gold)\s*[+\-*/]?=/);
assert.match(enclosure,/box\(x,ground\+\.40,z,\.105,\.44,z1-z0-\.025,plaster\[bay\]\)/,
 'a real built hall needs two-sided thick plaster, not one-sided invisible interior quads');
const calls=[],mesh=[],stats={};
const site={centerX:-.075,frontZ:10.77,backZ:12.45,halfWidth:3.02,eaveAboveGround:3.18,ridgeAboveGround:4.24};
const mockBox=(x,y,z,w,h,d)=>{calls.push({type:'box',x,y,z,w,h,d});for(let i=0;i<360;i++)mesh.push(0)};
const mockQuad=(a,b,c,d)=>{calls.push({type:'quad',points:[a,b,c,d]});for(let i=0;i<60;i++)mesh.push(0)};
const mockBeam=(a,b,r,_c,sides)=>{calls.push({type:'beam',a,b,r});for(let i=0;i<sides*60;i++)mesh.push(0)};
const ctx={data:mesh,marketQuarterStats:stats,marketReceivingRoofDatum:()=>.22,
 MARKET_RECEIVING_HALL:site,rgb:n=>[n,n,n],MATERIAL:{WOOD:1,STONE:2,PLASTER:3},
 materialScope:(_,fn)=>fn(),box:mockBox,quad:mockQuad,limbSegment:mockBeam};
vm.createContext(ctx);
vm.runInContext(enclosure+'\nmarketReceivingSideEnclosure();',ctx);
assert.equal(stats.arcadeWallSegments,4,'four genuine low timber-and-wattle wall bays');
assert(stats.arcadeWallMaxHeight<=1.0,'market remains genuinely open and adult workers unobscured');
assert(stats.arcadeClearCenterWidth>=5.1,'no new walls across the original courier aisle');
assert(stats.arcadeWallTriangles>40&&stats.arcadeWallTriangles<350,'bounded new original architecture');
for(const c of calls){
 const pts=c.points||[c.a,c.b].filter(Boolean);
 for(const p of pts)assert(p.length===3&&p.every(Number.isFinite),'finite structural geometry');
 if(c.type==='box')assert([c.x,c.y,c.z,c.w,c.h,c.d].every(Number.isFinite));
}
assert.match(src,/arcadeWallSegments:marketQuarterStats\.arcadeWallSegments/);
assert.match(src,/arcadeWallTriangles:marketQuarterStats\.arcadeWallTriangles/);
console.log('W208 PASS original live marketplace: low believable sheltered side bays, unobstructed original freight aisle, more natural stone/clay wagonway; actual captured WebGL still required');
