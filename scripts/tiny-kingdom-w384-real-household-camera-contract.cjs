'use strict';
/* W384: original living-town household shopper, physical camera source contract.
 * A buyer is only a truthful observer when she is the actually selected
 * existing citizen and is on a genuine market-to-home provision errand.
 * Presentation never creates a purchase, citizen, goods, or route. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const begin=source.indexOf('function realHouseholdCameraSubject(');
assert.ok(begin>0,'W384 missing real household follow identity gate');
const end=source.indexOf('\n}',begin);
assert.ok(end>begin,'W384 missing bounded pure household camera gate');
const helper=Function(source.slice(begin,end+2)+'; return realHouseholdCameraSubject;')();
const buyer={name:'real shopper',activity:'Traveling to market for provisions'};
assert.equal(helper(buyer,buyer,'household',true),true,'genuine market journey should be filmable');
buyer.activity='Collecting household provisions';
assert.equal(helper(buyer,buyer,'household',true),true,'real purchasing action should be filmable');
buyer.activity='Traveling home with provisions';
assert.equal(helper(buyer,buyer,'household',true),true,'verified provision return should be filmable');
for(const mode of ['delivery','off','live','homecoming']){
 assert.equal(helper(buyer,buyer,mode,true),false,'other modes must retain original cameras');
}
assert.equal(helper(buyer,{name:buyer.name,activity:buyer.activity},'household',true),false,'must not film impostor or stale actor');
assert.equal(helper(buyer,buyer,'household',false),false,'manual camera must not be hijacked');
buyer.activity='Resting at home';
assert.equal(helper(buyer,buyer,'household',true),false,'do not invent a walking shopper during rest');
const planner=source.slice(source.indexOf('function planCitizenCamera('),source.indexOf('/* W58 — genuine threshold witness.'));
assert.match(planner,/const householdErrand=realHouseholdCameraSubject\(citizen,people\[selectedCitizen\],\s*document\.body\.dataset\.workday,follow\)/);
assert.match(planner,/journeyCamera=homecoming\|\|filmedLoadedCourier\|\|householdErrand/);
assert.match(planner,/const pitches=[\s\S]*?householdErrand\?/);
assert.match(planner,/const zooms=[\s\S]*?householdErrand\?/);
assert.match(planner,/routeSizePenalty=[\s\S]*?householdErrand/);
assert.match(planner,/foregroundSceneProjection\(/);
assert.match(planner,/physicalFollowEyeClearance\(/);
const frame=source.slice(source.indexOf('function render(now)'),source.indexOf('function render(now)')+24000);
assert.match(frame,/const observingAction=Boolean\([\s\S]{0,400}realHouseholdCameraSubject\(/,
 'running frame director must use the same truth gate as camera planner');
assert.match(source,/document\.body\.dataset\.workday='household';\s*setCitizenFollow\(true\);updateFollowCamera\(\)/);
console.log('W384 PASS: actual buyer-gated physical documentary camera; mode/identity/rest negative cases; route/projection preserved. Video/FPS NOT PROVEN.');
