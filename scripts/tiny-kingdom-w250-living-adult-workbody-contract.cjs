#!/usr/bin/env node
'use strict';
// W250 integrated original cast: adult near/mid anatomy, physically connected
// occupation-specific wool and heel-to-toe boots, all tied to real autonomous
// gait and existing actor IK. Source floor, NEVER a 3D experience PASS.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
new vm.Script(js,{filename:'tiny-kingdom-w250-live.js'});
const begin=js.indexOf('function livedAdultGarmentProfile(');
const end=js.indexOf('function tailoredGarment(',begin);
assert(begin>0&&end>begin,'RED: shared adult near/compact work silhouette missing');
const c={Math,medievalCitizenIdentity:(p,i)=>({
 name:p.job,shoulder:.012,hem:.018,waist:.009
})};
vm.createContext(c);
vm.runInContext(js.slice(begin,end)+
 '\nthis.adult=livedAdultGarmentProfile;this.garment=garmentProfile;',c);
const realFarmer={job:'farmer',phase:2.75},
 travelling={traveling:true,working:false,acting:{lean:0}},
 working={traveling:false,working:true,acting:{lean:.38}},
 still={traveling:false,working:false,acting:{lean:0}};
const live=c.adult(realFarmer,2,travelling),labor=c.adult(realFarmer,2,working),
 rest=c.adult(realFarmer,2,still);
for(const row of [live,labor,rest]){
 assert([row.shoulder,row.waist,row.hem,row.drape].every(Number.isFinite));
 assert(row.shoulder>row.waist&&row.hem>row.waist);
 assert(row.shoulder<.33&&row.hem<.34,'avoid cartoon barrel silhouettes');
}
assert.notEqual(live.drape,rest.drape,'true authoritative locomotion drives cloth');
assert.notEqual(labor.drape,rest.drape,'authentic work lean drives cloth');
const profile=c.garment(realFarmer,2,working);
assert.equal(profile.panelCount,8);
assert.equal(profile.rings.length,5);
assert.equal(profile.rings[0].rx,labor.hem);
assert.equal(profile.rings[3].rx,labor.shoulder);
assert.equal(profile.rings[2].rx,labor.waist);
const compact=js.slice(js.indexOf('function renderRealVillageWorkwear('),
 js.indexOf('function renderMedievalHairline(',js.indexOf('function renderRealVillageWorkwear(')));
assert.match(compact,/livedAdultGarmentProfile\(p,index,rig\)/,
 'real compact garment must share near-actor torso profile');
const anatomy=js.slice(js.indexOf('const CITIZEN_HEAD_ANATOMY=Object.freeze('),
 js.indexOf('function rescaleCitizenHead(',js.indexOf('const CITIZEN_HEAD_ANATOMY=Object.freeze(')));
vm.runInContext(anatomy+'\nthis.head=CITIZEN_HEAD_ANATOMY;',c);
assert(c.head.headVerticalScale<=.55&&c.head.headHorizontalScale<=.78,
 'real adults must not keep oversized prototype skulls');
assert(c.head.neckPivot>1.29&&c.head.neckPivot<1.43);
assert.match(js.slice(js.indexOf('function turnCitizenHead('),
 js.indexOf('const CITIZEN_HEAD_ANATOMY',js.indexOf('function turnCitizenHead('))),
 /CITIZEN_HEAD_ANATOMY\.neckPivot/,
 'the moved neck and real head yaw/pitch pivot must match');
const bootStart=js.indexOf('function renderRollingBoot('),
 bootEnd=js.indexOf('// Witness actual commute',bootStart);
assert(bootStart>0&&bootEnd>bootStart);
const bootSource=js.slice(bootStart,bootEnd);
assert.match(bootSource,/quad\(/,'boot must be a tapered 3D last, not a rectangle');
const scene={Math,MATERIAL:{GENERAL:0},materialScope:(id,fn)=>fn(),
 data:[],box:()=>{throw Error('old rectangular boot silhouette still emitted')},
 quad:(a,b,d,e,color)=>{for(const p of [a,b,d,a,d,e]){
  scene.data.push(...p,0,1,0,...color,0);
 }}};
vm.createContext(scene);
vm.runInContext(bootSource+'\nthis.boot=renderRollingBoot;',scene);
const skin=[.33,.23,.15];
scene.boot(1,.2,2,.2,.14,.32,skin,{rollRadians:0});
const count=scene.data.length/30;
assert(Number.isInteger(count)&&count>=12&&count<=16,
 'do not expand the grown Day120 view for footwear');
assert(scene.data.every(Number.isFinite),'invalid original shoe vertex/normal');
const stillBoot=scene.data.slice();scene.data.length=0;
scene.boot(1,.2,2,.2,.14,.32,skin,{rollRadians:.12});
assert.equal(scene.data.length,stillBoot.length);
assert(scene.data.some((v,i)=>Math.abs(v-stillBoot[i])>1e-7),
 'authentic roll continues to animate the same actual ankle');
assert.doesNotMatch(js.slice(begin,end),/Math\.random\s*\(|people\.push\s*\(|state\.[a-z]+\s*=/);
console.log('W250 source floor PASS: real worker silhouette, attached cranial pivot, live cloth, bounded articulated shoe. Gameplay visual A/B NOT PROVEN.');
