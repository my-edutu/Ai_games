#!/usr/bin/env node
'use strict';
// W254 Phase 1 — real roof geometry, actual market unload sightline and
// complete merchant/market structure preservation (NOT an experience pass).
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
new vm.Script(js,{filename:'tiny-kingdom-original-playable.js'});
const pick=(begin,end)=>{const a=js.indexOf(begin),b=js.indexOf(end,a+begin.length);
 assert(a>0&&b>a,'missing production source '+begin+' / '+end);
 return js.slice(a,b)};
const scene={Math,Number,Error,Array,data:[],marketQuarterStats:{receivingBays:0,receivingHallPosts:0,receivingHallRoofPanels:0},
 MATERIAL:{STONE:1,WOOD:2,ROOF:3,PLASTER:4},
 FARMSTEAD:{granary:[29,-5.5]},terrain:(x,z)=>.018*Math.sin(x*.15+z*.3),
 rgb:color=>color,material:null,roofPolygons:[],
 materialScope:(kind,cb)=>{const old=scene.material;scene.material=kind;try{return cb()}finally{scene.material=old}},
 box:(...args)=>{assert(args.every(Number.isFinite));scene.data.push(...Array(360).fill(0))},
 limbSegment:(a,b,width)=>{assert(a.concat(b,[width]).every(Number.isFinite));scene.data.push(...Array(240).fill(0))},
 quad:(...args)=>{const vertices=args.slice(0,4);assert(vertices.flat().every(Number.isFinite));
  if(scene.material===scene.MATERIAL.ROOF)scene.roofPolygons.push(vertices);
  scene.data.push(...Array(60).fill(0))},
 tri:(a,b,c)=>{assert(a.concat(b,c).every(Number.isFinite));scene.data.push(...Array(30).fill(0))},
 marketReceivingDatum:null,tradeCorridorCameraEnvelopes:null
};
vm.createContext(scene);
vm.runInContext([
 pick('const MARKET_RECEIVING_HALL=Object.freeze(', '// W103:'),
 pick('function marketReceivingRoofDatum(', '\nfunction physicalReceivingHallPosts('),
 pick('function physicalReceivingHallPosts(', '\nfunction physicalTradeCorridorCameraVolumes('),
 pick('function physicalTradeCorridorCameraVolumes(', '\nfunction '),
 pick('function marketReceivingOpenFrontTruss(', '\nfunction '),
 pick('function marketReceivingSideEnclosure(', '\nfunction '),
 pick('function marketReceivingRoofInterior(', '\nfunction '),
 pick('function marketReceivingDock(', '\nfunction '),
 'this.profile=MARKET_RECEIVING_HALL;this.drawDock=marketReceivingDock;this.cameraVolumes=physicalTradeCorridorCameraVolumes;'
 ].join('\n'),scene);
const hall=scene.profile;
assert(Number.isFinite(hall.openSkyHalfWidth)&&hall.openSkyHalfWidth>=1.08&&
 hall.openSkyHalfWidth<1.28,
 'RED: market receiver must have full physical open-sky aisle at both real unload shelves');
scene.drawDock();
assert.equal(scene.marketQuarterStats.receivingBays,2,'real receiving shelves not lost');
assert.equal(scene.marketQuarterStats.receivingHallPosts,4,'original load-bearing posts survive');
assert.equal(scene.marketQuarterStats.receivingHallRoofPanels,18,
 'both pitched original roof wing panels exist');
assert.equal(scene.marketQuarterStats.receivingSoffitPanels,18,
 'physical interior rafters and roof soffits follow same real open roof wings');
assert(scene.marketQuarterStats.receivingOpenSkyWidth>=2.16,
 'roof opening must exist in playable market geometry, not cinematic masking');
assert.equal(scene.roofPolygons.length,18);
const center=hall.centerX;
assert(scene.roofPolygons.every(poly=>poly.every(p=>
 Math.abs(p[0]-center)>=hall.openSkyHalfWidth-1e-6)),
 'no roof triangles may cap the authentic unloading daylight slot');
const volumes=scene.cameraVolumes();
const roofs=volumes.filter(v=>v.kind==='receiving-hall-roof');
assert.equal(roofs.length,4,'both roof wings still physically occlude camera rays');
assert(roofs.every(v=>Math.abs(v.x-center)-v.rx>=hall.openSkyHalfWidth-.06),
 'camera physics must agree with the ACTUAL open roof geometry');
assert(volumes.some(v=>v.kind==='granary-porch-roof')&&
 volumes.some(v=>v.kind==='receiving-hall-post'),
 'farm-to-market physical sightlines must retain genuine posts and granary shelter');
assert(scene.data.every(Number.isFinite),'market geometry must remain finite');
assert.doesNotMatch(js.slice(js.indexOf('function marketReceivingOpenFrontTruss('),
 js.indexOf('function marketReceivingCourt(')),/Math\.random\s*\(|people\.push\s*\(|state\.food\s*[+\-=]/);
console.log('W254 source/geometry floor PASS: authentic real two-wing market roof, 2.16+m open-sky receiving aisle, preserved shelves, posts and courier camera collision. Visual/physical performance NOT PROVEN.');
