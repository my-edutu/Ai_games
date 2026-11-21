'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const h=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
new vm.Script(h.slice(h.indexOf('<script>')+8,h.indexOf('</script>',h.indexOf('<script>'))));
const a=h.indexOf('// W108 Phase 1: one bounded'),b=h.indexOf('// W24 Living Valley camera',a);
assert(a>0&&b>a);
const code=`let presentationEpoch=0,state={t:1},selectedCitizen=0,people=Array.from({length:14},(_,i)=>({i,name:'real'+i})),streetWalk=false,streetEncounterName='',follow=false,liveWorkday=false,zoom=25,eyeX=0,viewport=1024,calls=0,\n frozen=false,city=[],focusPoint=[0,0],yaw=0,pitch=.8;
function citizenDetailCameraFrame(){return {eye:[eyeX,1,4],forward:[0,0,-1],right:[1,0,0],up:[0,1,0],tanVertical:.5,tanHorizontal:.7,lens:{viewportWidth:viewport,viewportHeight:800,verticalDegrees:60,horizontalDegrees:75}}}
function projectRealCitizenDetail(p){calls++;return {visible:true,heightFraction:1/(p.i+1),screenX:p.i*.02,screenY:0}}
// The projection-only synthetic roster contains no jobs or cargo;
 // production predicates use true authority and are tested separately W167.
function isMarketUnloading(){return false}
function isWorkingAtSite(){return false}
${h.slice(a,b)}
let first=selectVisibleCitizenDetail(),second=selectVisibleCitizenDetail();assert.strictEqual(first,second);assert.equal(calls,14);assert.equal(first.indices.size,3);eyeX++;selectVisibleCitizenDetail();assert.equal(calls,28);presentationEpoch++;state.t++;selectVisibleCitizenDetail();assert.equal(calls,42);viewport=390;selectVisibleCitizenDetail();assert.equal(calls,56);people.push({i:14,name:'grown'});selectVisibleCitizenDetail();assert.equal(calls,71);people=Array.from({length:8},(_,i)=>({i,name:'founder'}));presentationEpoch++;assert.equal(selectVisibleCitizenDetail().indices.size,8);assert.equal(citizenProjectionCacheAudit().entries,1);assert.equal(citizenProjectionCacheAudit().authorityModified,false);`;
vm.runInNewContext(code,{assert});
assert(h.includes('dynamicPhaseTimes.citizenDetailSelection='));
assert(h.includes('frameProfileScene!==frameProfileScenario'));
assert(h.includes('getCitizenProjectionCacheAudit:citizenProjectionCacheAudit'));
console.log('W108 source V8 worker plan, 390px, growth, CPU scene profile PASS; no browser/FPS claim');
