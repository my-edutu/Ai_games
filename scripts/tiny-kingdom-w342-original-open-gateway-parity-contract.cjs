'use strict';
// Test-first W342: original open market gateway MUST be photographed as built.
// The road/real courier/receipt remain present; only camera volumes change.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const h=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const script=h.slice(h.indexOf('<script>')+8,h.indexOf('</script>',h.indexOf('<script>')));
new vm.Script(script);
const gateStart=h.indexOf('function physicalMarketGatewayVolumes(){');
const gateEnd=h.indexOf('function getMarketGatewayAudit()',gateStart);
assert(gateStart>0&&gateEnd>gateStart,'source must mirror the original two outboard guild markers');
const body=h.slice(gateStart,gateEnd);
const gate={x:-1.35,z:13.25,postOffset:2.82,postWidth:.18,
 postHeight:3.62,beamHeight:3.48,beamWidth:5.84};
const context={MARKET_ENTRY_ARCH:gate,terrain:(x,z)=>.04*x+.008*z,Math,Number};
vm.createContext(context);
const original=vm.runInContext(body+'\nphysicalMarketGatewayVolumes',context);
const solids=original();
assert.equal(solids.length,6,'two outboard arm, sign and brace profiles, without a phantom crossing lintel');
for(const kind of ['market-gateway-arm','market-gateway-guildmark','market-gateway-brace'])
 assert.equal(solids.filter(s=>s.kind===kind).length,2,'both physical roadside markers present: '+kind);
for(const s of solids){
 assert([s.x,s.z,s.rx,s.rz,s.bottom,s.top].every(Number.isFinite),
  'camera volume is finite');
 assert(s.rx>0&&s.rz>0&&s.top>s.bottom,'nondegenerate real timber only');
 assert(Math.abs(s.x-gate.x)>s.rx+.20,
  'every surviving wood element remains outboard of the actual central unloading aisle');
 assert(s.visualBottom===s.bottom,'photographed timber must cover exact visible vertical envelope');
}
const mid=solids.filter(s=>Math.abs(s.x-gate.x)<=s.rx+.05);
assert.equal(mid.length,0,'an unbuilt 5.84m overhead beam must NOT obstruct real courier');
assert(h.includes('roofs.push(...physicalMarketGatewayVolumes());'),
 'running camera must use genuine two-sided timber volumes');
assert(!h.includes('rx:MARKET_ENTRY_ARCH.beamWidth*.5+.04'),
 'obsolete whole-corridor phantom lintel must be gone');
for(const kind of ['market-gateway-arm','market-gateway-guildmark','market-gateway-brace']){
 const eyes=h.slice(h.indexOf('const PHYSICAL_FOLLOW_EYE_KINDS='),h.indexOf('function physicalFollowEyeClearance('));
 const scene=h.slice(h.indexOf('const WORKDAY_OPAQUE_SCENE_KINDS='),h.indexOf('function foregroundSceneProjection('));
 assert(eyes.includes("'"+kind+"'"),'physical observer cannot stand inside '+kind);
 assert(scene.includes("'"+kind+"'"),'3D portrait silhouette respects '+kind);
}
const mesh=h.slice(h.indexOf('function marketQuarter(){'),h.indexOf('function marketStallStockPlan(',h.indexOf('function marketQuarter(){')));
assert(mesh.includes('box(px+side*.46,py+gate.beamHeight-.17,pz,')&&
 mesh.includes('1.05,.14,.24,beam)'),'unchanged original outboard arm geometry present');
assert(mesh.includes('box(sx,py+gate.beamHeight-.41,pz+.12,.45,.39,.09,post)'),
 'unchanged original side-hung sign geometry present');
assert(mesh.includes('marketQuarterStats.freightCrossBeams=0'),
 'no wooden beam added over actual receiving worker');
console.log('W342 static gateway/physical camera source contract PASS; original workday film and native hardware FPS still NOT PROVEN.');
