'use strict';
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {launch,open}=require('./browser-harness.cjs');
let browser;
before(async()=>{browser=await launch()});
after(async()=>{await browser?.close()});
async function run(fn){const {page,errors}=await open(browser,{width:1280,height:720});try{const value=await page.evaluate(fn);assert.deepEqual(errors,[]);return value}finally{await page.close()}}
test('road shoulders, cobbles and market square are rendered once without touching authoritative state',async()=>{
 const r=await run(()=>{const g=__tinyKingdom,before=JSON.stringify(g.exportSnapshot());__drawFrame(1000);const stats=g.getRoadStats(),audit=g.getGeometryAudit();__drawFrame(1200);return {stats,again:g.getRoadStats(),audit,unchanged:JSON.stringify(g.exportSnapshot())===before}});
 assert.ok(r.unchanged);assert.ok(r.stats.shoulderSegments>100);assert.ok(r.stats.cobblestones>100);assert.ok(r.stats.plazaStones>=60);assert.ok(r.stats.triangles<13000);
 assert.deepEqual(r.stats,r.again);assert.equal(r.audit.static.invalidNormals,0);assert.equal(r.audit.static.invalidComponents,0);assert.ok(r.audit.static.triangles<115000);
});
test('visual-only shadow refreshes are bounded and depth resolution follows preset',async()=>{
 const r=await run(()=>{const g=__tinyKingdom;g.setGraphicsPreset('hd');__drawFrame(1000);const first=g.getLightingStats();g.step(1/30);__drawFrame(1100);const early=g.getLightingStats();g.step(1/30);__drawFrame(1300);const later=g.getLightingStats();g.setGraphicsPreset('balanced');__drawFrame(1500);const balanced=g.getLightingStats();g.setGraphicsPreset('performance');__drawFrame(1700);const performance=g.getLightingStats();g.setGraphicsPreset('hd');__drawFrame(1900);const hd=g.getLightingStats();return {first,early,later,balanced,performance,hd}});
 assert.equal(r.first.supported,true);assert.equal(r.first.mapSize,2048);assert.equal(r.early.passes,r.first.passes);assert.ok(r.early.reusedPasses>0);assert.ok(r.later.passes>r.early.passes);
 assert.equal(r.balanced.mapSize,1024);assert.equal(r.performance.mapSize,512);assert.equal(r.hd.mapSize,2048);assert.equal(r.hd.error,0);
});
test('changing camera and graphics budgets never changes a saved kingdom',async()=>{
 const r=await run(()=>{const g=__tinyKingdom,before=JSON.stringify(g.exportSnapshot());for(const [i,name] of ['hd','balanced','performance','hd'].entries()){g.setGraphicsPreset(name);g.setCamera({focus:[0,3],zoom:30+i,pitch:.68,yaw:2.65});__drawFrame(1000+i*500)}return {same:before===JSON.stringify(g.exportSnapshot()),audit:g.getGeometryAudit(),lighting:g.getLightingStats()}});
 assert.equal(r.same,true);assert.equal(r.audit.static.invalidComponents,0);assert.equal(r.lighting.error,0);
});
