'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');

const path=require('node:path');
const {readFileSync}=require('node:fs');
const cameraPath=path.resolve(__dirname,'../../public/snake-stream/camera.mjs');
const cameraSource=readFileSync(cameraPath,'utf8');
const cameraModule=()=>import('data:text/javascript;charset=utf-8,'+encodeURIComponent(cameraSource.replace("import { sculptRuinedGateway } from './world.mjs';",'const sculptRuinedGateway = () => ({});')));
const rendererSource=readFileSync(path.resolve(__dirname,'../../public/snake-stream/renderer.mjs'),'utf8');
class Vec3{
  constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
  copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this;}
  lerp(v,a){this.x+=(v.x-this.x)*a;this.y+=(v.y-this.y)*a;this.z+=(v.z-this.z)*a;return this;}
  distanceToSquared(v){return (this.x-v.x)**2+(this.y-v.y)**2+(this.z-v.z)**2;}
  equals(v){return this.distanceToSquared(v)===0;}
}
const measuredSevere={supported:true,failed:false,lastObservedLatencyMs:185,skipped:87};
const healthy={supported:true,failed:false,lastObservedLatencyMs:22,skipped:0};
test('late measured GPU pressure ends an already-running follow transition, not only its first frame',async()=>{
  const {shouldCutUnderGpuPressure,advancePresentationCameraPose}=await cameraModule();
  const target=new Vec3(0,.4,0),offset=new Vec3(4,9,14);
  const desiredTarget=new Vec3(3,.4,2),desiredOffset=new Vec3(5,8,11);
  advancePresentationCameraPose(target,offset,desiredTarget,desiredOffset,{delta:1/60});
  assert.ok(target.distanceToSquared(desiredTarget)>0,'a real intermediate pose exists');
  const cut=shouldCutUnderGpuPressure({mode:'follow',anchor:{reset:false,snap:false},queue:measuredSevere,
    inTransit: target.distanceToSquared(desiredTarget)>0||offset.distanceToSquared(desiredOffset)>0});
  assert.equal(cut,true,'late-arriving measured GPU pressure must end the uncached full-world camera flight');
  const result=advancePresentationCameraPose(target,offset,desiredTarget,desiredOffset,{delta:1/60,hardCut:cut});
  assert.equal(result.settled,true);
  assert.equal(target.equals(desiredTarget)&&offset.equals(desiredOffset),true);
});
test('healthy and unsupported renderers retain smooth follow/detail without guessed camera cuts',async()=>{
  const {shouldCutUnderGpuPressure}=await cameraModule();
  for(const queue of [healthy,{supported:false,failed:false,lastObservedLatencyMs:1000,skipped:10000},
    {supported:true,failed:false,lastObservedLatencyMs:null,skipped:300},
    {supported:true,failed:true,lastObservedLatencyMs:300,skipped:50}]){
    assert.equal(shouldCutUnderGpuPressure({mode:'detail',anchor:{reset:false,snap:false},queue,inTransit:true}),false);
  }
  assert.equal(shouldCutUnderGpuPressure({mode:'overview',anchor:{reset:true,snap:false},queue:measuredSevere,inTransit:true}),false);
  assert.equal(shouldCutUnderGpuPressure({mode:'follow',anchor:{reset:false,snap:false},queue:measuredSevere,inTransit:false}),false);
});
test('real renderer passes both current camera-pose vectors to the pressure cut and preserves full scene cache',()=>{
  assert.match(rendererSource,/inTransit:\s*cameraTarget\.distanceToSquared\(desiredTarget\)\s*>\s*0\s*\|\|\s*cameraOffset\.distanceToSquared\(desiredPosition\)\s*>\s*0/);
  assert.match(rendererSource,/advancePresentationCameraPose\(cameraTarget, cameraOffset, desiredTarget, desiredPosition/);
  assert.match(rendererSource,/renderPresentation\(\)/);
  assert.match(rendererSource,/renderer\.render\(scene, camera\)/);
  assert.match(rendererSource,/staticTarget\s*=\s*new THREE\.WebGLRenderTarget/);
});
