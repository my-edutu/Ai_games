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


// Source-bound ordered ticks, NOT an accelerated movie or a sustained-FPS test.
// Every still uses the same real deterministic authority run; no pose is edited.
function realAscentSequence(view) {
  const session=createSession(),history=[];
  for(let index=0;index<2500;index++){
    const frame=session.controller.frame(view.w,view.h,{reducedMotion:true,muted:true});
    history.push(frame);
    const platform=intendedLanding(frame.snapshot),contact=ledgeContactPoint(frame.snapshot,platform);
    if(contact){
      const anchor=history.length-1;
      for(let j=0;j<24;j++){
        advance(session);
        history.push(session.controller.frame(view.w,view.h,{reducedMotion:true,muted:true}));
      }
      const offsets=[-16,-8,-2,-1,0,1,2,6,12,20];
      if(anchor<16)throw Error('Real ledge encounter lacks 16 preceding ticks');
      const frames=offsets.map(offset=>({offset,frame:history[anchor+offset]}));
      const runToken=frames[0].frame.snapshot.runToken;
      if(frames.some(({frame})=>frame.snapshot.runToken!==runToken))
        throw Error('Real ledge window crosses a restart: cannot compare source ticks');
      return {contactTick:frame.snapshot.tick,frames};
    }
    advance(session);
  }
  throw Error('No authentic ledge contact for source-bound sequence');
}
for(const view of [{name:'desktop',w:960,h:600},{name:'portrait',w:390,h:844}]){
  test('source-bound ledge transition sequence '+view.name,async({page},info)=>{
    test.setTimeout(360000);
    const sequence=realAscentSequence(view),errors=[];
    const output=path.resolve('artifacts/tower-ledge-contact','sequence-'+view.name);
    fs.mkdirSync(output,{recursive:true});
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    await page.setViewportSize({width:view.w,height:view.h});
    let selected=sequence.frames[0].frame;
    await page.route('**/tower/state**',route=>route.fulfill({json:selected}));
    await page.goto('/tower?quality=low&reducedMotion=1&muted=1',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(checksum=>{
      const d=window.__TOWER_RENDER_DIAGNOSTICS__?.();
      return d?.frames>=3&&d.renderProgress?.state==='current'
        &&window.__TOWER_PUBLIC_STATE__?.publicChecksum===checksum;
    },selected.snapshot.publicChecksum,{timeout:90000});
    await waitForSettledTowerStone(page);
    const observations=[];
    for(let index=0;index<sequence.frames.length;index++){
      const {offset,frame}=sequence.frames[index];
      const prior=index===0?0:await page.evaluate(()=>window.__TOWER_RENDER_DIAGNOSTICS__().frames);
      selected=frame;
      await page.waitForFunction(({tick,checksum,prior})=>{
        const d=window.__TOWER_RENDER_DIAGNOSTICS__?.();
        return d?.frames>prior&&d.renderProgress?.lastSubmitted?.tick===tick
          &&window.__TOWER_PUBLIC_STATE__?.publicChecksum===checksum;
      },{tick:frame.snapshot.tick,checksum:frame.snapshot.publicChecksum,prior},{timeout:90000});
      const diagnostics=await page.evaluate(()=>window.__TOWER_RENDER_DIAGNOSTICS__());
      const filename=String(index).padStart(2,'0')+'-tick-'+frame.snapshot.tick+'.png';
      await page.screenshot({path:path.join(output,filename),timeout:90000});
      if(offset===0)await info.attach('authentic-contact-'+view.name,{path:path.join(output,filename),contentType:'image/png'});
      observations.push({offset,tick:frame.snapshot.tick,checksum:frame.snapshot.publicChecksum,
        player:{state:frame.snapshot.player.state,x:frame.snapshot.player.x,y:frame.snapshot.player.y,
          vy:frame.snapshot.player.vy,halfHeight:frame.snapshot.player.halfHeight},
        image:filename,rendererSubmittedTick:diagnostics.renderProgress?.lastSubmitted?.tick,
        frames:diagnostics.frames,ledgeContact:diagnostics.ledgeContact,
        ledgeProjection:diagnostics.ledgeProjection,
        errorsAtFrame:diagnostics.renderErrors});
    }
    fs.writeFileSync(path.join(output,'sequence.json'),JSON.stringify({
      method:'Ordered real authoritative ticks, separately rendered and captured as STILLS; NOT continuous normal-speed video or device FPS',
      sourceSha:process.env.GITHUB_SHA||null,contactTick:sequence.contactTick,view,observations,errors,
      independentVisualReview:false,
      gates:{tickIntegrity:'PASS',pixelMotion:'OPEN',visualDepth:'OPEN',deviceFPS:'OPEN'}
    },null,2));
    expect(errors,'do not hide page errors').toEqual([]);
    expect(observations).toHaveLength(10);
    expect(observations.every(o=>o.rendererSubmittedTick===o.tick),'actual rendered tick must match source').toBe(true);
    expect(observations.every(o=>o.errorsAtFrame===0),'no shader or rendering errors').toBe(true);
    expect(observations.every(o=>o.ledgeProjection?.ankles?.length===2),
      'both actual boot joints must be projected to screen').toBe(true);
    expect(observations.some(o=>o.ledgeContact?.errorWorld<.02),
      'capture must contain genuine rig-to-deck hand contact').toBe(true);
  });
}
