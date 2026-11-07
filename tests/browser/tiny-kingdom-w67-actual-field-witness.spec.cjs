'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W67 is a genuine camera/landmark regression, not a disguised art vote.
// RED until crop-depth witness is implemented: neither residents nor fields
// may be hidden, teleported, simulated or moved to stage these images.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W67 authentic grain worker is witnessed through a physically surveyed field '+viewport.width,async({page})=>{
  test.setTimeout(240000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:110000});
  const scene=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   let real=g.getHarvestInteractionAudit();
   for(let k=0;k<24*30*4&&!real.active;k++){
    g.step(1/30);if(k%3===0)real=g.getHarvestInteractionAudit();
   }
   if(!real.active)return {active:false};
   const before=JSON.stringify(g.exportSnapshot());
   const watch=g.watchHarvestShift();
   const audit=g.getFarmWorkCameraAudit();
   return {active:true,before,after:JSON.stringify(g.exportSnapshot()),
    real,watch,audit};
  });
  expect(scene.active,'the field subject must actually be harvesting').toBe(true);
  expect(scene.watch?.active).toBe(true);
  expect(scene.watch?.citizen).toBe(scene.real.citizen);
  expect(scene.before).toBe(scene.after);
  expect(scene.audit?.source).toBe('real-farmland-depth-and-actor-camera');
  expect(scene.audit?.active).toBe(true);
  expect(scene.audit?.citizen).toBe(scene.real.citizen);
  expect(scene.audit?.fieldsObserved).toBe(2);
  expect(scene.audit?.candidate?.heightFraction).toBeGreaterThan(0);
  expect(scene.audit?.candidate?.cropFaceBlockers).toBe(0);
  expect(scene.audit?.candidate?.cropWristBlockers).toBeGreaterThanOrEqual(0);
  expect(scene.audit?.candidate?.cropForegroundPenalty).toBeGreaterThanOrEqual(0);
  expect(scene.audit?.candidate?.cameraInsideField).toBe(false);
  await page.waitForFunction(()=>window.__tinyKingdom.getWorkdayCompositionAudit().active,
   null,{timeout:60000});
  const rendered=await page.evaluate(()=>{
   const g=window.__tinyKingdom,composition=g.getWorkdayCompositionAudit(),
    field=g.getFarmWorkCameraAudit();
   return {composition,field,
    integrity:JSON.stringify(g.exportSnapshot()),
    triangles:g.renderStats().lastFrameTriangles,
    overflow:document.documentElement.scrollWidth-innerWidth,
    glError:document.querySelector('#world').getContext('webgl')?.getError()};
  });
  expect(rendered.field.candidate.cropFaceBlockers).toBe(0);
  expect(rendered.composition.actor).toBe(scene.real.citizen);
  expect(rendered.triangles).toBeLessThan(160000);
  expect(rendered.overflow).toBeLessThanOrEqual(0);
  expect(rendered.glError).toBe(0);
  expect(errors).toEqual([]);
  fs.mkdirSync('artifacts/tiny-kingdom-w67',{recursive:true});
  await page.screenshot({path:'artifacts/tiny-kingdom-w67/'+viewport.width+'-real-field-witness.png'});
 });
}
