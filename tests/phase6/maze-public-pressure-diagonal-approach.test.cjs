'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const moduleFile=path.resolve(__dirname,'../../public/ai-maze-escape/map-view.mjs');

test('authentic publicly discovered diagonal pressure approach gets readable 390px optical stage, not a hidden cue',async()=>{
  const {publicPressureDiagonalApproachHalfHeight:stage}=await import(pathToFileURL(moduleFile).href);
  const visible={runToken:'published-approach',tick:4,width:10,height:10,currentCell:44,
    cells:[{cell:55,trap:true,blocked:false}],visibleCells:[44,55],result:null};
  const trap={cell:55,distance:4*Math.SQRT2,weight:.57};
  const sourceHeight=6.923;
  const run=(aspect=390/844,s=visible,t=trap,contact=false,retreat=false,reduced=false)=>
    stage(aspect,sourceHeight,s,t,4,contact,retreat,reduced);
  assert.equal(run(),sourceHeight*.96,
    'real 390px public diagonal receives a stronger complete hero/jaw stage');
  assert.ok(.6897967009211443/.96>.70,
    'the actual measured original jaw image crosses the old >.70 contract without lowering it');
  assert.equal(run(320/740),sourceHeight,'320px previous valid stage remains unchanged');
  assert.equal(run(844/390),sourceHeight,'landscape cannot steal a portrait-only scene');
  assert.equal(run(390/844,visible,trap,true),sourceHeight,'contact keeps its prior safe camera');
  assert.equal(run(390/844,visible,trap,false,true),sourceHeight,'withdrawal keeps existing strict physical no-crop');
  assert.equal(run(390/844,visible,trap,false,false,true),sourceHeight,'reduced motion retains original optic');
  assert.equal(run(390/844,{...visible,visibleCells:[44]}),sourceHeight,
    'undiscovered hazard never influences the viewer');
  assert.equal(run(390/844,{...visible,cells:[]}),sourceHeight,
    'an invented but absent trap record cannot stage a camera');
  assert.equal(run(390/844,{...visible,runToken:'new-run',result:'escape'}),sourceHeight,
    'terminal frame cannot fake an opening warning');
  assert.equal(run(390/844,{...visible,currentCell:45}),sourceHeight,
    'collinear public passage never earns a diagonal zoom');
  assert.equal(run(390/844,visible,{...trap,distance:24}),sourceHeight,
    'far/forged trap distances are rejected');
  assert.equal(run(390/844,visible,{...trap,weight:.01}),sourceHeight,
    'unverified public visual attention is ignored');
});

test('actual Pass244 390px physical bounds earn a complete uncropped moving-jaw action shot',async()=>{
  const {publicPhysicalPressureApproachHalfHeight:stage}=await import(pathToFileURL(moduleFile).href);
  // Untouched original 2026-11-10 390x844 source-bound WebGL tick4:
  // https://github.com/my-edutu/Ai_games/actions/runs/42811235386/artifacts/13763311168
  const hero={left:-.3128017364414933,right:.1808304331488542,
    bottom:.07919282833436515,top:.4103577142358351};
  const jaw={left:-.32786135740512956,right:.3619353435160148,
    bottom:-.27346821706663876,top:.16073073006251834};
  const sourceHeight=6.923000000000001, original=JSON.stringify({hero,jaw});
  const staged=stage(hero,jaw,sourceHeight,390/844,true);
  assert.ok(staged<sourceHeight,'real physical under-scale earns a tighter source-bound lens');
  const factor=sourceHeight/staged;
  assert.ok((jaw.right-jaw.left)*factor>.70);
  assert.ok((jaw.right-jaw.left)*factor>=.7599);
  assert.ok((hero.right-hero.left)*factor>.49);
  for(const box of [hero,jaw]){
    assert.ok(box.left*factor>=-.90 && box.right*factor<=.90);
    assert.ok(box.bottom*factor>=-.90 && box.top*factor<=.90);
  }
  assert.equal(JSON.stringify({hero,jaw}),original,'physical model bounds are read-only');
  assert.equal(stage(hero,jaw,sourceHeight,320/740,true),sourceHeight,
    'real 320px approach is already readable and must not be touched');
  assert.equal(stage(hero,jaw,sourceHeight,390/844,false),sourceHeight,
    'a camera without a validated, visible diagonal hazard cannot zoom');
  const already={...jaw,right:jaw.left+.77};
  assert.equal(stage(hero,already,sourceHeight,390/844,true),sourceHeight,
    'already-readable physical action must not receive repeated zoom');
});
test('native pressure lens refuses clipped, over-magnified or forged complete bodies',async()=>{
  const {publicPhysicalPressureApproachHalfHeight:stage}=await import(pathToFileURL(moduleFile).href);
  const hero={left:-.25,right:.25,bottom:-.2,top:.4};
  const jaw={left:-.35,right:.34,bottom:-.25,top:.3};
  const h=6.923,aspect=390/844;
  const close=(a=hero,b=jaw,x=h,y=aspect,enabled=true)=>stage(a,b,x,y,enabled);
  assert.ok(close()<h);
  assert.equal(close({...hero,right:.94}),h,'must not crop Pip to make jaws larger');
  assert.equal(close(hero,{...jaw,top:.94}),h,'must not crop the full connected jaw');
  assert.equal(close(hero,{...jaw,right:-.03}),h,'cannot rescue grossly undersized hazards');
  assert.equal(close(hero,{...jaw,right:NaN}),h);
  assert.equal(close(null),h);
  assert.equal(close(hero,jaw,-1),-1);
  assert.equal(close(hero,jaw,h,844/390),h);
});
test('production lens measures real mesh WORLD AABB before optional optical adjustment and safe pan',()=>{
  const fs=require('node:fs');
  const source=fs.readFileSync(path.resolve(__dirname,
    '../../public/ai-maze-escape/scene.js'),'utf8');
  assert.match(source,/publicPhysicalPressureApproachHalfHeight\(/);
  assert.match(source,/pressureReframeEnvelope\.union\(/);
  assert.match(source,/bottom=Math\.min\(bottom,projected\.y\)/);
  assert.match(source,/heroSpan=physicalSpan\(explorer\.group\)/);
  assert.match(source,/jawSpan=physicalSpan\(hazard\)/);
  assert.match(source,/publicDiagonal = !verifiedRetreatTrap && !settings\.reducedMotion/);
  assert.match(source,/publicPhysicalPressureHorizontalReframe\(/);
  assert.doesNotMatch(source,/camera\.zoom\s*=\s*.*physicallyStagedHeight/);
});
