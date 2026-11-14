'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const script=html.slice(html.lastIndexOf('<script>')+8,html.lastIndexOf('</script>'));
new vm.Script(script,{filename:'tiny-kingdom-inline-game.js'});
const begin=html.indexOf('let tradeCorridorCameraEnvelopes=null'),
 end=html.indexOf('function getMarketReceivingHallAudit(){');
assert.ok(begin>0&&end>begin,'the real W83/W100 camera contract must exist');
const ctx={terrain:(x,z)=>.07*x-.025*z,FARMSTEAD:{granary:[29,-5]},
 MARKET_RECEIVING_HALL:{centerX:-.075,frontZ:10.77,backZ:12.45,
  halfWidth:3.02,eaveAboveGround:3.18,ridgeAboveGround:4.24,openSkyHalfWidth:1.16}};
const expose=new Function('terrain','FARMSTEAD','MARKET_RECEIVING_HALL',
 html.slice(begin,end)+'\nreturn {physicalTradeCorridorCameraVolumes,physicalReceivingHallPosts,getTradeCorridorCameraAudit,marketReceivingRoofDatum};');
const kit=expose(ctx.terrain,ctx.FARMSTEAD,ctx.MARKET_RECEIVING_HALL);
const a=kit.getTradeCorridorCameraAudit(),first=kit.physicalTradeCorridorCameraVolumes(),
 second=kit.physicalTradeCorridorCameraVolumes(),posts=kit.physicalReceivingHallPosts();
assert.equal(first,second,'the immutable geometry is reused by consecutive camera surveys');
assert.equal(a.totalVolumes,14,'all original roof strips and posts, no unbounded extras');
assert.equal(a.marketRoofBands,4);assert.equal(a.marketPosts,4);
assert.equal(a.granaryRoofBands,4);assert.equal(a.granaryPosts,2);
assert.equal(a.boundsValid,true);
assert.ok(a.originalWorkerFrontGap>.5&&a.originalWorkerFrontGap<.6);
assert.deepEqual(a.originalMarketReceiptCoordinates,[[-1,10.2],[.85,10.2]]);
assert.equal(a.authorityModified,false);
assert.equal(posts.length,4);
assert.ok(posts.every(p=>Math.abs(Math.abs(p.x+.075)-2.89)<.001));
// The underlying terrain can be below zero; heights must be physical RELATIVE to local ground.
assert.ok(first.every(v=>v.top>v.bottom&&v.rx>0&&v.rz>0));
assert.ok(first.filter(v=>v.kind.includes('roof')).every(v=>v.top-v.bottom<.62));
assert.ok(first.filter(v=>v.kind.includes('roof')).every(v=>v.bottom>0));
assert.match(html,/roofs\.push\(\.\.\.physicalTradeCorridorCameraVolumes\(\)\)/);
assert.match(html,/const surveyedPosts=physicalMarketUprights\(\)\.concat\(physicalReceivingHallPosts\(\)\)/);
assert.match(html,/getMarketGatewayAudit,getMarketReceivingHallAudit,getTradeCorridorCameraAudit,/);
assert.match(html,/receivingHallRoofBands:count\('receiving-hall-roof'\)/);
console.log('W103: PASS original W83/W100 pitched roof+post camera geometry, bounded, cached, no invented authority');
