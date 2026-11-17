'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// The failed prior W402 real W54 test is the RED observed before this fix.
// Check voluntary economic inspection in the same real 3D citizen film.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W403 real film remains unobstructed and authentic grain is voluntarily inspectable '+viewport.width,async({page})=>{
  test.setTimeout(190000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:100000});
  const first=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   let view=g.watchVillageLife();
   for(let i=0;!view&&i<360;i++){g.step();view=g.watchVillageLife();}
   return view?{snapshot:JSON.stringify(g.exportSnapshot()),film:g.getVillageDocumentaryAudit(),
     stage:document.body.dataset.workday,worker:g.getGroundBaseWorkerAudit()}:null;
  });
  expect(first,'Only a genuine simulated workday can be filmed').not.toBeNull();
  expect(first.film.active).toBe(true);
  expect(first.film.following).toBe(true);
  expect(['live','delivery','household','homecoming']).toContain(first.stage);
  const ledger=page.locator('#film-ledger'),ribbon=page.locator('#world-ribbon');
  await expect(ledger).toBeVisible();await expect(ledger).toHaveAttribute('aria-expanded','false');
  await expect(ribbon).toBeHidden();
  const hit=await ledger.evaluate(el=>el.getBoundingClientRect().height);
  expect(hit).toBeGreaterThanOrEqual(viewport.width<=520?40:35);
  await ledger.click();
  await expect(ledger).toHaveAttribute('aria-expanded','true');
  await expect(ribbon).toBeVisible();
  await expect(page.locator('#world-supply-trail')).toBeVisible();
  await expect(page.locator('#world-trace-toggle')).toHaveAttribute('aria-expanded','true');
  const box=await ribbon.evaluate(el=>({left:el.getBoundingClientRect().left,
    right:el.getBoundingClientRect().right,height:el.getBoundingClientRect().height}));
  expect(box.left).toBeGreaterThanOrEqual(-1);expect(box.right).toBeLessThanOrEqual(viewport.width+1);
  const content=await page.locator('#world-supply-trail').innerText();
  expect(content.length).toBeGreaterThan(15);
  fs.mkdirSync('artifacts/tiny-kingdom-w403',{recursive:true});
  await page.screenshot({path:'artifacts/tiny-kingdom-w403/'+viewport.width+'-genuine-ledger-open.png'});
  await ledger.click();await expect(ribbon).toBeHidden();
  await expect(ledger).toHaveAttribute('aria-expanded','false');
  const end=await page.evaluate(()=>({snapshot:JSON.stringify(window.__tinyKingdom.exportSnapshot()),
    film:window.__tinyKingdom.getVillageDocumentaryAudit(),
    triangles:window.__tinyKingdom.renderStats().lastFrameTriangles}));
  expect(end.snapshot).toBe(first.snapshot);
  expect(end.film.active).toBe(true);expect(end.triangles).toBeGreaterThan(0);
  expect(errors).toEqual([]);
  await page.screenshot({path:'artifacts/tiny-kingdom-w403/'+viewport.width+'-real-worker-unobstructed.png'});
  fs.writeFileSync('artifacts/tiny-kingdom-w403/'+viewport.width+'-evidence.json',
   JSON.stringify({viewport,film:first.film,worker:first.worker,hit,expanded:box,
     currentFilm:end.film,triangles:end.triangles,nativeGpuFps:'NOT MEASURED',
     comparison:'NOT PROVEN'},null,2));
 });
}
