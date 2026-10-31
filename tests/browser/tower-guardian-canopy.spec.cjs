'use strict';
const fs = require('node:fs'), path = require('node:path');
const { test, expect } = require('@playwright/test');
const { createSession, advance } = require('../../scripts/serve-tower-stream.cjs');

// Real unmodified seeded floor-8 snapshots held for appearance inspection.
function encounter(w,h) {
  const session=createSession('tower-stream-reference',{launchFloor:8,guardianInterval:8,upgradeInterval:4,
    maxTicks:20000,noProgressTicks:3000,intermissionTicks:36});
  let best=null;
  for(let i=0;i<440;i++) {
    const frame=session.controller.frame(w,h,{reducedMotion:true,muted:true}), s=frame.snapshot;
    const guardian=s.enemies?.find(e=>e.active&&e.kind==='guardian');
    const cap=s.platforms?.find(p=>p.id.endsWith(':cap'));
    if(s.lifecycle==='running'&&guardian&&cap){
      const dx=Math.abs(s.player.x-guardian.x),dy=Math.abs(s.player.y-guardian.y);
      const score=dx+1.4*dy;
      if(!best||score<best.score)best={frame,score,guardianId:guardian.id,capId:cap.id};
      if(dx<90000&&dy<65000)break;
    }
    advance(session);
  }
  return best;
}
for(const v of [{name:'portrait',w:390,h:844},{name:'desktop',w:960,h:600}])
  test('live guardian beneath the cap '+v.name,async ({page})=>{
    test.setTimeout(150000);
    const match=encounter(v.w,v.h);
    expect(match,'active guardian and cap must exist in actual seeded run').toBeTruthy();
    expect(match.score).toBeLessThan(145000);
    const frame=match.frame,checksum=frame.snapshot.publicChecksum;
    const a=process.env.TOWER_GUARDIAN_BASELINE_SCENE,b=process.env.TOWER_GUARDIAN_BASELINE_CAST;
    if(a&&b){
      await page.route('**/tower/visuals/scene.mjs',route=>route.fulfill({contentType:'text/javascript',body:fs.readFileSync(a,'utf8')}));
      await page.route('**/tower/visuals/characters.mjs',route=>route.fulfill({contentType:'text/javascript',body:fs.readFileSync(b,'utf8')}));
    }
    await page.route('**/tower/state**',route=>route.fulfill({json:frame}));
    await page.setViewportSize({width:v.w,height:v.h});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    await page.goto('/tower?quality=low&reducedMotion=1&muted=1',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>{
      const d=window.__TOWER_RENDER_DIAGNOSTICS__?.();
      return d?.frames>=5&&d.lighting?.environmentState!=='pending';
    },null,{timeout:90000});
    const diagnostics=await page.evaluate(()=>window.__TOWER_RENDER_DIAGNOSTICS__());
    expect(diagnostics.renderErrors).toBe(0);
    expect(await page.evaluate(()=>window.__TOWER_PUBLIC_STATE__.publicChecksum)).toBe(checksum);
    const dir=path.resolve('artifacts/tower-guardian-canopy');
    fs.mkdirSync(dir,{recursive:true});
    const label=(a&&b?'before':'after')+'-'+v.name;
    await page.screenshot({path:path.join(dir,label+'.png'),fullPage:true,timeout:90000});
    fs.writeFileSync(path.join(dir,label+'.json'),JSON.stringify({
      method:'Actual seeded public snapshot held for WebGL appearance; not continuous motion or GPU FPS',
      sourceSha:process.env.GITHUB_SHA||null,viewport:v,tick:frame.snapshot.tick,
      checksum,guardianId:match.guardianId,capId:match.capId,score:match.score,
      baseline:!!a,diagnostics,errors
    },null,2));
    expect(errors).toEqual([]);
  });
