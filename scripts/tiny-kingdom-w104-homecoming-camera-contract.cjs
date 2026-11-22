'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const source=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
assert.doesNotThrow(()=>new vm.Script(source,{filename:'tiny-kingdom-inline.js'}));
const start=source.indexOf('function isReadableHomecomingShot(');
assert.ok(start>0,'W104 source must define a single read-only camera acceptance rule');
const end=source.indexOf('\n}\n',start);
assert.ok(end>start,'physical sightline rule has a well-bounded function body');
const fn=vm.runInNewContext(source.slice(start,end+2)+'\nisReadableHomecomingShot');
const clear={blockers:0,doorRayBlockers:0,vegetationFaceBlockers:0,
  foregroundVegetationCover:.04,foregroundSceneCover:.05,
  projectedWorkerHeightFraction:.28};
assert.equal(fn(clear,true,true),true,'real, visible mobile doorstep remains eligible');
assert.equal(fn(clear,true,false),true,'real moving mobile resident remains eligible');
for(const [patch,reason] of [
  [{vegetationFaceBlockers:1},'head physically behind a real tree'],
  [{foregroundVegetationCover:.40},'leaf mass dominates foreground'],
  [{foregroundSceneCover:.37},'roof or post dominates foreground'],
  [{projectedWorkerHeightFraction:.07},'resident visually lost at phone scale'],
  [{blockers:1},'roof ray intersects existing building']]){
  assert.equal(fn({...clear,...patch},true,false),false,reason+' must not be selected');
  assert.equal(fn({...clear,...patch},true,true),false,reason+' must not become a doorstep film');
}
assert.equal(fn({...clear,doorRayBlockers:1},true,true),false,'existing door blocked');
assert.equal(fn({...clear,doorRayBlockers:1},true,false),true,'no invented doorway requirement on walking shot');
const between=(from,to)=>source.slice(source.indexOf(from),source.indexOf(to,source.indexOf(from)));
const journey=between('function planCitizenCamera(','function planHomecomingThresholdCamera(');
assert.match(journey,/const scenic=\(working\|\|journeyCamera\)\?/,
 'real homeward walking camera must score existing timber and roofs');
assert.match(journey,/const canopy=\(\(working&&realWork\)\|\|journeyCamera\|\|unloading\)\?foregroundVegetationProjection/,
 'real homeward walking camera must score existing trees');
assert.match(journey,/const chosen=receivingBest\|\|routeBest\|\|clearHomewardBest\|\|frontBest/,
 'choose a physically readable real resident when one exists');
const doorstep=between('function planHomecomingThresholdCamera(','function continuousHomecomingWitness(');
assert.match(doorstep,/if\(!isReadableHomecomingShot\(sightline,portrait,true\)\)continue;/,
 'a blocked physical doorstep cannot override the moving citizen shot');
assert.match(doorstep,/return best\?\{\.\.\.best,clearShots,readableShots,checkedShots:checked\}:null;/,
 'no safe real outside position must report unavailable, never a fake shot');
// W173: closed oak door is an honest physical subject when the worker
// already rests beyond the wall; it must never pretend their body is visible.
const closedStart=source.indexOf('function isReadableClosedHomeShot(');
assert.ok(closedStart>0,'true closed-door physical camera criterion is present');
const closedEnd=source.indexOf('\n}\n',closedStart);
assert.ok(closedEnd>closedStart,'closed-door check has a bounded function body');
const closed=vm.runInNewContext(source.slice(closedStart,closedEnd+2)+'\nisReadableClosedHomeShot');
const shut={...clear,eyeClear:true,outsideDoor:true,projectedWorkerHeightFraction:0};
assert.equal(closed(shut),true,'observed real shut oak door does not require an invented visible resident');
for(const patch of [{outsideDoor:false},{eyeClear:false},{doorRayBlockers:1},
 {vegetationFaceBlockers:1},{foregroundVegetationCover:.34},
 {foregroundSceneCover:.32},{blockers:1}]){
 assert.equal(closed({...shut,...patch}),false,
  'closed doorway film cannot hide physical obstructions to stage an arrival');
}
assert.match(source,/function getHomecomingThresholdCameraAudit\(\)/);
console.log('W104/W173 PASS: JavaScript parses; original real open-door and genuinely closed-door sightline checks pass. Running-browser, performance and quality remain separately unproven.');
