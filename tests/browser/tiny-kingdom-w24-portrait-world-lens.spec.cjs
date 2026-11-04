'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// Living Valley W24: the SAME physical market, pedestrians and working
// villagers must be legible through a narrow portrait display. The renderer
// must adapt its optical projection, NOT move/hide actors, roofs or posts.
// This is a visual safety floor, not independent LOOK/FEEL/PLAY evidence.
for(const [label,width,height] of [['desktop',1024,640],['portrait 390px',390,844]]){
 test('W24 physical street lens keeps actual market and autonomy '+label,async({page})=>{
  test.setTimeout(180000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width,height});
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
  const audit=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   g.setSpeed(0);
   const before=JSON.stringify(g.exportSnapshot());
   const overview=g.getCameraLensAudit();
   const market=g.visitMarket();
   const pedestrian=g.getCameraLensAudit();
   const physical=g.getStreetWalkState();
   const after=JSON.stringify(g.exportSnapshot());
   const gl=document.getElementById('world').getContext('webgl');
   return {overview,pedestrian,marketActive:market.active,physical,
    unchanged:before===after,citizens:g.metrics().citizens,
    triangles:g.renderStats().lastFrameTriangles,
    glError:gl?.getError()??-1,overflow:document.documentElement.scrollWidth};
  });
  expect(audit.unchanged,'Optical camera must not change world snapshot').toBe(true);
  expect(audit.marketActive,'Visit a REAL physically checked market stall').toBe(true);
  expect(audit.physical.active).toBe(true);
  expect(audit.citizens).toBeGreaterThanOrEqual(12);
  expect(audit.pedestrian.mode).toBe('pedestrian');
  expect(audit.pedestrian.viewportWidth).toBe(width);
  expect(audit.pedestrian.viewportHeight).toBe(height);
  expect(audit.pedestrian.verticalDegrees).toBeLessThanOrEqual(100);
  if(width===390){
   expect(audit.pedestrian.horizontalDegrees,
    '390px pedestrians must see surrounding village, not only a single roof').toBeGreaterThanOrEqual(51);
   expect(audit.pedestrian.responsive).toBe(true);
   expect(audit.pedestrian.horizontalDegrees-audit.overview.horizontalDegrees).toBeGreaterThan(13);
  }else{
   expect(audit.pedestrian.responsive).toBe(false);
   expect(audit.pedestrian.verticalDegrees).toBeCloseTo(56.25,0);
  }
  expect(audit.triangles).toBeLessThan(160000);
  expect(audit.glError).toBe(0);
  expect(audit.overflow).toBeLessThanOrEqual(width);
  expect(errors).toEqual([]);
 });
}
