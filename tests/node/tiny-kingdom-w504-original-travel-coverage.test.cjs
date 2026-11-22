'use strict';
// W504: source RED-before / GREEN-after for genuine food-carrier contact
// and exact one-body-per-original-citizen presentation accounting.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const begin=html.indexOf('function isOriginalUnladenTravelStage(');
const finish=html.indexOf('function isResidentCommuterCandidate(',begin);
assert.ok(begin>=0&&finish>begin,'original travel classification must be present');
const classify=new Function(html.slice(begin,finish)+'\nreturn isOriginalUnladenTravelStage;')();
test('actual empty-handed original routes can retain GPU rig',()=>{
 for(const activity of ['Traveling to farmer work','Exploring the valley',
  'Returning home at dusk','Traveling home for a meal'])
  assert.equal(classify({activity,provisions:0}),true,activity);
});
test('all purchased provisions and escrowed deliveries keep original live body contacts',()=>{
 for(const activity of ['Traveling to farmer work','Traveling home for a meal',
  'Exploring the valley','Returning home at dusk']){
  assert.equal(classify({activity,provisions:.8}),false,activity);
  assert.equal(classify({activity,provisions:0,delivery:{id:'original-real'}}),false,activity);
 }
});
test('genuine screen-space resident policy remains bounded and live CPU fallback remains',()=>{
 assert.match(html,/COMMUTER_BODY_ENTER_SCREEN_HEIGHT=\.235/);
 assert.match(html,/COMMUTER_BODY_RETAIN_SCREEN_HEIGHT=\.275/);
 assert.match(html,/return !screen.visible\|\|screen.heightFraction<originalCommuterScreenLimit\(i\)/);
 assert.match(html,/commuter\?originalCommuterScreenLimit\(i\)/);
 assert.match(html,/if\(!foregroundIndices.has\(i\)\)\{/);
 assert.match(html,/compactVillager\(people\[i\]\);actualActorBodyPaths\[i\]=1/);
});
test('actual citizen cover ledger is inspectable without altering authority',()=>{
 assert.match(html,/function getActorPresentationCoverageAudit\(\)/);
 assert.match(html,/originalBodyPathCount:current\?rows.length-missing.length:0/);
 assert.match(html,/getResidentCommuterAudit,getActorPresentationCoverageAudit/);
});
