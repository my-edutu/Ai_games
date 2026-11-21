'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// W228 RED-before: the predecessor has no desktop dock/disclosure styling.
test('W228 source contains original visible-world dock contract',()=>{
 expect(html.includes('/* W228: documentary gameplay keeps a single accessible lower command row.')).toBe(true);
 // This exact selector intentionally outranks historical important rules.
 // A short boolean expectation avoids echoing 1.25MB of actual game source.
 expect(html.includes('body[data-command="world"][data-workday="off"]:not([data-street="on"]):not([data-workday="live"]):not([data-workday="delivery"]):not([data-workday="homecoming"]) #world-ribbon')).toBe(true);
});
for(const width of [1024,390]){
 test('W228 full running village preserves scene and opens real camera controls '+width+'px',async({page})=>{
  test.setTimeout(180000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width,height:width===390?844:768});
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:115000});
  await page.waitForFunction(()=>document.body.dataset.command==='world'&&document.body.dataset.workday==='off');
  const first=await page.evaluate(()=>{
   const rect=id=>{const r=document.querySelector(id).getBoundingClientRect();
    return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
   const css=id=>getComputedStyle(document.querySelector(id));
   return {mode:document.body.dataset.command,workday:document.body.dataset.workday,
    camera:rect('#camera-tools'),bottom:rect('.bottom'),ribbon:rect('#world-ribbon'),
    cameraDisclosure:css('#camera-disclosure').display,
    hiddenCameraAction:css('#camera-home').display,
    blur:css('#world-ribbon').backdropFilter,
    pop:window.__tinyKingdom.metrics().citizens,
    buildings:window.__tinyKingdom.metrics().buildings,
    triangles:window.__tinyKingdom.renderStats().lastFrameTriangles,
    overflow:document.documentElement.scrollWidth,
    gl:document.querySelector('#world').getContext('webgl')?.getError()??-1};
  });
  expect(first.mode).toBe('world');expect(first.workday).toBe('off');
  expect(first.pop).toBeGreaterThanOrEqual(12);
  expect(first.buildings).toBeGreaterThanOrEqual(12);
  expect(first.triangles).toBeGreaterThan(0);
  expect(first.triangles).toBeLessThan(160000);
  expect(first.overflow).toBeLessThanOrEqual(width);
  expect(first.cameraDisclosure).not.toBe('none');
  expect(first.hiddenCameraAction).toBe('none');
  expect(first.gl).toBe(0);
  expect(first.blur).toBe('none');
  if(width===1024){
   // Two full-width overlay rows are replaced by a single bottom dock.
   expect(first.bottom.right).toBeLessThanOrEqual(first.ribbon.left+3);
   expect(Math.abs(first.bottom.bottom-first.ribbon.bottom)).toBeLessThan(14);
   expect(first.camera.left).toBeGreaterThan(width*.70);
  }
  fs.mkdirSync(path.resolve(__dirname,'../../test-results'),{recursive:true});
  await page.screenshot({path:path.resolve(__dirname,'../../test-results/w228-original-world-'+width+'.png')});
  await page.locator('#camera-disclosure').click();
  await expect(page.locator('#camera-disclosure')).toHaveAttribute('aria-expanded','true');
  await expect(page.locator('#camera-home')).toBeVisible();
  const btn=await page.locator('#camera-home').boundingBox();
  expect(btn.height).toBeGreaterThanOrEqual(43);
  await page.locator('#camera-disclosure').press('Escape');
  await expect(page.locator('#camera-disclosure')).toHaveAttribute('aria-expanded','false');
  await page.locator('#command-toggle').click();
  await expect(page.locator('#save')).toBeVisible();
  await page.locator('#command-toggle').click();
  await expect(page.locator('#pause')).toBeVisible();
  await expect(page.locator('#world-ribbon')).toBeVisible();
  const after=await page.evaluate(()=>({
   mode:document.body.dataset.command,gl:document.querySelector('#world').getContext('webgl')?.getError()??-1,
   triangles:window.__tinyKingdom.renderStats().lastFrameTriangles,
   cameraExpanded:document.querySelector('#camera-disclosure').getAttribute('aria-expanded'),
   overflow:document.documentElement.scrollWidth}));
  expect(after.mode).toBe('world');
  expect(after.cameraExpanded).toBe('false');
  expect(after.triangles).toBeGreaterThan(0);
  expect(after.triangles).toBeLessThan(160000);
  expect(after.overflow).toBeLessThanOrEqual(width);
  expect(after.gl).toBe(0);
  expect(errors).toEqual([]);
  fs.writeFileSync(path.resolve(__dirname,'../../test-results/w228-world-'+width+'.json'),
   JSON.stringify({source:'genuine-running-game',runtime:'Chromium SwiftShader, NOT physical GPU FPS',
    initial:first,after,pageErrors:errors},null,2));
 });
}

/* W231 real playable grain-storage gallery and source-linked market.
 * Only true simulation, 3D geometry, existing actor/route and UI evidence. */
for(const width of [1024,390]){
 test('W231 authentic granary-side architecture and market trail '+width+'px',async({page})=>{
  test.setTimeout(180000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width,height:width===390?844:768});
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,
    null,{timeout:115000});
  const before=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   return JSON.stringify(g.exportSnapshot());
  });
  const audit=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {district:g.getGrainwardDistrictAudit(),granary:g.getGranaryArchitectureAudit(),farm:g.getFarmsteadStats(),
    road:g.getFarmMarketStreetAudit(),market:g.getMarketGatewayAudit(),
    triangles:g.renderStats().lastFrameTriangles,
    gl:document.querySelector('#world').getContext('webgl')?.getError(),
    unchanged:JSON.stringify(g.exportSnapshot())};
  });
  // W233: the real farm entrance now has a connected, open-air timber
  // threshing court, not a synthetic worksite or inventory source.
  // W234: genuine inhabited cottage silhouettes, never simulated houses.
  // The source test is intentionally RED before the playable build adds these.
  expect(audit.district.connected).toBe(true);
  expect(audit.district.upperRearBays).toBeGreaterThan(0);
  expect(audit.district.upperRearBayTriangles).toBeGreaterThan(80);
  expect(audit.district.upperRearBayTriangles).toBeLessThan(3500);
  expect(audit.district.originalLotsOnly).toBe(true);
  const court=audit.farm.fieldThreshingCourt;
  expect(court?.linkedToActualFarm).toBe(true);
  expect(court.roofPanels).toBe(18);
  expect(court.posts).toBe(6);
  expect(court.flagstones).toBe(30);
  expect(court.approachPanels).toBeGreaterThanOrEqual(8);
  expect(court.triangles).toBeGreaterThan(200);
  expect(court.triangles).toBeLessThanOrEqual(850);
  expect(court.realFarmGateUnblocked).toBe(true);
  expect(court.changesEconomy).toBe(false);
  expect(court.changesAuthority).toBe(false);
  expect(court.extraBuffers).toBe(0);
  const wing=audit.granary.coveredDryingGallery;
  expect(wing?.attachedToExisting).toBe(true);
  expect(wing.roofCourses).toBe(10);
  expect(wing.posts).toBe(3);
  expect(wing.piers).toBe(3);
  expect(wing.flagstones).toBe(18);
  expect(wing.triangles).toBeGreaterThan(100);
  expect(wing.triangles).toBeLessThanOrEqual(500);
  expect(wing.changesAuthority).toBe(false);
  expect(wing.extraBuffers).toBe(0);
  expect(audit.granary.realDoorUnblocked).toBe(true);
  expect(audit.road.connected).toBe(true);
  expect(audit.market.receivingBays).toBe(2);
  expect(audit.triangles).toBeGreaterThan(0);
  expect(audit.triangles).toBeLessThan(160000);
  expect(audit.gl).toBe(0);
  expect(audit.unchanged).toBe(before);
  const toggle=page.locator('#world-trace-toggle');
  await toggle.click();
  await expect(page.locator('#world-supply-trail')).toBeVisible();
  const bounds=await page.evaluate(()=>{
   const el=document.getElementById('world-supply-trail'),
    r=el.getBoundingClientRect();
   return {left:r.left,right:r.right,scroll:document.documentElement.scrollWidth,
    button:document.getElementById('world-trace-follow').getBoundingClientRect().height};
  });
  expect(bounds.left).toBeGreaterThanOrEqual(-1);
  expect(bounds.right).toBeLessThanOrEqual(width+1);
  expect(bounds.scroll).toBeLessThanOrEqual(width);
  expect(bounds.button).toBeGreaterThanOrEqual(40);
  expect(errors).toEqual([]);
  expect(await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot())))
   .toBe(before);
  fs.mkdirSync(path.resolve(__dirname,'../../test-results'),{recursive:true});
  await page.screenshot({path:path.resolve(__dirname,'../../test-results/w231-grainward-'+width+'.png')});
  fs.writeFileSync(path.resolve(__dirname,'../../test-results/w231-grainward-'+width+'.json'),
   JSON.stringify({hardwarePerformanceNotMeasured:true,
    source:'real-running-original-village-and-economy',court,wing,road:audit.road,
    triangles:audit.triangles,ui:bounds,pageErrors:errors},null,2));
  // W233 real-game camera: inspect the ORIGINAL farm and attached stone/
  // timber threshing court, not a detached model, fake actor or beauty render.
  // No world step, restore, seeded randomness or inventory is triggered.
  await page.evaluate(()=>{
   document.querySelector('#world-trace-toggle').click();
   document.querySelector('.tour-btn[data-scenic="farm"]').click();
  });
  await page.waitForTimeout(1200);
  const farmFrame=await page.evaluate(()=>{
   const g=window.__tinyKingdom,frame=g.getCamera(),audit=g.getFarmsteadStats();
   return {camera:frame,scene:g.renderStats().lastFrameTriangles,
    court:audit.fieldThreshingCourt,gl:document.querySelector('#world').getContext('webgl')?.getError(),
    overflow:document.documentElement.scrollWidth,
    authority:JSON.stringify(g.exportSnapshot())};
  });
  expect(farmFrame.camera.focus).toEqual([25,0]);
  expect(farmFrame.court?.roofPanels).toBe(18);
  expect(farmFrame.scene).toBeGreaterThan(0);
  expect(farmFrame.scene).toBeLessThan(160000);
  expect(farmFrame.gl).toBe(0);
  expect(farmFrame.overflow).toBeLessThanOrEqual(width);
  expect(farmFrame.authority).toBe(before);
  expect(errors).toEqual([]);
  await page.screenshot({path:path.resolve(__dirname,'../../test-results/w233-real-farm-court-'+width+'.png')});
  fs.writeFileSync(path.resolve(__dirname,'../../test-results/w233-real-farm-court-'+width+'.json'),
   JSON.stringify({runtime:'real running game in Chromium SwiftShader; NO physical GPU FPS',
    exactSourceCommit:'44d156b48c1be5cd7c0b938b38f38dd899a3ee85',
    camera:farmFrame.camera,sceneTriangles:farmFrame.scene,court:farmFrame.court,
    noAuthorityMutation:farmFrame.authority===before,pageErrors:errors,gl:farmFrame.gl,
    viewportWidth:width,overflow:farmFrame.overflow},null,2));
 });
}
