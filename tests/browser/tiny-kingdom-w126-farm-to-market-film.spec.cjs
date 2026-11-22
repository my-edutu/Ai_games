'use strict';
// W126 actual workday film — the original seeded world only.
// No direct person edits, teleports, invented crops, cargo, jobs or stock.
// Time-lapse samples are physically simulated in order; delivery and receipts
// must use the original escrow ID. Software WebGL is not physical GPU proof.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const OUT=path.resolve(__dirname,'../../artifacts/tiny-kingdom-w126');
fs.mkdirSync(OUT,{recursive:true});
test.use({video:'on'});
async function actualRenderedFrame(page){
 // First give the original WebGL renderer a frame; never create a substitute
 // scene, draw a pose without simulation, or replace a character for a movie.
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));
 await page.waitForTimeout(85);
}
async function stepOriginalWorld(page,ticks){
 return page.evaluate(count=>{
  const g=window.__tinyKingdom;
  for(let i=0;i<count;i++)g.step(1/30);
  return {day:g.metrics().day,clock:g.getAuthenticWorkdayAudit().time,
   deliveries:g.getActiveDeliveries()};
 },ticks);
}
test('W126 genuine farmer cutting to original escrowed cart and physical market receipt — 1024px filmed',async({page},info)=>{
 test.setTimeout(570000);
 const errors=[];page.on('pageerror',err=>errors.push(err.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,
  null,{timeout:115000});
 await page.evaluate(()=>{window.__tinyKingdom.reset();window.__tinyKingdom.setSpeed(0)});
 const evidence={source:'exact-running-original-world',viewport:'1024x640',
  sampling:'chronological deterministic time-lapse; original rendering frames',
  harvest:null,freight:null,receipt:null,samples:[],authentic:true};
 // Locate an EXISTING working farmer; do not script their profession or action.
 const harvest=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  for(let i=0;i<24000;i++){
   g.step(1/30);
   if(i%7!==0)continue;
   const a=g.getHarvestInteractionAudit();
   if(a.active&&a.progress>.13&&a.progress<.58){
    const before=JSON.stringify(g.exportSnapshot());
    const observer=g.watchHarvestShift();
    return {audit:a,observer,readOnly:before===JSON.stringify(g.exportSnapshot())};
   }
  }
  return null;
 });
 expect(harvest,'a genuine, actually harvesting farmer must exist').toBeTruthy();
 expect(harvest.readOnly).toBe(true);
 expect(harvest.observer?.active).toBe(true);
 evidence.harvest=harvest.audit;
 for(let frame=0;frame<16;frame++){
  const sample=await stepOriginalWorld(page,3);
  evidence.samples.push({stage:'real-harvest',frame,clock:sample.clock});
  await actualRenderedFrame(page);
 }
 await page.screenshot({path:path.join(OUT,'w126-real-cutting-and-gathering.png')});
 // Scout only genuine resource escrow created by the original work() timer.
 // Never create a load merely to fill an incomplete demonstration.
 const freight=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  for(let i=0;i<120000;i++){
   g.step(1/30);
   if(i%9!==0)continue;
   const loads=g.getActiveDeliveries();
   const realFarmer=loads.find(d=>d.job==='farmer'&&d.escrowed&&d.stage==='travel');
   if(realFarmer){
    const before=JSON.stringify(g.exportSnapshot());
    const camera=g.watchDelivery(realFarmer.id);
    return {delivery:realFarmer,camera,
     readOnly:before===JSON.stringify(g.exportSnapshot())};
   }
  }
  return null;
 });
 expect(freight,'no authentic farmer escrow reached; cannot fabricate cargo').toBeTruthy();
 expect(freight.readOnly).toBe(true);
 expect(freight.camera?.id).toBe(freight.delivery.id);
 evidence.freight=freight.delivery;
 const id=freight.delivery.id;
 // Preserve the identical shipment ID and Nav route throughout the film.
 let received=false,seenUnload=false;
 for(let frame=0;frame<190;frame++){
  const sample=await stepOriginalWorld(page,13);
  const a=await page.evaluate(id=>{
   const g=window.__tinyKingdom;
   const d=g.getActiveDeliveries().find(v=>v.id===id);
   const receipt=g.getDeliveryReceipts().find(v=>v.id===id)||null;
   return {stage:d?.stage||null,id:d?.id||null,receipt,
    grip:g.getCourierCartGripAudit().find(v=>v.id===id)||null,
    clock:g.getAuthenticWorkdayAudit().time,
    readOnly:g.getAuthenticWorkdayAudit().changesAuthority===false};
  },id);
  evidence.samples.push({stage:a.stage||'receipt',clock:a.clock,
   frame,loaded:a.id===id,handContact:a.grip?.gaps||null,
   received:!!a.receipt});
  if(a.stage==='unloading')seenUnload=true;
  if(a.grip)expect(a.grip.gaps.every(v=>v<.06)).toBe(true);
  if(a.receipt){
   evidence.receipt=a.receipt;received=true;
  }
  await actualRenderedFrame(page);
  if(received)break;
 }
 expect(seenUnload,'cargo must reach its actual receiving bay').toBe(true);
 expect(received,'same escrow must finish its genuine market handoff').toBe(true);
 expect(evidence.receipt.id).toBe(id);
 expect(evidence.receipt.creditedAtUnloading).toBe(true);
 expect(evidence.receipt.amount).toBe(freight.delivery.amount);
 const end=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  return {triangles:g.renderStats().lastFrameTriangles,
   overflow:document.documentElement.scrollWidth-innerWidth,
   glError:document.getElementById('world').getContext('webgl')?.getError(),
   citizens:g.metrics().citizens,buildings:g.metrics().buildings};
 });
 expect(end.triangles).toBeLessThan(160000);
 expect(end.overflow).toBeLessThanOrEqual(0);
 expect(end.glError).toBe(0);
 expect(errors).toEqual([]);
 evidence.end=end;
 fs.writeFileSync(path.join(OUT,'w126-original-farm-to-market-timeline.json'),
  JSON.stringify(evidence,null,2));
 await page.screenshot({path:path.join(OUT,'w126-real-market-receipt.png')});
 await info.attach('W126 genuine same-escrow workday timeline',
  {body:JSON.stringify(evidence,null,2),contentType:'application/json'});
 console.log('W126 original farmer to market time-lapse evidence',
  JSON.stringify({citizen:freight.delivery.citizen,id,amount:freight.delivery.amount,
   frames:evidence.samples.length,unloaded:received,renderedTriangles:end.triangles}));
});
