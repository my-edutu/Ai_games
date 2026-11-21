'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const root=path.resolve(__dirname,'../../artifacts/tiny-kingdom-w476');
test.use({video:'off'});
for(const [width,height] of [[1024,640],[390,844]]){
 test('W476 real projected workers and genuine viewport '+width,async({browser})=>{
  test.setTimeout(240000);fs.mkdirSync(root,{recursive:true});
  const context=await browser.newContext({viewport:{width,height},
   recordVideo:{dir:root,size:{width,height}}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
    null,{timeout:150000});
  await page.evaluate(()=>window.__tinyKingdom.setSpeed(0));
  const truth=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   for(let i=0;i<720&&!g.getActiveWorksites().length&&
      !g.getActiveDeliveries().length;i++)g.step(1/30);
   const active=g.getActiveWorksites(),cargo=g.getActiveDeliveries();
   const witness=active[0];
   if(witness&&Number.isFinite(witness.x)&&Number.isFinite(witness.z))
    g.setCamera({focus:[witness.x,witness.z],yaw:3.8,pitch:.43,zoom:10});
   return {active,cargo,citizens:g.metrics().citizens,buildings:g.metrics().buildings};
  });
  await page.waitForTimeout(1300);
  const proof=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {snapshot:JSON.stringify(g.exportSnapshot()),
    beacons:g.getLiveWorkBeaconAudit(),
    labels:[...document.querySelectorAll('#world-live-roles button:not([hidden])')]
    .map(b=>({name:b.querySelector('strong').textContent,
     detail:b.querySelector('small').textContent,
     label:b.getAttribute('aria-label'),
     bounds:b.getBoundingClientRect().toJSON()})),
    citizens:g.metrics().citizens,buildings:g.metrics().buildings,
    submitted:g.renderStats().lastFrameTriangles,
    gl:document.getElementById('world').getContext('webgl')?.getError()??-1,
    horizontalOverflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(proof.beacons.authorityModified).toBe(false);
  expect(proof.beacons.createdActors).toBe(0);
  expect(proof.beacons.createdTransactions).toBe(0);
  expect(proof.beacons.markers.length).toBeLessThanOrEqual(width===390?2:3);
  expect(proof.labels.length).toBe(proof.beacons.markers.length);
  for(const label of proof.labels){
   expect(label.bounds.height).toBeGreaterThanOrEqual(43.9);
   expect(label.bounds.left).toBeGreaterThanOrEqual(-1);
   expect(label.bounds.right).toBeLessThanOrEqual(width+1);
   expect(label.label).toContain(label.name);
   expect(label.label).toContain(label.detail);
   expect(truth.active.some(p=>p.citizen===label.name)||
    truth.cargo.some(p=>p.citizen===label.name)).toBe(true);
  }
  expect(proof.citizens).toBe(truth.citizens);
  expect(proof.buildings).toBe(truth.buildings);
  expect(proof.submitted).toBeGreaterThan(0);
  expect(proof.submitted).toBeLessThan(160000);
  expect(proof.gl).toBe(0);
  expect(proof.horizontalOverflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  await page.screenshot({path:path.join(root,width+'-real-visible-workers.png')});
  if(proof.labels.length){
   const first=proof.labels[0];
   await page.locator('#world-live-roles button:not([hidden])').first().click();
   expect(await page.evaluate(()=>window.__tinyKingdom.getSelectedCitizen())).toBe(first.name);
   expect(await page.evaluate(()=>window.__tinyKingdom.getCamera().follow)).toBe(true);
   expect(await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot())))
    .toBe(proof.snapshot);
   // W477: observe the genuine selected worker through the physical 3D eye.
   await page.waitForTimeout(900);
   const followed=await page.evaluate(()=>({
    selection:window.__tinyKingdom.getLiveWorkBeaconAudit().lastSelectedOriginalWorker,
    tag:window.__tinyKingdom.getWorldActorTagAudit(),
    camera:window.__tinyKingdom.getCamera(),
    snapshot:JSON.stringify(window.__tinyKingdom.exportSnapshot())
   }));
   expect(followed.selection.citizen).toBe(first.name);
   expect(followed.selection.authorityModified).toBe(false);
   expect(followed.selection.createdActors).toBe(0);
   expect(followed.selection.createdTransactions).toBe(0);
   expect(['surveyed-original-worker','original-safe-follow'])
    .toContain(followed.selection.lens);
   expect(followed.camera.follow).toBe(true);
   expect(followed.tag.citizen).toBe(first.name);
   expect(followed.tag.authorityMutated).toBe(false);
   expect(followed.snapshot).toBe(proof.snapshot);
   await page.screenshot({path:path.join(root,width+'-real-worker-follow.png')});
   // The actual video continues real autonomous movement after the capture.
   await page.evaluate(()=>window.__tinyKingdom.setSpeed(1));
   await page.waitForTimeout(1400);
   fs.writeFileSync(path.join(root,width+'-physical-follow.json'),
    JSON.stringify({viewport:[width,height],selection:followed.selection,
     tag:followed.tag,camera:followed.camera,
     postFollowSnapshot:await page.evaluate(()=>window.__tinyKingdom.exportSnapshot()),
     independentExperienceReview:'NOT PROVEN'},null,2));
  }
  fs.writeFileSync(path.join(root,width+'-proof.json'),JSON.stringify({
   viewport:[width,height],originalPop:truth.citizens,buildings:truth.buildings,
   actualWorksites:truth.active,actualCargo:truth.cargo,
   beacons:proof.beacons,labels:proof.labels,
   submitted:proof.submitted,gl:proof.gl,errors,
   hardwareFPS:'NOT MEASURED',qualityReview:'NOT PROVEN'
  },null,2));
  const video=page.video();await page.close();await context.close();
  if(video)await video.saveAs(path.join(root,width+'-full-viewport.webm'));
 });
}