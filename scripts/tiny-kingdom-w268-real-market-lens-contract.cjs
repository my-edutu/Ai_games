'use strict';
/* W268: Original receiving-dock camera must actually show both authentic
 * purchase-backed shelves; an unobstructed ROOF is not sufficient when a
 * full-height market post dominates the courier's work in the running film.
 * This tests the production projective math, not an invented mock movie. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
new Function(js);
function extract(name){
 const at=js.indexOf('function '+name+'(');
 assert(at>=0,'missing original-source function '+name);
 const open=js.indexOf('{',at);let depth=0,end=open;
 do {if(js[end]==='{')depth++;if(js[end]==='}')depth--;end++;}
 while(depth&&end<js.length);
 assert(depth===0,'unbalanced original-source function '+name);
 return js.slice(at,end);
}
const project=vm.runInNewContext(extract('projectMarketReceiptShelves')+
 ';projectMarketReceiptShelves');
const shelves=[[-1,0.42,11.03],[.85,0.42,11.03]];
const aim=[-.075,.42,11.03];
const frontal=project([-.075,2.55,5.95],aim,shelves,.92,.58);
assert.equal(frontal.visibleShelves,2,
 'front camera must see BOTH exact original receiving bays');
assert(frontal.minHeightFraction>.02,'original sacks must occupy visible pixels');
assert(frontal.maxAbsX<.8,'both receiving shelves must fit in frame');
const fromBack=project([-.075,2.55,16.0],aim,shelves,.92,.58);
assert.equal(fromBack.visibleShelves,2,'pure projection must work behind market too');
const oblique=project([12,1.7,11.03],aim,shelves,.92,.58);
assert(oblique.minHeightFraction<frontal.minHeightFraction,
 '12m camera cannot claim same size as a physical 5m sightline');
assert.equal(project(aim,aim,shelves,.92,.58).visibleShelves,0,
 'zero-length camera cannot fabricate a valid view');
const lens=extract('chooseRealMarketReceiptLens');
for(const token of ['projectMarketReceiptShelves(', 'marketCourierPostSightline(',
 'physicalFollowEyeClearance',
 'foregroundSceneProjection','foregroundVegetationProjection',
 'receiptId','actualShelfPoints','postCover','visibleShelves'])
 assert(lens.includes(token),'authentic dock lens must account for '+token);
assert(lens.includes('[-1,')&&lens.includes('[.85,'),
 'source must measure both physical ORIGINAL receipt shelf X positions');
const audit=extract('getRealGrainJourneyAudit');
for(const key of ['visibleShelves','postCover','minHeightFraction'])
 assert(audit.includes(key),'record actual market sightline evidence: '+key);
const actor=extract('applyPlayerCamera');
assert(actor.includes('grainJourney.marketLens={...lens,yaw,pitch,zoom}'),
 'never block player manual orbit once original market follow is active');
console.log('W268 source and authentic market camera projection PASS (NOT a visual or hardware FPS milestone)');
