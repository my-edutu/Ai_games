'use strict';
// W490 Phase 1: staged real farmer/gatherer work becomes retained geometry
// only at a genuine changed occupational progress stage. Never fake work.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
function sourceBetween(start,end){
 const a=html.indexOf(start),b=html.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'production function must exist: '+start);
 return html.slice(a,b);
}
const stageSource=sourceBetween('function originalStagedWorksiteKey(w){',
 'function worksiteFixtureSignature(sites){');
const stage=new Function('worksiteVisualCue',
 stageSource+'\nreturn originalStagedWorksiteKey;')(
 w=>({progress:Math.max(0,Math.min(1,w.progress))}));
const farmer=p=>({citizen:'Bram',job:'farmer',activity:'Harvesting grain',progress:p});
const gatherer=p=>({citizen:'Mira',job:'gatherer',activity:'Gathering herbs',progress:p});
test('real harvesting stages have exact discrete transitions, not 30fps re-bakes',()=>{
 assert.equal(stage(farmer(.12)),stage(farmer(.20)));
 assert.notEqual(stage(farmer(.20)),stage(farmer(.35)));
 assert.equal(stage(farmer(0)),stage(farmer(.12)));
 assert.notEqual(stage(farmer(.75)),stage(farmer(.9)));
 assert.equal(stage(farmer(.9)),stage(farmer(1)));
 const winter={...farmer(.8),activity:'Tending grain store'};
 assert.notEqual(stage(winter),stage(farmer(.8)));
 assert.equal(stage(winter),stage({...winter,progress:.2}));
});
test('gatherer bundle stages change when real harvested material changes',()=>{
 assert.equal(stage(gatherer(.03)),stage(gatherer(.31)));
 assert.notEqual(stage(gatherer(.31)),stage(gatherer(.34)));
 assert.equal(stage(gatherer(.35)),stage(gatherer(.64)));
 assert.notEqual(stage(gatherer(.64)),stage(gatherer(.68)));
});
test('continuous forge, woodcutting, joinery and trade NEVER get frozen in residency',()=>{
 for(const job of ['craftsperson','forester','builder','merchant'])
  assert.equal(stage({job,progress:.3,activity:'Working'}),'');
});
test('production uses ONE existing bounded fixture VBO and preserves live strikes',()=>{
 const signature=sourceBetween('function worksiteFixtureSignature(sites){',
 'function emitFixedWorkstation(w,station){');
 const key=sourceBetween('function worksiteFixturePartKey(w,station){',
 'function buildWorksiteFixturePart(w,station){');
 const build=sourceBetween('function buildWorksiteFixturePart(w,station){',
 'function prepareWorksiteFixtureResidentMesh(sites){');
 const render=sourceBetween('function renderWorkdayTraces(){',
 '/* G097 inhabited-high-street');
 assert.match(signature,/worksiteFixturePartKey\(w,station\)/);
 assert.match(key,/originalStagedWorksiteKey\(w\)/);
 assert.match(build,/originalStagedWorksiteKey\(w\)/);
 assert.match(build,/appendActiveWorksiteDressing\(w,/);
 assert.match(render,/emitMovingWorkstation\(w,station,pulse\)/);
 assert.match(render,/fixturesResident.*originalStagedWorksiteKey\(w\)/);
 assert.match(html,/getWorksiteFixtureResidencyAudit/);
});
