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
 assert.equal(result.triangles,56);
 assert.equal(scene.quads.length,22);
 assert.equal(scene.boxes.length,1,'one real oak tie, not an invented solid plaster block');
 assert.equal(scene.data.length,56*30);
 assert.equal(scene.getOriginalOccupiedUpperStoreyAudit().sideWindowOpenings,2);
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
 assert.ok(scene.quads.every(q=>q.slice(0,4).every(p=>p.length===3&&p.every(Number.isFinite))));
 assert.ok(scene.boxes.every(b=>b.slice(0,6).every(Number.isFinite)));
 assert.ok(scene.boxes.every(b=>b[3]>0&&b[4]>0&&b[5]>0));
});
test('W481 upper storey has bounded resident geometry at either actual tall-house height',()=>{
 for(const h of [3.27,3.73]){
  const scene=makeRoom();
  const r=scene.renderOriginalOccupiedUpperStorey(-8,1,12,2.82,2.28,h,1,[.7,.6,.5]);
  assert.equal(r.triangles,56);
  assert.equal(scene.getOriginalOccupiedUpperStoreyAudit().trianglesPerHome,56);
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
 for(const part of source.match(/<script>([\s\S]*?)<\/script>/g)||[])
  new Function(part.replace(/^<script>|<\/script>$/g,''));
});
