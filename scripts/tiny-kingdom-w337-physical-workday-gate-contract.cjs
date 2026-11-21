'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const src=html.match(/function genuineWorkdayShotDecision\(shot,portrait\)\{[\s\S]*?\n\}/)?.[0];
assert(src,'W337 missing actual physical worker camera admission');
const assessment=vm.runInNewContext(src+'\ngenuineWorkdayShotDecision;');
const base={
 eyeCollision:{clear:true},blockers:0,handBlockers:0,blockedBodyRays:0,
 foregroundCitizenBlockers:0,cameraProximityWarnings:0,
 foregroundSceneCover:.04,foregroundActorCoreCover:.035,
 foregroundCargoCover:0,foregroundVegetationCover:.03,
 vegetationFaceBlockers:0,projectedWorkerHeightFraction:.34,
 facingAlignment:.7,projectedWorksitePosts:0
};
const judge=(p,portrait=true)=>assessment({...base,...p},portrait);
assert.equal(judge({}).safe,true,'fully surveyed genuine worker should be admissible');
assert.equal(judge({}).readable,true,'worker with face and hands visible at 34% screen should be readable');
assert.equal(judge({eyeCollision:{clear:false}}).safe,false,'a false clear label may never admit an eye inside walls');
assert.equal(judge({blockers:1}).safe,false,'real intervening roof must reject the eye');
assert.equal(judge({foregroundActorCoreCover:.38}).safe,false,'real occlusion may not claim a visible worker');
assert.equal(judge({foregroundCargoCover:.30}).safe,false,'actual cargo may not obscure body during follow');
assert.equal(judge({handBlockers:2}).safe,false,'two obscured IK hands cannot pass');
assert.equal(judge({projectedWorkerHeightFraction:.09}).safe,false,'microscopic actor is not a useful workday');
assert.equal(judge({projectedWorkerHeightFraction:.18}).readable,false,'small real portrait actor needs enlargement');
assert.equal(judge({facingAlignment:-.50}).readable,false,'a rear-facing citizen is not a readable work close-up');
assert.equal(judge({foregroundSceneCover:.12,foregroundActorCoreCover:.11}).safe,true,'real surroundings need not be deleted');
const anchor=html.match(/function anchorSelectedWorkdayCamera\(row\)\{[\s\S]*?\n\}/)?.[0];
assert(anchor&&anchor.includes('genuineWorkdayShotDecision('),'workday camera anchor must independently check physical admission');
assert(!anchor.includes('row.clear||physicallyUsable'),'untrusted score cannot bypass real-world eye checks');
const director=html.match(/function advanceLiveWorkdayDirector\(\)\{[\s\S]*?\n \}/)?.[0];
assert(director&&director.includes('genuineWorkdayShotDecision('),'mobile workday switch must reject obstructed new subject BEFORE changing selection');
assert(director.indexOf('genuineWorkdayShotDecision(')<director.indexOf('selectedCitizen=next.index'),'validate actual shot before switching real worker');
console.log('W337 source contract PASS: real physical eye, torso, hands, cargo and worker size checked before mobile camera handoff; no actors/economy mutated.');
