'use strict';
// W118 real 1024px and 390px WebGL screenshot/retention gate.
// Reaches ONLY original simulation citizens; no actor/transaction mocks.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W118 real occupied night resting residents retain one VBO '+viewport.width,async({page},info)=>{
  test.setTimeout(280000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:110000});
  // Only genuinely reached homes qualify, after simulated growth to >12.
  const observed=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.reset();g.setSpeed(0);
   let witness=null,ticks=0;
   for(;ticks<92000;ticks++){
    g.step(1/30);
    if(ticks%10)continue;
    const positions=g.getNavigation();
    const rest=positions.filter(p=>p.activity==='Resting at home'&&
     Array.isArray(p.target)&&!(p.path?.length)&&
     Math.hypot(p.position[0]-p.target[0],p.position[1]-p.target[1])<=.24);
    if(g.metrics().citizens>12&&rest.length>=5){
     witness={names:rest.map(p=>p.name),day:g.metrics().day,
      citizens:g.metrics().citizens};break;
    }
   }
   // Use normal physical orbit; no staged camera/entity/worker teleport.
   g.setCamera({focus:[0,0],zoom:38,yaw:.7,pitch:.79});
   return {witness,ticks,frame:g.getFrameProfile().totalFrames,
    authority:JSON.stringify(g.exportSnapshot())};
  });
  expect(observed.witness,'must reach genuine resting residents in a grown town')
   .not.toBeNull();
  await page.waitForFunction(previous=>
   window.__tinyKingdom.getFrameProfile().totalFrames>previous,
   observed.frame,{timeout:110000});
  const before=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {audit:g.getRestingActorResidencyAudit(),
    authority:JSON.stringify(g.exportSnapshot()),triangles:g.renderStats().lastFrameTriangles,
    frame:g.getFrameProfile().totalFrames};
  });
  expect(before.authority).toBe(observed.authority);
  expect(before.audit.bufferCount).toBeLessThanOrEqual(1);
  expect(before.audit.floats).toBeLessThanOrEqual(before.audit.maxFloats);
  expect(before.audit.actualCitizens).toBeGreaterThan(0);
  expect(before.triangles).toBeLessThan(160000);
  await info.attach('W118 authentic residents '+viewport.width+'px',
   {body:await page.screenshot(),contentType:'image/png'});
  const next=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   const prior=g.getFrameProfile().totalFrames;
   g.setCamera({yaw:.91,pitch:.72,zoom:35,focus:[0,0]});
   return prior;
  });
  await page.waitForFunction(previous=>
   window.__tinyKingdom.getFrameProfile().totalFrames>previous,
   next,{timeout:110000});
  const later=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {audit:g.getRestingActorResidencyAudit(),
    authority:JSON.stringify(g.exportSnapshot()),
    error:document.getElementById('world').getContext('webgl')?.getError()??0,
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(later.authority).toBe(observed.authority);
  expect(later.audit.bufferCount).toBeLessThanOrEqual(1);
  expect(later.audit.floats).toBeLessThanOrEqual(later.audit.maxFloats);
  expect(later.audit.reuses).toBeGreaterThanOrEqual(before.audit.reuses);
  expect(later.error).toBe(0);
  expect(later.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
 });
}
