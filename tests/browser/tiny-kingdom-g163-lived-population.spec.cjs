'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// G163: Day-120 pedestrians must have genuine articulated joints in the
// rendered LOD, not cardboard sliding boxes. Test the real WebGL scene and
// existing authoritative movement; never manufacture/copy citizen motion.
test('G163 390px grown civilization has physically articulated walking residents with unchanged authority',async({page})=>{
 test.setTimeout(240000);
 const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e.message)));
 await page.setViewportSize({width:390,height:844});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
 await page.evaluate(()=>{const g=window.__tinyKingdom;g.reset();g.setSpeed(0)});
 for(let remaining=120*24*30;remaining>0;remaining-=7200)
  await page.evaluate(n=>{
   const g=window.__tinyKingdom;for(let i=0;i<n;i++)g.step(1/30);
  },Math.min(remaining,7200));
 // Day-121 daytime: work shifts and road journeys must be authentic and
 // visible; a midnight motionless settlement cannot prove inhabited life.
 await page.evaluate(()=>{for(let i=0;i<8*30;i++)window.__tinyKingdom.step(1/30);});
 await page.waitForFunction(()=>window.__tinyKingdom?.getPopulationMotionAudit?.().lastRenderedCompact>0,
  null,{timeout:90000});
 const original=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {authority:JSON.stringify(g.exportSnapshot()),audit:g.getPopulationMotionAudit(),
   metrics:g.metrics(),triangles:g.renderStats().lastFrameTriangles,
   screen:document.documentElement.scrollWidth,
   gl:document.querySelector('#world').getContext('webgl')?.getError()??-1};
 });
 expect(original.metrics.day).toBeGreaterThanOrEqual(120);
 expect(original.audit.source).toBe('real-citizen-rig-at-visible-LOD');
 expect(original.audit.population).toBe(original.metrics.citizens);
 expect(original.audit.compactCount).toBeGreaterThan(5);
 expect(original.audit.lastRenderedCompact).toBeGreaterThan(0);
 expect(original.audit.lastRenderedArticulated).toBe(original.audit.lastRenderedCompact);
 // G164 integrated inhabited-workday contract. Every far-field resident must
 // have visually identifiable occupation clothing, not just a job-coloured cube.
 // Authentic workers bend over the physical task and use their own job tool.
 expect(original.audit.lastRoleSilhouettes).toBe(original.audit.lastRenderedCompact);
 expect(original.audit.lastBentWorkers).toBe(original.audit.lastWorking);
 expect(original.audit.visualJobs.length).toBeGreaterThanOrEqual(3);
 expect(original.audit.lastRoleToolRenderings).toBeGreaterThanOrEqual(0);
 if(original.audit.lastWorksiteWorkers>0)
  expect(original.audit.lastRoleToolRenderings).toBe(original.audit.lastWorksiteWorkers);
 expect(original.audit.lastAnimatedCartWheels).toBeGreaterThanOrEqual(0);
 expect(original.audit.samples.length).toBeGreaterThan(0);
 for(const p of original.audit.samples){
  expect(p.twoBoneGait).toBe(true);
  expect(p.legs).toHaveLength(2);
  expect(p.arms).toHaveLength(2);
  for(const bone of p.legs){
   expect(bone.hipToKnee).toBeGreaterThan(.24);
   expect(bone.hipToKnee).toBeLessThan(.38);
   expect(bone.kneeToAnkle).toBeGreaterThan(.24);
   expect(bone.kneeToAnkle).toBeLessThan(.38);
   expect(bone.groundOffset).toBeGreaterThan(-.28);
   expect(bone.groundOffset).toBeLessThan(.28);
  }
 }
 expect(original.triangles).toBeGreaterThan(0);
 expect(original.triangles).toBeLessThan(160000);
 expect(original.screen).toBeLessThanOrEqual(390);
 expect(original.gl).toBe(0);
 const unchanged=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
 expect(unchanged).toBe(original.authority);
 expect(pageErrors).toEqual([]);
});
