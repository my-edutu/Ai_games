'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/physical-feedback-visuals.js')).href);

function geometryFixture(){
 class BufferGeometry{
  constructor(){this.attributes={};this.index=[];this.normalsComputed=false}
  setAttribute(key,value){this.attributes[key]=value}
  setIndex(value){this.index=value}
  computeVertexNormals(){this.normalsComputed=true}
 }
 class Float32BufferAttribute{
  constructor(array,itemSize){this.array=Float32Array.from(array);this.itemSize=itemSize}
 }
 return {BufferGeometry,Float32BufferAttribute};
}
function projectedArea(geometry,plane){
 const vertices=geometry.attributes.position.array,index=geometry.index;
 let area=0;
 const uv=(i)=>{
  const k=3*i;
  if(plane==='YZ')return [vertices[k+1],vertices[k+2]];
  if(plane==='XY')return [vertices[k],vertices[k+1]];
  // View diagonally along X+Z; projection basis Y and (X-Z)/sqrt(2).
  return [vertices[k+1],(vertices[k]-vertices[k+2])/Math.SQRT2];
 };
 for(let i=0;i<index.length;i+=3){
  const [ax,ay]=uv(index[i]),[bx,by]=uv(index[i+1]),[cx,cy]=uv(index[i+2]);
  area+=Math.abs((bx-ax)*(cy-ay)-(by-ay)*(cx-ax))*.5;
 }
 return area;
}
test('D04 sword streak uses one bounded retained geometry visible from orthogonal and oblique viewpoints',async()=>{
 const {createOriginalBladeStreakGeometry}=await load();
 const geometry=createOriginalBladeStreakGeometry(geometryFixture());
 const pos=geometry.attributes.position;
 assert.equal(pos.itemSize,3);
 assert.ok(geometry.normalsComputed);
 assert.ok(geometry.index.length>0&&geometry.index.length<=192,
  'one compact geometry, not extra draw-call meshes');
 assert.equal(geometry.index.length%3,0);
 assert.ok(projectedArea(geometry,'XY')>.015,'front-view visible ribbon');
 assert.ok(projectedArea(geometry,'YZ')>.015,
  'side-view must not collapse to edge-on/invisible geometry');
 assert.ok(projectedArea(geometry,'DIAGONAL')>.015,
  'diagonal view must retain meaningful projected blade silhouette');
 for(let i=0;i<pos.array.length;i+=3){
  const x=pos.array[i],y=pos.array[i+1],z=pos.array[i+2];
  assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&Number.isFinite(z));
  assert.ok(Math.abs(x)<=.035&&Math.abs(z)<=.035,
   'do not inflate wrist-proxy trail into a large neon blade');
  assert.ok(y>=-.501&&y<=.501);
 }
 assert.equal(geometry.attributes.uv.array.length,pos.array.length/3*2);
 assert.ok(geometry.index.every(i=>i>=0&&i<pos.array.length/3));
});
