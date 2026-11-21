'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const test=require('node:test');
const assert=require('node:assert/strict');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
function isolated(first,next){
 const a=html.indexOf(first),b=html.indexOf(next,a+first.length);
 assert.ok(a>=0&&b>a,'authentic gameplay source contract is present');
 return vm.runInNewContext(html.slice(a,b)+'\n'+first.match(/function ([^(]+)/)[1]);
}
const plan=isolated('function planViewFarmTriangleBudget(', 'function chooseBudgetedFarmPlotModes(');
const choose=isolated('function chooseBudgetedFarmPlotModes(', 'function disposeResidentFarmFields(');
const blank=()=>Object.fromEntries(
 ['landscape','settlement','homes','civicCore','civic'].map(k=>[k,{
  visibleTriangles:0,culledTriangles:0,bridgedTriangles:0
 }]));
test('camera budget charges all nonfield polygons when no static geometry is culled',()=>{
 const b=plan(159275,blank());
 assert.equal(b.issuedNonFieldTriangles,159275);
 assert.equal(b.availableFieldTriangles,725);
 assert.equal(b.originalGeometryConserved,true);
 assert.equal(b.measuredHardwareFps,false);
});
test('a fully real frustum audit reclaims only offscreen submitted geometry',()=>{
 const classes=blank();
 classes.landscape={visibleTriangles:25000,culledTriangles:30000,bridgedTriangles:150};
 classes.homes={visibleTriangles:10000,culledTriangles:5000,bridgedTriangles:50};
 const b=plan(159275,classes);
 assert.equal(b.culledStaticTriangles,35000);
 assert.equal(b.bridgedStaticTriangles,200);
 assert.equal(b.issuedNonFieldTriangles,124475);
 assert.equal(b.availableFieldTriangles,35525);
});
test('the cap cannot be evaded by omitted classes, negative counts or overdraw',()=>{
 const classes=blank();
 assert.throws(()=>plan(160001,{}),/W468 invalid real/);
 classes.civic.bridgedTriangles=400;
 const b=plan(159900,classes);
 assert.equal(b.availableFieldTriangles,0);
 assert.equal(b.nonFieldAlreadyOverBudget,true);
 classes.homes.culledTriangles=-1;
 assert.throws(()=>plan(159900,classes),/W468 invalid real/);
});
test('actual near-field quality prioritizes the real working plot without dropping original plots',()=>{
 const plots=[{plot:0,farTriangles:60,nearTriangles:210,distance:18,realWork:true,wantsNear:true},
 {plot:1,farTriangles:70,nearTriangles:210,distance:16,realWork:false,wantsNear:true}];
 const result=choose(plots,350);
 assert.deepEqual(Array.from(result.modes),['near','far']);
 assert.equal(result.droppedPlots,0);
 assert.equal(result.totalTriangles,280);
});
test('retained static districts submit before fields and reconciliation stays full-world',()=>{
 const p=html.indexOf('const planes=gpuAvailable?sceneFrustumPlanes(m):null;');
 const staticPass=html.indexOf('drawOriginalRetainedLandscape(planes,staticDistrictContext)',p);
 const finish=html.indexOf('finishResidentStaticMaterialBatch()',p);
 const budget=html.indexOf('viewFarmBudgetAudit=planViewFarmTriangleBudget(',p);
 const field=html.indexOf('fieldLodDraw=drawResidentFarmFields(',p);
 const stats=html.indexOf('scenicVisibilityStats.totalSubmittedTriangles=',p);
 assert.ok(p>=0&&staticPass>p&&finish>staticPass&&budget>finish&&field>budget&&stats>field);
 assert.match(html,/unaccountedTriangles:lastFrameFullSceneTriangles-weather-audited.totalTriangles/);
 assert.match(html,/viewFarmBudgetAudit\.viewBudgetBreached=lastFrameTriangles>160000/);
});
