'use strict';
// W257 original late-market building contract — TWO existing textile/herb
// stalls gain inhabited-looking, real structural envelopes inside the original
// stall footprint. No fake merchants, market goods, navigation or resources.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const h=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const at=h.indexOf('<script>')+8,newScript=h.slice(at,h.indexOf('</script>',at));
new vm.Script(newScript);
const start=h.indexOf('function grainwardArtisanShopEnvelope(');
const end=h.indexOf('function marketStall(s,index){',start);
assert(start>=0&&end>start,'W257 original artisan structural bays missing');
const source=h.slice(start,end);
assert(!/\b(?:people|state|city|rand|Math\.random|routeBetween|walkable|deliveryReceipts)\b/.test(source),
 'Market art must never alter authoritative trade or residents');
assert.match(h,/if\(!profile\.structural\)grainwardArtisanShopEnvelope\(s,index,profile\)/,
 'Both original non-tradehouse stalls must use the permanent artisan shell');
function inspect(index){
 const stall={x:index===2?4.30:-5.75,z:index===2?8.50:8.70,face:-1};
 const boxes=[],quads=[],timbers=[];
 const c={Math,Error,Number,
  data:[],marketQuarterStats:{artisanShells:0,artisanShellTriangles:0,
   artisanShellWallPanels:0,artisanShellJoinery:0},
  rgb:n=>[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255],
  terrain:(x,z)=>.018*x-.008*z,
  MATERIAL:{STONE:1,PLASTER:2,WOOD:3,ROOF:4},
  materialScope:(_,fn)=>fn()};
 c.box=(...args)=>{boxes.push(args);c.data.push(...Array(360).fill(0))};
 c.quad=(...args)=>{quads.push(args);c.data.push(...Array(60).fill(0))};
 c.tri=(...args)=>{quads.push(args);c.data.push(...Array(30).fill(0))};
 c.limbSegment=(...args)=>{timbers.push(args);c.data.push(...Array(300).fill(0))};
 vm.createContext(c);vm.runInContext(source,c);
 const a=c.grainwardArtisanShopEnvelope(stall,index,{structural:false,eave:2.16,peak:2.92});
 assert.equal(a.onlyOriginalShop,true);
 assert.equal(a.openGroundBuyerFace,true);
 assert.equal(a.addedWorkers,0);
 assert.equal(a.addedInventory,0);
 assert.equal(a.navigationChanged,false);
 assert.equal(c.marketQuarterStats.artisanShells,1);
 assert.equal(a.triangles,c.data.length/30);
 assert(a.triangles>=100&&a.triangles<=420,'visible structural detail must be bounded');
 assert(quads.length>=15&&boxes.length>=7&&timbers.length>=5,
  'Actual plaster, weathered stone, timber and gable architecture must have physical volume');
 for(const polygon of quads)for(const point of polygon.slice(0,-1)){
  assert(Array.isArray(point)&&point.length===3&&point.every(Number.isFinite),
   'Market wall geometry must have finite 3D positions');
 }
 assert(boxes.every(b=>b.slice(0,6).every(Number.isFinite)));
 assert(timbers.every(b=>b[0].every(Number.isFinite)&&b[1].every(Number.isFinite)));
 // Do not put a new opaque wall across either original counter, the
 // farmer's genuine receipt corridor or a shopper's front access.
 const y=c.terrain(stall.x,stall.z),front=stall.z+stall.face*.83;
 assert(!boxes.some(([x,cy,z,w,height])=>Math.abs(z-front)<.15&&w>1.3&&height>.5&&cy<y+1.55),
  'The original buyer face must remain physically open');
 return a;
}
const east=inspect(2),west=inspect(3);
assert.equal(east.triangles,west.triangles,'both same-footprint artisan shells completed');
console.log('W257 PASS two existing original artisan bay envelopes, original accessible counters, finite bounded geometry, no invented economic authority');
