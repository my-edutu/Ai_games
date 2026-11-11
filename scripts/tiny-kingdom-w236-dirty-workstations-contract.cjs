'use strict';
/* W236 RED-first: identical real fixed workstations are cached per citizen,
 * not rebuilt and uploaded as one giant block when another worker moves.
 * Run the actual production function in a small deterministic WebGL harness.
 * The original 1024/390 browser suite independently exercises the full game. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const start=html.indexOf('const WORKSITE_FIXTURE_FLOAT_BUDGET=96000;');
const end=html.indexOf('function renderWorkdayTraces(){',start);
assert(start>0&&end>start,'original workstation residency source missing');
const events=[];
const gl={
 ARRAY_BUFFER:34962,DYNAMIC_DRAW:35048,TRIANGLES:4,
 createBuffer(){events.push({type:'create'});return {};},
 bufferData(_target,bytes){events.push({type:'alloc',bytes});},
 bufferSubData(_target,offset,mesh){
  events.push({type:'upload',offset,bytes:mesh.byteLength,
   values:Array.from(mesh.slice(0,3))});
 },
 drawArrays(){events.push({type:'draw'});}
};
const ctx={Float32Array,Map,Set,Math,Error,Number,Boolean,Array,Object,
 gl,gpuAvailable:true,swiftGpu:false,MATERIAL:{WOOD:3},
 currentMaterial:0,data:[],presentationEpoch:0,
 cameraDynamicCache:null,cameraDynamicKey:'',lastFrozenFrameKey:null,
 workdayRenderStats:{activeWorksites:0},
 materialScope(_material,fn){fn();},
 workerLocalWorksite(w){return {angle:w.angle||0,localX:w.x,localZ:w.z,groundHeight:0}},
 worksInsideOriginalForgeYard(){return false},
 rotateWorksiteVertices(){},
 bindGeometry(){},
 releaseGeometryBuffer(){events.push({type:'dispose'})}
};
vm.createContext(ctx);
vm.runInContext(html.slice(start,end),ctx,{timeout:10000});
// Deterministic stand-in geometry: one real person's identity and physical
// location yield one whole-triangle source mesh, regardless of others.
vm.runInContext(`emitFixedWorkstation=function(w,station){
  for(let i=0;i<30;i++)data.push(w.x+station.localZ+w.job.length+i/100);
};`,ctx);
const a={citizen:'Bram',job:'farmer',x:10,z:1};
const b={citizen:'Selene',job:'merchant',x:2,z:3};
const c={citizen:'Iris',job:'builder',x:4,z:5};
function prepare(rows){
 ctx.sites=rows;
 return vm.runInContext('prepareWorksiteFixtureResidentMesh(sites)',ctx,{timeout:10000});
}
function audit(){return vm.runInContext('getWorksiteFixtureResidencyAudit()',ctx);}
function uploads(){return events.filter(e=>e.type==='upload')}
assert.equal(prepare([a,b]),true);
assert.equal(audit().cachedParts,2);
assert.equal(audit().partBuilds,2);
assert.equal(uploads().length,1);
assert.equal(uploads()[0].bytes,240);
assert.equal(audit().meshFloats,60);
assert.equal(prepare([a,b]),true);
assert.equal(uploads().length,1,'unchanged frame must upload nothing');
assert.equal(audit().partBuilds,2,'unchanged frame must rebuild nobody');
const shiftedB={...b,x:b.x+.5};
assert.equal(prepare([a,shiftedB]),true);
assert.equal(audit().partBuilds,3,'one moved worker only rebuilds one station');
assert.equal(audit().partialUploads,1);
assert.equal(uploads().length,2);
assert.equal(uploads()[1].offset,120,'second worksite has a physical GPU byte offset');
assert.equal(uploads()[1].bytes,120,'only changed station bytes uploaded');
assert.equal(audit().meshFloats,60);
assert.equal(prepare([a,shiftedB,c]),true);
assert.equal(audit().cachedParts,3);
assert.equal(audit().partBuilds,4);
assert.equal(uploads().at(-1).offset,0,'topology growth must repack safely');
assert.equal(uploads().at(-1).bytes,360);
assert.equal(prepare([shiftedB,c]),true);
assert.equal(audit().cachedParts,2,'departed worker must be evicted');
assert.equal(uploads().at(-1).bytes,240);
assert.equal(prepare([]),true);
assert.equal(audit().cachedParts,0,'no historical workstations retained');
assert.equal(audit().meshFloats,0,'zero active workers draws no stale resident');
assert.equal(events.filter(e=>e.type==='create').length,1,'one resident GPU buffer');
assert.equal(audit().authorityModified,false);
console.log('W236 isolated genuine per-worker retained-geometry contract PASS; physical GPU FPS and A/B experience remain NOT PROVEN');
