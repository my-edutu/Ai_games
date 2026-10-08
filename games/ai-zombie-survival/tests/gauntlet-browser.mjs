import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../evidence/3d-runtime/',import.meta.url));
await mkdir(root,{recursive:true});
const browser=await chromium.launch({
  headless:true,
  args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']
});
const report={renderer:'WebGL2',scenarios:[],errors:[],checks:{}};
const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
page.on('pageerror',err=>report.errors.push('page: '+err.message));
page.on('console',msg=>{if(msg.type()==='error')report.errors.push('console: '+msg.text());});
try{
  for(const scenario of ['day','night','large-horde','barricade-defense','interior','near-death','failure']){
    await page.goto('http://127.0.0.1:4177/web/3d.html?scenario='+scenario+'&freeze=1',{waitUntil:'load'});
    await page.waitForFunction(()=>document.querySelector('#fps')?.textContent?.includes('FPS'),{timeout:12000});
    const info=await page.evaluate(()=>{
      const canvas=document.getElementById('scene');
      const gl=canvas.getContext('webgl2');
      return {width:canvas.width,height:canvas.height,renderer:gl?.getParameter(gl.VERSION),
        status:document.querySelector('#verdict').textContent,stats:document.querySelector('#fps').textContent};
    });
    assert.match(info.renderer,/WebGL 2/);
    assert.match(info.stats,/STATIC BOX EQUIV/);
    assert.ok(info.width>=1280&&info.height>=720);
    const shot=await page.screenshot({path:root+scenario+'.png',animations:'disabled'});
    assert.ok(shot.length>12000,'screenshot suspiciously small for '+scenario);
    report.scenarios.push({name:scenario,bytes:shot.length,...info});
  }
  await page.goto('http://127.0.0.1:4177/web/3d.html?seed=2026',{waitUntil:'load'});
  await page.waitForFunction(()=>document.querySelector('#fps')?.textContent?.includes('FPS'),{timeout:12000});
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('zombie-gauntlet-live')||'{}').tick||0);
  await page.waitForTimeout(750);
  const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('zombie-gauntlet-live')||'{}').tick||0);
  assert.ok(after>before,'authoritative simulation must continue while rendered');
  report.checks.autonomousSimulation=true;
  await page.keyboard.press('h');
  assert.equal(await page.locator('#hud').isHidden(),true);
  await page.keyboard.press('h');
  assert.equal(await page.locator('#hud').isVisible(),true);
  await page.keyboard.press('Space');
  await page.waitForTimeout(200);
  assert.match(await page.locator('#verdict').textContent(),/PAUSED/);
  report.checks.hudPause=true;
  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(250);
  const mobile=await page.locator('#scene').boundingBox();
  assert.equal(mobile.width,390);
  assert.equal(mobile.height,844);
  await page.screenshot({path:root+'mobile.png'});
  report.checks.mobileResponsive=true;
  await page.goto('http://127.0.0.1:4177/web/progress.html',{waitUntil:'load'});
  await page.frameLocator('iframe').locator('#scene').waitFor();
  await page.waitForTimeout(1100);
  assert.match(await page.locator('#health').textContent(),/LIVE|telemetry/);
  await page.screenshot({path:root+'progress.png'});
  report.checks.progressPage=true;
  assert.deepEqual(report.errors,[],report.errors.join('\n'));
}finally{
  await writeFile(root+'browser-report.json',JSON.stringify(report,null,2));
  await browser.close();
}
console.log(JSON.stringify(report,null,2));
