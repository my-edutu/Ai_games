#!/usr/bin/env node
'use strict';
// W251 Phase 1 — physically open authentic farm workcourt + farmer hand/face
// sightlines. Test-first source and real geometry safety floor, never an A/B pass.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
new vm.Script(js,{filename:'tiny-kingdom-w251-actual-game.js'});
const begin=js.indexOf('function fieldThreshingOpenAisleProfile('),
 courtEnd=js.indexOf('\nfunction farmstead(',begin);
assert(begin>0&&courtEnd>begin,
 'RED: original six-post farm court must have a real open-air central threshing aisle');
const source=js.slice(begin,courtEnd);
const scene={Math,Number,data:[],
 FARM_MARKET_STREET_ORIGIN:[29,-7.6],FIELD_TO_GRANARY_GATE:[21.7,-2.45],
 MATERIAL:{STONE:1,WOOD:2,ROOF:3},
 terrain:(x,z)=>.01*x+.006*z,walkable:()=>true,
 rgb:t=>Array.isArray(t)?t:[.52,.43,.35],
 materialScope:(material,cb)=>cb(),
 upwardRoadQuad:()=>{for(let i=0;i<60;i++)scene.data.push(0)},
 quad:()=>{for(let i=0;i<60;i++)scene.data.push(0)},
 box:()=>{for(let i=0;i<360;i++)scene.data.push(0)},
 limbSegment:()=>{for(let i=0;i<240;i++)scene.data.push(0)}
};
vm.createContext(scene);
vm.runInContext(source+'\nthis.plan=fieldThreshingOpenAisleProfile;'+
 '\nthis.court=grainwardFieldThreshingCourt;',scene);
const profile=scene.plan(16.4,20.2);
assert(profile.openAisleMetres>=1.8,'working people must occupy open sky, not a painted cutaway');
assert(profile.westBay[1]<profile.eastBay[0],
 'two authentic shelter wings, not a full opaque roof over the active court');
assert(profile.westBay[0]<profile.westBay[1]&&
 profile.eastBay[0]<profile.eastBay[1]);
const court=scene.court();
assert.equal(court.posts,6,'preserve genuine timber shelter structure');
assert.equal(court.flagstones,30,'preserve complete terrain-anchored work floor');
assert.equal(court.roofPanels,18,'two durable partial roof bays, bounded budget');
assert.equal(court.realFarmGateUnblocked,true);
assert(court.openAisleMetres>=1.8&&court.openToSky===true,
 'genuine outdoor harvesting cannot be concealed beneath a full-size roof');
assert.equal(court.extraBuffers,0);
assert(court.triangles>200&&court.triangles<=850,
 'reconstructed retained civic workcourt stays bounded');
assert.equal(court.changesNavigation,false);
assert.equal(court.changesAuthority,false);
assert(scene.data.every(Number.isFinite),'nonfinite workcourt geometry');
const sightStart=js.indexOf('function realFarmWorkSightline(');
const sightEnd=js.indexOf('\nfunction getFarmWorkCameraAudit(',sightStart);
assert(sightStart>0&&sightEnd>sightStart);
const farmer={name:'Actual farmer',job:'farmer',x:20.5,z:.2,activity:'Harvesting grain'};
const camera={Math,FARMSTEAD:{fields:[[16.45,24.65,-1.62,3.64]]},
 state:{t:7},terrain:(x,z)=>0,climateAt:()=>({season:1}),
 isWorkingAtSite:p=>p===farmer,getHarvestInteractionAudit:()=>({
 active:true,citizen:farmer.name,contact:[farmer.x,farmer.z,1]})};
vm.createContext(camera);
vm.runInContext(js.slice(sightStart,sightEnd)+
 '\nthis.sight=realFarmWorkSightline;',camera);
const hands=[[20.27,.55,.54],[20.76,.60,.5]];
const insideClear=camera.sight([20.4,5,.2],farmer,hands);
assert.equal(insideClear.cameraInsideField,true);
assert.equal(insideClear.cropFaceBlockers,0);
assert.equal(insideClear.cropWristBlockers,0);
assert.equal(insideClear.cropForegroundPenalty,0,
 'an honestly clear worksite eye may enter without arbitrary forced fence foreground');
const insideBlocked=camera.sight([20.4,.25,.2],farmer,hands);
assert(insideBlocked.cropForegroundPenalty>0,
 'standing ears still reject genuinely obstructed close-up work shots');
const director=js.slice(js.indexOf('function planCitizenCamera('),
 js.indexOf('function isReadableClosedHomeShot('));
assert.match(director,/realFarmWorkSightline\(shot\.eye,citizen,hands\)/,
 'full real plant/face/hand sightline must remain in final camera rank');
assert.match(director,/cropEye\?80:0/,
 'physically clear interior eyes must survive the inexpensive initial survey');
assert.match(director,/followRayBlockers\(eye,target,roofs\)/,
 'all actual structures and roof obstructions stay authoritative for camera');
assert.doesNotMatch(source,/Math\.random\s*\(|people\.push\s*\(|city\.push\s*\(/);
console.log('W251 source/physical floor PASS: complete real workcourt, open roof aisle and plant-checked field cameras. Running-game look/feel/play NOT PROVEN.');
