'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const first=html.indexOf('const DAYBREAK_RETURN_MS=4200;'),last=html.indexOf('let liveWorkSwitchHour=',first);
assert(first>0&&last>first);
assert.match(html,/noteDrawCompletion\(frameProfileEnd,drawScenario,idleFrames>0\);[\s\S]*?acknowledgeDaybreakWorldFrame\(\);/);
const h={elapsed:0,follow:true,yaw:.5,pitch:.38,zoom:15,focusPoint:[1,2],
 previousFollowCamera:{yaw:.6,pitch:.7,zoom:31,focus:[0,0]},
 window:{matchMedia:()=>({matches:false})},
 document:{body:{dataset:{workday:'homecoming'}},getElementById:()=>({textContent:''})},
 terrain:()=>0,followCameraRoofs:()=>[{x:1.5,z:1,rx:1,rz:1,top:4.5}],
 actualHomecomingWitnessShot:()=>({eye:[3,1.8,4],target:[2,1.4,4]}),
 physicalFollowEyeClearance:()=>({clear:true,kind:'none'}),
 performance:{now:()=>h.elapsed},setCitizenFollow:v=>{assert.equal(v,false);h.follow=false;h.followOffs++},
 stopWorkdayWatch:()=>{h.stops++},setCommandView:()=>{},showToast:()=>{},
 followOffs:0,stops:0};
vm.createContext(h);vm.runInContext(html.slice(first,last),h,{timeout:2000});
const run=s=>vm.runInContext(s,h,{timeout:2000});
assert(run('beginDaybreakReturn({name:"Isolde"})'));
const path=run('daybreakReturn.physical');
const rise=run('daybreakWorldCameraAt(daybreakReturn.physical,.22)');
const crossing=run('daybreakWorldCameraAt(daybreakReturn.physical,.65)');
const reached=run('daybreakWorldCameraAt(daybreakReturn.physical,.78)');
for(const axis of [0,2]){
 assert(Math.abs(rise.eye[axis]-path.fromEye[axis])<1e-7);
 assert(Math.abs(reached.eye[axis]-path.toEye[axis])<1e-7);
}
assert(crossing.eye[1]>=path.clearanceY-1e-5);
assert.equal(run('acknowledgeDaybreakWorldFrame()'),false);
// W184+ accepts a camera sample only after a genuine world-frame submission.
h.lastCitizenPickFrame={eye:[999,999,999],target:[0,0,0]};
assert.equal(run('recordSubmittedDaybreakWorldFrame()'),false);
assert.equal(run('acknowledgeDaybreakWorldFrame()'),false);
h.elapsed=5000;let prev=0;
for(let i=0;i<9;i++){
 assert(run('advanceDaybreakReturn()'));
 const submitted=run('daybreakReturn.frame');
 h.lastCitizenPickFrame={eye:Array.from(submitted.eye),
  target:Array.from(submitted.target)};
 assert(run('recordSubmittedDaybreakWorldFrame()'));
 const a=run('getDaybreakReturnAudit()');
 assert(a.progress>=prev&&a.progress-prev<.120001);
 prev=a.progress;
}
assert.equal(prev,1);
assert.equal(h.followOffs,0,'Must not restore view before actual draw');
assert(run('getDaybreakReturnAudit().awaitingSubmittedFinalFrame'));
assert(run('acknowledgeDaybreakWorldFrame()'));
const ended=run('getDaybreakReturnAudit()');
assert(!ended.active&&ended.lastCompleted.finalWorldDrawSubmitted);
assert(ended.lastCompleted.samples.some(s=>s.progress>.38&&s.progress<.97));
assert(ended.lastCompleted.submittedFrames>=9);
assert.equal(h.followOffs,1);assert.equal(h.stops,1);
assert.equal(run('acknowledgeDaybreakWorldFrame()'),false);
for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi))
 if(m[1].includes('function beginDaybreakReturn'))new vm.Script(m[1]);
console.log('W183 source-bound physical daybreak PASS: real roof-safe ascent/cross/descent, bounded steps, final submitted shot before exactly-once camera release. No performance or visual PASS.');
