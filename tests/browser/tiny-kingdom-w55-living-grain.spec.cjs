'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// W245: preserve W55's planted-field and 390px evidence against the actual
// W111 two complete resident tiers and the strict current-frame scene budget.
// Source or WebGL success is NOT a commercial experience milestone.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W55 inhabited farm has lightweight, individually bent grain ears and legible controls at '+viewport.width+'px',async({page})=>{
  test.setTimeout(160000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:100000});
  const audit=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   const before=JSON.stringify(g.exportSnapshot());
   const farmer=g.getFarmsteadStats();
   const planted=g.getFarmFieldResidencyAudit();
   const ui=['pause','command-toggle'].map(id=>{
    const b=document.getElementById(id),r=b.getBoundingClientRect();
    return {id,fontSize:parseFloat(getComputedStyle(b).fontSize),height:r.height};
   });
   return {farmer,planted,ui,scene:g.renderStats().lastFrameTriangles,
    glError:document.getElementById('world').getContext('webgl')?.getError(),
    unchanged:before===JSON.stringify(g.exportSnapshot()),
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(audit.farmer.stalkVisualModel).toBe('w111-two-complete-seasonal-crop-tiers');
  expect(audit.farmer.stalks).toBe(668);
  expect(audit.farmer.seedHeads).toBeGreaterThan(500);
  expect(audit.planted.originalPlotCount).toBe(2);
  expect(audit.planted.plantedStems).toBe(668);
  expect(audit.planted.plottedStems).toBe(audit.planted.plantedStems);
  expect(audit.planted.allOriginalRoots).toBe(true);
  expect(audit.planted.active).toBe(true);
  expect(audit.planted.buffers).toBe(2);
  expect(audit.planted.nearTriangles).toBeGreaterThan(audit.planted.farTriangles);
  expect(audit.planted.sceneBudget.originalPlotsPreserved).toBe(true);
  expect(audit.planted.sceneBudget.droppedPlotsForBudget).toBe(0);
  expect(audit.planted.sceneBudget.sceneBudgetBreached).toBe(false);
  expect(audit.scene).toBeLessThan(160000);
  expect(audit.unchanged).toBe(true);
  expect(audit.glError).toBe(0);
  expect(audit.overflow).toBeLessThanOrEqual(0);
  if(viewport.width===390)for(const control of audit.ui){
   expect(control.fontSize).toBeGreaterThanOrEqual(11);
   expect(control.height).toBeGreaterThanOrEqual(39);
  }
  fs.mkdirSync('artifacts/tiny-kingdom-w55',{recursive:true});
  await page.screenshot({path:'artifacts/tiny-kingdom-w55/'+viewport.width+'-real-original-grain-fields.png'});
  expect(errors).toEqual([]);
 });
}
