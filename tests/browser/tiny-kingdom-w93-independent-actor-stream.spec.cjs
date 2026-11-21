'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// W93 RED-FIRST: separate complete citizen geometry from real worksite /
// economy geometry, with independent bounded GPU storage. This must neither
// hide a worker nor invent a transaction, and must agree with old combined
// path for BOTH real screen sizes, without changing the authoritative snapshot.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W93 exact 3D citizen/world stream parity '+viewport.width,async({page},testInfo)=>{
  test.setTimeout(240000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:110000});
  const baseline=await page.evaluate(()=>{const g=window.__tinyKingdom;
   const citizen=g.getState().people.find(p=>Number.isFinite(p.x)&&Number.isFinite(p.z));
   if(!citizen)throw Error('W93 no true autonomous citizen for physical close-up');
   g.setSpeed(0);g.setCamera({yaw:.8,pitch:.22,zoom:3.4,focus:[citizen.x,citizen.z]});
   g.setActorStreamSplitForTesting(false);
   return g.getFrameProfile().totalFrames;
  });
  await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,
   baseline,{timeout:110000});
  const old=await page.evaluate(()=>{const g=window.__tinyKingdom;return {
   snapshot:JSON.stringify(g.exportSnapshot()),
   geometry:g.getGeometryAudit(),
   total:g.renderStats().lastFrameTriangles,
   policy:g.getCitizenDetailPolicy(),
   stream:g.getActorResidencyAudit()
  }});
  const prior=await page.evaluate(()=>{const g=window.__tinyKingdom;
   const n=g.getFrameProfile().totalFrames;
   g.setActorStreamSplitForTesting(true);return n;
  });
  await page.waitForFunction(n=>{const g=window.__tinyKingdom,a=g.getActorResidencyAudit();
   return g.getFrameProfile().totalFrames>n&&a.enabled&&a.actorFloats>0;
  },prior,{timeout:110000});
  const split=await page.evaluate(()=>{const g=window.__tinyKingdom;
   return {snapshot:JSON.stringify(g.exportSnapshot()),geometry:g.getGeometryAudit(),
    total:g.renderStats().lastFrameTriangles,policy:g.getCitizenDetailPolicy(),
    stream:g.getActorResidencyAudit(),gl:document.querySelector('#world')
     .getContext('webgl')?.getError(),overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(old.stream.enabled).toBe(false);
  expect(split.stream.actorFloats).toBeGreaterThan(0);
  expect(split.stream.actorFloats+split.stream.worldFloats).toBe(old.stream.worldFloats);
  expect(split.stream.cachedActors).toBe(split.policy.population);
  expect(split.stream.bufferCount).toBeLessThanOrEqual(3);
  expect(split.stream.maxBufferCount).toBe(3);
  expect(split.stream.authorityModified).toBe(false);
  expect(split.stream.totalFloats).toBeLessThanOrEqual(split.stream.floatBudget);
  expect(split.geometry).toEqual(old.geometry);
  expect(split.total).toBe(old.total);
  expect(split.snapshot).toBe(old.snapshot);
  expect(split.policy.population).toBe(old.policy.population);
  expect(split.gl).toBe(0);
  expect(split.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  await testInfo.attach('W93-actual-resident-workers-'+viewport.width,
   {body:await page.screenshot(),contentType:'image/png'});
 });
}
