'use strict';
// Original gamerender travel-eligibility contract; pure presentation only.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const body=html.match(/function isOriginalUnladenTravelStage\(p\)\{[\s\S]*?\n\}/);
assert.ok(body,'single real-worker travel policy is implemented');
const eligible=vm.runInNewContext('('+body[0]+')');
for(const activity of ['Traveling to farmer work','Traveling to market for provisions',
 'Exploring the valley','Returning home at dusk','Traveling home for a meal']){
 assert.equal(eligible({activity,provisions:0}),true,'real unladen '+activity);
}
for(const activity of ['Traveling home with provisions','Collecting household provisions',
 'Resting at home','Harvesting','Unloading at market','Delivering grain to market']){
 assert.equal(eligible({activity,provisions:0}),false,'live contact or nontravel '+activity);
}
assert.equal(eligible({activity:'Traveling home for a meal',provisions:.8}),false,
 'never replace an actual purchased provision hand with a GPU-only body');
assert.equal(eligible({activity:'Traveling home for a meal',provisions:0}),true);
assert.equal(eligible(null),false);
assert.match(html,/if\(!isOriginalUnladenTravelStage\(p\)\|\|/,
 'original compact commuter receives the same truthful route policy');
assert.match(html,/const moving=isOriginalUnladenTravelStage\(p\);/,
 'original fully sculpted worker consumes the same truthful route policy');
assert.match(html,/originalNames:commuterResidentVisible\.map\(row=>row\.p\.name\)/,
 'read-only audit identifies exactly which genuine persons were rendered');
console.log('W503 source contract PASS: actual empty-handed market/home work commute, no fake hands, shared render eligibility. Gameplay/physical FPS unproven.');
