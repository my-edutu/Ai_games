'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
for(const viewport of [{width:1024,height:640},{width:390,height:844}])test('W108 genuine citizen projection '+viewport.width,async({page})=>{
 test.setTimeout(180000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize(viewport);await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:110000});
 const before=await page.evaluate(()=>{const g=window.__tinyKingdom;g.setSpeed(0);
 const saved=JSON.stringify(g.exportSnapshot()),a=g.getCitizenDetailProjectionAudit(),b=g.getCitizenDetailProjectionAudit();
 return {saved,a,b,cache:g.getCitizenProjectionCacheAudit(),cpu:g.getFrameProfile(),citizens:g.metrics().citizens}});
 expect(before.a).toEqual(before.b);expect(before.cache.entries).toBe(1);
 expect(before.cache.hits).toBeGreaterThan(0);
 expect(before.a.fullDetailCount+before.a.compactCount).toBe(before.citizens);
 expect(before.cpu.stages.citizenDetailSelection).toBeDefined();
 const after=await page.evaluate(()=>{const g=window.__tinyKingdom;
 g.setCamera({yaw:1.21,pitch:.55,zoom:21,focus:[0,6]});const detail=g.getCitizenDetailProjectionAudit();
 return {detail,cache:g.getCitizenProjectionCacheAudit(),saved:JSON.stringify(g.exportSnapshot()),
 gl:document.getElementById('world').getContext('webgl')?.getError(),overflow:document.documentElement.scrollWidth-innerWidth}});
 expect(after.cache.builds).toBeGreaterThan(before.cache.builds);
 expect(after.detail.fullDetailCount+after.detail.compactCount).toBe(before.citizens);
 expect(after.saved).toEqual(before.saved);expect(after.gl).toBe(0);
 expect(after.overflow).toBeLessThanOrEqual(0);expect(errors).toEqual([]);
 const dir='artifacts/tiny-kingdom-w108';fs.mkdirSync(dir,{recursive:true});
 await page.screenshot({path:dir+'/'+viewport.width+'-true-worker-view.png'});
});
