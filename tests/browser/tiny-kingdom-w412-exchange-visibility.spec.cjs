'use strict';
// W412: market physical-frame + honest camera witness, original playable world.
// This test rejects ignoring the four REAL exchange posts or double-counting
// them as new camera solids. No invented merchant, goods or navigation change.
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
function section(start,end){
 const a=html.indexOf(start),b=html.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'original game source anchors: '+start);
 return html.slice(a,b);
}
test('W412 real civic weighing exchange is a roof-supported open market, not a foreground wall',()=>{
 const contract=section('const EXCHANGE_CANOPY=Object.freeze(', 'function renderOriginalMarketExchangeJoinery(');
 const ctx={Object,Math};vm.createContext(ctx);
 vm.runInContext(contract,ctx,{timeout:1000});
 const c=vm.runInContext('EXCHANGE_CANOPY',ctx);
 assert.ok(c.supportX>=2.65 && c.supportX<=2.9,'structural posts must move OUTBOARD of genuine traders');
 assert.ok(c.supportZ>0.5&&c.supportZ<.8,'real posts remain clear of adjoining stall posts');
 assert.ok(c.roofX>c.supportX+.2 && c.roofX<c.supportX+.5,'roof wings stay supported, not floating');
 assert.ok(c.roofZ>=c.supportZ+.5,'original extended oak roof shelters genuine commerce');
 assert.ok(c.openSkyHalfWidth>=1.47&&c.openSkyHalfWidth<c.supportX-.7);
 assert.equal(c.tableWidth,2.34,'actual original weighing counter stays at its original position');
 const mesh=section('function market(x,z){','// W410: the original four stone-footed posts');
 const solids=section('function physicalVillageExchangeVolumes(){','/* G095:');
 assert.match(mesh,/EXCHANGE_CANOPY\.supportX/);assert.match(mesh,/EXCHANGE_CANOPY\.openSkyHalfWidth/);
 assert.match(solids,/EXCHANGE_CANOPY\.supportX/);
 assert.doesNotMatch(mesh,/people\.(push|splice)|state\.(food|wood|gold)\s*=/);
});
test('W412 four actual exchange posts are surveyed, memoized, and never duplicated as physical wall volumes',()=>{
 const posts=section('function physicalMarketUprights(){','// W342:');
 assert.match(posts,/EXCHANGE_CANOPY\.supportX/);
 assert.match(posts,/EXCHANGE_CANOPY\.supportZ/);
 assert.match(posts,/marketUprightMemo/);
 const camera=section('function followCameraRoofs(){','function cameraOcclusionModel(');
 // The four physical exchange posts already exist in physicalVillageExchangeVolumes.
 // Include them in post-specific sightline checks but only ONCE in AABB ray index.
 assert.match(camera,/post\.kind==='exchange'/);
 assert.match(camera,/physicalVillageExchangeVolumes\(\)/);
 const sight=section('function marketCourierPostSightline(', '/* W67');
 assert.match(sight,/physicalMarketUprights\(\)\.concat\(physicalReceivingHallPosts\(\)\)/);
 assert.doesNotMatch(posts,/people\.|state\.|Math\.random/);
});
