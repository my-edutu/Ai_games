'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W33: a real citizen's head and shoulders attend to work and travelling.
// Capture continuously rendered WebGL, including 390px, without inventing
// workers or touching save/restore, production, RNG, or physical structures.
test.use({video:'on'});
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W33 authentic embodied labor and deterministic replay '+viewport.width+'px',async({page},testInfo)=>{
  test.setTimeout(180000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
  const before=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   const snapshot=g.exportSnapshot();
   const residents=Array.from({length:g.metrics().citizens},(_,i)=>g.getCitizenEmbodiment(i));
   return {snapshot,residents,triangles:g.renderStats().lastFrameTriangles};
  });
  expect(before.residents).toHaveLength(await page.evaluate(()=>window.__tinyKingdom.metrics().citizens));
  for(const r of before.residents){
   expect(r.source).toBe('actual-citizen-embodied-locomotion-and-labor');
   expect(typeof r.citizen).toBe('string');
   expect(Number.isFinite(r.phase)).toBe(true);
   expect(Math.abs(r.spineShift)).toBeLessThanOrEqual(.065);
   expect(Math.abs(r.forwardLean)).toBeLessThanOrEqual(.09);
   expect(Math.abs(r.headYaw)).toBeLessThanOrEqual(.21);
   expect(r.headPitch).toBeGreaterThanOrEqual(-.04);
   expect(r.headPitch).toBeLessThanOrEqual(.29);
   expect(r.altersAuthority).toBe(false);
  }
  expect(before.residents.some(r=>Math.abs(r.spineShift)>0.0005||r.headPitch>.025)).toBe(true);
  const observed=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   for(let i=0;i<90;i++)g.step(1/30);
   return {state:g.exportSnapshot(),poses:Array.from({length:g.metrics().citizens},(_,i)=>g.getCitizenEmbodiment(i))};
  });
  const replay=await page.evaluate(snapshot=>{
   const g=window.__tinyKingdom;g.restoreSnapshot(snapshot);
   for(let i=0;i<90;i++)g.step(1/30);
   return {state:g.exportSnapshot(),poses:Array.from({length:g.metrics().citizens},(_,i)=>g.getCitizenEmbodiment(i))};
  },before.snapshot);
  expect(replay.state).toEqual(observed.state);
  expect(replay.poses).toEqual(observed.poses);
  expect(replay.poses.some((p,i)=>Math.abs(p.spineShift-before.residents[i].spineShift)>.001||
   Math.abs(p.headPitch-before.residents[i].headPitch)>.001)).toBe(true);
  await testInfo.attach('w33-real-workers-'+viewport.width,{body:await page.screenshot(),contentType:'image/png'});
  const live=await page.evaluate(()=>({
   gl:document.querySelector('#world').getContext('webgl')?.getError()??-1,
   width:document.documentElement.scrollWidth,
   triangles:window.__tinyKingdom.renderStats().lastFrameTriangles,
   metrics:window.__tinyKingdom.metrics()
  }));
  expect(live.width).toBeLessThanOrEqual(viewport.width);
  expect(live.gl).toBe(0);
  expect(live.triangles).toBeLessThan(160000);
  expect(live.metrics.citizens).toBe(before.residents.length);
  expect(errors).toEqual([]);
  await page.evaluate(()=>window.__tinyKingdom.setSpeed(1));
  await page.waitForTimeout(1400);
 });
}


for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W33 truth-linked selected citizen shift and courier progress '+viewport.width+'px',async({page})=>{
  test.setTimeout(180000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
  const before=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   const p=g.getState().people[2];g.setCamera({focus:[p.x,p.z],zoom:11,yaw:.7,pitch:.6});
   return g.exportSnapshot().checksum;
  });
  await page.waitForFunction(()=>window.__tinyKingdom.getCitizenPickCandidates().some(c=>
   c.visible&&c.x>90&&c.x<innerWidth-90&&c.y>125&&c.y<innerHeight-200),null,{timeout:90000});
  const picked=await page.evaluate(()=>{
   const options=window.__tinyKingdom.getCitizenPickCandidates().filter(c=>
    c.visible&&c.x>90&&c.x<innerWidth-90&&c.y>125&&c.y<innerHeight-200);
   return options[0];
  });
  await page.mouse.click(picked.x,picked.y);
  const audit=await page.evaluate(()=>{
   const g=window.__tinyKingdom;const status=g.getSelectedCitizenTaskAudit();
   return {status,checksum:g.exportSnapshot().checksum,
    caption:document.querySelector('#citizen-pick-caption')?.textContent,
    value:document.querySelector('#citizen-pick-meter')?.value,
    visible:document.querySelector('#citizen-pick-meter')?.hidden,
    errors:document.querySelector('#world').getContext('webgl')?.getError()??-1,
    width:document.documentElement.scrollWidth};
  });
  expect(audit.status.source).toBe('real-selected-citizen-task-progression');
  expect(audit.status.citizen).toBe(picked.name);
  expect(['production','market-hauling','market-unloading','inactive']).toContain(audit.status.stage);
  expect(audit.status.progress===null||audit.status.progress>=0&&audit.status.progress<=100).toBe(true);
  expect(audit.status.authoritativeChanges).toBe(false);
  expect(audit.caption).toContain(picked.name);
  expect(audit.caption).toContain(picked.job);
  expect(audit.visible).toBe(audit.status.progress===null);
  if(audit.status.progress!==null)expect(audit.value).toBeCloseTo(audit.status.progress,2);
  expect(audit.checksum).toBe(before);
  expect(audit.width).toBeLessThanOrEqual(viewport.width);
  expect(audit.errors).toBe(0);
  expect(errors).toEqual([]);
 });
}
