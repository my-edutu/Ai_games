'use strict';
// W420 Phase 1: actual medieval citizen joints and market grain presentation.
// Execute extracted ORIGINAL geometry functions; never synthesize an actor or trade.
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
function block(start,end){
 const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'missing actual game geometry contract: '+start);
 return source.slice(a,b);
}
const skin=block('function packedSmoothLimbQuad(','function renderArticulatedHand(');
assert.match(skin,/function taperedMedievalLimb\(/);
assert.match(skin,/packedSmoothLimbQuad\(p0,p1,p2,p3/);
function renderTaper(a,b,r0,r1,sides){
 const data=[],ctx={data,currentMaterial:7,packedRing:()=>null,Math};
 vm.runInNewContext(skin,ctx,{timeout:1200});
 ctx.taperedMedievalLimb(a,b,r0,r1,[.65,.48,.32],sides);
 return data;
}
const norm=(d,o)=>[d[o+3],d[o+4],d[o+5]];
const pos=(d,o)=>[d[o],d[o+1],d[o+2]];
const near=(a,b,eps=1e-6)=>a.every((x,i)=>Math.abs(x-b[i])<eps);
for(const entry of [
 {a:[0,0,0],b:[0,1,0],r0:.20,r1:.12,sides:6},
 {a:[1,.5,2],b:[1.45,1.5,1.4],r0:.15,r1:.09,sides:6},
 {a:[1,.2,3],b:[2,.4,3.3],r0:.08,r1:.05,sides:4}
]){
 const d=renderTaper(entry.a,entry.b,entry.r0,entry.r1,entry.sides);
 assert.equal(d.length,entry.sides*6*10,'no added triangles or missing role joints');
 const unit=entry.b.map((x,i)=>(x-entry.a[i])/Math.hypot(...entry.b.map((v,j)=>v-entry.a[j])));
 for(let i=0;i<d.length;i+=10){
  const p=pos(d,i),n=norm(d,i);
  assert.ok([...p,...n].every(Number.isFinite));
  assert.ok(Math.abs(Math.hypot(...n)-1)<1e-5,'valid continuous unit vertex normals');
  assert.deepEqual(d.slice(i+6,i+10),[.65,.48,.32,7],'preserve original 10-float material contract');
  const q=p.map((x,j)=>x-entry.a[j]);
  const along=q.reduce((v,x,j)=>v+x*unit[j],0);
  const radial=q.map((x,j)=>x-unit[j]*along);
  assert.ok(radial.reduce((v,x,j)=>v+x*n[j],0)>0,'outward skin surface, not inside-out mesh');
 }
 for(let i=0;i<entry.sides;i++){
  const facet=i*60,next=((i+1)%entry.sides)*60;
  assert.ok(near(pos(d,facet+10),pos(d,next)),'original ring vertices meet exactly');
  assert.ok(near(norm(d,facet+10),norm(d,next)),
   'smooth radial normals continue across every original polygon seam');
  assert.ok(near(pos(d,facet+20),pos(d,next+50)),
   'real rigged limb far ring connects to the next panel');
  assert.ok(near(norm(d,facet+20),norm(d,next+50)),
   'far joint normals remain continuous with no flat-shaded polygon flashes');
  assert.ok(!near(norm(d,facet),norm(d,facet+10)),
   'workskin face has four authentic distinct vertex normals, not flat plastic');
 }
}
assert.equal(renderTaper([1,1,1],[1,1,1],.1,.1,6).length,0,
 'zero-length IK motion remains bounded');

// Genuine palm at actual wrist: no longer the cuboid that clipped through tools.
// It must use the same bounded smooth joint writer, not spawn an extra hand.
const palm=block('function renderArticulatedHand(','// A few intentional, large forms');
assert.match(palm,/taperedMedievalLimb\(\[x,y\+/);
assert.doesNotMatch(palm,/box\(x,y-\.008\*size/);

// Real inventory-only canvas: the stock body's upper mouth is gathered and
// its physical base rests flatter on the existing counter, never another bag.
const sack=block('function emitLivedCanvasSack(','let marketStallStockRenderStats');
const sackData=[],cloth={
 data:sackData,
 MATERIAL:{GENERAL:0,WOOD:1},Math,
 materialScope:(_id,fn)=>fn(),
 rgb:()=>[.6,.5,.4],
 ellipsoid:(x,y,z,rx,ry,rz)=>{
  for(const v of [-.9,.9])for(const u of [-.6,0,.6])
   sackData.push(x+u*rx,y+v*ry,z+.6*rz,0,0,1,.6,.5,.4,0);
 },
 cylinder:()=>{},limbSegment:()=>{}
};
vm.runInNewContext(sack,cloth,{timeout:1200});
const shape=cloth.emitLivedCanvasSack(0,1,0,.3,.25,.25,0);
assert.equal(shape.triangles,2,'no additional invented inventory or triangles');
const lower=[0,10,20].map(i=>sackData[i]),upper=[30,40,50].map(i=>sackData[i]);
assert.ok(Math.max(...upper)-Math.min(...upper)<.92*(Math.max(...lower)-Math.min(...lower)),
 'real tied sack narrows near original counted mouth');
assert.ok(sackData[1]>.775,'true market sack settles into a flattened supported base');
assert.equal(shape.authoritativeInventoryUnchanged,true);
console.log('W420 original smooth IK skin / lived-in stock: PASS, exact rings and resources');
