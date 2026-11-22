'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// W54 RED-first: gameplay is not world-first if watching an ACTUAL worker
// restores the oversized pre-W53 HUD. Test both the actor and the controls.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W54 workday world-first live camera and accessible controls '+viewport.width,async({page})=>{
  test.setTimeout(190000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:100000});
  const actor=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   let result=g.watchVillageLife();
   for(let i=0;!result&&i<360;i++){g.step();result=g.watchVillageLife();}
   if(!result)return null;
   return {stage:document.body.dataset.workday,film:g.getVillageDocumentaryAudit(),
    before:JSON.stringify(g.exportSnapshot())};
  });
  expect(actor,'must be observing a genuinely simulated worker, not a staged NPC').not.toBeNull();
  // Genuine household provisioning is a valid observed village documentary stage.
  expect(['live','delivery','homecoming','household']).toContain(actor.stage);
  // W175 RED-first: household viewers must remain part of the genuine
  // continuous documentary, not leave it when an actual citizen buys food.
  expect(actor.film?.active).toBe(true);
  expect(actor.film?.following).toBe(true);
  expect(actor.film?.citizen).toEqual(actor.film?.citizen?.trim());
  if(actor.stage==='household'){
   expect(['travel-to-market','market-purchase','returning-with-provisions',
    'at-home','observing-household']).toContain(actor.film.stage);
   expect(actor.film?.household?.realCitizen).toBe(true);
  }
  await page.waitForTimeout(350);
  const audit=await page.evaluate(()=>{
   const rect=selector=>{const e=document.querySelector(selector),r=e.getBoundingClientRect(),cs=getComputedStyle(e);
    return {x:r.x,y:r.y,w:r.width,h:r.height,display:cs.display,visible:cs.display!=='none'&&cs.visibility!=='hidden'};};
   const nav=rect('.world-tour'),dock=rect('.bottom');
   return {nav,dock,ribbon:rect('#world-ribbon'),tag:rect('#world-actor-tag'),
    command:rect('#command-toggle'),buttons:Array.from(document.querySelectorAll('.bottom>.btn')).filter(x=>getComputedStyle(x).display!=='none').map(x=>x.id),
    overflow:document.documentElement.scrollWidth,view:document.body.dataset.command};
  });
  expect(audit.view).toBe('world');
  expect(audit.nav.visible).toBe(true);
  expect(audit.nav.h).toBeLessThanOrEqual(54);
  expect(audit.nav.y).toBeLessThanOrEqual(90);
  expect(audit.dock.h).toBeLessThanOrEqual(68);
  expect(audit.dock.y).toBeGreaterThan(viewport.height-90);
  expect(audit.buttons).toEqual(['pause','speed1','focus','command-toggle']);
  expect(audit.command.visible).toBe(true);
  expect(audit.ribbon.visible).toBe(false);
  expect(audit.tag.visible).toBe(false);
  expect(audit.overflow).toBeLessThanOrEqual(viewport.width);
  expect(await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()))).toBe(actor.before);
  fs.mkdirSync('artifacts/tiny-kingdom-w54',{recursive:true});
  await page.screenshot({path:'artifacts/tiny-kingdom-w54/'+viewport.width+'-real-working-citizen.png'});
  await page.locator('#command-toggle').click();
  await expect(page.locator('#save')).toBeVisible();
  await page.locator('#command-toggle').click();
  await expect(page.locator('body')).toHaveAttribute('data-command','world');
  expect(await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()))).toBe(actor.before);
  expect(errors).toEqual([]);
 });
}
