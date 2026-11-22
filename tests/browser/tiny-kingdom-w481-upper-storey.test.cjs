'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const start=source.indexOf('// W481: the real tall founding homes now have');
const end=source.indexOf('function house(x,z,scale=1,variant=0)',start);
function makeRoom(){
 assert.ok(start>=0&&end>start,'RED before W481: no genuine hollow upper room');
 const data=[],quads=[],boxes=[];
 const api=new Function('data','quad','box','materialScope','MATERIAL','rgb',
  source.slice(start,end)+'return {renderOriginalOccupiedUpperStorey,getOriginalOccupiedUpperStoreyAudit};')(
  data,(...f)=>{quads.push(f);for(let i=0;i<60;i++)data.push(0)},
  (...b)=>{boxes.push(b);for(let i=0;i<360;i++)data.push(0)},
  (_,fn)=>fn(),{PLASTER:8,WOOD:6},v=>v);
 return {data,quads,boxes,...api};
}
test('W481 original tall-home upper floor is physically hollow with two open casement reveals',()=>{
 const scene=makeRoom(),x=7,z=-4,w=3,d=2.4;
 const result=scene.renderOriginalOccupiedUpperStorey(x,0,z,w,d,3.73,1,[1,1,1]);
 assert.equal(result.triangles,164);
 assert.equal(scene.quads.length,46);
 assert.equal(scene.boxes.length,6,'one exposed tie, two joists, sleeping platform, chest and mattress');
 assert.equal(scene.data.length,164*30);
 assert.equal(scene.getOriginalOccupiedUpperStoreyAudit().sideWindowOpenings,2);
 assert.equal(scene.getOriginalOccupiedUpperStoreyAudit().rearWindowOpenings,2);
 assert.equal(scene.getOriginalOccupiedUpperStoreyAudit().frontWindowOpenings,2);
 assert.equal(scene.getOriginalOccupiedUpperStoreyAudit().loftFurnishings,3);
 assert.equal(scene.getOriginalOccupiedUpperStoreyAudit().additionalGpuBuffers,0);
 assert.equal(scene.getOriginalOccupiedUpperStoreyAudit().changedAuthority,false);
 assert.equal(scene.getOriginalOccupiedUpperStoreyAudit().insertedResidents,0);
 const windowZ=[z-.285,z+.285],windowY=[2.39,2.83];
 for(const side of [-1,1]){
  const fx=x+side*(w+.28)/2;
  const sideFaces=scene.quads.filter(q=>q.slice(0,4).every(p=>Math.abs(p[0]-fx)<1e-8));
  assert.equal(sideFaces.length,8,'two-sided exterior wall with four panels, not a filled casement');
  for(const face of sideFaces){
   const ys=face.slice(0,4).map(p=>p[1]),zs=face.slice(0,4).map(p=>p[2]);
   const overlapsY=Math.min(...ys)<windowY[1]-1e-7&&Math.max(...ys)>windowY[0]+1e-7;
   const overlapsZ=Math.min(...zs)<windowZ[1]-1e-7&&Math.max(...zs)>windowZ[0]+1e-7;
   assert.ok(!(overlapsY&&overlapsZ),'actual side casement aperture must remain EMPTY');
  }
 }
 const rear=z+(d+.30)/2;
 const rearFaces=scene.quads.filter(q=>q.slice(0,4)
  .every(p=>Math.abs(p[2]-rear)<1e-8));
 assert.equal(rearFaces.length,14,'three support piers plus actual daylight lintels and sills, two-sided');
 for(const face of rearFaces){
  const ys=face.slice(0,4).map(p=>p[1]),xs=face.slice(0,4).map(p=>p[0]);
  const intersectsY=Math.min(...ys)<windowY[1]-1e-7&&Math.max(...ys)>windowY[0]+1e-7;
  for(const cx of [x-w*.25,x+w*.25]){
   const intersectsX=Math.min(...xs)<cx+.18-1e-7&&Math.max(...xs)>cx-.18+1e-7;
   assert.ok(!(intersectsY&&intersectsX),'rear daylight opening is not sealed by plaster');
  }
 }
 const front=z-(d+.30)/2;
 const frontFaces=scene.quads.filter(q=>q.slice(0,4)
  .every(p=>Math.abs(p[2]-front)<1e-8));
 assert.equal(frontFaces.length,14,'two outward/inward surfaces around TWO real frontage casements');
 const cy=Math.min(3.73-.43,Math.max(2.08,3.73-.69));
 for(const face of frontFaces){
  const ys=face.slice(0,4).map(p=>p[1]),xs=face.slice(0,4).map(p=>p[0]);
  const overlapY=Math.min(...ys)<cy+.18-1e-7&&Math.max(...ys)>cy-.32+1e-7;
  for(const wx of [x-w*.22,x+w*.22]){
   const overlapX=Math.min(...xs)<wx+.19-1e-7&&Math.max(...xs)>wx-.19+1e-7;
   assert.ok(!(overlapY&&overlapX),'real frontage opening must not have plaster across it');
  }
 }
 assert.match(source,/if\(isCompact\)materialScope\(MATERIAL\.WINDOW_GLOW/);
 assert.ok(scene.quads.every(q=>q.slice(0,4).every(p=>p.length===3&&p.every(Number.isFinite))));
 assert.ok(scene.boxes.every(b=>b.slice(0,6).every(Number.isFinite)));
 assert.ok(scene.boxes.every(b=>b[3]>0&&b[4]>0&&b[5]>0));
});
test('W481 upper storey has bounded resident geometry at either actual tall-house height',()=>{
 for(const h of [3.27,3.73]){
  const scene=makeRoom();
  const r=scene.renderOriginalOccupiedUpperStorey(-8,1,12,2.82,2.28,h,1,[.7,.6,.5]);
  assert.equal(r.triangles,164);
  assert.equal(scene.getOriginalOccupiedUpperStoreyAudit().trianglesPerHome,164);
 }
 const scene=makeRoom();
 assert.throws(()=>scene.renderOriginalOccupiedUpperStorey(0,0,0,3,2,2.8,1,[1,1,1]),/invalid dimensions/);
});
test('W481 retains actual housing cache, open room, economy and fully parsed original game',()=>{
 assert.match(source,/renderOriginalOccupiedUpperStorey\(x,y,z,w,d,h,scale,plasterTone\)/);
 assert.doesNotMatch(source,/box\(x,y\+2\.19\*scale,z,w\+\.28\*scale,h-2\.19\*scale,/);
 assert.match(source,/y1=y\+\(h>2\.5\*scale\?2\.15\*scale:h-\.025\*scale\)/);
 assert.match(source,/getCompactOccupiedRoomAudit,getCompactUpperLoftAudit,getOriginalOccupiedUpperStoreyAudit/);
 assert.match(source,/function exportSnapshot\(\)/);
 assert.match(source,/function marketSupplyView\(\)/);
 assert.match(source,/W482: parked open oak casements instead of four opaque flat blue/);
 assert.match(source,/w483-six-open-sided-authentic-loft-no-false-glass-v5/);
 assert.doesNotMatch(source,/materialScope\(MATERIAL\.WINDOW_GLOW,\(\)=>\{\s*for\(const side of \[-1,1\]\)\{\s*const sx=x\+side\*\(w\*\.5\+\.154\*scale\)/);
 for(const part of source.match(/<script>([\s\S]*?)<\/script>/g)||[])
  new Function(part.replace(/^<script>|<\/script>$/g,''));
});
