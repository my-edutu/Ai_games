'use strict';
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {launch,open}=require('./browser-harness.cjs');
let browser;before(async()=>{browser=await launch()});after(async()=>{await browser?.close()});
async function use(fn,size={width:1920,height:1080}){const {page,errors}=await open(browser,size);try{await fn(page);assert.deepEqual(errors,[])}finally{await page.close()}}
test('HD renderer has a complete bounded shadow map and caches identical paused frames',async()=>use(async page=>{
 const r=await page.evaluate(()=>{const g=__tinyKingdom;if(!g.getLightingStats)return null;g.setRenderQuality(1);__drawFrame(1000);const a=g.getLightingStats();__drawFrame(1200);return {a,b:g.getLightingStats(),audit:g.getGeometryAudit()}});
 assert.ok(r,'lighting inspection missing');assert.equal(r.a.model,'directional-depth-pcf3');assert.equal(r.a.framebufferComplete,true);assert.equal(r.a.mapSize,2048);assert.equal(r.a.error,0);assert.ok(r.a.passes>=1);assert.equal(r.a.passes,r.b.passes);assert.equal(r.audit.static.invalidComponents,0);assert.equal(r.audit.dynamic.invalidNormals,0);
}));
test('HD quality is an explicit full-resolution choice and does not mutate simulation',async()=>use(async page=>{
 assert.equal(await page.locator('#graphics-quality').count(),1);
 const before=await page.evaluate(()=>JSON.stringify(__tinyKingdom.exportSnapshot()));
 await page.selectOption('#graphics-quality','hd');await page.evaluate(()=>__drawFrame(1000));
 const r=await page.evaluate(()=>({preset:__tinyKingdom.getPresentationStats(),w:document.querySelector('#world').width,h:document.querySelector('#world').height,s:JSON.stringify(__tinyKingdom.exportSnapshot())}));
 assert.equal(r.preset.quality,'hd');assert.equal(r.w,1920);assert.equal(r.h,1080);assert.equal(r.s,before);
 await page.selectOption('#graphics-quality','balanced');await page.evaluate(()=>__drawFrame(1200));assert.equal(await page.evaluate(()=>JSON.stringify(__tinyKingdom.exportSnapshot())),before);
}));
test('only the requested inspector opens; escape closes it without changing the world',async()=>use(async page=>{
 assert.equal(await page.locator('[data-panel="citizens"]').count(),1);
 await page.locator('[data-panel="citizens"]').click();assert.equal(await page.locator('#citizen-card').isVisible(),true);assert.equal(await page.locator('.feed').isVisible(),false);
 await page.locator('[data-panel="resources"]').click();assert.equal(await page.locator('#citizen-card').isVisible(),false);assert.equal(await page.locator('#economic-observatory').isVisible(),true);
 await page.keyboard.press('Escape');assert.equal(await page.locator('#economic-observatory').isVisible(),false);
 assert.equal(await page.evaluate(()=>document.body.dataset.inspector),'none');
}));
test('390px interface has accessible controls without horizontal overflow',async()=>use(async page=>{
 assert.equal(await page.locator('#panel-nav').count(),1);
 const fits=await page.evaluate(()=>{const ids=['panel-nav','world-ribbon'];return ids.every(id=>{let r=document.getElementById(id).getBoundingClientRect();return r.x>=0&&r.right<=innerWidth+1})&&document.documentElement.scrollWidth<=innerWidth});assert.equal(fits,true);
 await page.locator('[data-panel="citizens"]').click();assert.equal(await page.locator('#citizen-card').isVisible(),true);
 await page.evaluate(()=>__tinyKingdom.setHudMode('cinema'));assert.equal(await page.locator('#panel-nav').isVisible(),false);await page.keyboard.press('Escape');assert.equal(await page.locator('#panel-nav').isVisible(),true);
},{width:390,height:844}));
test('shadow and night material changes are render-only and finite',async()=>use(async page=>{
 const r=await page.evaluate(()=>{let g=__tinyKingdom;if(!g.getLightingStats)return null;const s=g.exportSnapshot();s.payload.state.t=21;s.checksum=__tkInspection.checksum(s.payload);g.restoreSnapshot(s);const before=JSON.stringify(g.exportSnapshot());__drawFrame(1000);return {same:before===JSON.stringify(g.exportSnapshot()),lighting:g.getLightingStats(),audit:g.getGeometryAudit()}});
 assert.ok(r);assert.equal(r.same,true);assert.equal(r.lighting.error,0);assert.equal(r.audit.static.invalidColors,0);
}));

test('cylinders and conical surfaces face outward, including the top caps',async()=>use(async page=>{
 const result=await page.evaluate(()=>['cylinder','cone'].map(kind=>{const d=__tkInspection.capturePrimitive(kind);let inward=0;for(let i=0;i<d.length;i+=30){const x=(d[i]+d[i+10]+d[i+20])/3,z=(d[i+2]+d[i+12]+d[i+22])/3;if(Math.abs(d[i+4])>.99){if(d[i+4]<0)inward++}else if(x*d[i+3]+z*d[i+5]<=0)inward++}return {kind,inward}}));
 for(const shape of result)assert.equal(shape.inward,0,shape.kind+' has inward-facing triangles');
}));
test('district finishing is bounded, cached, finite, and cannot change saved state',async()=>use(async page=>{
 const r=await page.evaluate(()=>{const g=__tinyKingdom;if(!g.getDistrictStats)return null;const before=JSON.stringify(g.exportSnapshot());__drawFrame(1000);const a=g.getDistrictStats();__drawFrame(1200);return {a,b:g.getDistrictStats(),audit:g.getGeometryAudit(),same:before===JSON.stringify(g.exportSnapshot())}});
 assert.ok(r,'district finishing missing');assert.ok(r.a.plantedBorders>=24);assert.ok(r.a.plants>=150);assert.ok(r.a.landscapeTriangles>1000);assert.deepEqual(r.a,r.b);assert.equal(r.same,true);assert.equal(r.audit.static.outOfBounds,0);assert.equal(r.audit.static.invalidNormals,0);assert.ok(r.audit.static.triangles<115000);
}));
test('WebGL without depth-texture support retains a valid fallback renderer',async()=>{
 const {markup}=require('./browser-harness.cjs');const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{const html=markup().replace('<script>','<script>\nconst originalExt=WebGLRenderingContext.prototype.getExtension;WebGLRenderingContext.prototype.getExtension=function(n){return n===\'WEBGL_depth_texture\'?null:originalExt.call(this,n)};');await page.setContent(html);await page.waitForFunction(()=>!!window.__tinyKingdom);const result=await page.evaluate(()=>{__tinyKingdom.setSpeed(0);__drawFrame(1000);return __tinyKingdom.getLightingStats()});assert.equal(result.supported,false);assert.equal(result.error,0);assert.ok(result.fallbackReason);assert.deepEqual(errors,[])}finally{await page.close()}
});
test('resolution readout updates on the first frame after a viewport resize',async()=>use(async page=>{
 await page.evaluate(()=>__drawFrame(1000));await page.setViewportSize({width:390,height:844});await page.evaluate(()=>__drawFrame(1200));
 assert.match(await page.locator('#render-readout').textContent(),/^390 × 844/);
}));

test('gable timber finishing sits outside the existing roof caps instead of inside the wall',async()=>use(async page=>{
 const r=await page.evaluate(()=>{const d=__tkInspection.captureFinish(),ground=__tkInspection.ground(0,0);let front=0,back=0;for(let i=0;i<d.length;i+=10){if(d[i+1]>ground+2&&d[i+9]===6){front=Math.min(front,d[i+2]);back=Math.max(back,d[i+2])}}return {front,back}});
 assert.ok(r.front< -1.23,'front gable braces hidden behind roof cap');assert.ok(r.back>1.23,'rear gable braces hidden behind roof cap');
}));
