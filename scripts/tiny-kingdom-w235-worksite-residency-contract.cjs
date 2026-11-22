'use strict';
/* W235 rendering-spine RED-before contract: physical stationary workbench
 * geometry moves to the existing bounded resident fixture mesh. This is
 * NOT a claim of software or physical GPU frame-rate improvement. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const part=(start,end)=>{
 const a=html.indexOf(start),b=html.indexOf(end,a+start.length);
 assert(a>=0&&b>a,`W235 missing source partition: ${start}`);
 return html.slice(a,b);
};
const still=part('function appendStationaryWorksiteDressing(','function appendActiveWorksiteDressing(');
const moving=part('function appendActiveWorksiteDressing(','/* G090: genuine work evidence');
const fixed=part('function emitFixedWorkstation(','function emitMovingWorkstation(');
const resident=part('function worksiteFixtureSignature(','function emitFixedWorkstation(');
const renderer=part('function renderFixedWorkstations(','function prepareWorksiteFixtureResidentMesh(');
const realJobs=['forester','farmer','builder','merchant','craftsperson','gatherer'];
for(const job of realJobs)
 assert(still.includes("w.job==='"+job+"'"),'W235 missing stationary '+job+' physical work');
assert.match(fixed,/appendStationaryWorksiteDressing\(w,x,y,z\)/,
 'W235 original fixed workstation must include stationary dressing');
assert.match(renderer,/emitFixedWorkstation\(w,station\)/);
assert.match(resident,/station.angle/);
assert.match(resident,/station.groundHeight/);
assert.match(moving,/cue\.phase/);
assert.match(moving,/w\.job==='farmer'/);
assert.match(moving,/w\.job==='builder'/);
assert.match(moving,/w\.job==='craftsperson'/);
assert.match(moving,/w\.job==='merchant'/);
assert.match(moving,/w\.job==='gatherer'/);
assert.match(moving,/w\.job==='forester'/);
assert.match(moving,/worksiteVisualCue\(w\)/);
assert.match(still,/box\(x,y\+\.50,z\+\.46,1\.00,\.09,\.55/);
assert(!moving.includes('box(x,y+.50,z+.46,1.00,.09,.55'),
 'W235 market tabletop must not be regenerated per frame');
assert(!moving.includes('for(let i=0;i<3;i++){\n    limbSegment([x-.43'),
 'W235 sawbuck logs must not be regenerated per frame');
assert(!moving.includes('box(x+.05,y+.06,z-.46,.49,.20,.35'),
 'W235 farm crate must not be regenerated per frame');
assert.match(html,/WORKSITE_FIXTURE_FLOAT_BUDGET=96000/);
console.log('W235 SOURCE contract PASS: all six authentic professions preserve physical stationary props in existing resident/fallback paths; genuine moving job actions stay live. Hardware and experience unproven.');
