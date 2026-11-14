'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// Preserve uncut REAL WebGL interaction videos, including the live resumed world.
test.use({video:'on'});

// W31 Living Valley: select an ACTUAL rendered villager from the 3D world.
// No invented worker, source-data mutation, opaque click-anywhere teleport,
// or false hit through a physical cottage or market roof.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W31 directly inspect a real visible citizen, then drag without selecting at '+viewport.width+'px',async({page},testInfo)=>{
  test.setTimeout(180000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
  await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   const p=g.getState().people[2];g.setCamera({focus:[p.x,p.z],zoom:11,yaw:.7,pitch:.6});
  });
  await page.waitForFunction(()=>{
   const g=window.__tinyKingdom;
   return typeof g.getCitizenPickCandidates==='function'&&
    g.getCitizenPickCandidates().some(c=>c.visible&&c.x>90&&
     c.x<innerWidth-90&&c.y>125&&c.y<innerHeight-205);
  },null,{timeout:90000});
  const before=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   const options=g.getCitizenPickCandidates().filter(c=>c.visible&&c.x>90&&
    c.x<innerWidth-90&&c.y>125&&c.y<innerHeight-205);
   const x=innerWidth/2,y=innerHeight/2;
   options.sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y));
   const candidate=options[0];
   return {candidate,checksum:g.exportSnapshot().checksum,
    population:g.metrics().citizens,camera:g.getCamera(),others:options.length};
  });
  expect(before.candidate).toBeTruthy();
  await page.mouse.click(before.candidate.x,before.candidate.y);
  await expect.poll(()=>page.evaluate(()=>window.__tinyKingdom.getSelectedCitizen())).toBe(before.candidate.name);
  await expect.poll(()=>page.evaluate(()=>window.__tinyKingdom.getCamera().follow)).toBe(true);
  // A user inspecting a citizen needs a HUMAN-SCALE 3D portrait, not the
  // existing tiny 12.8m overview follow lens.
  await expect.poll(()=>page.evaluate(()=>window.__tinyKingdom.getCamera().zoom)).toBeLessThan(9);
  await expect(page.locator('#citizen-pick-caption')).toContainText(before.candidate.name);
  await expect(page.locator('#citizen-pick-caption')).toContainText(before.candidate.job);
  expect(await page.evaluate(()=>window.__tinyKingdom.exportSnapshot().checksum)).toBe(before.checksum);
  expect(await page.evaluate(()=>window.__tinyKingdom.metrics().citizens)).toBe(before.population);
  await testInfo.attach('w31-real-actor-selected-'+viewport.width+'px', {
   body:await page.screenshot(),contentType:'image/png'
  });
  // A real orbit drag must not be misinterpreted as a second citizen tap.
  await page.mouse.move(before.candidate.x,before.candidate.y);
  await page.mouse.down();
  await page.mouse.move(before.candidate.x+60,before.candidate.y+32,{steps:4});
  await page.mouse.up();
  expect(await page.evaluate(()=>window.__tinyKingdom.getSelectedCitizen())).toBe(before.candidate.name);
  expect(await page.evaluate(()=>window.__tinyKingdom.exportSnapshot().checksum)).toBe(before.checksum);
  const audit=await page.evaluate(()=>({
   picked:window.__tinyKingdom.getCitizenPickAudit(),
   role:document.querySelector('#citizen-pick-caption')?.getAttribute('role'),
   scrollWidth:document.documentElement.scrollWidth,
   gl:document.querySelector('#world').getContext('webgl')?.getError()??-1
  }));
  expect(audit.picked.hit).toBeTruthy();
  expect(audit.role).toBe('status');
  expect(audit.scrollWidth).toBeLessThanOrEqual(viewport.width);
  expect(audit.gl).toBe(0);
  expect(errors).toEqual([]);
  // The captured WebM must include actual AI-led world motion AFTER the
  // stationary selection, while proving that the pick itself had no effect.
  await page.evaluate(()=>window.__tinyKingdom.setSpeed(1));
  await page.waitForTimeout(2600);
  const resumed=await page.evaluate(()=>({
   world:window.__tinyKingdom.exportSnapshot().checksum,
   population:window.__tinyKingdom.metrics().citizens,
   selected:window.__tinyKingdom.getSelectedCitizen(),
   gl:document.querySelector('#world').getContext('webgl')?.getError()??-1
  }));
  expect(resumed.world).not.toBe(before.checksum);
  expect(resumed.population).toBeGreaterThanOrEqual(before.population);
  expect(resumed.selected).toBe(before.candidate.name);
  expect(resumed.gl).toBe(0);
 });
}

test('W31 real touchscreen pointer selects a physically visible citizen at 390px',async({browser},testInfo)=>{
 test.setTimeout(160000);
 const context=await browser.newContext({
  viewport:{width:390,height:844},isMobile:true,hasTouch:true,
  recordVideo:{dir:testInfo.outputPath('touch-webgl-video')}
 });
 try{
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
  await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   const p=g.getState().people[2];g.setCamera({focus:[p.x,p.z],zoom:11,yaw:.7,pitch:.6});
  });
  await page.waitForFunction(()=>window.__tinyKingdom.getCitizenPickCandidates()
   .some(c=>c.visible&&c.x>90&&c.x<300&&c.y>125&&c.y<620),null,{timeout:90000});
  const before=await page.evaluate(()=>{
   const g=window.__tinyKingdom,choices=g.getCitizenPickCandidates()
    .filter(c=>c.visible&&c.x>90&&c.x<300&&c.y>125&&c.y<620);
   choices.sort((a,b)=>Math.hypot(a.x-195,a.y-420)-Math.hypot(b.x-195,b.y-420));
   return {person:choices[0],checksum:g.exportSnapshot().checksum};
  });
  await page.touchscreen.tap(before.person.x,before.person.y);
  await expect.poll(()=>page.evaluate(()=>window.__tinyKingdom.getSelectedCitizen()))
   .toBe(before.person.name);
  expect(await page.evaluate(()=>window.__tinyKingdom.getCamera().follow)).toBe(true);
  expect(await page.evaluate(()=>window.__tinyKingdom.getCamera().zoom)).toBeLessThan(9);
  expect(await page.evaluate(()=>window.__tinyKingdom.exportSnapshot().checksum)).toBe(before.checksum);
  expect(await page.evaluate(()=>window.__tinyKingdom.getCitizenPickAudit().source)).toBe('pointer');
  expect(errors).toEqual([]);
 }finally{await context.close()}
});
