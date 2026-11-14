#!/usr/bin/env node
'use strict';
// W249 — test-first proof for one ACTUAL farmer, real IK sickle, field
// interaction stages and read-only render inputs. No claimed GPU/FPS review.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
new vm.Script(js,{filename:'tiny-kingdom-w249-playable.js'});
const start=js.indexOf('function realHarvestBladeContact(');
const stop=js.indexOf('// W04: visible crop aftermath',start);
assert(start>0&&stop>start,'RED: original worker IK-to-wheat contact director is absent');
const block=js.slice(start,stop);
const actor={name:'Actual farmer',job:'farmer',activity:'Harvesting grain',
 x:20.7,z:.4,workTimer:3,phase:2.2};
let stage='cutting',working=true;
const rig={arms:[{wrist:[-.25,.52,.18]},{wrist:[.23,.56,.32]}],
 acting:{focus:[21.32,.74],beat:.65}};
const c={Math,people:[actor],selectedCitizen:0,
 FARMSTEAD:{fields:[[16.45,24.65,-1.62,3.64,12,17]]},
 isWorkingAtSite:p=>working&&p===actor,
 citizenRigPose:p=>{assert.equal(p,actor);return rig},
 getAuthenticWorkGesture:p=>({stage}),
 occupationalPerformance:p=>({beat:.65}),
 workDuration:p=>8,terrain:(x,z)=>.03*x+.01*z};
vm.createContext(c);
vm.runInContext(block+
 '\nthis.realHarvestBladeContact=realHarvestBladeContact;'+
 '\nthis.getHarvestInteractionAudit=getHarvestInteractionAudit;'+
 '\nthis.getHarvestVisibilityAudit=getHarvestVisibilityAudit;',c);
const actual=c.realHarvestBladeContact(actor),audit=c.getHarvestInteractionAudit(),
 visibility=c.getHarvestVisibilityAudit();
assert.equal(actual.stage,'cutting');
assert.equal(actual.authorityModified,false);
assert.equal(actual.insideField,true);
assert.ok(actual.tip.every(Number.isFinite));
assert.equal(audit.citizen,actor.name);
assert.equal(audit.stage,'cutting');
assert.ok(audit.active&&audit.contact[2]>0);
assert.deepEqual(Array.from(audit.bladeTip),Array.from(actual.tip));
assert.equal(visibility.hasSickle,true);
assert.equal(visibility.workStage,'cutting');
const angle=Math.atan2(.62,.34),scale=.92,co=Math.cos(angle),si=Math.sin(angle);
const expectedX=actor.x+scale*(co*(.23+.35)+si*(.32+.48));
const expectedZ=actor.z+scale*(-si*(.23+.35)+co*(.32+.48));
assert.ok(Math.hypot(actual.tip[0]-expectedX,actual.tip[1]-expectedZ)<1e-9,
 'blade edge must follow original farmer IK wrist and occupational facing, not root');
assert.ok(Math.hypot(actual.tip[0]-actor.x,actual.tip[1]-actor.z)>.2);
stage='gathering';
const gather=c.getHarvestInteractionAudit(),gatherView=c.getHarvestVisibilityAudit();
assert.equal(gather.stage,'gathering');
assert.equal(gather.contact[2],0,'no fake crop cutting during real gathering phase');
assert.equal(gatherView.hasSickle,false);
stage='tying';
assert.equal(c.getHarvestInteractionAudit().contact[2],0);
working=false;
assert.equal(c.realHarvestBladeContact(actor),null);
assert.equal(c.getHarvestInteractionAudit().active,false);
assert.doesNotMatch(block,/people\.push\(|city\.push\(|Math\.random\s*\(|state\.(?:food|wood|gold)\s*=/);
const camera=js.slice(js.indexOf('function planCitizenCamera('),
 js.indexOf('function isReadableClosedHomeShot(',js.indexOf('function planCitizenCamera(')));
assert.match(camera,/const observedBlade=realFarmWork\?realHarvestBladeContact\(citizen\):null/);
assert.match(camera,/observedBlade\.insideField\?observedBlade\.tip:null/);
assert.match(camera,/\(visibleCropAim\[0\]-citizen\.x\)\*\.46/);
assert.match(camera,/followRayBlockers\(eye,target,roofs\)/);
const tools=js.slice(js.indexOf('function emitWorkdayHandTool('),
 js.indexOf('\nfunction windmill(',js.indexOf('function emitWorkdayHandTool(')));
assert.match(tools,/getAuthenticWorkGesture\(p\)\.stage/);
assert.match(tools,/stage==='cutting'/);
assert.match(tools,/stage==='gathering'/);
assert.match(tools,/stage==='tying'/);
console.log('W249 PASS: real IK-guided cutting, silent crop at gathering/tying, bounded real-wrist geometry, unchanged economy. Real WebGL A/B NOT PROVEN.');
