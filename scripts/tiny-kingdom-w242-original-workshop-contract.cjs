'use strict';
// W242 original civic massing geometry contract. This exercises the ACTUAL
// two-storey workshop authoring function, not a mock replacement mesh.
// Renderer/browser/HW performance and quality comparisons remain separate gates.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const first=html.indexOf('<script>'),end=html.lastIndexOf('</script>');
assert(first>=0&&end>first,'real Tiny Kingdom script must exist');
new vm.Script(html.slice(first+8,end),{filename:'tiny-kingdom-playable.js'});
function section(before,after){
 const a=html.indexOf(before),b=html.indexOf(after,a);
 assert(a>=0&&b>a,'missing original production section '+before);
 return html.slice(a,b);
}
const workshop=section('function highStreetCraftShop(x,z,variant){',
 '// W87: original receiving court to a REAL resident');
const street=section('function inhabitedHighStreet(){',
 '// W83: ONE physical granary-to-market service street');
assert.match(street,/highStreetCraftShop\(-14\.65,-3\.35,0\)/);
assert.match(street,/highStreetCraftShop\(14\.15,8\.25,1\)/);
assert.doesNotMatch(workshop,/\b(?:state\.(?:food|wood|gold|t)\s*=|people\.(?:push|splice)|city\.(?:push|splice))\b/,
 'civic architecture must not invent authoritative people, resources or homes');
const context={
 data:[],highStreetStats:{shopfronts:0},
 MATERIAL:{STONE:1,PLASTER:2,ROOF:3,WOOD:4,WINDOW_GLOW:5,GENERAL:6},
 rgb:()=>[.5,.5,.5],terrain:()=>0,
};
let bounds,usedMaterials,triangleCount;
const reset=()=>{
 context.data=[];
 context.highStreetStats={shopfronts:0};
 bounds={minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity,
  minZ:Infinity,maxZ:-Infinity};
 usedMaterials=new Set();triangleCount=0;
};
const mark=p=>{
 assert(p.length===3&&p.every(Number.isFinite),'finite original 3D vertex');
 bounds.minX=Math.min(bounds.minX,p[0]);bounds.maxX=Math.max(bounds.maxX,p[0]);
 bounds.minY=Math.min(bounds.minY,p[1]);bounds.maxY=Math.max(bounds.maxY,p[1]);
 bounds.minZ=Math.min(bounds.minZ,p[2]);bounds.maxZ=Math.max(bounds.maxZ,p[2]);
};
const emit=n=>{assert(Number.isInteger(n)&&n>0);context.data.length+=30*n;triangleCount+=n;};
context.materialScope=(material,fn)=>{usedMaterials.add(material);return fn();};
context.box=(x,y,z,w,h,d)=>{
 assert([x,y,z,w,h,d].every(Number.isFinite)&&w>0&&h>0&&d>0,
  'valid nondegenerate structural timber/stone/glass solid');
 mark([x-w/2,y,z-d/2]);mark([x+w/2,y+h,z+d/2]);emit(12);
};
context.tri=(a,b,c)=>{[a,b,c].forEach(mark);emit(1);};
context.quad=(a,b,c,d)=>{[a,b,c,d].forEach(mark);emit(2);};
context.limbSegment=(a,b,radius,color,sides=7)=>{
 mark(a);mark(b);assert(radius>0&&sides>=3&&sides<=24);
 emit(2*sides);
};
context.cylinder=(x,y,z,r,h,color,sides=8)=>{
 assert(r>0&&h>0&&sides>=3);
 mark([x-r,y,z-r]);mark([x+r,y+h,z+r]);emit(3*sides);
};
vm.createContext(context);
vm.runInContext(workshop+'\nthis.makeActualWorkshop=highStreetCraftShop;',context);
for(const [x,z,variant] of [[-14.65,-3.35,0],[14.15,8.25,1]]){
 reset();
 context.makeActualWorkshop(x,z,variant);
 const audit=context.highStreetStats;
 assert.equal(audit.shopfronts,1,'one existing shop, never a duplicate town structure');
 assert.equal(audit.upperWorkshopStoreys,1,'real two-storey civic geometry');
 assert.equal(audit.workshopFootprintsUnchanged,true,'preserved ground footprint');
 assert.equal(audit.workshopReconstructionTriangles,triangleCount,
  'accurate resource accounting from real authored geometry');
 assert(triangleCount>=600&&triangleCount<=1100,'bounded original detailed massing');
 assert(bounds.maxY>=4.65&&bounds.maxY<=5.25,'substantial upper room and pitched roof');
 assert(bounds.minY>=-.05,'supported above original ground, no buried synthetic shell');
 assert(bounds.minX>=x-2.05&&bounds.maxX<=x+2.05,
  'existing footprint/eaves do not expand into road at ground');
 assert(usedMaterials.has(context.MATERIAL.STONE)&&
  usedMaterials.has(context.MATERIAL.PLASTER)&&
  usedMaterials.has(context.MATERIAL.ROOF)&&
  usedMaterials.has(context.MATERIAL.WOOD)&&
  usedMaterials.has(context.MATERIAL.WINDOW_GLOW),
  'real stone, plaster, roof, oak and framed upper glass exist');
}
console.log('W242 structural civic reconstruction contract PASS; running WebGL, hardware p95 and independent visual criticism NOT PROVEN');
