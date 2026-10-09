import { chromium } from '@playwright/test';
import { scoreScreenshot, compareWithVisualGoals } from './browser-scene-quality.mjs';
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
  // The canonical game entry must open the new 3D build, not silently land in 2.5D.
  await page.goto('http://127.0.0.1:4177/',{waitUntil:'load'});
  await page.waitForFunction(()=>document.querySelector('#fps')?.textContent?.includes('CPU P95'),{timeout:18000});
  assert.ok(await page.locator('#scene').count(),'root must open true WebGL2 3D viewer');
  report.checks.defaultEntryUses3D=true;
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
    assert.match(info.stats,/CPU P95/);
    assert.match(info.stats,/TRIANGLES/);
    assert.ok(info.width>=1280&&info.height>=720);
    const map=await page.locator('#miniMap').evaluate(el=>{
      const c=el.getContext('2d');const data=c.getImageData(0,0,el.width,el.height).data;
      let painted=0;for(let i=3;i<data.length;i+=4)if(data[i]>0)painted++;
      return {width:el.width,painted};
    });
    assert.ok(map.width>=200&&map.painted>=map.width,'Tactical map must paint real pixels');
    const shot=await page.screenshot({path:root+scenario+'.png',animations:'disabled'});
    assert.ok(shot.length>12000,'screenshot suspiciously small for '+scenario);
    const runtimeStats=await page.evaluate(()=>JSON.parse(localStorage.getItem('zombie-gauntlet-live')||'{}'));
    if(scenario==='large-horde'){
      assert.ok(runtimeStats.gpuHordeInstances>=10,'distant infected must use true WebGL2 GPU instancing');
      assert.ok(runtimeStats.gpuHordeTriangles>=runtimeStats.gpuHordeInstances*30,
        'GPU horde must consist of real articulated 3D geometry rather than sprites');
      report.checks.gpuInstancedCrowd=true;
    }
    report.scenarios.push({name:scenario,bytes:shot.length,...info,performance:runtimeStats});
  }
  await page.goto('http://127.0.0.1:4177/web/3d.html?scenario=day&freeze=1',{waitUntil:'load'});
  await page.waitForFunction(()=>document.querySelector('#fps')?.textContent?.includes('CPU P95'),{timeout:12000});
  const hudStyles=await page.evaluate(()=>{
    const css=getComputedStyle(document.documentElement);
    return ['--cyan','--coral','--amber'].map(k=>css.getPropertyValue(k).trim().toLowerCase());
  });
  assert.deepEqual(hudStyles,['#42f2e1','#ff647a','#ffc96e']);
  assert.ok((await page.locator('#cameraLabel').textContent()).length>2);
  assert.ok(await page.locator('#eventTape').count(),'Outbreak chronicle must be mounted');
  assert.ok(await page.locator('#alertBanner').count(),'live survival warning must be mounted');
  assert.ok(await page.locator('.mobileOverview').count(),'mobile status overview must be mounted');
  await page.keyboard.press('h');
  const uncovered=await page.screenshot({path:root+'world-hud-hidden.png'});
  const appearance=await scoreScreenshot(page,uncovered);
  const score=compareWithVisualGoals(appearance);
  report.visualQuality={appearance,score};
  assert.ok(score.minimumReadability,'The daylight game world is still too dark to read');
  assert.ok(score.minimumSaturation,'The daylight game world palette regressed to washed-out gray');
  await page.keyboard.press('h');
  await page.screenshot({path:root+'vibrant-ui.png'});
  report.checks.vibrantHudAndMap=true;
  await page.waitForFunction(()=>document.querySelectorAll('#squadQuick .squadLink').length>=6,{timeout:8000});
  assert.equal(await page.locator('#squadQuick .squadLink').count(),6);
  for(const id of ['resFood','resAmmo','resMed']){
    assert.match(await page.locator('#'+id).textContent(),/^[0-9]+$/,
      'supply tiles must display actual inventory, not placeholders');
  }
  await page.locator('#squadQuick .squadLink').first().click();
  await page.waitForFunction(()=>document.querySelector('#cameraLabel').textContent.includes('HERO'),{timeout:6000});
  assert.equal(await page.locator('#squadQuick .squadLink').first().getAttribute('aria-pressed'),'true');
  await page.screenshot({path:root+'squad-quick-command.png'});
  report.checks.quickSquadAndInventory=true;
  await page.goto('http://127.0.0.1:4177/web/3d.html?scenario=night&weather=storm&freeze=1',{waitUntil:'load'});
  await page.waitForFunction(()=>document.querySelector('#fps')?.textContent?.includes('CPU P95'),{timeout:12000});
  await page.screenshot({path:root+'night-storm.png'});
  report.checks.weatherEvidence=true;
  // CC0 GLB pipeline is network-optional and may fall back without disrupting the live game.
  await page.goto('http://127.0.0.1:4177/web/3d.html?scenario=small-encounter&freeze=1&models=cc0&view=hero',{waitUntil:'load'});
  await page.waitForFunction(()=>{
    const d=JSON.parse(localStorage.getItem('zombie-gauntlet-live')||'{}');
    return ['ready','fallback'].includes(d.cc0AssetState);
  },{timeout:13000});
  const cc0State=await page.evaluate(()=>JSON.parse(localStorage.getItem('zombie-gauntlet-live')||'{}').cc0AssetState);
  await page.screenshot({path:root+'cc0-imported-characters.png'});
  report.assetPipeline={cc0State,source:'Ariescar/gobkit-free-assets; CC0-1.0; pinned git commit'};
  report.checks.glbImportFallback=true;
  await page.goto('http://127.0.0.1:4177/web/3d.html?scenario=day&freeze=1&lighting=shadows',{waitUntil:'load'});
  await page.waitForFunction(()=>document.querySelector('#fps')?.textContent?.includes('CPU P95'),{timeout:16000});
  const shadowGL=await page.locator('#scene').evaluate(el=>el.getContext('webgl2').getError());
  assert.equal(shadowGL,0,'Cinematic directional shadow pass must not trigger WebGL errors');
  await page.screenshot({path:root+'cinematic-shadows.png'});
  report.checks.cinematicShadows=true;
  await page.goto('http://127.0.0.1:4177/web/3d.html?scenario=small-encounter&view=hero&freeze=1',{waitUntil:'load'});
  await page.waitForFunction(()=>document.querySelector('#fps')?.textContent?.includes('FPS'),{timeout:12000});
  await page.waitForTimeout(700);
  await page.screenshot({path:root+'hero-closeup.png'});
  await page.keyboard.press('m');
  await page.screenshot({path:root+'hero-clear-view.png'});
  await page.keyboard.press('m');
  const aiIntent=await page.locator('#decision').textContent();
  await page.keyboard.press('n');
  await page.keyboard.press('g');
  await page.keyboard.press('c');
  assert.ok(aiIntent?.length>12,'AI decision panel must expose a meaningful current intent');
  report.checks.heroCameraAndIntent=true;
  await page.keyboard.press('m');
  assert.equal(await page.locator('#hud').getAttribute('data-cinema'),'true');
  assert.ok((await page.locator('#cinemaActor').textContent()).length>5);
  assert.ok((await page.locator('#cinemaIntent').textContent()).length>5);
  assert.equal(await page.locator('.cinemaTicker').isVisible(),true);
  assert.equal(await page.locator('#cinemaMode').getAttribute('aria-pressed'),'true');
  await page.screenshot({path:root+'cinema-mode.png'});
  await page.keyboard.press('m');
  assert.equal(await page.locator('#hud').getAttribute('data-cinema'),'false');
  report.checks.cinemaMode=true;
  await page.goto('http://127.0.0.1:4177/web/3d.html?seed=2026',{waitUntil:'load'});
  await page.waitForFunction(()=>document.querySelector('#fps')?.textContent?.includes('FPS'),{timeout:12000});
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('zombie-gauntlet-live')||'{}').tick||0);
  await page.waitForTimeout(750);
  const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('zombie-gauntlet-live')||'{}').tick||0);
  assert.ok(after>before,'authoritative simulation must continue while rendered');
  report.checks.autonomousSimulation=true;
  // A browser refresh must restore RNG, tick and actual authority, never restart at day one.
  await page.reload({waitUntil:'load'});
  await page.waitForFunction(()=>document.querySelector('#fps')?.textContent?.includes('CPU P95'),{timeout:12000});
  const recovered=await page.evaluate(()=>JSON.parse(localStorage.getItem('zombie-gauntlet-live')||'{}').tick||0);
  assert.ok(recovered>=after,'restored authoritative tick must not move backward after browser reload');
  report.checks.recoveredSimulation=true;
  await page.keyboard.press('s');
  assert.equal(await page.locator('#squadPanel').isVisible(),true);
  assert.equal(await page.locator('#squadCards .squad-person').count(),6);
  assert.match(await page.locator('#squadCards .squad-person').first().textContent(),/HP|INFECTION/);
  await page.screenshot({path:root+'survivor-dossiers.png'});
  await page.locator('#squadCards .squad-person:not([disabled])').first().click();
  assert.equal(await page.locator('#squadPanel').isHidden(),true);
  report.checks.autonomousDossiers=true;
  await page.keyboard.press('h');
  assert.equal(await page.locator('#hud').isHidden(),true);
  await page.keyboard.press('h');
  assert.equal(await page.locator('#hud').isVisible(),true);
  await page.keyboard.press('Space');
  await page.waitForFunction(()=>document.querySelector('#verdict')?.textContent?.includes('PAUSED'),{timeout:5000});
  assert.equal(await page.locator('#togglePause').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#liveLabel').textContent(),'PAUSED / SIMULATION');
  assert.match(await page.locator('#verdict').textContent(),/PAUSED/);
  const pauseTick=await page.evaluate(()=>JSON.parse(localStorage.getItem('zombie-gauntlet-live')||'{}').tick);
  await page.waitForTimeout(850);
  const pausedTick=await page.evaluate(()=>JSON.parse(localStorage.getItem('zombie-gauntlet-live')||'{}').tick);
  assert.equal(pausedTick,pauseTick,'pause must stop authoritative simulation ticks');
  report.checks.hudPause=true;
  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(250);
  const mobile=await page.locator('#scene').boundingBox();
  assert.equal(mobile.width,390);
  assert.equal(mobile.height,844);
  // Real 390x844 critic: default panels must not hide the world.
  const mobileState=await page.evaluate(()=>{
    const h=document.querySelector('#hud');
    return {panel:h.dataset.mobilePanel,
      left:getComputedStyle(document.querySelector('#survivalPanel')).display,
      right:getComputedStyle(document.querySelector('#intelPanel')).display,
      nav:getComputedStyle(document.querySelector('.mobileDeck')).display,
      summary:getComputedStyle(document.querySelector('.mobileOverview')).display,
      pageWidth:document.documentElement.scrollWidth,
      alive:document.querySelector('#mobileAlive').textContent,
      horde:document.querySelector('#mobilePressure').textContent};
  });
  assert.equal(mobileState.panel,'none');
  assert.equal(mobileState.left,'none');
  assert.equal(mobileState.right,'none');
  assert.notEqual(mobileState.nav,'none');
  assert.notEqual(mobileState.summary,'none');
  assert.ok(mobileState.pageWidth<=391,'mobile UI must not introduce horizontal overflow');
  assert.match(mobileState.alive,/^[0-9]+$/);
  assert.match(mobileState.horde,/^[0-9]+%$/);
  await page.screenshot({path:root+'mobile.png'});
  await page.locator('#mobileSurvival').click();
  assert.equal(await page.locator('#hud').getAttribute('data-mobile-panel'),'survival');
  assert.equal(await page.locator('#mobileSurvival').getAttribute('aria-expanded'),'true');
  assert.equal(await page.locator('#survivalPanel').isVisible(),true);
  assert.equal(await page.locator('#intelPanel').isVisible(),false);
  await page.screenshot({path:root+'mobile-survival-panel.png'});
  await page.locator('#mobileIntel').click();
  assert.equal(await page.locator('#hud').getAttribute('data-mobile-panel'),'intel');
  assert.equal(await page.locator('#survivalPanel').isVisible(),false);
  assert.equal(await page.locator('#intelPanel').isVisible(),true);
  await page.screenshot({path:root+'mobile-ai-intel-panel.png'});
  await page.locator('#mobileMap').click();
  assert.equal(await page.locator('#mobileMap').getAttribute('aria-expanded'),'true');
  await page.screenshot({path:root+'mobile-tactical-map.png'});
  await page.locator('#intelPanel .panelClose').click();
  assert.equal(await page.locator('#hud').getAttribute('data-mobile-panel'),'none');
  await page.locator('#mobileSurvival').click();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#hud').getAttribute('data-mobile-panel'),'none');
  report.checks.mobileMissionPanels=true;
  report.checks.mobileResponsive=true;
  await page.goto('http://127.0.0.1:4177/web/3d.html?scenario=failure&restartMs=750',{waitUntil:'load'});
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.includes('RUN 2'),{timeout:15000});
  assert.match(await page.locator('#status').textContent(),/RUN 2/);
  report.checks.unattendedRestart=true;
  await page.goto('http://127.0.0.1:4177/web/progress.html',{waitUntil:'load'});
  await page.frameLocator('iframe').locator('#scene').waitFor();
  await page.waitForTimeout(1100);
  assert.match(await page.locator('#health').textContent(),/LIVE|telemetry/);
  await page.screenshot({path:root+'progress.png'});
  assert.equal(await page.locator('.historyRow:visible').count(),0,'historical loops start compact');
  await page.locator('#historyToggle').click();
  assert.ok(await page.locator('.historyRow:visible').count()>10,'operator can expand full iteration ledger');
  await page.locator('#historyToggle').click();
  assert.equal(await page.locator('.historyRow:visible').count(),0);
  await page.locator('[data-scene="night"]').click();
  assert.equal(await page.locator('[data-scene="night"]').getAttribute('aria-pressed'),'true');
  assert.match(await page.locator('#gauntletViewer').getAttribute('src'),/scenario=night/);
  await page.frameLocator('#gauntletViewer').locator('#scene').waitFor({timeout:12000});
  await page.screenshot({path:root+'progress-night-critic.png'});
  await page.locator('[data-scene="live"]').click();
  assert.match(await page.locator('#gauntletViewer').getAttribute('src'),/crowd=dense/);
  report.checks.gauntletSceneInspector=true;
  report.checks.progressPage=true;
  assert.deepEqual(report.errors,[],report.errors.join('\n'));
}finally{
  await writeFile(root+'browser-report.json',JSON.stringify(report,null,2));
  await browser.close();
}
console.log(JSON.stringify(report,null,2));
