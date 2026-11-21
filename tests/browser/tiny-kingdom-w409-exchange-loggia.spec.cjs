'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const begin=html.indexOf('const EXCHANGE_CANOPY=Object.freeze(');
const end=html.indexOf('/* G095:',begin);
assert.ok(begin>=0&&end>begin,'W409 canonical civic exchange source available');
const source=html.slice(begin,end);
function originalPhysicalModel(){
 const ctx={terrain:()=>0,Math,Number};
 vm.createContext(ctx);
 vm.runInContext(source,ctx,{timeout:1000});
 return {ctx,canopy:vm.runInContext('EXCHANGE_CANOPY',ctx),
  solids:ctx.physicalVillageExchangeVolumes()};
}
test('W409 RED→GREEN: one original four-post outboard loggia shares exact renderer and camera measurements',()=>{
 const {canopy,solids}=originalPhysicalModel();
 assert.ok(canopy.supportX>=1.5&&canopy.supportX<canopy.roofX,
  'real carved posts sit outside the active weighing table but under eaves');
 assert.ok(canopy.supportZ>.6&&canopy.supportZ<canopy.roofZ);
 assert.ok(canopy.roofX>=1.85&&canopy.roofZ>=1.2);
 assert.ok(canopy.minimumClearance>=3&&canopy.eave>canopy.minimumClearance);
 const posts=solids.filter(v=>v.kind==='village-market-post');
 assert.equal(posts.length,4,'all four REAL ground-bearing posts remain');
 for(const post of posts){
  assert.ok(Math.abs(Math.abs(post.x)-canopy.supportX)<1e-8);
  assert.ok(Math.abs(Math.abs(post.z-5)-canopy.supportZ)<1e-8);
 }
 const roofs=solids.filter(v=>v.kind==='village-market'||v.kind==='village-market-roof');
 assert.equal(roofs.length,4,'continuous, original pitched solid roof maintained');
 const table=solids.find(v=>v.kind==='village-market-counter');
 assert.ok(table&&Math.abs(table.rx*2-canopy.tableWidth)<1e-8);
 assert.ok(Math.abs(table.rz*2-canopy.tableDepth)<1e-8);
 assert.ok(canopy.tableDepth<=.85,'real central balance retains an open buyer work bay');
 assert.match(source,/box\(x,y\+\.79,z,EXCHANGE_CANOPY\.tableWidth/);
 assert.match(source,/centralExchangeStats\.originalPostsRetained=centralExchangeStats\.originalPostPositions===4/);
 assert.match(source,/centralExchangeStats\.authoritativeChanges=false/);
 assert.doesNotMatch(source,/state\.[a-zA-Z]+\s*=(?!=)/,
  'no new fake inventory, actor work, purchases or saved state');
});
test('W409 central civic roof, tabletop, four posts and knee joints are real geometry, never a camera-only omission',()=>{
 const {canopy,solids}=originalPhysicalModel();
 assert.match(source,/box\(px,py\+\.10,pz,\.12,EXCHANGE_CANOPY\.postTop-\.10/);
 assert.match(source,/limbSegment\(\[px,py\+EXCHANGE_CANOPY\.eave-\.57,pz\]/);
 assert.match(source,/for\(const sx of \[-1,1\]\)for\(const sz of \[-1,1\]\)/);
 assert.match(source,/EXCHANGE_CANOPY\.roofX/);
 assert.match(source,/EXCHANGE_CANOPY\.roofZ/);
 assert.ok(solids.every(v=>Number.isFinite(v.x)&&Number.isFinite(v.z)&&v.rx>0&&v.rz>0&&v.top>v.bottom));
 assert.ok(canopy.tableWidth<2.6&&canopy.tableDepth<1.0);
});
