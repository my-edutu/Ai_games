'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const moduleURL=pathToFileURL(path.join(root,'public/ai-maze-escape/guardian-duel-camera.mjs')).href;
const originalScene=fs.readFileSync(path.join(root,'public/ai-maze-escape/scene.js'),'utf8');

const nativePairs=[
  {viewport:'390×844',aspect:390/844,bodies:[
    {left:-.1876684342,right:.3911926575,bottom:-.2106387699,top:.1243622846},
    {left:-.639658235,right:.3095238275,bottom:.039854505,top:.4873444987}]},
  {viewport:'320×740',aspect:320/740,bodies:[
    {left:-.2457097423,right:.4123384141,bottom:-.2111305555,top:.1362510201},
    {left:-.7082236857,right:.2992094794,bottom:.0454679567,top:.4888361511}]}
];
test('Pass402 original autonomous 91→74 earned recoil fills more of BOTH native mobile screens without cropping real bodies or HUD',async()=>{
  const {publicGuardianEarnedRecoilPhysicalStage:stage}=await import(moduleURL);
  for(const sample of nativePairs){
    const halfHeight=8.16;
    const result=stage(sample.aspect,halfHeight,sample.bodies,true,false,0);
    assert.ok(result.scale>=1.30 && result.scale<=1.34+1e-10,
      sample.viewport+' must materially enlarge ACTUAL physical Pip and Thornback, not a decal');
    assert.equal(result.height,halfHeight/result.scale);
    const extraPan=result.shift/(halfHeight*sample.aspect);
    for(const body of sample.bodies){
      assert.ok(Math.abs((body.left-extraPan)*result.scale)<=.80+1e-9);
      assert.ok(Math.abs((body.right-extraPan)*result.scale)<=.80+1e-9);
      assert.ok(body.top*result.scale<=.69+1e-9,'reserved top objective');
      assert.ok(-body.bottom*result.scale<=.78+1e-9,'reserved lower 44px controls');
    }
    assert.deepEqual(stage(sample.aspect,halfHeight,sample.bodies,true,false,0),result,
      'no RNG, hidden route or retrospective event clock in optical layout');
  }
});
test('Pass402 invalid, unverifiable, cramped, stale, reduced, desktop and landscape frames never zoom',async()=>{
  const {publicGuardianEarnedRecoilPhysicalStage:stage}=await import(moduleURL);
  const {aspect,bodies}=nativePairs[0],h=8.16;
  for(const [a,arr,earned,reduced,pan] of [
    [aspect,bodies,false,false,0],[aspect,bodies,true,true,0],
    [844/390,bodies,true,false,0],[1280/900,bodies,true,false,0],
    [.2,bodies,true,false,0],[NaN,bodies,true,false,0],
    [aspect,[bodies[0]],true,false,0],
    [aspect,[bodies[0],null],true,false,0],
    [aspect,[{...bodies[0],left:NaN},bodies[1]],true,false,0],
    [aspect,[{...bodies[0],right:Infinity},bodies[1]],true,false,0],
    [aspect,[{...bodies[0],top:.75},bodies[1]],true,false,0],
    [aspect,[{...bodies[0],left:-.99},bodies[1]],true,false,0],
    [aspect,bodies,true,false,Infinity]
  ]){
    assert.deepEqual(stage(a,h,arr,earned,reduced,pan),{height:h,shift:0,scale:1});
  }
});
test('Pass402 earlier full-mesh pair-pan is accounted for before stage tightening',async()=>{
  const {publicGuardianEarnedRecoilPhysicalStage:stage}=await import(moduleURL);
  const a=390/844,h=8.16,pair=[
    {left:-.17,right:.41,bottom:-.16,top:.18},
    {left:-.977,right:.015,bottom:.19,top:.70}
  ];
  const priorShift=-.06*h*a;
  const out=stage(a,h,pair,true,false,priorShift);
  assert.equal(out.scale,1,'the ACTUAL top HUD overlap forbids zoom even when prior horizontal pan fixes the left crop');
});
test('Pass402 original native renderer consumes only source-witnessed complete meshes; keeps strict previous zoom gate',()=>{
  assert.match(originalScene,/publicGuardianEarnedRecoilPhysicalStage\(\s*aspect,halfHeight,realBodies,earnedGuardianFrame,\s*settings\.reducedMotion,recoilPairShift\)/);
  assert.match(originalScene,/if\(!earnedGuardianFrame && physicalPairHeight<halfHeight-\.02\)/,
    'retain the preexisting strict rule: old closeup never fakes a fit on an earned recoil');
  assert.match(originalScene,/camera\.position\.addScaledVector\(pressureReframeRight,earnedStage\.shift\)/);
  assert.match(originalScene,/camera\.updateProjectionMatrix\(\)/);
  assert.doesNotMatch(originalScene,/privateMaze.*earnedStage|secretRoute.*earnedStage/);
});
