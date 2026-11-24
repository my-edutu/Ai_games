'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const base=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(base,'public/ai-maze-escape/scene.js'),'utf8');
const camera=()=>import(pathToFileURL(path.join(base,'public/ai-maze-escape/guardian-duel-camera.mjs')).href);

// Actual Pass541b 390x844 native, unaltered source-bound 2026-11-20 tick94,
// SHA256 0ac9d022fbf938d1ffbcca2c0e9dd9ece3ea501ee886900ffed71b1a153a2a07.
// Box boundaries are the real complete NDC physical bounds, not test art.
const pip={left:-.898648363,right:-.040302133,bottom:.068525822,top:.482252005,nearestZ:.10};
const thornback={left:-.456429681,right:.898648363,bottom:-.272087168,top:.357866027,nearestZ:.16};

test('Pass542 earned foreground negative space is broader than literal actor intersections, but is not a whole-screen deletion',async()=>{
  const {
    publicEarnedGuardianScenicPerformanceCourt:court,
    publicEarnedGuardianScenicStageOverlap:direct
  }=await camera();
  const nearbyOrnament={left:-.24,right:.22,bottom:-.57,top:-.35,nearestZ:-.25};
  assert.equal(direct(thornback,nearbyOrnament,true),false,
    'the original overlap gate misses genuine nearby visual crowding beneath the actor');
  assert.equal(court(pip,thornback,nearbyOrnament,true),true,
    'joined true actor bounds protect the otherwise crowded physically public performance apron');
  for(const outOfScope of [
    {...nearbyOrnament,nearestZ:.85}, // real far background is still visible
    {...nearbyOrnament,left:.98,right:1.2}, // outside the framed stage
    {...nearbyOrnament,bottom:-.96,top:-.88}, // deep lower UI/out-of-stage
    {...nearbyOrnament,top:NaN},
    {...nearbyOrnament,nearestZ:-1.4},
    {...nearbyOrnament,bottom:.75,top:.70}
  ])assert.equal(court(pip,thornback,outOfScope,true),false);
  assert.equal(court(pip,thornback,nearbyOrnament,false),false);
  assert.equal(court(pip,null,nearbyOrnament,true),false);
  assert.equal(court(pip,thornback,nearbyOrnament,true),true,
    'deterministic, no camera or GPU allocation, no time-based fake parry');
});
test('Pass542 full original witness, public visible-cell filtering, solid walls and actor no-crop contracts remain untouched',()=>{
  assert.match(source,/earnedScenicStage=cameraMode==='follow'/);
  assert.match(source,/earnedGuardianFrame && verifiedGuardianModel\?\.parent/);
  assert.match(source,/s\?\.lifecycle==='running'/);
  assert.match(source,/visible\.has\(cell\)/);
  assert.match(source,/parryScenicRoots\.push\(node\)/);
  assert.match(source,/node\.userData\?\.optionalGuardianSightlineDecor!==true/);
  assert.match(source,/outsideOriginalCourt=Math\.min\(distance\(cell,s\.currentCell\),/);
  assert.match(source,/distance\(cell,earnedCounterActor\.cell\)\)>3/);
  assert.match(source,/if\(nearActor>6\)continue/);
  assert.match(source,/outsideOriginalCourt&&!crowdsPerformance/);
  assert.match(source,/publicEarnedGuardianScenicPerformanceCourt\(\s*pipPhysical,thornbackPhysical,projected,true\)/);
  assert.match(source,/scenic\.position\.y=scenic\.userData\.parryRecessBaseY-2\.65\*amount/);
  assert.match(source,/publicGuardianEarnedRecoilSafeContactHalfHeight\(/);
  assert.match(source,/publicGuardianEarnedRecoilFinalPairShift\(/);
  assert.doesNotMatch(source,/privateMaze|secretRoute|hiddenMap.*parryRecess/);
});
