'use strict';
// W355: behavior-level physical farm camera contract, not a fabricated filmed PASS.
// It intentionally invokes the original gameplay decision function and verifies
// the full 1.5MB inline script parses. A screenshot/physical GPU is still needed.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const script=src.slice(src.indexOf('<script>')+8,src.lastIndexOf('</script>'));
new vm.Script(script,{filename:'tiny-kingdom-playable-inline.js'});
const a=script.indexOf('function genuineWorkdayShotDecision('),
 b=script.indexOf('// Read-only W13 film progression',a);
assert(a>=0&&b>a,'real workday acceptance present');
const decision=vm.runInNewContext(script.slice(a,b)+
 '\ngenuineWorkdayShotDecision',{});
const base={"eyeCollision":{"clear":true},"blockers":0,"projectedWorkerHeightFraction":0.35,"foregroundSceneCover":0.06,"foregroundActorCoreCover":0.05,"foregroundCargoCover":0,"foregroundVegetationCover":0.04,"handBlockers":0,"blockedBodyRays":0,"foregroundCitizenBlockers":0,"cameraProximityWarnings":0,"facingAlignment":0.8,"vegetationFaceBlockers":0,"projectedWorksitePosts":0};
assert.equal(decision(base,true).safe,true,'clear real worker remains filmable');
for(const [kind,patch] of [
 ['planted wheat covers face',{cropFaceBlockers:1}],
 ['planted wheat covers sickle wrist',{cropWristBlockers:1}],
 ['field eye not cleared',{cameraInsideField:true,physicalInteriorEyeClear:false}]
]){
 const result=decision({...base,...patch},true);
 assert.equal(result.safe,false,kind+' must reject physically obscured camera');
 assert.equal(result.readable,false,kind+' cannot count as readable work');
}
assert.equal(decision({...base,cameraInsideField:true,
 physicalInteriorEyeClear:true},true).safe,true,
 'interior real eye may work if all crop/body rays are clear');
assert.equal(decision({...base,cropFaceBlockers:-1},true).safe,false,
 'invalid crop evidence must fail closed');
assert.match(script,/function personHasActiveFarmWork\(citizen\)/);
const alt=script.slice(script.indexOf('function findPhysicalPortraitAlternative('),
 script.indexOf('function updateFollowCamera(',script.indexOf('function findPhysicalPortraitAlternative(')));
assert.match(alt,/realFarmWorkSightline\(eye,citizen,hands\)/);
assert.match(alt,/crop\.cropFaceBlockers>0\|\|crop\.cropWristBlockers>0/);
assert.match(alt,/const candidate=\{\.\.\.shot,\.\.\.crop,/,
 'every alternate has its OWN physical wheat evidence');
const follow=script.slice(script.indexOf('const currentWorkerForeground=portraitCurrentScene'),
 script.indexOf('lastFollowShot=plan;',script.indexOf('const currentWorkerForeground=portraitCurrentScene')));
assert.match(follow,/const mustRepairWheat=currentWheatBlocked&&plannedWheatClear/);
assert.match(follow,/cropObstructs\(midwayWheat\)/);
assert.match(follow,/immediatePortraitWitness\|\|portraitAlternativeSelected/);
assert.match(follow,/plannedWheatClear/);
assert.match(script,/actualCropWristBlockers:realCrop\?\.cropWristBlockers\?\?0/);
console.log('W355 GREEN: real shot decisions, per-eye farmer grain, 390px tracking evidence and full-game syntax PASS. Running video & FPS NOT PROVEN.');
