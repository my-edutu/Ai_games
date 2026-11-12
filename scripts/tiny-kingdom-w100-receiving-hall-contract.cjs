'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const code=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)?.[1];
assert.ok(code,'inline playable game code missing');
new vm.Script(code,{filename:'tiny-kingdom-w100-playable.js'});
assert.match(code,/function marketReceivingDock\(\)/);
assert.match(code,/function getMarketReceivingHallAudit\(\)/);
assert.match(code,/marketQuarterStats\.receivingHallRoofPanels\+\+/);
assert.match(code,/marketQuarterStats\.receivingHallPosts\+\+/);
assert.match(code,/marketQuarterStats\.rearShopGables\+\+/);
assert.match(code,/materialScope\(MATERIAL\.ROOF,\(\)=>\{/);
assert.match(code,/unobstructedCourierAisle:/);
assert.match(code,/openWorkerApproachMeters:/);
assert.match(code,/originalShelfUnderRoof:/);
assert.match(code,/\[\[-1\.0,10\.2\],\[\.85,10\.2\]\]/);
assert.match(code,/getMarketReceivingHallAudit,/);
console.log('W100 original real two-bay open-front receiving arcade source/syntax PASS (not browser visual evidence)');

const hallFragment=code.slice(code.indexOf('const MARKET_RECEIVING_HALL='),
  code.indexOf('// The transfer platform sits',code.indexOf('const MARKET_RECEIVING_HALL=')));
assert.ok(hallFragment.includes('function marketReceivingDock()'));
const farmStart=code.indexOf('const FARMSTEAD=');
assert.ok(farmStart>=0,'The test requires the same real farm/granary geometry as the playable game');
const farmDeclaration=code.slice(farmStart,code.indexOf(';',farmStart)+1);
assert.match(farmDeclaration,/^const FARMSTEAD=Object\.freeze\(\{/);
const hallGeometry=new Function(`
${farmDeclaration}
let data=[];const rgb=hex=>hex,terrain=(x,z)=>Math.sin(x*.03+z*.01)*.07;
const marketQuarterStats={receivingBays:0,receivingHallRoofPanels:0,receivingHallPosts:0,rearShopGables:0};
const MATERIAL={STONE:5,WOOD:6,PLASTER:8,ROOF:7},materialScope=(id,fn)=>fn();
const tri=(a,b,c,col)=>{data.length+=30;},quad=(a,b,c,d,col)=>{tri(a,b,c,col);tri(a,c,d,col)};
const box=(x,y,z,w,h,d,col)=>{for(let i=0;i<12;i++)data.length+=30;};
const limbSegment=(a,b,r,col,sides)=>{for(let i=0;i<2*sides;i++)data.length+=30;};
${hallFragment}
marketReceivingDock();return {triangles:data.length/30,audit:getMarketReceivingHallAudit()}
`)();
assert.ok(hallGeometry.triangles>=750&&hallGeometry.triangles<=950,
 'The complete W208 real four-wall, oak-framed, roofed grain arcade must remain within its isolated 750–950-triangle construction envelope');
assert.equal(hallGeometry.audit.arcadeWallSegments,4,'Existing real side walls must be included');
assert.equal(hallGeometry.audit.arcadeWallTriangles,320,'Keep physical joinery, not decorative fake planes');
assert.equal(hallGeometry.audit.receivingSoffitPanels,18,'Do not regress the real interior roof');
assert.equal(hallGeometry.audit.frontGablePlasterPanels,0,'Physical courier approach stays open');
assert.ok(hallGeometry.audit.arcadeClearCenterWidth>5,'No freight obstruction');
assert.ok(hallGeometry.audit.originalBays===2);
assert.ok(hallGeometry.audit.loadBearingPosts===4);
assert.ok(hallGeometry.audit.roofPanels===18);
assert.ok(hallGeometry.audit.openWorkerApproachMeters>.5);
assert.equal(hallGeometry.audit.originalShelfUnderRoof,false,
 'both real receipt shelves now sit beneath actual open sky, not a fabricated roof');
assert.equal(hallGeometry.audit.realReceiptShelvesUnderSky,true);
assert(hallGeometry.audit.openSkyReceivingAisleMetres>=2.16);
assert.equal(hallGeometry.audit.coveredReceivingWings,2);
