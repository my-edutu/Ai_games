'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W32: continuing the inhabited workday, not a new cosmetic micro-gauntlet.
// Inspect an authentic citizen and ORBIT the physical 3D world on desktop and
// touch-sized layouts. The camera must not tunnel into a real roof to do it.
// Video is the real running WebGL animation, never a generated mock or still.
test.use({video:'on'});
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W32 physical human-scale orbit protects a selected real worker at '+viewport.width+'px',async({page},testInfo)=>{
  test.setTimeout(180000);
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
  const prepared=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   const p=g.getState().people[2];g.setCamera({focus:[p.x,p.z],zoom:11,yaw:.7,pitch:.6});
   return {before:g.exportSnapshot().checksum,count:g.metrics().citizens};
  });
  await page.waitForFunction(()=>window.__tinyKingdom.getCitizenPickCandidates().some(c=>
   c.visible&&c.x>90&&c.x<innerWidth-90&&c.y>120&&c.y<innerHeight-185),null,{timeout:90000});
  const candidate=await page.evaluate(()=>{
   const list=window.__tinyKingdom.getCitizenPickCandidates().filter(c=>
    c.visible&&c.x>90&&c.x<innerWidth-90&&c.y>120&&c.y<innerHeight-185);
   list.sort((a,b)=>a.depth-b.depth);return list[0];
  });
  await page.mouse.click(candidate.x,candidate.y);
  await expect.poll(()=>page.evaluate(()=>window.__tinyKingdom.getCamera().follow)).toBe(true);
  expect(await page.evaluate(()=>window.__tinyKingdom.getSelectedCitizen())).toBe(candidate.name);
  await page.mouse.move(viewport.width/2,viewport.height/2);
  await page.mouse.down();
  for(let i=1;i<=8;i++)
   await page.mouse.move(viewport.width/2+Math.min(viewport.width*.36,155)*i/8,
    viewport.height/2+Math.min(52,i*7));
  await page.mouse.up();
  await page.mouse.wheel(0,-260);
  await page.waitForTimeout(800);
  const observed=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {view:g.getCitizenOrbitAudit(),camera:g.getCamera(),
    after:g.exportSnapshot().checksum,count:g.metrics().citizens,
    selected:g.getSelectedCitizen(),width:document.documentElement.scrollWidth,
    gl:document.querySelector('#world').getContext('webgl')?.getError()??-1};
  });
  expect(observed.view?.source).toBe('real-selected-citizen-orbit');
  expect(observed.view?.checked).toBeGreaterThan(0);
  expect(observed.view?.blockers).toBe(0);
  expect(observed.view?.foregroundSceneCover).toBeLessThan(.36);
  expect(observed.camera.zoom).toBeGreaterThan(3.8);
  expect(observed.camera.zoom).toBeLessThan(14.5);
  expect(observed.selected).toBe(candidate.name);
  expect(observed.after).toBe(prepared.before);
  expect(observed.count).toBe(prepared.count);
  expect(observed.width).toBeLessThanOrEqual(viewport.width);
  expect(observed.gl).toBe(0);expect(errors).toEqual([]);
  await testInfo.attach('w32-actual-orbit-'+viewport.width+'px',{
   body:await page.screenshot(),contentType:'image/png'
  });
  // The clip must include a real autonomous world running after observation.
  await page.evaluate(()=>window.__tinyKingdom.setSpeed(1));
  await page.waitForTimeout(1200);
  expect(await page.evaluate(()=>window.__tinyKingdom.exportSnapshot().checksum))
   .not.toBe(prepared.before);
 });
}
