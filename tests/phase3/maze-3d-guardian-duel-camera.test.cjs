'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const camera=()=>import(pathToFileURL(path.join(root,'public/ai-maze-escape/guardian-duel-camera.mjs')).href);
const scene=fs.readFileSync(path.join(root,'public/ai-maze-escape/scene.js'),'utf8');

test('Pass308 native 390 public guardian performance moves its physical lens only across authentic notice, brace and release',async()=>{
 const {publicGuardianDuelCameraElevation:e}=await camera();
 const aspect=390/844,strength=.818181818;
 const first=e(aspect,strength,.00198,false),brace=e(aspect,strength,.48889,false),release=e(aspect,strength,.89953,false);
 assert.equal(first,21,'first public warning uses original high view');
 assert.ok(brace<18.3&&brace>15.2,'real planted foreclaws earn a visible profile shot');
 assert.ok(release<15.1&&release>14.7,'real shell opening holds a still lower profile');
 assert.ok(first-brace>2&&brace-release>2,'not three near-identical overhead frames');
 assert.equal(e(aspect,strength,1,false),release,'release holds a stable final shot');
 assert.equal(e(aspect,strength,.89953,false),release,'same original public beat replays deterministically');
});
test('unknown clock, withheld warning, reduced motion, desktop and landscape retain the original complete view',async()=>{
 const {publicGuardianDuelCameraElevation:e}=await camera();
 const a=390/844;
 for(const b of [undefined,null,NaN,Infinity,-Infinity,-1,0,1.01,'0.5'])
   assert.equal(e(a,.82,b,false),21,'no imagined unrevealed scene');
 for(const strength of [0,.35,.70,NaN,Infinity,-1])
   assert.equal(e(a,strength,.8,false),21,'weak/invalid attention does not stage new threat');
 for(const x of [320/740,390/844])
   assert.equal(e(x,.82,.8,true),21,'reduced motion keeps stable proven lens');
 for(const x of [844/390,1280/900,.2,.61,NaN,Infinity])
   assert.equal(e(x,.82,.8,false),21,'other camera classes retain prior framing');
 assert.ok(e(a,.75,.8,false)>e(a,.82,.8,false),'no discontinuous low-attention camera cut');
});
test('the live lens consumes only the source authenticated Follow guardian encounter, not engine truth',()=>{
 assert.match(scene,/publicGuardianDuelCameraElevation\(\s*aspect,closestThreat\.strength,closestThreat\.encounterBeat,\s*settings\.reducedMotion\)/);
 assert.match(scene,/if \(!result && closestThreat\?\.strength\) \{/);
 assert.match(scene,/portraitEncounterOrbit=publicPortraitGuardianOrbitAngle\(/);
 assert.match(scene,/portraitEncounterOrbit \? portraitCameraOffset/);
 assert.doesNotMatch(scene,/privateMaze.*publicGuardianDuelCameraElevation|secretRoute.*duetElevation/);
});

test('explicit public stream asset allowlist serves the real 3D guardian cinematic module',()=>{
 const server=fs.readFileSync(path.join(root,'scripts/serve-maze-stream.cjs'),'utf8');
 assert.match(server,/PUBLIC_ASSETS = \[[^\]]*'guardian-duel-camera\.mjs'/,
   'WebGL live server must serve every imported module, not silently fall back to 2D');
 assert.match(server,/const routes=new Map\(PUBLIC_ASSETS\.map\(/,
   'explicit route security boundary must remain intact');
 assert.doesNotMatch(server,/\.\.\/\.\.\//,'no broad path traversal fallback for module repair');
});

test('Pass309 real native full-body Pip–Thornback boxes drive a meaningful bounded portrait closeup',async()=>{
 const {publicGuardianPhysicalCloseupHalfHeight:fit}=await camera();
 const aspect=390/844, strength=.818181818, height=8.162680093240091;
 const beats=[
  [{left:-.41031,right:.31589,bottom:.08085,top:.53998},
   {left:-.04837,right:.37898,bottom:-.30816,top:.07254}],
  [{left:-.47607,right:.46927,bottom:.04699,top:.58528},
   {left:-.13770,right:.37272,bottom:-.32340,top:.12378}],
  [{left:-.45167,right:.45068,bottom:.06089,top:.56574},
   {left:-.11414,right:.39715,bottom:-.30000,top:.14514}]
 ];
 for(const pair of beats){
   const projected=fit(aspect,strength,height,height,pair);
   assert.ok(projected<height*.86&&projected>=height*.79,
     'the complete original actors become visibly larger rather than changing their models');
   const factor=height/projected;
   for(const box of pair){
     assert.ok(Math.max(Math.abs(box.left),Math.abs(box.right))*factor<=.88+1e-9);
     assert.ok(box.top*factor<=.70+1e-9,'urgent 390px mission chip still has safe room');
     assert.ok(-box.bottom*factor<=.84+1e-9,'actual 44px Map and intent controls stay clear');
   }
   assert.equal(fit(aspect,strength,height,height,pair),projected,'no frame-clock dependent target');
 }
});

test('unseen, clipped, malformed, manual/landscape/reduced-motion guardian cannot earn camera zoom',async()=>{
 const {publicGuardianPhysicalCloseupHalfHeight:fit}=await camera();
 const a=390/844,h=8.16,body={left:-.4,right:.36,bottom:-.35,top:.53};
 const valid=[body,{left:-.48,right:.41,bottom:-.12,top:.59}];
 for(const pair of [undefined,null,[],[body],[body,null],
   [{...body,left:-1},body],[{...body,right:1},body],
   [{...body,top:Infinity},body],[{...body,left:NaN},body]])
   assert.equal(fit(a,.82,h,h,pair),h,'no geometry or cropped body means no zoom');
 for(const strength of [0,.35,.70,NaN,Infinity])
   assert.equal(fit(a,strength,h,h,valid),h,'no confirmed guardian means no framing request');
 for(const aspect of [844/390,1280/900,.61,.2,NaN])
   assert.equal(fit(aspect,.82,h,h,valid),h,'other camera classes unchanged');
 assert.equal(fit(a,.82,h,h,valid,true),h,'reduced motion keeps previous source framing');
 assert.equal(fit(a,.82,h,h,[{...body,top:.90},valid[1]]),h,
   'any near-HUD collision must prevent further magnification');
});
test('Pass309 production source reads only actual public 3D actors, preserves existing WebGL evidence gates',()=>{
 assert.match(scene,/closestThreatModel=entry\.model\.group/);
 assert.match(scene,/attentionStrength=witnessedLocally\s*&& publicGuardianOpenSightline\(s,entry\.cell\)/);
 assert.match(scene,/cameraMode==='follow'[\s\S]*?closestThreat\?\.strength>\.70[\s\S]*?closestThreatModel\?\.parent/);
 assert.match(scene,/root\.traverseVisible\(mesh=>/);
 assert.match(scene,/publicGuardianPhysicalCloseupHalfHeight\(\s*aspect,closestThreat\.strength,targetHeight,halfHeight,realBodies/);
 assert.doesNotMatch(scene,/privateMaze.*closestThreatModel|secretRoute.*closestThreatModel/);
});
