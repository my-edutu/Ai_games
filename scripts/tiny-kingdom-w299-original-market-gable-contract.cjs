'use strict';
// W299: execute the REAL four-stall render helper, not reauthored visuals.
// Pass is geometry/correctness only; running-game quality remains NOT PROVEN.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const s=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const a=s.indexOf('<script>'),b=s.indexOf('</script>',a);
assert(a>=0&&b>a);new vm.Script(s.slice(a+8,b));
const from=s.indexOf('function grainwardMarketRoofEdges('),
 to=s.indexOf('function getGrainwardDistrictAudit(',from);
assert(from>0&&to>from);const helper=s.slice(from,to);
assert(!/\blimbSegment\(/.test(helper),'remove ornamental cylindrical scaffold');
const stalls=[{x:-5.4,z:2.25},{x:4.45,z:2.95},{x:4.30,z:8.50},{x:-5.75,z:8.70}];
const mesh=[],faces=[],audit={};
const add=(v,triangles)=>{assert(v.flat().every(Number.isFinite));faces.push(v);mesh.length+=30*triangles};
const ctx={MARKET_STALLS:stalls,marketQuarterStats:audit,data:mesh,terrain:()=>.25,
 marketStallProfile:i=>({eave:i<2?3.35:3.12,peak:i<2?4.51:4.34}),
 MATERIAL:{WOOD:6,PLASTER:8},rgb:x=>x,materialScope:(_,f)=>f(),
 tri:(a,b,c)=>add([a,b,c],1),quad:(a,b,c,d)=>add([a,b,c,d],2)};
vm.createContext(ctx);vm.runInContext(helper+'\nthis.renderMarketGables=grainwardMarketRoofEdges;',ctx);
ctx.renderMarketGables();
assert.equal(audit.grainwardRoofGables,8);assert.equal(audit.grainwardRoofFrames,16);
assert.equal(audit.grainwardRoofTriangles,40);assert.equal(mesh.length/30,40);
assert.equal(faces.length,24);
for(const f of faces){
 const [a,b,c]=f,u=b.map((x,i)=>x-a[i]),v=c.map((x,i)=>x-a[i]);
 const nz=u[0]*v[1]-u[1]*v[0];
 assert(Math.abs(nz)>1e-5,'nondegenerate upper wall');
 const stall=stalls.find(q=>Math.abs(a[0]-q.x)<2&&Math.abs(a[2]-q.z)<1.25);
 assert(stall,'original market shop');
 assert.equal(Math.sign(nz),Math.sign(a[2]-stall.z),'outward winding');
 assert(a[1]>.25+3-.12,'no buyer or courier ground-floor screen');
}
const start=s.indexOf('function marketStall(s,index){'),end=s.indexOf('function marketQuarter(){',start);
const shop=s.slice(start,end);
assert(!shop.includes('Lift the ridge above the original toy tent'));
assert(/grainwardMarketRoofEdges\(\);\s*grainwardTradeArcade\(\);/.test(s));
assert(s.includes('const MARKET_ENTRY_ARCH=Object.freeze'));
console.log('W299 PASS original merchant roof gables: 8 end walls, 16 bargeboards, 40 triangles, no lost trading bay; WebGL quality unproven');