'use strict';
// W411: RED-before-GREEN physical market gallery and genuine mobile workday.
// This contract inspects the ORIGINAL game source, not a synthetic scene.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
function excerpt(a,b){
 const first=html.indexOf(a),last=html.indexOf(b,first+a.length);
 assert.ok(first>=0&&last>first,'W411 required original source: '+a);
 return html.slice(first,last);
}
test('W411 authentic roof-supported four-post market loggia is outside the physical buyer aisle',()=>{
 const source=excerpt('function marketStallPostPlacement(', 'function marketStall(s,index)');
 const ctx={Math};vm.createContext(ctx);
 vm.runInContext(source,ctx,{timeout:1000});
 for(const stall of [{x:-5.4,z:2.25,face:1},{x:4.45,z:2.95,face:1},{x:4.3,z:8.5,face:-1}]){
  for(const side of [-1,1]){
   const front=ctx.marketStallPostPlacement(stall,side,stall.face);
   const rear=ctx.marketStallPostPlacement(stall,side,-stall.face);
   assert.ok(Math.abs(front.x-stall.x)>=1.76&&Math.abs(front.x-stall.x)<2.0,
    'outboard real front supports leave a wide unobstructed trade frontage');
   assert.ok(Math.abs(rear.x-stall.x)>=1.33&&Math.abs(rear.x-stall.x)<1.6,
    'real rear posts remain under the same enlarged pitched roof');
   assert.equal(front.z,stall.z+stall.face*.84);
   assert.equal(rear.z,stall.z-stall.face*.84);
  }
  assert.equal(ctx.marketStallSignPlacement(stall).realMarketTrade,stall.trade);
 }
 const stallMesh=excerpt('function marketStall(s,index)', '// W389:');
 assert.match(stallMesh,/const courses=tiled\?7:6,edge=1\.9/);
 assert.match(stallMesh,/marketStallPostPlacement\(s,sx,sz\)/);
 assert.match(stallMesh,/renderOpenRearTradeScreen\(s,timber,trim\)/);
 assert.match(stallMesh,/box\(x,y\+\.87,z\+face\*\.25/);
 assert.doesNotMatch(stallMesh,/box\(x,y\+\.84,z,w-\.18,\.12,d-\.28/);
 assert.doesNotMatch(source,/Math\.random|state\.food|state\.gold|\.activity\s*=/);
 const physical=excerpt('function physicalMarketUprights()', '// W342:');
 assert.match(physical,/marketStallPostPlacement\(stall,sx,sz\)/);
});
test('W411 portrait trading documentary prioritizes actual physically clear work and wider distance before raw actor scale',()=>{
 const camera=excerpt('function planCitizenCamera(', '/* W58');
 assert.match(camera,/marketBarter\?Math\.max\(0,\(portraitLens\?\.235:\.26\)-shot\.projectedWorkerHeightFraction\)\*2700/);
 assert.match(camera,/marketBarter\?\(portraitLens\?\[3\.7,4\.5,5\.4,6\.4,7\.4\]/);
 assert.match(camera,/marketBarterReadable/);
 assert.match(camera,/marketBarterPartialCandidates/);
 assert.match(camera,/readableMarketBarterShot\(shot,framing,portraitLens\)/);
 assert.doesNotMatch(camera,/citizen\.(x|z|activity)\s*=(?!=)/);
});
