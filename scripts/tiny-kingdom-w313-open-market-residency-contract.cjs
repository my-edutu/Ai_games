'use strict';
/* W313 Phase 1: TEST-FIRST production contracts for the SAME real
 * farmer -> receiving market -> household district. This rejects fake
 * inventory, missing stall screens, old opaque visual barriers, and
 * an unbounded per-fragment software architecture material path.
 * Source/geometry contract only: never call this a video or FPS PASS. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const a=html.indexOf('<script>'),b=html.lastIndexOf('</script>');
assert(a>=0&&b>a,'must execute the real game inline source');
new vm.Script(html.slice(a+8,b),{filename:'tiny-kingdom-production.js'});
const planStart=html.indexOf('function originalMarketOpenRearScreenPlan(');
const stallStart=html.indexOf('function marketStall(s,index)',planStart);
const volumeStart=html.indexOf('function physicalStreetLevelStallVolumes(){');
const volumeEnd=html.indexOf('function followCameraRoofs(){',volumeStart);
assert(planStart>0&&stallStart>planStart&&volumeStart>stallStart&&volumeEnd>volumeStart);
const stalls=[
 {x:-5.4,z:2.25,face:1},{x:4.45,z:2.95,face:1},
 {x:4.30,z:8.50,face:-1},{x:-5.75,z:8.70,face:-1}];
const emittedOriginalMarketQuads=[];
const context={MARKET_STALLS:stalls,terrain:()=>0,
 marketQuarterStats:{openRearScreenPanels:0,openRearScreenGaps:0},
 quad:(a,b,c,d,col)=>{
  assert([a,b,c,d].every(p=>p.length===3&&p.every(Number.isFinite)));
  assert(Array.isArray(col)&&col.length===3&&col.every(Number.isFinite));
  const cross=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  assert(Math.abs(cross)>0,'no zero-area original wood infill');
  emittedOriginalMarketQuads.push([a,b,c,d]);
 },
 marketStallProfile:i=>({structural:i<2,eave:[4.20,3.98,3.25,3.04][i]})};
vm.runInNewContext(html.slice(planStart,stallStart)+
 html.slice(volumeStart,volumeEnd),context,{timeout:1500});
const all=context.physicalStreetLevelStallVolumes();
assert.equal(all.length,38,'4 existing shops: 8 original counters, 20 truthful narrow slats, 6 loft returns and 4 signs');
const slats=all.filter(x=>x.kind==='market-stall-screen');
for(const stall of stalls){
 const before=emittedOriginalMarketQuads.length;
 context.renderOpenRearTradeScreen(stall,[.46,.34,.23],[.73,.61,.46]);
 assert.equal(emittedOriginalMarketQuads.length-before,10,
  'each of the 5 original oak boards must really emit BOTH faces');
}
assert.equal(context.marketQuarterStats.openRearScreenPanels,20);
assert.equal(context.marketQuarterStats.openRearScreenGaps,8);
assert.equal(emittedOriginalMarketQuads.length*2,80,
 'twenty original narrow boards x two faces x 2 triangles, no discarded geometry');
assert.equal(slats.length,20,'five actual thin wood rails/posts per original market booth');
for(const stall of stalls){
 const rows=context.originalMarketOpenRearScreenPlan(stall);
 assert.equal(rows.length,5);
 const sheets=slats.filter(row=>Math.abs(row.z-(stall.z-stall.face*.84))<1e-8);
 assert.equal(sheets.length,5,'camera uses same true rear plane as original boards');
 assert(rows.every(row=>[row.x,row.z,row.width,row.depth,row.bottom,row.top].every(Number.isFinite)));
 assert(rows.every(row=>row.width<=2.46&&row.depth<=.11&&row.top<=.84+1e-9));
 const boardArea=rows.reduce((sum,row)=>sum+row.width*(row.top-row.bottom),0);
 assert(boardArea<1.06,'open 2.45m rear bay must have major real light/air gaps');
 assert(boardArea>0.40,'real structure must retain weather-protective joinery');
 for(const row of rows)assert(sheets.some(box=>
  Math.abs(box.x-row.x)<1e-8&&Math.abs(box.z-row.z)<1e-8&&
  Math.abs(box.rx-row.width*.5)<1e-8&&
  Math.abs(box.bottom-row.bottom)<1e-8&&Math.abs(box.top-row.top)<1e-8),
  'not a cosmetic camera exclusion: every measured physical slat matches geometry');
}
assert(html.includes('marketQuarterStats.openRearScreenPanels+=rearSlats.length'));
assert(html.includes('marketQuarterStats.openRearScreenGaps+=2'));
assert(html.includes('renderOpenRearTradeScreen(s,timber,trim);'));
assert(html.includes('roofs.push(...physicalStreetLevelStallVolumes());'));
assert(html.includes('if(groundAtlasFast<.5){'),'software shader must avoid second 3D-noise lighting pass on atlas-resident architectural surfaces');
for(const tag of ['architectureAtlas','vMaterial>4.5&&vMaterial<5.5',
 'vMaterial>5.5&&vMaterial<6.5','vMaterial>6.5&&vMaterial<7.5',
 'vMaterial>7.5&&vMaterial<8.5'])
 assert(html.includes(tag),'no loss of original physical stone/wood/roof/plaster material class: '+tag);
assert(!html.includes('new FakeCitizen(')&&html.includes('marketStallStockPlan('));
console.log('W313 source PASS: four real market shops with daylight-safe open rear joinery, exact physical camera slat bounds, original inventory and atlas-based software architecture material contract; visual/FPS gates remain NOT PROVEN.');
