'use strict';
// W240: authoritative stock/routes never change when the camera learns the
// geometry of the TWO existing inter-stall arcade roofs.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const js=html.match(/<script>([\\s\\S]*?)<\\/script>/);
assert(js,'real playable Tiny Kingdom script');
new vm.Script(js[1],{filename:'tiny-kingdom-original-game.js'});
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
const director=section('function chooseFilmableWorker(rows,excluded=-1){',
 'function getLiveWorkDirectorStats(){');
assert.match(director,/shot\.workFacingMode!=='obstructed'/,
 'the documentary director must never describe an obstructed work shot as a clear front');
assert.doesNotMatch(fn,/state\.(food|wood|gold|t)\s*[+\\-*/]?=/,
 'physical arcade survey cannot mutate the authoritative economy or clock');
console.log('W240 source contract PASS: 8 camera bands on original 2 arcades, truthful director visibility; runtime WebGL and exact-frame visual review still required');
