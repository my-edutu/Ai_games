'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const source=path.resolve(__dirname,'../../public/ai-dungeon/expedition-stonework.js');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(source,'utf8')
 .replace(/^import .*;\s*$/gm,'')).toString('base64'));
class Attribute{constructor(array,itemSize){this.array=array;this.itemSize=itemSize;this.count=array.length/itemSize}}
class Geometry{
 constructor(){this.attributes={};this.index=null;this.normalComputed=false;this.boundsComputed=false}
 setAttribute(name,attr){this.attributes[name]=attr;return this}
 getAttribute(name){return this.attributes[name]}
 setIndex(values){this.index=new Attribute(values,1);return this}
 computeVertexNormals(){this.normalComputed=true}
 computeBoundingBox(){this.boundsComputed=true}
 computeBoundingSphere(){this.sphereComputed=true}
}
const THREE={BufferGeometry:Geometry,Float32BufferAttribute:Attribute};
const vertex=(g,index)=>({x:g.getAttribute('position').array[index*3],y:g.getAttribute('position').array[index*3+1],z:g.getAttribute('position').array[index*3+2]});
const normalY=(a,b,c)=>(b.z-a.z)*(c.x-a.x)-(b.x-a.x)*(c.z-a.z);
test('CPU-original flagstone has a bounded *closed* physical beveled mesh, not a flat quad',async()=>{
 const {makeSoftwareChiselledFlagstone}=await load();
 const g=makeSoftwareChiselledFlagstone(THREE);
 assert.equal(g.getAttribute('position').count,16);
 assert.equal(g.index.count,84,'6 top + 6 bottom + 16 physical wall triangles');
 assert.equal(g.index.count/3,28);
 const upper=Array.from({length:8},(_,i)=>vertex(g,i));
 const lower=Array.from({length:8},(_,i)=>vertex(g,8+i));
 assert.ok(upper.every(p=>Math.abs(p.y-.017)<1e-9));
 assert.ok(lower.every(p=>Math.abs(p.y+.017)<1e-9));
 assert.ok(upper.every((p,i)=>Math.hypot(p.x,p.z)<Math.hypot(lower[i].x,lower[i].z)));
 assert.ok(normalY(vertex(g,0),vertex(g,1),vertex(g,2))>0,'walkable face upwards');
 assert.ok(normalY(vertex(g,8),vertex(g,10),vertex(g,9))<0,'closed underside downwards');
 const used=new Set(g.index.array);
 assert.equal(used.size,16,'the real walls and both caps share bounded geometry');
 assert.ok(g.normalComputed&&g.boundsComputed&&g.sphereComputed);
});
test('the software geometry is deterministic and its source footprint has the original chiselled corners',async()=>{
 const {makeSoftwareChiselledFlagstone}=await load();
 const a=makeSoftwareChiselledFlagstone(THREE),b=makeSoftwareChiselledFlagstone(THREE);
 assert.deepEqual(a.getAttribute('position').array,b.getAttribute('position').array);
 assert.deepEqual(a.index.array,b.index.array);
 assert.ok(Math.abs(vertex(a,8).x-(-.49))<1e-9);
 assert.ok(Math.abs(vertex(a,8).z-(+.40))<1e-9);
 assert.ok(Math.abs(vertex(a,12).x-.475)<1e-9);
 assert.ok(Math.abs(vertex(a,12).z-(-.28))<1e-9,'world z must match original rotated source shape');
});
