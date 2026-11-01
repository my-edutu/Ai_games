'use strict';
const fs=require('node:fs'),path=require('node:path');
const {test,expect}=require('@playwright/test');
const {createSession,advance}=require('../../scripts/serve-tower-stream.cjs');
const {waitForSettledTowerStone}=require('../../scripts/tower-capture-ready.cjs');
const shots=new Set([296,298,300,302,304,308,316]);
function actualRun(view){
 const session=createSession(),frames=[];
 for(let tick=0;tick<=320;tick++){
  const frame=session.controller.frame(view.width,view.height,{reducedMotion:true,muted:true});
  if(frame.snapshot.tick>=296&&frame.snapshot.tick<=316)frames.push(frame);
  advance(session);
 }
 expect(frames.map(f=>f.snapshot.tick)).toEqual(Array.from({length:21},(_,i)=>i+296));
 expect(frames.every(f=>f.snapshot.runToken===frames[0].snapshot.runToken)).toBe(true);
 return frames;
}
for(const view of [{label:'desktop',width:960,height:600},{label:'portrait',width:390,height:844}]){
 test('G41 consecutive real authority mantle frames '+view.label,async({page})=>{
  test.setTimeout(480000);
  const frames=actualRun(view),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.setViewportSize({width:view.width,height:view.height});
  let selected=frames[0];
  await page.route('**/tower/state**',r=>r.fulfill({json:selected}));
  await page.goto('/tower?quality=low&reducedMotion=1&muted=1',{waitUntil:'domcontentloaded'});
  const out=path.resolve('artifacts/tower-g41',view.label);fs.mkdirSync(out,{recursive:true});
  const observed=[];
  for(let i=0;i<frames.length;i++){
   const frame=frames[i],prior=i===0?0:await page.evaluate(()=>window.__TOWER_RENDER_DIAGNOSTICS__?.().frames||0);
   selected=frame;
   await page.waitForFunction(({tick,checksum,prior})=>{
    const d=window.__TOWER_RENDER_DIAGNOSTICS__?.();
    return d?.frames>prior&&d.renderProgress?.lastSubmitted?.tick===tick
      &&window.__TOWER_PUBLIC_STATE__?.publicChecksum===checksum;
   },{tick:frame.snapshot.tick,checksum:frame.snapshot.publicChecksum,prior},{timeout:90000});
   if(i===0)await waitForSettledTowerStone(page);
   const d=await page.evaluate(()=>window.__TOWER_RENDER_DIAGNOSTICS__());
   observed.push({tick:frame.snapshot.tick,authority:frame.snapshot.publicChecksum,
    actualRadius:Math.hypot(d.climberPosition[0],d.climberPosition[2]),
    desired:d.radialTransition?.desired,presented:d.radialTransition?.presented,
    renderErrors:d.renderErrors});
   if(shots.has(frame.snapshot.tick))
    await page.screenshot({path:path.join(out,'tick-'+frame.snapshot.tick+'.png'),timeout:90000});
  }
  fs.writeFileSync(path.join(out,'observations.json'),JSON.stringify({sourceSha:process.env.GITHUB_SHA,
   method:'Actual continuous seeded authoritative sequence, separate matching WebGL frames—not physical GPU FPS',
   view,observed,errors,independentVisualCritic:false,AAA:'NOT PASSED'},null,2));
  const at=t=>observed.find(o=>o.tick===t);
  expect(errors).toEqual([]);expect(observed.every(o=>o.renderErrors===0)).toBe(true);
  expect(at(298).presented).toBeGreaterThan(27.95);
  expect(at(304).presented).toBeGreaterThan(26.2);
  expect(at(316).presented).toBeCloseTo(25,4);
  for(let i=1;i<observed.length;i++)
   expect(observed[i-1].presented-observed[i].presented,'no per-tick inward snap')
     .toBeLessThanOrEqual(.551);
 });
}
