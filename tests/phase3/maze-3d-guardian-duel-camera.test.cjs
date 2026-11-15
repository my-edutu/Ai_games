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
 assert.ok(brace<13.7&&brace>13.45,'real planted foreclaws earn a strong lower profile shot');
 assert.ok(release<11.55&&release>11.45,'real shell opening holds the complete lower three-quarter pose');
 assert.ok(first-brace>7&&brace-release>1.8,'notice, brace and release require distinct real optical presentations');
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
 assert.match(scene,/publicGuardianPhysicalCloseupHalfHeight\(\s*aspect,verifiedGuardianStrength,targetHeight,halfHeight,realBodies/);
 assert.match(scene,/verifiedGuardianStrength=verifiedGuardianModel===closestThreatModel && closestThreat\?\.strength>\.70/,
   'physical closeup retains real authoritative guardian strength when the original witnessed enemy is nearby');
 assert.doesNotMatch(scene,/privateMaze.*closestThreatModel|secretRoute.*closestThreatModel/);
});

test('Pass330 observed guardian camera has a continuous real warning-to-brace trajectory and clears invalid/hidden beats',async()=>{
 const {publicGuardianDuelCameraElevation:e}=await camera();
 const aspect=390/844, strength=.818181818;
 const at=[.00198,.07,.08,.18,.29,.39,.48889,.58,.67,.89953,1]
   .map(beat=>e(aspect,strength,beat,false));
 assert.equal(at[0],21);
 assert.equal(at[1],21,'no camera anticipation before a real published warning');
 for(let i=1;i<at.length;i++)assert.ok(at[i]<=at[i-1]+1e-9,
   'camera may descend but never bounce higher in the witnessed sequence');
 assert.ok(at.every(value=>Number.isFinite(value)&&value>=11.5&&value<=21),
   'the original three-quarter guardian orbit stays physically bounded');
 assert.ok(Math.abs(e(aspect,strength,.071,false)-e(aspect,strength,.07,false))<.01,
   'no cut at the first public camera transition');
 assert.ok(Math.abs(e(aspect,strength,.669,false)-e(aspect,strength,.67,false))<.01,
   'no cut at the completed physical reveal');
 assert.equal(e(aspect,strength,.89953,true),21,
   'reduced motion preserves the familiar static angle');
 assert.equal(e(aspect,0,.89953,false),21,
   'a hidden/unobserved guardian cannot trigger a cinematic');
});

test('Pass333 source-observed 390px guardian physically un-stacks toward a side-on duel at brace and release',async()=>{
 const {publicGuardianDuelShoulderOrbit:shot}=await camera();
 const a=390/844,s=.818181818,o=-.78;
 const beats=[0,.07,.16,.20,.30,.48889,.60,.73,.89953,1];
 const frame=beats.map(b=>shot(a,s,b,o));
 assert.deepEqual(frame.slice(0,3),[0,0,0]);
 for(let i=1;i<frame.length;i++)assert.ok(frame[i]>=frame[i-1]-1e-12,
   'no sudden camera reversal through actual public witness');
 assert.ok(frame[5]>.30&&frame[5]<.34,'the actual planted brace now exposes both opposed bodies rather than re-stacking them');
 assert.ok(frame[8]>.51&&frame[8]<=.52000001,'complete shell release earns an opposed three-quarter actor composition');
 assert.equal(frame[8],frame[9],'hold the completed disclosure');
 assert.equal(shot(a,s,.89953,o),frame[8]);
 assert.equal(shot(a,s,.89953,-o),-frame[8],'mirror the same public encounter');
 assert.ok(frame.every(v=>o+v<0&&Math.abs(o+v)>=.25),
   'the stronger real duel still preserves more than 0.25rad native camera orbit and actor-axis side');
});
test('Pass333 no shoulder camera on unknown, ended, reduced-motion or wrong-size/attention inputs',async()=>{
 const {publicGuardianDuelShoulderOrbit:shot}=await camera();
 const a=390/844;
 for(const b of [undefined,null,NaN,Infinity,-Infinity,-1,0,1.01,'0.5'])
   assert.equal(shot(a,.82,b,-.78,false),0);
 for(const s of [0,.4,.70,NaN,Infinity,-1])
   assert.equal(shot(a,s,.8,-.78,false),0);
 for(const o of [0,.02,-.02,NaN,Infinity])
   assert.equal(shot(a,.82,.8,o,false),0);
 for(const size of [844/390,1280/900,.61,.2,NaN,Infinity])
   assert.equal(shot(size,.82,.8,-.78,false),0);
 assert.equal(shot(a,.82,.8,-.78,true),0);
 assert.match(scene,/portraitEncounterOrbit\+=publicGuardianDuelShoulderOrbit\(\s*aspect,closestThreat\.strength,closestThreat\.encounterBeat,\s*portraitEncounterOrbit,settings\.reducedMotion\)/);
 assert.match(scene,/publicPortraitGuardianHalfHeight\(/,
   'preserve real actor mesh physical camera bounds and strict tests');
});

test('Pass338 320px and 390px physical duel cameras only open up on public brace/release, not on unseen or reduced-motion combat',async()=>{
 const {publicGuardianDuelShoulderOrbit:shot}=await camera();
 for(const a of [320/740,390/844]){
   assert.equal(shot(a,.818181818,.07,-.78),0);
   assert.ok(shot(a,.818181818,.48889,-.78)>.30);
   assert.equal(shot(a,.818181818,.89953,-.78),.52);
   assert.equal(shot(a,.818181818,.89953,.78),-.52);
   assert.equal(shot(a,.818181818,.89953,-.78,true),0);
   assert.equal(shot(a,.69,.89953,-.78),0);
   assert.equal(shot(a,.818181818,.89953,0),0);
 }
 assert.match(scene,/publicGuardianPhysicalCloseupHalfHeight\(/,
   'production continues to use actual connected body outlines and unchanged strict native framing limits');
});

test('Pass398 authentic seed-13 earned recoil centers BOTH complete 390px actors without changing the strict +/-0.95 gate',async()=>{
 const {publicGuardianEarnedRecoilPairShift:pan}=await camera();
 const aspect=390/844,halfHeight=8.16;
 const pip={left:-.1713999384928615,right:.4092604465164776,
   bottom:-.158196910493359,top:.18458725723140895};
 const guardian={left:-.9770493484332434,right:.01586402120380243,
   bottom:.19272908037591552,top:.7027986410071145};
 const dx=pan(aspect,halfHeight,[pip,guardian],true);
 const ndc=dx/(halfHeight*aspect);
 assert.ok(dx<0&&ndc<-.25&&ndc>-.31,
   'actual counter must center both bodies instead of leaving Thornback off the left edge');
 for(const body of [pip,guardian]){
   assert.ok(body.left-ndc>-.925 && body.right-ndc<.925,
     'BOTH connected original actors must fit with stricter margin');
 }
 assert.equal(pan(aspect,halfHeight,[pip,guardian],true),dx,
   'same published actor geometry yields exactly the same camera correction');
 assert.match(scene,/earnedGuardianFrame\s*\|\| closestThreat\?\.lanternParried===true/);
 assert.match(scene,/camera\.position\.addScaledVector\(pressureReframeRight,recoilPairShift\)/);
 assert.match(scene,/publicGuardianEarnedRecoilPairShift\(/);
});
test('Pass398 real earned-counter framing never edits unseen/invalid/manual/reduced-motion/other views',async()=>{
 const {publicGuardianEarnedRecoilPairShift:pan}=await camera();
 const a=390/844,h=8.16;
 const pip={left:-.1714,right:.4093,bottom:-.1582,top:.1846};
 const guardian={left:-.9771,right:.0159,bottom:.1927,top:.7028};
 const pair=[pip,guardian];
 assert.equal(pan(a,h,pair,false),0,'no earned published counter, no special camera');
 assert.equal(pan(a,h,pair,true,true),0,'reduced-motion spectator keeps original camera');
 for(const ratio of [844/390,1280/900,.20,.61,NaN,Infinity])
   assert.equal(pan(ratio,h,pair,true),0);
 for(const invalid of [undefined,[],[pip], [pip,null],
   [{...pip,left:Infinity},guardian],
   [{...pip,right:-1},guardian],
   [{...pip,left:-1.4,right:-.7},{...guardian,right:1.1}]])
   assert.equal(pan(a,h,invalid,true),0,'invalid or physically uncenterable scene must not fake a pass');
 assert.equal(pan(a,h,[{...pip,left:-.32,right:.3},guardian],true)!==0,true);
 assert.equal(pan(a,h,[{...pip,left:-.5,right:.4}, {...guardian,left:-.6,right:.5}],true),0,
   'already comfortably framed pair needs no pan');
 assert.doesNotMatch(scene,/privateMaze.*publicGuardianEarnedRecoilPairShift|secretRoute.*recoilPairShift/);
});

test('Pass398b real public guardian parry remains a complete physical mobile shot after its retreat clears ordinary warning',()=>{
 assert.match(scene,/let earnedCounterModel = null, earnedCounterDistance = Infinity/);
 assert.match(scene,/entry\.lanternParried === true[\s\S]*?s\.visibleCells\.includes\(entry\.cell\)/,
   'the fallback must require the currently published and visibly disclosed guardian');
 assert.match(scene,/verifiedGuardianModel=closestThreat\?\.strength>\.70 && closestThreatModel\?\.parent[\s\S]*?earnedCounterModel/);
 assert.match(scene,/verifiedGuardianStrength>\.70[\s\S]*?verifiedGuardianModel\?\.parent/);
 assert.match(scene,/for \(const root of \[explorer\.group,verifiedGuardianModel\]\)/,
   'project the actual entire player AND parried guardian, never just a marker');
 assert.match(scene,/!earnedGuardianFrame && physicalPairHeight<halfHeight-\.02/,
   'a physically earned retreat must not zoom into a falsely fitting body envelope');
 assert.match(scene,/publicGuardianEarnedRecoilPairShift\([\s\S]*?earnedGuardianFrame\s*\|\| closestThreat\?\.lanternParried===true/);
 assert.doesNotMatch(scene,/privateMaze.*earnedCounterModel|secretRoute.*earnedCounterDistance/,
   'no private map/AI route may decide which guardian is framed');
});
