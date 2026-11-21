'use strict';
// W501 genuine software WebGL worksite retention default: source RED/GREEN.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const start=html.indexOf('function worksiteFixtureResidencyRequested(){');
const end=html.indexOf('function disposeWorksiteFixtureMesh(){',start);
assert.ok(start>=0&&end>start,'production admission function must exist');
const source=html.slice(start,end);
const admission=new Function('gpuAvailable','swiftGpu','worksiteFixtureOverride',
 source+'\nreturn worksiteFixtureResidencyRequested();');
test('software WebGL retains the existing physical workstation mesh by default',()=>{
 assert.equal(admission(true,true,null),true);
 assert.equal(admission(true,false,null),true);
});
test('render-only opt out restores original complete CPU worksite geometry',()=>{
 assert.equal(admission(true,true,false),false);
 assert.equal(admission(true,false,false),false);
 assert.equal(admission(true,true,true),true);
});
test('no GPU means no retained worksite state even if manually requested',()=>{
 assert.equal(admission(false,true,null),false);
 assert.equal(admission(false,false,true),false);
});
test('authentic motion and world-state contracts remain on the live path',()=>{
 const begin=html.indexOf('function renderWorkdayTraces(){');
 const finish=html.indexOf('/* G097 inhabited-high-street',begin);
 assert.ok(begin>=0&&finish>begin);
 const renderer=html.slice(begin,finish);
 assert.match(renderer,/prepareWorksiteFixtureResidentMesh\(active\)/);
 assert.match(renderer,/if\(!fixturesResident\)renderFixedWorkstations\(active\)/);
 assert.match(renderer,/emitMovingWorkstation\(w,station,pulse\)/);
 assert.match(renderer,/originalStagedWorksiteKey\(w\)/);
 assert.match(html,/WORKSITE_FIXTURE_FLOAT_BUDGET=96000/);
 assert.match(html,/function getWorksiteFixtureResidencyAudit\(\)/);
 assert.match(html,/softwareDefaultResident:Boolean\(swiftGpu&&gpuAvailable&&worksiteFixtureOverride===null\)/);
});
