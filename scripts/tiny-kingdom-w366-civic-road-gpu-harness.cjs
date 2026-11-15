'use strict';
// W366 executes the real civic buffer residency function, not a synthetic game.
// An actually changed street triangle must not re-upload unchanged original roads.
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const extract=(begin,end)=>{
 const a=html.indexOf(begin),b=html.indexOf(end,a+begin.length);
 assert(a>=0&&b>a,'Missing production resident civic segment: '+begin);
 return html.slice(a,b);
};
const production=extract('function planResidentVertexUpload(','function getResidentDeltaUploadAudit()')+
 extract('function rememberCivicScenery(','// G140: resident original settlement VBOs');
const e={
 Float32Array,Number,Math,Map,Object,
 data:[],currentMaterial:0,civicGpuResidencyEnabled:true,
 CIVIC_CACHE_FLOAT_BUDGET:3000,CIVIC_CACHE_MAX_ENTRIES:5,
 civicSceneryCache:new Map(),civicCacheBuilds:0,civicCacheReuses:0,
 civicCacheEvictions:0,civicActiveKey:'',civicBuffer:null,
 civicChunkRanges:[],civicGpuUploads:0,civicGpuDisposals:0,
 civicGpuResidencyFailures:0,civicRoadBufferRecycles:0,
 civicRoadBufferSubUploads:0,civicRoadBufferReallocations:0,
 civicRoadBytesUploaded:0,civicCoreBuffer:null,activeCivicCoreKey:'',
 civicRoadDeltaPartialUploads:0,civicRoadDeltaUnchangedUploads:0,
 civicRoadDeltaFullUploads:0,civicRoadDeltaAvoidedBytes:0,civicRoadDeltaLastWindow:null,
 gl:{ARRAY_BUFFER:34962,STATIC_DRAW:35044,DYNAMIC_DRAW:35048},
 packLinearResidentScenery:mesh=>({vertices:mesh,ranges:[
  {first:0,count:mesh.length/10,minX:0,maxX:1,minY:0,maxY:1,minZ:0,maxZ:1}]}),
 packSpatialScenery:()=>{throw Error('unexpected spatial scatter')},
 releaseGeometryBuffer:buffer=>{if(buffer)buffer.deleted=true},
 civicCacheStats:()=>({cachedFloats:[...e.civicSceneryCache.values()]
   .reduce((n,item)=>n+item.vertices.length,0),
  cachedGpuFloats:[...e.civicSceneryCache.values()]
   .reduce((n,item)=>n+(item.capacityFloats||item.vertices.length),0)}),
 calls:[],recycled:[]
};
e.gl.createBuffer=()=>({arr:null});
e.bindGeometry=buffer=>{e.bound=buffer;};
e.gl.bufferData=(target,payload)=>{
 assert.equal(target,e.gl.ARRAY_BUFFER);
 e.bound.arr=typeof payload==='number'?
  new Float32Array(payload/4):Float32Array.from(payload);
};
e.gl.bufferSubData=(target,offset,values)=>{
 assert.equal(target,e.gl.ARRAY_BUFFER);
 assert.equal(offset%120,0,'uploads must align with original 30-float triangles');
 assert(e.bound?.arr);
 e.bound.arr.set(values,offset/4);
 e.calls.push({offset,bytes:values.byteLength});
};
const remember=new Function('env','with(env){'+production+
 ';return rememberCivicScenery;}')(e);
const tri=id=>Array.from({length:30},(_,i)=>id*100+i+.25);
const mesh=(...ids)=>new Float32Array(ids.flatMap(tri));
function stage(label,vertices){
 e.calls=[];
 const key='temperate:actual-civic-roads:'+label;
 assert.equal(remember(key,vertices,{source:'actual village street graph'}),true);
 const entry=e.civicSceneryCache.get(key);
 assert(entry?.buffer?.arr);
 assert.deepEqual(Array.from(entry.buffer.arr.subarray(0,vertices.length)),
  Array.from(vertices),'GPU civic mesh differs from actual exact original triangles');
 assert.equal(entry.buffer.deleted,undefined,'active physical civic buffer was disposed');
 return {calls:e.calls.slice(),entry};
}
const first=stage('home-1',mesh(1,2));
assert(first.entry.buffer.arr.length>=60,'initial real civic GPU allocation exists');
const edited=stage('home-2',mesh(1,3));
assert.deepEqual(edited.calls,[{offset:120,bytes:120}],
 'Replacing one road triangle must not transfer the unchanged real road triangle');
assert.equal(edited.entry.buffer,first.entry.buffer,
 'new occupied home should reuse existing genuine same-season GPU civic handle');
const grown=stage('home-3',mesh(1,3,4));
assert.deepEqual(grown.calls,[{offset:240,bytes:120}],
 'An appended actual road triangle must use bounded spare GPU capacity');
const shrunk=stage('home-4',mesh(1));
assert.equal(shrunk.calls.length,0,'Shortened exact civic draw ranges need zero uploads');
assert.equal(e.civicSceneryCache.size,1,'only latest genuine same-season road VBO remains');
assert(e.civicRoadDeltaPartialUploads>=2);
assert(e.civicRoadDeltaUnchangedUploads>=1);
assert(e.civicRoadDeltaAvoidedBytes>=480);
console.log('W366 TRUE original civic GPU growth/edit/shrink delta PASS; hardware FPS and live LOOK/FEEL/PLAY NOT PROVEN.');
