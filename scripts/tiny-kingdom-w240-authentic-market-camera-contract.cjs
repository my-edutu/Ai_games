'use strict';
// W240: authoritative stock/routes never change when the camera learns the
// geometry of the TWO existing inter-stall arcade roofs.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const start=html.indexOf('<script>'),end=html.indexOf('</script>',start);
assert(start>=0&&end>start,'real playable Tiny Kingdom script');
new vm.Script(html.slice(start+8,end),{filename:'tiny-kingdom-original-game.js'});
function section(first,last){
 const a=html.indexOf(first),b=html.indexOf(last,a);
 assert(a>=0&&b>a,'missing original camera geometry '+first);
 return html.slice(a,b);
}
const fn=section('function physicalMarketArcadeRoofVolumes(){','function grainwardTradeArcade(){');
const originalPlans=[
 {outerX:-4.2,innerX:-3.1,z0:3.42,z1:7.53,y0:4.16,y1:4.03,noNewGroundPosts:true},
 {outerX:4.2,innerX:3.1,z0:4.12,z1:7.33,y0:4.34,y1:4.21,noNewGroundPosts:true}
];
const sandbox={grainwardMarketArcadePlan:()=>originalPlans};
vm.createContext(sandbox);
vm.runInContext(fn+'\nthis.roofs=physicalMarketArcadeRoofVolumes();',sandbox);
const roofs=sandbox.roofs;
assert.equal(roofs.length,8,'four near-fitting collision bands per existing arcade');
assert.equal(roofs.filter(v=>v.kind==='market-arcade-roof').length,8);
for(const [i,volume] of roofs.entries()){
 assert([volume.x,volume.z,volume.rx,volume.rz,volume.bottom,volume.top]
  .every(Number.isFinite),'no invalid physical camera bounds');
 assert(volume.rx>.05&&volume.rx<.30,'do not falsely block broad market lanes');
 assert(volume.rz>1.5&&volume.rz<2.5,'actual roof segment, not invented building');
 assert(volume.top>volume.bottom&&volume.top-volume.bottom<.6,
  'thin original sloping timber canopy, not opaque floor-to-ceiling wall');
 assert.equal(volume.originalArcade,Math.floor(i/4));
 assert.equal(volume.noNewGroundPosts,true);
}
assert.match(html,/roofs\.push\(\.\.\.physicalMarketArcadeRoofVolumes\(\)\)/,
 'actual follow and citizen-pick camera must receive the real volumes');
assert.match(html,/marketArcadeRoofBands:count\('market-arcade-roof'\)/);

// W241: the eight REAL inter-stall roof strips must be consistent across
// THREE independent presentation checks: ray block, the camera's physical
// eye clearance, and foreground image coverage. Otherwise the camera can
// be placed inside a clay roof or call an obstructed shot readable.
const clearance=section('const PHYSICAL_FOLLOW_EYE_KINDS=', 'function physicalCitizenForegroundBlockers(');
const frame=section('const WORKDAY_OPAQUE_SCENE_KINDS=', 'function foregroundSceneProjection(');
const physical={terrain:()=>0,Set};
vm.createContext(physical);
vm.runInContext(clearance+'\nthis.inspect=physicalFollowEyeClearance;',physical);
const held={x:0,z:0,rx:.2,rz:2,bottom:3.9,top:4.25,kind:'market-arcade-roof'};
assert.equal(physical.inspect([0,4.02,0],[held]).clear,false,
 'live spectator camera must never sit inside the ACTUAL arcade clay roof');
assert.equal(physical.inspect([0,2,0],[held]).clear,true,
 'physical arcade leaves the genuine standing worker aisle clear below its eave');
assert.match(frame,/['"]market-arcade-roof['"]/,
 'all original arcade roofs must count as actual projected foreground obstruction');
assert.match(clearance,/['"]market-arcade-roof['"]/,
 'every actual arcade roof must enter physical camera clearance, not just a ray survey');

const director=section('function chooseFilmableWorker(rows,excluded=-1){',
 'function getLiveWorkDirectorStats(){');
assert.match(director,/shot\.workFacingMode!=='obstructed'/,
 'the documentary director must never describe an obstructed work shot as a clear front');
assert(!/state\.(food|wood|gold|t)\s*=/.test(fn),
 'physical arcade survey cannot mutate the authoritative economy or clock');
console.log('W240 source contract PASS: 8 camera bands on original 2 arcades, truthful director visibility; runtime WebGL and exact-frame visual review still required');
