'use strict';
// W385: live exchange camera bounds must match the ORIGINAL emitted building,
// not a phantom opaque low roof that hides a real market buyer. Test-first.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const from=(a,b)=>{
 const x=html.indexOf(a),y=html.indexOf(b,x+a.length);
 assert(x>=0&&y>x,'Missing real market/camera source '+a);
 return html.slice(x,y);
};
const inline=html.slice(html.indexOf('<script>')+8,html.indexOf('</script>',html.indexOf('<script>')));
new vm.Script(inline);
const exchange=from('function physicalVillageExchangeVolumes(){','/* G095:');
const context={terrain:()=>0,Math,Number,Error};
vm.runInNewContext(exchange,context,{timeout:1500});
const solids=context.physicalVillageExchangeVolumes();
assert.equal(solids.length,9,'4 sloped clay roof bands, four actual posts and one existing trading table');
const roof=solids.filter(v=>v.kind==='village-market'||v.kind==='village-market-roof');
const posts=solids.filter(v=>v.kind==='village-market-post');
assert.equal(roof.length,4,'accurate original double-pitched market roof');
assert.equal(posts.length,4,'exact original oak corner uprights');
assert.equal(solids.filter(v=>v.kind==='village-market-counter').length,1);
assert.equal(roof.filter(v=>v.kind==='village-market').length,1,'retain prior public camera audit category');
for(const volume of solids)
 assert([volume.x,volume.z,volume.rx,volume.rz,volume.bottom,volume.top].every(Number.isFinite)&&
  volume.rx>0&&volume.rz>0&&volume.top>volume.bottom,'legal real physical roof or counter');
assert(roof.every(v=>v.bottom>2.22&&v.top<3.23),'roof bounds track real 2.35m eaves / 3.14m ridge');
assert(posts.every(v=>v.top>=2.38-1e-8),'actual wood posts are never hidden from sightline physics');
assert(solids.some(v=>v.kind==='village-market-counter'&&v.bottom<.70),'original trade table remains physical');
const camera=from('function followCameraRoofs(){','function cameraOcclusionModel(){');
assert.match(camera,/roofs\.push\(\.\.\.physicalVillageExchangeVolumes\(\)\)/,
 'camera must use physical roof bands, posts and counter, not the historical incorrect y=1.51-2.31 box');
assert.doesNotMatch(camera,/top:my\+2\.31/,'do not reconstruct phantom opaque trader roof');
const market=from('function market(x,z){','/* G095:');
assert.match(market,/renderOriginalMarketExchangeJoinery\(x,y,z\)/,
 'the original exchange must have real stone footings and subroof timber instead of an empty unsupported plane');
assert.match(from('function renderOriginalMarketExchangeJoinery(','function market(x,z){'),
 /materialScope\(MATERIAL\.WOOD/,'real material-batched structural joinery');
console.log('W385 PASS: real market counter, four posts, four clay slopes, native joinery and source-matched physically legal camera; no authority edits. Running footage/FPS NOT PROVEN.');
