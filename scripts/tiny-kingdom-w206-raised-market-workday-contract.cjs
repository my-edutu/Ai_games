'use strict';
// W206 original raised receiving-hall workday: source-safety contract.
// This is NOT a visual transformation, hardware FPS, or independent critic verdict.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const start=html.indexOf('<script>'),end=html.indexOf('</script>',start);
assert(start>=0&&end>start,'original browser game must be present');
new vm.Script(html.slice(start+8,end));
const between=(a,b)=>{const start=html.indexOf(a),end=html.indexOf(b,start+a.length);
 assert(start>=0&&end>start,'missing original production architecture: '+a);
 return html.slice(start,end)};
const siteSection=between('const MARKET_RECEIVING_HALL=Object.freeze({','function marketReceivingRoofDatum(){');
const match=siteSection.match(/const MARKET_RECEIVING_HALL=Object\.freeze\((\{[\s\S]*?\})\);/);
assert(match,'physical roof site must have a single source of truth');
const hall=vm.runInNewContext('('+match[1]+')');
assert(hall.eaveAboveGround>=3.10 && hall.eaveAboveGround<=3.45,
 'the genuine 2.27m low eave still obstructs worker/market visibility');
assert(hall.ridgeAboveGround>=4.08 && hall.ridgeAboveGround<=4.65,
 'credible raised hall ridge must physically exceed the eave');
assert(hall.ridgeAboveGround-hall.eaveAboveGround>=.85,
 'a complete original pitched roof is required');
assert.equal(hall.frontZ,10.77);assert.equal(hall.backZ,12.45);
assert.equal(hall.halfWidth,3.02);assert.equal(hall.centerX,-.075);
const posts=between('function physicalReceivingHallPosts(){','function physicalTradeCorridorCameraVolumes(){');
const camera=between('function physicalTradeCorridorCameraVolumes(){','function getTradeCorridorCameraAudit(){');
const truss=between('function marketReceivingOpenFrontTruss(){','function marketReceivingDock(){');
const dock=between('function marketReceivingDock(){','function marketReceivingCourt(){');
const audit=between('function getMarketReceivingHallAudit(){','function marketReceivingOpenFrontTruss(){');
assert(posts.includes('ground+h.eaveAboveGround') && posts.includes('top:'),
 'actual camera collision envelope must extend to raised real load-bearing posts');
assert(camera.includes('h.eaveAboveGround') && camera.includes('h.ridgeAboveGround'),
 'same physical roof heights must drive the camera occlusion treatment');
assert(truss.includes('site.eaveAboveGround')&&truss.includes('site.ridgeAboveGround')&&
 truss.includes('marketReceivingRoofDatum()')&&!truss.includes('ground+2.25'),
 'oak king-post geometry must follow changed actual roof, never hang below it');
assert(dock.includes('site.eaveAboveGround')&&dock.includes('site.ridgeAboveGround')&&
 dock.includes('marketReceivingOpenFrontTruss();')&&
 !dock.includes('ground+2.23'),
 'four original posts and braces must reach the real raised pitched roof');
assert(dock.includes('for(const [index,x] of bayX.entries())')&&
 dock.includes('marketQuarterStats.receivingHallPosts++')&&
 dock.includes('marketQuarterStats.receivingHallRoofPanels++')&&
 dock.includes('const z=site.backZ-.03')&&
 dock.includes('tri(outer,foot,inner,lime)')&&
 dock.includes('site.openSkyHalfWidth'),
 'the two original shelves remain between two covered wing roofs and rear weather gables');
assert(audit.includes('roofAboveGrainReceiptMeters:')&&
 audit.includes('roofMatchesCameraVolumes:roofBands.length===4')&&
 audit.includes('originalShelfUnderRoof:')&&
 audit.includes('authorityModified:false')&&audit.includes('changesNavigation:false'),
 'real-game inspection must expose clearance and explicitly preserve authority');
console.log('W206 raised original freight hall: geometry and camera source contract PASS; lived workday must still be verified on actual WebGL.');
