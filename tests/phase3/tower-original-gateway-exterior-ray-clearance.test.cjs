'use strict';
const { test }=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const moduleFile=import('../../public/infinite-tower-climb/visuals/guardian-clear-sightline-frame.mjs');

// Recorded from the UNEDITED 1x candidate portrait WebM + associated actual
// current-Three geometry rays at source F9 tick479 (d0ca8ff7). These are
// camera/ray witnesses, not native pixels or independent reviewer acceptance.
const actualRay={
  sourceExitX:304896,worldWidth:480000,
  camera:[11.62,4.14,44.28],
  openedGateCentre:[7.107,.4,23.185],
  openedGateLip:[7.107,1.6,23.185],
  roofWorldY:-2.8
};
function rayHitsGateBlock(eye,target,block) {
  const a=(actualRay.sourceExitX/actualRay.worldWidth-.5)*2.2;
  const ox=Math.sin(a)*24.25, oz=Math.cos(a)*24.25;
  const local=p=>{
    const x=p[0]-ox,z=p[2]-oz;
    return [-Math.sin(a)*x-Math.cos(a)*z,
      p[1]-actualRay.roofWorldY,
      Math.cos(a)*x-Math.sin(a)*z];
  };
  const p=local(eye),q=local(target),direction=q.map((x,i)=>x-p[i]);
  let near=0,far=1;
  const centre=[block.x,block.y,block.z];
  const half=[block.width/2,block.height/2,block.depth/2];
  for(let j=0;j<3;j++){
    const lower=centre[j]-half[j],upper=centre[j]+half[j];
    if(Math.abs(direction[j])<1e-10){
      if(p[j]<lower||p[j]>upper)return false;
    } else {
      let t1=(lower-p[j])/direction[j],t2=(upper-p[j])/direction[j];
      if(t1>t2)[t1,t2]=[t2,t1];
      near=Math.max(near,t1);far=Math.min(far,t2);
      if(near>far)return false;
    }
  }
  return far>=0&&near<=1;
}
test('original gate centre and lip rays hit prior exterior pier but clear new connected structural frame',async()=>{
  const {originalGuardianGatewayClearSightlineFrame}=await moduleFile;
  const frame=originalGuardianGatewayClearSightlineFrame();
  const outboard=frame.piers.find(x=>x.side===-1);
  const old={x:-4.15,y:2.58,z:-.42,width:.34,height:5.16,depth:.42};
  const relocated={...outboard,y:2.58,width:.34,height:5.16,depth:.42};
  for(const endpoint of [actualRay.openedGateCentre,actualRay.openedGateLip]){
    assert.equal(rayHitsGateBlock(actualRay.camera,endpoint,old),true,
      'old observed pier intersection must be reproducible');
    assert.equal(rayHitsGateBlock(actualRay.camera,endpoint,relocated),false,
      'new actual outboard load pier must not hide the source-open doorway');
    assert.equal(rayHitsGateBlock(actualRay.camera,endpoint,frame.upperOuterTie),false,
      'new connected overhead tie cannot become another portal obstruction');
    assert.equal(rayHitsGateBlock(actualRay.camera,endpoint,frame.crown),false);
  }
  assert.deepEqual(frame.piers.find(x=>x.side===1),{side:1,x:4.15,z:-.42});
  assert.equal(frame.upperOuterTie.x,outboard.x);
  assert.ok(frame.upperOuterTie.z-frame.upperOuterTie.depth/2<=outboard.z+.21);
  assert.ok(frame.upperOuterTie.z+frame.upperOuterTie.depth/2>=frame.crown.z-.23);
});
test('original guardian world uses source-built masonry plan without bypassing guardian HP defeat or authority',()=>{
  const code=fs.readFileSync(path.resolve(__dirname,'../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  assert.match(code,/originalGuardianGatewayClearSightlineFrame\(\)/);
  assert.match(code,/for\(const pier of gatewayFrame\.piers\)/);
  assert.match(code,/guardianGate=\{frame,wings,crest,counterweights,conduit/);
  assert.match(code,/const unlocked=guardian\.active===false/);
});
