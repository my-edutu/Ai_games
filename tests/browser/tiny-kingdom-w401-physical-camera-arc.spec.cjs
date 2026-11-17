'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const {test}=require('node:test');

const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
function extract(name,nextMarker){
 const start=html.indexOf('function '+name+'(');
 assert.ok(start>0,'the live game contains '+name);
 const end=html.indexOf(nextMarker,start);
 assert.ok(end>start,'bounded camera helper source');
 return html.slice(start,end);
}
function arc(start,end,valid){
 const code=extract('chooseWorkdayCameraArc','function physicallyClearWorkdayCameraArc(');
 const context={Math,Number,Array};
 vm.createContext(context);
 vm.runInContext(code,context,{timeout:1000});
 return context.chooseWorkdayCameraArc(start,end,valid);
}
test('W401 camera path: shortest angular arc, first truly clear physical intermediate',()=>{
 const attempts=[];
 const result=arc([3.10,.20,6],[-3.10,.48,4.4],c=>{
  attempts.push(c.fraction);
  return c.fraction>=.5;
 });
 assert.deepEqual(attempts,[.25,.5]);
 assert.ok(result);
 assert.equal(result.fraction,.5);
 assert.ok(Math.abs(result.yaw)>3.1,'no long camera rotation behind roof');
 assert.ok(Math.abs(result.pitch-.34)<1e-8);
 assert.ok(Math.abs(result.zoom-5.2)<1e-8);
});
test('W401 camera path: if every real volume blocks, preserve original fallback',()=>{
 const attempts=[];
 const result=arc([0,.15,5],[1,.6,8],c=>{attempts.push(c);return false;});
 assert.equal(result,null);
 assert.equal(attempts.length,4,'strict bounded actual-eye budget');
});
test('W401 camera path: bad numbers are rejected without a phantom camera',()=>{
 assert.equal(arc([NaN,.2,5],[1,.6,8],()=>true),null);
 assert.equal(arc([0,.2,5],[1,Infinity,8],()=>true),null);
 assert.equal(arc([0,.2,5],[1,.6,8],null),null);
});
test('W401 source: physical labor and receipt visibility checked without touching authority',()=>{
 const source=extract('physicallyClearWorkdayCameraArc','function shouldRescuePortraitWorkerCore(');
 for(const name of ['physicalFollowEyeClearance','followRayBlockers','foregroundSceneProjection',
  'foregroundVegetationProjection','realFarmWorkSightline','marketCourierPostSightline',
  'documentaryWorkHandTargets','chooseWorkdayCameraArc']){
  assert.ok(source.includes(name),name+' must be measured on real game objects');
 }
 assert.ok(!/state\s*\.|people\s*\[.*\]\s*=|\.delivery\s*=/.test(source),
  'camera helper never writes authoritative state');
});
