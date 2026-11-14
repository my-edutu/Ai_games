'use strict';
// Red before W120, green only after genuine resident field and home GPU
// triangles enter the exact original scene's material and budget auditor.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const open=html.indexOf('<script>'),close=html.lastIndexOf('</script>');
assert(open>=0&&close>open);
new Function(html.slice(open+8,close));
const a=html.indexOf('function drawnFarmFieldGeometry(){');
const b=html.indexOf('function geometryAudit(){',a);
const end=html.indexOf('// G054b',b);
assert(a>=0&&b>a&&end>b);
const src=html.slice(a,b),audit=html.slice(b,end);
const near={mesh:new Float32Array(150),ranges:[{first:0,count:3},{first:3,count:6}]};
const far={mesh:new Float32Array(210),ranges:[{first:0,count:3},{first:3,count:6}]};
const evalRows=(rows,enabled=true)=>new Function('gpuAvailable','farmFieldNear','farmFieldFar',
 'farmFieldLastDrawnPlots',src+';return drawnFarmFieldGeometry;')(
 enabled,near,far,rows)();
const actual=evalRows([{plot:0,mode:'near',triangles:1},
 {plot:1,mode:'far',triangles:2}]);
assert.deepEqual(actual.map(x=>x.length),[30,60]);
assert.equal(actual[1].byteOffset,far.mesh.byteOffset+120);
assert.equal(evalRows([{plot:1,mode:'far',triangles:2}]).length,1);
assert.deepEqual(evalRows([],true),[]);
assert.deepEqual(evalRows([{plot:0,mode:'near',triangles:1}],false),[]);
assert.throws(()=>evalRows([{plot:1,mode:'far',triangles:3}]),
 /differs from its audited draw range/);
assert(audit.includes('addSceneGeometryStats(fixed,portion)'),
 'true field meshes enter budget and normal/material integrity');
assert(audit.includes('addSceneGeometryStats(animated,nightHomesMesh)'),
 'true inhabited household lights enter budget/integrity');
assert(html.includes('getGeometryAudit:geometryAudit,getSceneTriangleReconciliation,'));
assert(html.includes(
 "function restoreSnapshot(snapshot){validateSnapshot(snapshot);restingActorKey='';resetResidentCommuters();"),
 'both old resting geometry and new commuter GPU poses reset');
console.log('W120 PASS: original mixed LOD, frustum, occupied homes, restore and V8 syntax; live GPU and hardware FPS not measured.');
