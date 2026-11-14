'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W64 living workday: existing growing grain moves with wind without a single
// synthetic farmer, additional harvest credit, changed route or RNG draw.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W64 physically rooted wind in real cultivated fields '+viewport.width+'px',async({page})=>{
  test.setTimeout(240000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:110000});
  const evidence=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   const source=JSON.stringify(g.exportSnapshot());
   const timeA=g.getFieldWindAudit(12),timeB=g.getFieldWindAudit(13.5);
   const after=JSON.stringify(g.exportSnapshot());
   document.querySelector('[data-scenic="farm"]')?.click();
   return {timeA,timeB,source,after,people:g.metrics().citizens,
    triangles:g.renderStats().lastFrameTriangles,
    glError:document.getElementById('world').getContext('webgl')?.getError(),
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(evidence.timeA.source).toBe('living-wheat-field-gpu-rooted-sway');
  expect(evidence.timeA.fields).toBe(2);
  expect(evidence.timeA.authoritativeWorkers).toBe(evidence.people);
  expect(evidence.timeA.activeCrops).toBeGreaterThan(0);
  expect(evidence.timeA.rootDrift).toBe(0);
  expect(evidence.timeA.tipDisplacement).toBeGreaterThan(.025);
  expect(evidence.timeB.tipDisplacement).toBeGreaterThan(.025);
  expect(Math.hypot(
   evidence.timeA.tipVector[0]-evidence.timeB.tipVector[0],
   evidence.timeA.tipVector[1]-evidence.timeB.tipVector[1])).toBeGreaterThan(.015);
  expect(evidence.timeA.usesAuthorityRandomness).toBe(false);
  expect(evidence.source).toBe(evidence.after);
  expect(evidence.triangles).toBeLessThan(160000);
  expect(evidence.glError).toBe(0);
  expect(evidence.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  fs.mkdirSync('artifacts/tiny-kingdom-w64',{recursive:true});
  await page.screenshot({path:'artifacts/tiny-kingdom-w64/'+viewport.width+'-living-farm.png'});
 });
}
