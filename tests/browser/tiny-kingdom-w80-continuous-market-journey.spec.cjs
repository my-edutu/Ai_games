'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W80 test authored before implementation. A real completed-delivery camera
// must NOT hard-cut away from the physical same-person handoff merely because
// the authoritative stage changed. Existing physical camera planning is
// responsible for collision and market-post clearance during the transition.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W80 continuous genuine courier handoff '+viewport.width+'px',async({page})=>{
  test.setTimeout(240000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:110000});
  const run=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   g.setSpeed(0);
   // Locate a courier entirely by real deterministic simulation. No mock
   // delivery, forced NPC movement or fabricated credited inventory.
   let steps=0;
   while(!g.getActiveDeliveries().length&&steps<120*24*30){
    g.step(1/30);steps++;
   }
   const deliveries=g.getActiveDeliveries();
   if(!deliveries.length)return {steps,missingRealCourier:true};
   const chosen=g.watchVillageLife();
   if(!chosen?.active)return {steps,missingRealCourier:false,noWitness:true};
   const original=JSON.stringify(g.exportSnapshot());
   const first=g.getVillageDocumentaryAudit();
   g.advanceVillageDocumentary();
   const preserved=JSON.stringify(g.exportSnapshot())===original;
   const seen=[first.stage],identity=first.citizen;
   let received=false;
   // Traverse only genuine autonomous walking and market work, ending when
   // a same-delivery receipt is actually granted by the existing economy.
   for(let i=0;i<24*30&&g.getActiveDeliveries().some(d=>d.id===first.deliveryId);i++){
    g.step(1/30);
    g.advanceVillageDocumentary();
    const audit=g.getVillageDocumentaryAudit();
    if(!seen.includes(audit.stage))seen.push(audit.stage);
   }
   g.advanceVillageDocumentary();
   const final=g.getVillageDocumentaryAudit();
   const actualReceipt=g.getDeliveryReceipts().find(r=>r.id===first.deliveryId);
   received=Boolean(actualReceipt);
   return {steps,identity,first,final,seen,preserved,received,
    citizens:g.metrics().citizens,triangles:g.renderStats().lastFrameTriangles,
    glError:document.querySelector('#world').getContext('webgl')?.getError(),
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(run.missingRealCourier).toBeUndefined();
  expect(run.noWitness).toBeUndefined();
  expect(run.first.active).toBe(true);
  expect(run.preserved).toBe(true);
  expect(run.received).toBe(true);
  expect(run.final.citizen).toBe(run.identity);
  expect(run.final.deliveryId).toBe(run.first.deliveryId);
  expect(run.final.cameraCuts).toBe(0);
  expect(run.final.continuityTransitions).toBeGreaterThanOrEqual(1);
  expect(run.final.following).toBe(true);
  expect(run.citizens).toBeGreaterThan(0);
  expect(run.triangles).toBeLessThan(160000);
  expect(run.glError).toBe(0);
  expect(run.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  fs.mkdirSync('artifacts/tiny-kingdom-w80',{recursive:true});
  fs.writeFileSync('artifacts/tiny-kingdom-w80/'+viewport.width+'-true-handoff.json',
   JSON.stringify({viewport,actual:run},null,2));
  await page.screenshot({path:'artifacts/tiny-kingdom-w80/'+viewport.width+'-real-market-handoff.png'});
 });
}
