'use strict';
// W326 original two-VBO field-row view culling: test-first against real game
// source, no dropped rooted crops or authority; browser/GPU still separate.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const script=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
 .find(m=>m[1].includes('function farmStalk('));
assert(script,'original playable kingdom inline script');
new vm.Script(script[1],{filename:'tiny-kingdom-original-game.js'});
const a=html.indexOf('function buildOriginalCropMesh('),
 b=html.indexOf('// W182:',a),
 c=html.indexOf('function chooseBudgetedFarmPlotModes('),
 d=html.indexOf('function disposeResidentFarmFields(',c),
 e=html.indexOf('function drawResidentFarmFields('),
 f=html.indexOf('function getFarmFieldResidencyAudit(',e);
assert(a>0&&b>a&&c>0&&d>c&&e>0&&f>e);
const ctx={Math,Number,Array,Error,Float32Array,
 data:[],currentMaterial:0,FARM_FIELD_MESH_FLOAT_LIMIT:650000,
 FARMSTEAD:{fields:[[0,4,0,4,2,2],[10,14,0,6,3,2]]},
 gpuAvailable:true,people:[],farmFieldPlotLods:['far','far'],
 farmFieldDrawCalls:0,farmFieldLod:'far',farmFieldSceneBudgetAudit:{},
 farmFieldLodChoice:()=> 'near',isWorkingAtSite:()=>false};
ctx.ripeningField=(field,plot,season,compact,onRow)=>{
 for(let row=0;row<field[4];row++){
  for(let t=0;t<(compact?1:2);t++)
   for(let v=0;v<3;v++)ctx.data.push(plot*10+v*.1,1,row*10,0,1,0,1,1,1,5);
  onRow?.(row);
 }
};
ctx.draws=[];
ctx.sceneChunkInFrustum=(range,clip)=>
 range.maxX>=clip.x0&&range.minX<=clip.x1&&
 range.maxZ>=clip.z0&&range.minZ<=clip.z1;
ctx.gl={TRIANGLES:4,drawArrays(mode,first,count){
 assert.equal(mode,4);ctx.draws.push({first,count});
}};
ctx.bindGeometry=b=>assert(b?.id);
vm.createContext(ctx);
const ga=html.indexOf('function drawnFarmFieldGeometry('),
 gb=html.indexOf('function addSceneGeometryStats(',ga);
assert(ga>0&&gb>ga,'original real-GPU material audit');
vm.runInContext(html.slice(a,b)+html.slice(c,d)+html.slice(e,f)+html.slice(ga,gb),ctx);
const evalSource=code=>vm.runInContext(code,ctx,{timeout:1200});
const near=evalSource('buildOriginalCropMesh(2,false)');
const far=evalSource('buildOriginalCropMesh(2,true)');
assert.equal(near.length/30,10);assert.equal(far.length/30,5);
assert.equal(near.rowRanges.length,5);assert.equal(far.rowRanges.length,5);
assert.deepEqual(Array.from(near.plotRanges,r=>r.rowCount),[2,3]);
assert.deepEqual(Array.from(near.rowRanges,r=>r.count),[6,6,6,6,6]);
assert.deepEqual(Array.from(far.rowRanges,r=>r.count),[3,3,3,3,3]);
assert.equal(near.rowRanges.reduce((n,r)=>n+r.count,0),near.length/10);
assert.equal(near.plotRanges[1].firstRow,2);
ctx.farmFieldNear={mesh:near,ranges:near.plotRanges,buffer:{id:1}};
ctx.farmFieldFar={mesh:far,ranges:far.plotRanges,buffer:{id:2}};
let view=evalSource('drawResidentFarmFields([1,2,10],{x0:-1,x1:2,z0:9,z1:12},1000)');
assert.equal(view.visiblePlots,1);assert.equal(view.visibleRows,1);
assert.equal(view.culledRows,4);assert.equal(view.triangles,2);
assert.deepEqual(ctx.draws.map(d=>d.count),[6]);
assert.equal(evalSource('drawnFarmFieldGeometry()').reduce((n,mesh)=>n+mesh.length,0),
 view.triangles*30,'the visual geometry audit observes only the one actual GPU-issued row');
ctx.draws=[];
view=evalSource('drawResidentFarmFields([1,2,10],null,1000)');
assert.equal(view.visiblePlots,2);assert.equal(view.visibleRows,5);
assert.equal(view.triangles,10);
assert.deepEqual(ctx.draws.map(d=>d.count),[12,18]);
assert.equal(evalSource('drawnFarmFieldGeometry()').reduce((n,mesh)=>n+mesh.length,0),
 view.triangles*30,'full farm source/GPU geometry audit remains exact');
ctx.draws=[];
view=evalSource('drawResidentFarmFields([1,2,10],null,4)');
assert.equal(view.triangles,5);
assert.equal(view.budget.sceneBudgetBreached,true);
assert.equal(view.budget.droppedPlotsForBudget,0);
assert.equal(near.rowRanges.length,5);
assert.match(html,/drawResidentFarmFields\(eye,planes,Math.max\(0,160000-nonFieldTriangles\)\)/);

assert.match(html,/function drawResidentFarmFields\([\s\S]*?multiDrawBatches/, 'W338 field GPU driver should consolidate genuine crop row draws');
ctx.draws=[];ctx.softwareBatchCalls=0;ctx.swiftGpu=false;ctx.scenicMultiDrawOverride=null;
ctx.scenicMultiDrawExtension={multiDrawArraysWEBGL(mode,firsts,fo,counts,co,n){
 assert.equal(mode,ctx.gl.TRIANGLES);assert(n>1&&n<=256);
 ctx.softwareBatchCalls++;
 for(let i=0;i<n;i++)ctx.draws.push({first:firsts[fo+i],count:counts[co+i]});
}};
view=evalSource('drawResidentFarmFields([1,2,10],null,1000)');
assert.equal(view.visiblePlots,2);
assert.equal(view.triangles,10,'all near authentic crop triangles remain');
assert.deepEqual(ctx.draws.map(d=>d.count),[12,18]);
assert.equal(ctx.softwareBatchCalls,1,'both visible original near plot submissions share one hardware batch');
assert.equal(view.driverCalls,1);
assert.equal(view.multiDrawBatches,1);
assert.equal(view.drawCalls,2,'logical root-row submissions remain audited');
ctx.swiftGpu=true;ctx.draws=[];ctx.softwareBatchCalls=0;
view=evalSource('drawResidentFarmFields([1,2,10],null,1000)');
assert.deepEqual(ctx.draws.map(d=>d.count),[12,18]);
assert.equal(view.driverCalls,2,'slow software uses exact prior WebGL calls');
assert.equal(view.multiDrawBatches,0);
assert.equal(ctx.softwareBatchCalls,0);

console.log('W326 original source PASS: planted row residency, conservative near/far union, one real frustum row, coalesced full farm, explicit 160k deficit; no FPS/visual claim.');
