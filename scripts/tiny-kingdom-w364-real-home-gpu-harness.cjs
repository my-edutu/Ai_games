'use strict';
// W364 isolated execution of the exact playable WebGL home-buffer path,
// not a stand-in LOD mesh, fabricated economy, or software FPS claim.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
function original(a,b){
 const i=html.indexOf(a),j=html.indexOf(b,i+a.length);
 assert(i>=0&&j>i,'Missing original production function '+a);
 return html.slice(i,j);
}
const production=[
 original('function planResidentVertexUpload(','function getResidentDeltaUploadAudit()'),
 original('function homeClusterGroups(','// Prefer reclaiming'),
 original('function takeStaleHomeClusterForGrowth(','// W179 Phase 1:'),
 original('function packLocalHomeResidentMesh(','function buildHomeClusters('),
 original('function buildHomeClusters(','function recallHomeClusterKeys(')
].join('\n');
const e={Float32Array,Math,Number,Object,Map,Set,data:[],city:[],
 currentMaterial:1,HOME_CLUSTER_EDGE:16,
 HOME_STATIC_GEOMETRY_KEY_VERSION:'w261-original-living-burgage-v2',
 HOME_CLUSTER_FLOAT_BUDGET:100000,HOME_CLUSTER_MAX_ENTRIES:32,
 homeClusterCache:new Map(),homeClusterActive:[],
 homeClusterCachedFloats:0,homeClusterReservedFloats:0,
 homeClusterHits:0,homeClusterBuilds:0,homeClusterUploads:0,
 homeClusterDisposals:0,homeClusterEvictions:0,homeClusterStaleDrawn:0,
 homeClusterReusedGpuHandles:0,homeClusterSubDataUploads:0,
 homeClusterStorageAllocations:0,homeLocalMeshPacked:0,
 homeLocalMeshFallbacks:0,homeLocalMeshFloatsRetained:0,
 homeClusterDeltaFullUploads:0,homeClusterDeltaPartialUploads:0,
 homeClusterDeltaUnchangedUploads:0,homeDeltaUploadedBytes:0,
 homeDeltaAvoidedBytes:0,homeDeltaLastWindow:null,
 homePartitionLastTopology:'',swiftGpu:false,
 gl:{ARRAY_BUFFER:34962,DYNAMIC_DRAW:35048},
 houseCountersSnapshot:()=>({}),houseCountersDelta:()=>({}),
 applyHouseCountersDelta:()=>{},
 homePartitionLiveSignature:()=> 'isolated-real-home-grow-shrink',
 releaseGeometryBuffer:b=>{if(b)b.deleted=true}
};
e.gl.createBuffer=()=>({arr:null});
e.bindGeometry=b=>{e.bound=b};
e.gl.bufferData=(target,bytes)=>{
 assert.equal(target,e.gl.ARRAY_BUFFER);assert.equal(bytes%4,0);
 e.bound.arr=new Float32Array(bytes/4);
};
e.calls=[];
e.gl.bufferSubData=(target,offset,values)=>{
 assert.equal(target,e.gl.ARRAY_BUFFER);assert.equal(offset%4,0);
 assert(e.bound.arr,'missing original GPU buffer');
 e.bound.arr.set(values,offset/4);
 e.calls.push({offset,bytes:values.byteLength});
};
e.renderCachedHomeLot=(x,z,k)=>{
 for(const row of [
  [x,.2,z,0,1,0,.4+k/10,.3,.2,1],
  [x+.1,.2,z,0,1,0,.4+k/10,.3,.2,1],
  [x,.2,z+.1,0,1,0,.4+k/10,.3,.2,1]
 ])e.data.push(...row);
};
e.packSpatialScenery=()=>{throw Error('Unexpected spatial fallback')};
const build=new Function('env','with(env){'+production+';return buildHomeClusters}')(e);
function stage(city,swift=false){
 e.city=city;e.swiftGpu=swift;e.calls=[];
 build(new Set(city.map((_,i)=>i)),'temperate');
 assert.equal(e.homeClusterActive.length,1);
 const actual=e.homeClusterActive[0];
 assert.equal(actual.homes,e.city.length,'A real inhabited cottage was lost');
 const onGpu=actual.buffer.arr.slice(0,actual.mesh.length);
 assert.deepEqual([...onGpu],[...actual.mesh],
  'Partial WebGL transfer corrupted a REAL original house roof/material');
 assert.equal(e.homeClusterCache.get(actual.key),actual,
  'Inhabited GPU buffer lost its authentic cell ownership');
 return {calls:e.calls.slice(),uploaded:e.homeDeltaUploadedBytes,
  avoided:e.homeDeltaAvoidedBytes,full:e.homeClusterDeltaFullUploads,
  partial:e.homeClusterDeltaPartialUploads,
  zero:e.homeClusterDeltaUnchangedUploads};
}
const initial=stage([[0,0,1]]);
assert.equal(initial.full,1);
assert.deepEqual(initial.calls.map(x=>x.offset),[0]);
const growth=stage([[0,0,1],[1,1,2]]);
assert.equal(growth.partial,1);
assert.deepEqual(growth.calls,[{offset:120,bytes:120}],
 'Genuine new home must upload only the 30-float appended triangle');
const change=stage([[0,0,1],[1,1,3]]);
assert.equal(change.partial,2);
assert.deepEqual(change.calls,[{offset:120,bytes:120}],
 'Changing an existing original house must not overwrite its neighbour');
const shrink=stage([[0,0,1]]);
assert.equal(shrink.zero,1);
assert.equal(shrink.calls.length,0,
 'Shorter exact draw range needs no duplicate old geometry upload');
assert(e.homeDeltaAvoidedBytes>=360,'Retained GPU bytes not counted');
const software=stage([[0,0,1],[1,1,2]],true);
assert.equal(software.full,2);
assert.deepEqual(software.calls,[{offset:0,bytes:240}],
 'SwiftShader diagnostic must use original full upload');
assert.equal(e.homeClusterActive[0].homes,e.city.length);
console.log('W364 REAL original buildHomeClusters: append, edit, shrink, full SwiftShader, exact GPU triangle fidelity and 100% home representation PASS');
