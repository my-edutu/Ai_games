'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// W55 test written before rebuilding the original, truth-linked field art.
// These tests do not count as an experience gate without matched gameplay.
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
   const ui=['pause','command-toggle'].map(id=>{
    const b=document.getElementById(id),r=b.getBoundingClientRect();
    return {id,fontSize:parseFloat(getComputedStyle(b).fontSize),height:r.height};
   });
   return {farmer,ui,scene:g.renderStats().lastFrameTriangles,
    glError:document.getElementById('world').getContext('webgl')?.getError(),
    unchanged:before===JSON.stringify(g.exportSnapshot()),
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(audit.farmer.stalkVisualModel).toBe('w55-tapered-crossed-stems-grain-ears');
  expect(audit.farmer.stalks).toBe(668);
  expect(audit.farmer.seedHeads).toBeGreaterThan(500);
  expect(audit.farmer.stalkTriangles).toBeGreaterThan(5000);
  expect(audit.farmer.stalkTriangles).toBeLessThan(16000);
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
