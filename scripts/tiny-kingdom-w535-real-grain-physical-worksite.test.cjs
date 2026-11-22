'use strict';
// W535 source + actual helper behavior: authentic working actor -> physical
// observed shot -> bounded portrait rescue -> identical safe fallback.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,
 '../public/tiny-kingdom/index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(script,'original executable game script');
new vm.Script(script[1],{filename:'tiny-kingdom-live-world.js'});
const start=script[1].indexOf('const realGrainEntrancePortrait=');
const stop=script[1].indexOf('function watchRealGrainJourney(){',start);
assert.ok(start>=0&&stop>start,
 'RED: original grain watcher lacked physically validated entrance for real acting farmer');
const fragment=script[1].slice(start,stop);
assert.match(script[1],/if\(!anchorRealGrainProducerAtPhysicalWorksite\(p\)\)\s*updateFollowCamera\(builderStageAngle\(p\)\)/,
 'Genuine chosen farmer must use the validated shot, with old original fallback');
assert.match(script[1],/getRealGrainJourneyAudit,getRealGrainEntrancePortraitAudit,/
 ,'Expose real rather than synthesized entry evidence');
const person={name:'Genuine Farmer',activity:'Harvesting grain'};
let safe=true,alternate=null,admitted=true,anchors=0,planner=0,rescues=0;
const originalWorld={seed:'e0',food:48.25,delivery:null,people:1};
const context={
 canvas:{clientWidth:390},follow:true,people:[person],selectedCitizen:0,
 isWorkingAtSite:p=>p===person,planCitizenCamera:(p,y,run)=>{
  planner++;assert.equal(p,person);assert.equal(run,true);
  return {actor:p.name,shot:'worksite'}},
 builderStageAngle:()=>1.9,
 genuineWorkdayShotDecision:shot=>({safe:shot.shot==='rescue'||safe,
  readable:shot.shot==='rescue'||safe}),
 findPhysicalPortraitAlternative:()=>{rescues++;return alternate},
 followCameraRoofs:()=>[{kind:'true-home'}],
 anchorSelectedWorkdayCamera:row=>{
  anchors++;assert.equal(row.person,person);
  assert.equal(row.index,0);
  assert.ok(row.shot);
  return admitted;
 }};
vm.runInNewContext(fragment+
 ';this.anchor=anchorRealGrainProducerAtPhysicalWorksite;'+
 'this.audit=getRealGrainEntrancePortraitAudit;',context);
assert.equal(context.anchor(person),true);
assert.equal(anchors,1);
assert.equal(context.audit().validated,1);
safe=false;alternate=null;
assert.equal(context.anchor(person),false,
 'An obstructed real worker must not force a false-clear film');
assert.equal(anchors,1);
alternate={shot:'rescue',actor:person.name};
assert.equal(context.anchor(person),true,
 'The same original actor may accept a physically cleared portrait');
assert.equal(context.audit().portraitRescues,1);
assert.equal(anchors,2);
context.canvas.clientWidth=1024;safe=false;
assert.equal(context.anchor(person),false);
assert.equal(rescues,2,'Only mobile may survey the extra rescue');
assert.equal(context.anchor({name:'Invented Farmer'}),false);
assert.equal(context.audit().attempts,4);
assert.equal(context.audit().validated,2);
assert.equal(context.audit().rejected,2);
assert.equal(planner,4);
assert.equal(context.audit().seededAuthorityUntouched,true);
assert.deepEqual(originalWorld,{seed:'e0',food:48.25,delivery:null,people:1});
console.log('W535 source helper / actual farmer identity / 390px bounded physical rescue PASS; real WebGL experience and hardware fps NOT PROVEN.');
