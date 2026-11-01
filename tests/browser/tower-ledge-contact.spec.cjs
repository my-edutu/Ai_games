'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {test,expect}=require('@playwright/test');
const {createSession,advance}=require('../../scripts/serve-tower-stream.cjs');
const {waitForSettledTowerStone}=require('../../scripts/tower-capture-ready.cjs');
const scene=fs.readFileSync(path.resolve('public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
function selector(name,args){
  const m=scene.match(new RegExp('^function '+name+'\\('+args+'\\) \\{[\\s\\S]*?^\\}','m'));
  if(!m)throw Error('shipped selector missing: '+name);
  return vm.runInNewContext(m[0]+'\n'+name);
}
const intendedLanding=selector('intendedLanding','snapshot');
const ledgeContactPoint=selector('ledgeContactPoint','snapshot, platform');
function realEncounter(view){
  const session=createSession();
  for(let i=0;i<2500;i++){
    const frame=session.controller.frame(view.w,view.h,{reducedMotion:true,muted:true});
    const platform=intendedLanding(frame.snapshot),point=ledgeContactPoint(frame.snapshot,platform);
    if(point)return {frame,platformId:platform.id,point};
    advance(session);
  }
  throw Error('No eligible authentic ascent in 2500 seeded ticks: evidence BLOCKED, not PASS');
}
for(const view of [{name:'desktop',w:960,h:600},{name:'portrait',w:390,h:844}]){
  test('real raised fingertip at authentic ledge '+view.name,async({page},info)=>{
    test.setTimeout(150000);
    const fixture=realEncounter(view),checksum=fixture.frame.snapshot.publicChecksum,errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    await page.route('**/tower/state**',r=>r.fulfill({json:fixture.frame}));
    await page.setViewportSize({width:view.w,height:view.h});
    await page.goto('/tower?quality=low&reducedMotion=1&muted=1',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(checksum=>{
      const d=window.__TOWER_RENDER_DIAGNOSTICS__?.();
      return d?.frames>=4&&d.renderProgress?.state==='current'&&window.__TOWER_PUBLIC_STATE__?.publicChecksum===checksum;
    },checksum,{timeout:90000});
    const d=await waitForSettledTowerStone(page);
    const out=path.resolve('artifacts/tower-ledge-contact');
    fs.mkdirSync(out,{recursive:true});
    const png=path.join(out,view.name+'.png');
    await page.screenshot({path:png,timeout:90000});
    await info.attach('authentic-reach-'+view.name,{path:png,contentType:'image/png'});
    fs.writeFileSync(path.join(out,view.name+'.json'),JSON.stringify({
      method:'Unmodified real autonomous authority snapshot held for appearance; NOT motion or FPS evidence',
      sourceSha:process.env.GITHUB_SHA||null,tick:fixture.frame.snapshot.tick,checksum,view,
      platformId:fixture.platformId,authoritativeTop:fixture.point,measured:d.ledgeContact||null,
      renderErrors:d.renderErrors,errors,independentVisualReview:false,
      gates:{physicalAppearance:'OPEN',completeMotion:'OPEN',intendedDeviceFPS:'OPEN'}
    },null,2));
    expect(errors).toEqual([]);
    expect(d.renderErrors).toBe(0);
    expect(d.ledgeContact?.platformId).toBe(fixture.platformId);
    expect(d.ledgeContact?.errorWorld,'rendered fingertip must reach the real deck').toBeLessThan(.02);
    expect(d.ledgeContact?.target).toHaveLength(3);
    expect(d.ledgeContact?.fingertip).toHaveLength(3);
    // The previous G37 GPU still passed fingertip IK while the *helmet*
    // visibly cut through stone. Reject a contact frame unless the actual
    // world-space head envelope is exterior to the real platform front rim.
    expect(d.ledgeContact?.helmetWorld).toHaveLength(3);
    expect(d.ledgeContact?.helmetClearanceWorld,'helmet must not intersect the deck rim').toBeGreaterThan(0);
    expect(Math.hypot(d.climberPosition[0],d.climberPosition[2]),
      'live visible root must follow the exterior corridor').toBeGreaterThan(27.95);
  });
}
