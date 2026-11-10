#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const h=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const first=h.indexOf('<script>')+8,script=h.slice(first,h.indexOf('</script>',first));
new vm.Script(script);
const start=h.indexOf('function grainwardTradehouseEnvelope(');
const end=h.indexOf('function marketStall(s,index){',start);
assert.ok(start>0&&end>start,'actual physical tradehouse shell is present in original game');
const source=h.slice(start,end);
assert.ok(!/\b(?:state|people|city|rand|Math\.random|routeBetween|walkable)\b/.test(source),
 'tradehouse geometry cannot manufacture economy, citizens or navigation');
const make=(index,face)=>{
 const polygons=[],solids=[];
 const c={
  Math,Number,Error,rgb:n=>[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255],
  terrain:(x,z)=>.018*x-.009*z,
  MATERIAL:{STONE:1,PLASTER:2,WOOD:3,WINDOW_GLOW:4},
  materialScope:(_,fn)=>fn(),
  quad:(...args)=>polygons.push(args),
  tri:(...args)=>polygons.push(args),
  box:(...args)=>solids.push(args),
  limbSegment:(...args)=>solids.push(args),
  marketQuarterStats:{tradehouseShells:0,tradehouseTriangles:0,tradehouseWindows:0,
   tradehouseGroundFrontWalls:0},
  data:[]
 };
 c.quad=(...args)=>{polygons.push(args);c.data.push(...Array(60).fill(0))};
 c.tri=(...args)=>{polygons.push(args);c.data.push(...Array(30).fill(0))};
 c.box=(...args)=>{solids.push(args);c.data.push(...Array(360).fill(0))};
 c.limbSegment=(...args)=>{solids.push(args);c.data.push(...Array(300).fill(0))};
 vm.createContext(c);
 vm.runInContext(source,c);
 const before=c.data.length;
 const audit=c.grainwardTradehouseEnvelope({x:index?4.45:-5.4,z:index?2.95:2.25,face},index,
 {eave:3.0,peak:4.05});
 assert.equal(c.marketQuarterStats.tradehouseShells,1);
 assert.equal(audit.groundLevelBuyerWallCount,0,'real market must remain open at buyer face');
 assert.equal(audit.reusesAuthenticStall,true);
 assert.equal(audit.addedDeliveries,0);
 assert.equal(audit.sideWalls,2);
 assert.equal(audit.frontUpperGables,1);
 assert.equal(audit.upperCasements,2);
 assert.ok(audit.triangles>80&&audit.triangles<800,'bounded visible market-house mass');
 assert.equal(c.data.length-before,audit.triangles*30);
 assert.ok(polygons.length>50&&solids.length>10,'stone, plaster and timber have real mass');
 for(const f of polygons)for(const p of f.slice(0,f.length-1))
  assert.ok(Array.isArray(p)&&p.length===3&&p.every(Number.isFinite),
   'all original-world shell vertices finite');
 return audit;
};
const east=make(1,1),west=make(0,-1);
assert.equal(east.triangles,west.triangles,'both real tradehouse shells complete');
console.log('W196 tradehouse masonry and loft geometry contract passed. No running-game, GPU FPS or visual A/B PASS claimed.');
