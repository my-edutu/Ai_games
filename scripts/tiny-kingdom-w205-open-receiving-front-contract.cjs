'use strict';
// W205 real receiving-hall frontage contract; safety floor, not experience PASS.
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const script=html.slice(html.indexOf('<script>')+8,html.indexOf('</script>',html.indexOf('<script>')));
new vm.Script(script);
const cut=(a,b)=>{const start=html.indexOf(a),end=html.indexOf(b,start);
 assert(start>=0&&end>start,'Expected original playable geometry functions');return html.slice(start,end)};
const builder=cut('function marketReceivingOpenFrontTruss(){','function marketReceivingDock(){');
const dock=cut('function marketReceivingDock(){','function marketReceivingCourt(){');
const audit=cut('function getMarketReceivingHallAudit(){','function marketReceivingOpenFrontTruss(){');
assert(builder.includes('materialScope(MATERIAL.WOOD')&&builder.includes('limbSegment('),
 'real timber members must replace the previous solid billboard');
assert(builder.includes('site.frontZ+.03')&&builder.includes('marketReceivingRoofDatum()'),
 'truss must occupy the same original receiving front gable');
assert(dock.includes('marketReceivingOpenFrontTruss();'),
 'production receiving hall must render actual structural open front');
assert(!dock.includes('for(const z of [site.frontZ+.03,site.backZ-.03])'),
 'do not retain the opaque front triangle over original receipts');
assert(dock.includes('const z=site.backZ-.03')&&dock.includes('tri(outer,foot,inner,lime)')&&
 dock.includes('site.openSkyHalfWidth'),
 'retain both real rear wing gables, open sky and original trade bays');
assert(dock.includes('for(const [index,x] of bayX.entries())')&&
 dock.includes('marketQuarterStats.receivingBays++')&&
 dock.includes('marketQuarterStats.receivingHallPosts++')&&
 dock.includes('marketQuarterStats.receivingHallRoofPanels++'),
 'all true unload shelves, four posts and two pitched roofs must remain');
assert(audit.includes('openFrontTrussMembers:')&&
 audit.includes('frontGablePlasterPanels:0')&&
 audit.includes('realFreightOnly:true')&&audit.includes('authorityModified:false'),
 'read-only inspection must report the genuine architectural sightline');
assert(html.includes("function physicalTradeCorridorCameraVolumes(){")&&
 html.includes("kind:'receiving-hall-roof'"),
 'physical roof collision model must remain aligned with original covering');
console.log('W205 open real receiving hall: source safety contract PASS; live gameplay and performance still require CI evidence.');
