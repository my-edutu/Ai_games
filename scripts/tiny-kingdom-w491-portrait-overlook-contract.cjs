#!/usr/bin/env node
'use strict';
// W491 TEST-FIRST contract of the real production 390px camera fallback.
// It must select only physically surveyed views of a real citizen, never
// invent/move buildings, workers, routes or market receipts.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const start=html.indexOf('const PORTRAIT_WORKDAY_OVERLOOK_MAX_EYES=24;');
const end=html.indexOf('function updateFollowCamera(',start);
assert(start>=0&&end>start,'W491 physical portrait rescue is production code');
const code=html.slice(start,end);
const game=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
 .map(row=>row[1]).find(src=>src.includes('function findPhysicalPortraitWorkdayOverlook('));
assert(game);new vm.Script(game);
assert(html.includes('const needOriginalOverlook='));
assert.match(html,/now-portraitWorkdayOverlookLastAttempt>=2200/);
assert.match(html,/portraitAlternativeSelected=true/);
assert.match(code,/followRayBlockers\(eye,face,roofs\)!==0/);
assert.match(code,/physicalFollowEyeClearance\(eye,roofs\)/);
assert.match(code,/terrainClearWorkerSightline\(eye,face\)/);
assert.doesNotMatch(code,/Math\.random|state\.(?:food|wood|gold)\s*[+\-=]|people\.push|city\.push|market\.push|gl\./);
let blocked=false,eyes=0,scans=0;
const mock={Math,Number,Array,Infinity,canvas:{clientWidth:390},
 terrain:()=>0,
 physicalFollowEyeClearance:()=>({clear:!blocked}),
 followRayBlockers:()=>blocked?1:0,
 terrainClearWorkerSightline:()=>!blocked,
 foregroundSceneProjection:()=>({cover:0.03,actorCoreCover:0.02,cargoCover:0}),
 foregroundVegetationProjection:()=>({cover:0,faceBlockers:0}),
 projectedWorkerBodyFraction:()=>.16,
};
vm.createContext(mock);
vm.runInContext(code+'\nthis.inspect=findPhysicalPortraitWorkdayOverlook;this.audit=getPhysicalPortraitWorkdayOverlookAudit;',mock);
const citizen={name:'genuine-existing-worker',x:0,z:0},prior={
 yaw:0,pitch:.40,zoom:7,target:[0,1,0],blockers:2,
 foregroundSceneCover:.9,foregroundActorCoreCover:.8};
const clear=mock.inspect(citizen,prior,[]);
assert(clear,'a physically clear external eye exists for the REAL citizen');
assert.equal(clear.originalAutonomousCitizen,citizen.name);
assert.equal(clear.noClippedBuildings,true);
assert.equal(clear.altersAuthority,false);
assert.equal(clear.notAReadableHandsClaim,true);
assert.equal(clear.physicalPortraitOverlook,true);
assert.equal(clear.blockers,0);
assert(mock.audit().physicalEyesChecked<=24);
blocked=true;assert.equal(mock.inspect(citizen,prior,[]),null,
 'no camera can claim clear if the real wall blocks every eye');
assert.equal(mock.inspect(null,prior,[]),null);
mock.canvas.clientWidth=1024;
assert.equal(mock.inspect(citizen,prior,[]),null,'desktop needs no portrait rescue');
console.log('W491 real 390px portrait physical-overlook contract PASS; cinematic LOOK/FEEL/PLAY still NOT PROVEN.');
