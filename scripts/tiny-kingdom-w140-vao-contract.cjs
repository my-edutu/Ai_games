'use strict';
// W140: exact original GPU mesh buffers/attribute layouts, explicit lifetime.
// This is a source + mocked WebGL1 contract, NOT physical hardware timing.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const start=html.indexOf('const stride=40,attributes=');
const end=html.indexOf('bindGeometry(buffer);',start);
assert(start>0&&end>start);
const script=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
new vm.Script(script);
const definitions=html.slice(start,end+'bindGeometry(buffer);'.length);
assert(definitions.includes('const GEOMETRY_VAO_MAX_BUFFERS=24'));
assert(html.includes("getScenicBvhAudit,getGeometryVaoAudit,setGeometryVaoEnabledForTesting,"));
assert(/function drawAtmosphere\(a\)\{[\s\S]{0,350}geometryVaoExt\.bindVertexArrayOES\(null\)/.test(html));
assert(html.includes('function releaseGeometryBuffer(target)'));
function fixture(withExtension,software){
 const metrics={pointers:0,deleted:0,created:0,vaoDeleted:0,vaoBinds:0,bufferBinds:0};
 const extension={
  createVertexArrayOES(){metrics.created++;return {id:metrics.created};},
  bindVertexArrayOES(){metrics.vaoBinds++;},
  deleteVertexArrayOES(){metrics.vaoDeleted++;}
 };
 const gl={ARRAY_BUFFER:34962,FLOAT:5126,
  getAttribLocation(_program,name){return {position:0,normal:1,color:2,materialId:3}[name];},
  getExtension(name){assert.equal(name,'OES_vertex_array_object');return withExtension?extension:null;},
  bindBuffer(){metrics.bufferBinds++;},
  enableVertexAttribArray(){},
  vertexAttribPointer(){metrics.pointers++;},
  deleteBuffer(){metrics.deleted++;}
 };
 const originalBuffer={id:0};
 const factory=new Function('gl','program','gpuAvailable','swiftGpu','buffer',
  'let lastFrozenFrameKey=null;\n'+definitions+'\nreturn {bindGeometry,releaseGeometryBuffer,dropGeometryVao,'
  +'getGeometryVaoAudit,setGeometryVaoEnabledForTesting};');
 return {...factory(gl,{},true,software,originalBuffer),metrics,originalBuffer};
}
const hardware=fixture(true,false);
assert.equal(hardware.getGeometryVaoAudit().supported,true);
assert.equal(hardware.getGeometryVaoAudit().residentBindings,1);
const before=hardware.metrics.pointers;
hardware.bindGeometry(hardware.originalBuffer);
assert.equal(hardware.metrics.pointers,before,
 'same exact real buffer must reuse its original four attributes');
assert(hardware.metrics.bufferBinds>0,
 'ARRAY_BUFFER still explicitly bound for real bufferSubData');
for(let i=0;i<48;i++)hardware.bindGeometry({id:i+1});
let audit=hardware.getGeometryVaoAudit();
assert.equal(audit.residentBindings,24);
assert(audit.evictions>=25);
assert.equal(audit.noDrawOrEntityRemoved,true);
const priorPointerCalls=hardware.metrics.pointers;
assert(hardware.setGeometryVaoEnabledForTesting(false));
hardware.bindGeometry({id:900});
hardware.bindGeometry({id:900});
assert.equal(hardware.metrics.pointers-priorPointerCalls,8,
 'manual WebGL1 fallback must issue all original 4 pointers per bind');
assert.equal(hardware.getGeometryVaoAudit().residentBindings,0);
assert(hardware.setGeometryVaoEnabledForTesting(null));
const retirement={id:901};
hardware.bindGeometry(retirement);
assert(hardware.getGeometryVaoAudit().residentBindings>0);
hardware.releaseGeometryBuffer(retirement);
assert.equal(hardware.metrics.deleted,1);
assert.equal(hardware.getGeometryVaoAudit().residentBindings,0);
const software=fixture(true,true);
assert.equal(software.getGeometryVaoAudit().supported,false,
 'software-rendered recording must retain the old full pointer path');
const oldPointers=software.metrics.pointers;
software.bindGeometry(software.originalBuffer);
assert.equal(software.metrics.pointers-oldPointers,4);
assert.equal(software.metrics.vaoBinds,0);
const unsupported=fixture(false,false);
assert.equal(unsupported.getGeometryVaoAudit().supported,false);
assert.equal(unsupported.setGeometryVaoEnabledForTesting(true),false);
assert.equal(unsupported.getGeometryVaoAudit().enabled,false);
const calls=(html.match(/releaseGeometryBuffer\(/g)||[]).length;
assert(calls>=24,'all original GPU-buffer retirements must pass through VAO cleanup');
assert.equal((html.match(/gl\.deleteBuffer\(/g)||[]).length,1,
 'only the VAO-safe retirement function may call WebGL deleteBuffer');
console.log('W140 WebGL1 mock: exact-pointer residency, 24-entry bounded LRU, '
 +'explicit original-buffer retirement and unsupported/SwiftShader fallbacks PASS; '
 +'no running-game, hardware FPS or transformation PASS claimed.');
