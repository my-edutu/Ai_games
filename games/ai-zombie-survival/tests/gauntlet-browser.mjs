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
    // Internal 3D resolution can adapt to measured GPU stalls; CSS viewport stays 1280x720.
    assert.ok(info.width>=Math.floor(1280*.69)&&info.height>=Math.floor(720*.69),
      'adaptive 3D canvas must retain at least 70% linear resolution');
    const map=await page.locator('#miniMap').evaluate(el=>{
      const c=el.getContext('2d');const data=c.getImageData(0,0,el.width,el.height).data;
      let painted=0;for(let i=3;i<data.length;i+=4)if(data[i]>0)painted++;
      return {width:el.width,painted};
    });
    assert.ok(map.width>=200&&map.painted>=map.width,'Tactical map must paint real pixels');
    const shot=await page.screenshot({path:root+scenario+'.png',animations:'disabled'});
    assert.ok(shot.length>12000,'screenshot suspiciously small for '+scenario);
    const runtimeStats=await page.evaluate(()=>JSON.parse(localStorage.getItem('zombie-gauntlet-live')||'{}'));
    if(scenario==='day'){
      assert.ok(['unsupported','warming','warming-after-disjoint','measured'].includes(runtimeStats.gpuTimingState),
        'GPU timer must report extension support and measurement state');
      assert.ok(Number.isInteger(runtimeStats.gpuFrameSamples)&&runtimeStats.gpuFrameSamples>=0,
        'GPU sample count must be nonnegative');
      assert.ok(Number.isInteger(runtimeStats.gpuTimerPending)&&runtimeStats.gpuTimerPending<=4,
        'GPU query backlog must remain bounded');
      if(runtimeStats.gpuTimingState==='measured')
        assert.ok(Number.isFinite(runtimeStats.gpuFrameP95Ms)&&runtimeStats.gpuFrameP95Ms>=0,
          'GPU p95 must be measured and finite');
      else assert.equal(runtimeStats.gpuFrameP95Ms,null,
        'missing GPU timings must never be replaced with CPU estimates');
      assert.ok(Number.isFinite(runtimeStats.renderScale)&&runtimeStats.renderScale>=.70&&runtimeStats.renderScale<=1,
        'adaptive 3D resolution must stay inside safe presentation limits');
      assert.ok(['native','awaiting-gpu-samples','gpu-within-budget','gpu-over-budget',
        'gpu-headroom','frame-pacing-over-budget','frame-pacing-headroom'].includes(runtimeStats.resolutionBudgetReason),
        'budget decision must be inspectable in runtime evidence');
      assert.equal(runtimeStats.shaderPath,runtimeStats.rendererGpu==='software'?'low-spec':'cinematic',
        'actual WebGL renderer must select the matching material shader');
      report.checks.softwareMaterialPath=true;
      report.checks.adaptiveSceneBudget=true;
      report.checks.nonblockingGpuTelemetry=true;
    }
    if(scenario==='large-horde'){
      assert.ok(runtimeStats.gpuHordeInstances>=10,'distant infected must use true WebGL2 GPU instancing');
      assert.ok(runtimeStats.gpuHordeTriangles>=runtimeStats.gpuHordeInstances*30,
        'GPU horde must consist of real articulated 3D geometry rather than sprites');
      report.checks.gpuInstancedCrowd=true;
    }
    report.scenarios.push({name:scenario,bytes:shot.length,...info,performance:runtimeStats});
    if(scenario==='day'){
      assert.equal(runtimeStats.cameraMode,'director','day scene must retain autonomous director');
      assert.ok(runtimeStats.cameraRangeTarget>=14&&runtimeStats.cameraRangeTarget<=18,
        'desktop director must frame squad close enough: '+JSON.stringify(runtimeStats));
      assert.ok(Number.isFinite(runtimeStats.cameraEyeDistance)&&runtimeStats.cameraEyeDistance>4,
        'actual desktop camera must remain finite and outside near clipping');
      report.desktopCamera={target:runtimeStats.cameraRangeTarget,actual:runtimeStats.cameraEyeDistance};
      report.checks.desktopActionFraming=true;
    }

    if(scenario==='large-horde'){
      // Real 390x844 stress screenshot: ensure dense horde signalling stays
      // scene-first instead of placing a bright vertical beam over the hero.
      await page.setViewportSize({width:390,height:844});
      try{
        // Allow the narrow-screen autonomous director shot to settle on a
        // nearby living squad member before evaluating its real composition.
        await page.waitForTimeout(1500);
        const mobileCamera=await page.evaluate(()=>JSON.parse(localStorage.getItem('zombie-gauntlet-live')||'{}'));
        assert.ok(Number.isFinite(mobileCamera.cameraFocusX)&&Number.isFinite(mobileCamera.cameraFocusZ),
          'mobile shot must expose actual 3D camera focus telemetry');
        report.mobileCamera={mode:mobileCamera.cameraMode,x:mobileCamera.cameraFocusX,z:mobileCamera.cameraFocusZ};
        report.checks.mobileCameraTelemetry=true;
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=391),
          'dense horde phone viewport must not overflow');
        const mobileHorde=await page.screenshot({path:root+'mobile-ground-threat.png',animations:'disabled'});
        assert.ok(mobileHorde.length>12000,'mobile horde screenshot must contain real pixels');
        report.checks.mobileGroundThreatCapture=true;
      }finally{await page.setViewportSize({width:1280,height:720});}
    }

    // Capture the CURRENT 390x844 scene at the start of CI, before expensive
    // horde/asset cases can fail and suppress all mobile visual evidence.
    if(scenario==='day'){
      await page.setViewportSize({width:390,height:844});
      try{
        await page.waitForTimeout(350);
        const layout=await page.evaluate(()=>{
          const box=sel=>document.querySelector(sel).getBoundingClientRect();
          return {width:document.documentElement.scrollWidth,
            panel:document.querySelector('#hud').dataset.mobilePanel,
            left:getComputedStyle(document.querySelector('#survivalPanel')).display,
            right:getComputedStyle(document.querySelector('#intelPanel')).display,
            header:box('.top').bottom,summary:box('.mobileOverview').top,
            navigation:box('.mobileDeck').bottom,footer:box('.bottom').top};
        });
        assert.ok(layout.width<=391,'mobile playfield must not overflow horizontally');
        assert.equal(layout.panel,'none');
        assert.equal(layout.left,'none');
        assert.equal(layout.right,'none');
        assert.ok(layout.summary>=layout.header-8,'mobile vitals must not collide with header');
        assert.ok(layout.navigation<=layout.footer+3,'mobile navigation must not collide with footer');
        const phoneType=await page.evaluate(()=>{
          const px=selector=>parseFloat(getComputedStyle(document.querySelector(selector)).fontSize);
          return {
            overview: px('.mobileOverview span:not(.liveStatusDot)'),
            count: px('.mobileOverview strong'),
            navigation: px('.mobileDeck button'),
            command: px('.bottom .controls>button'),
            director: px('.directorStrip strong'),
            frame: px('.sceneBadge #fpsCompact'),
          };
        });
        for(const key of ['overview','navigation','command'])
          assert.ok(phoneType[key]>=10,'unreadable native 390px phone label: '+key);
        assert.ok(phoneType.count>=15,'live vitals must be glance-readable');
        assert.ok(phoneType.director>=12,'director objective must be legible');
        assert.ok(phoneType.frame>=11,'frame badge must be legible');
        report.checks.mobileReadableTypography=true;
        await page.screenshot({path:root+'mobile-first-look.png',animations:'disabled'});
        report.checks.mobileFirstLook=true;
      }finally{
        await page.setViewportSize({width:1280,height:720});
      }
    }

  }
  await page.goto('http://127.0.0.1:4177/web/3d.html?scenario=day&freeze=1',{waitUntil:'load'});
  await page.waitForFunction(()=>document.querySelector('#fps')?.textContent?.includes('CPU P95'),{timeout:12000});
  // Loop 43: measure 1280px default clear corridor and prove details remain interactive.
   const compactHud=await page.evaluate(()=>{
     const rect=id=>{const r=document.getElementById(id).getBoundingClientRect();
       return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width};};
     return {survival:rect('survivalPanel'),intel:rect('intelPanel'),
       rosterDisplay:getComputedStyle(document.getElementById('squadQuick')).display,
       mapDisplay:getComputedStyle(document.getElementById('miniMap')).display,
       expanded:[...document.querySelectorAll('.desktopHudToggle')].map(b=>b.getAttribute('aria-expanded'))};
   });
   assert.ok(compactHud.survival.width<=240&&compactHud.intel.width<=240,
     'desktop panels must not consume nearly half the game image');
   assert.ok(compactHud.intel.left-compactHud.survival.right>=760,
     'desktop action corridor must remain >=760px wide at 1280px');
   assert.ok(compactHud.survival.bottom<430&&compactHud.intel.bottom<400,
     'compact panels must not obscure lower combat staging');
   assert.equal(compactHud.rosterDisplay,'none');
   assert.equal(compactHud.mapDisplay,'none');
   assert.deepEqual(compactHud.expanded,['false','false']);
   await page.screenshot({path:root+'desktop-hud-compact.png',animations:'disabled'});
   await page.locator('#survivalPanel .desktopHudToggle').click();
   assert.equal(await page.locator('#survivalPanel .desktopHudToggle').getAttribute('aria-expanded'),'true');
   assert.equal(await page.locator('#squadQuick').isVisible(),true);
   assert.equal(await page.locator('.supplyGrid').isVisible(),true);
   await page.locator('#intelPanel .desktopHudToggle').click();
   assert.equal(await page.locator('#intelPanel .desktopHudToggle').getAttribute('aria-expanded'),'true');
   assert.equal(await page.locator('#miniMap').isVisible(),true);
   await page.screenshot({path:root+'desktop-hud-expanded.png',animations:'disabled'});
   await page.locator('#intelPanel .desktopHudToggle').click();
   assert.equal(await page.locator('#miniMap').isVisible(),false);
   await page.locator('#intelPanel .desktopHudToggle').click();
   report.checks.desktopPlayfieldFocus=true;
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
  // Actual 390x844 phone capture, not a desktop screenshot resized in CSS.
  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(250);
  const phoneCharacter=await page.screenshot({path:root+'mobile-character-study.png',animations:'disabled'});
  assert.ok(phoneCharacter.length>12000,'phone character study must contain rendered pixels');
  await page.setViewportSize({width:1280,height:720});
  report.checks.mobileCharacterStudy=true;
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
  // A prior root-view visit can leave an unrelated session snapshot; start this
  // liveness case clean, then still verify genuine recovery on the next reload.
  await page.evaluate(()=>sessionStorage.removeItem('edutu-zombie-gauntlet-recovery-v1'));
  await page.goto('http://127.0.0.1:4177/web/3d.html?seed=2026',{waitUntil:'load'});
  await page.waitForFunction(()=>document.querySelector('#fps')?.textContent?.includes('FPS'),{timeout:12000});
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('zombie-gauntlet-live')||'{}').tick||0);
  // SwiftShader can spend >750ms in a single frame. Observe authoritative
  // ticks rather than assuming a 750ms wall-clock sleep proves liveness.
  await page.waitForFunction(previous=>{
    const state=JSON.parse(localStorage.getItem('zombie-gauntlet-live')||'{}');
    return state.status==='running'&&Number.isSafeInteger(state.tick)&&state.tick>previous;
  },before,{timeout:30000,polling:250});
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
  const rebuildBefore=await page.evaluate(()=>JSON.parse(localStorage.getItem('zombie-gauntlet-live')||'{}').dynamicRebuilds||0);
  await page.setViewportSize({width:390,height:844});
  await page.waitForFunction(n=>JSON.parse(localStorage.getItem('zombie-gauntlet-live')||'{}').dynamicRebuilds>n,rebuildBefore,{timeout:12000});
  report.checks.pausedViewportSignalRebuild=true;
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
   assert.equal(await page.locator('#survivalPanel .desktopHudToggle').isVisible(),false,
     'desktop density control must not intrude into phone drawers');
  assert.equal(mobileState.left,'none');
  assert.equal(mobileState.right,'none');
  assert.notEqual(mobileState.nav,'none');
  assert.notEqual(mobileState.summary,'none');
  assert.equal(await page.locator('#fpsCompact').isVisible(),true);
  assert.equal(await page.locator('#fps').isVisible(),false);
  assert.match(await page.locator('#fpsCompact').textContent(),/^[0-9]+ FPS$/);
  assert.ok(mobileState.pageWidth<=391,'mobile UI must not introduce horizontal overflow');
  assert.match(mobileState.alive,/^[0-9]+$/);
  assert.match(mobileState.horde,/^[0-9]+%$/);
  // Loop 51: real 390x844 HUD geometry, not only static CSS declarations.
  // Preserve the EDUTU brand, readable vitals and independent control rail.
  const phoneTop=await page.evaluate(()=>{
    const rect=selector=>{
      const b=document.querySelector(selector).getBoundingClientRect();
      return {top:b.top,bottom:b.bottom,height:b.height};
    };
    return {header:rect('.top'),summary:rect('.mobileOverview'),
      brand:getComputedStyle(document.querySelector('.branding h1')).fontSize,
      summaryValue:getComputedStyle(document.querySelector('.mobileOverview strong')).fontSize};
  });
  assert.ok(phoneTop.header.bottom<=64,
    'phone masthead still steals the top of the action: '+JSON.stringify(phoneTop));
  assert.ok(phoneTop.summary.top>=phoneTop.header.bottom+2,
    'phone vital bars overlap the masthead');
  assert.ok(phoneTop.summary.bottom<=104,
    'phone vital bars still obscure the upper action');
  assert.ok(parseFloat(phoneTop.brand)>=19&&parseFloat(phoneTop.summaryValue)>=15,
    'mobile broadcast hierarchy was shrunk below readable sizes');
  report.checks.mobileVerticalPlayfield=true;
  await page.screenshot({path:root+'mobile.png'});
  // Harsh phone critic: the previous footer ended with a chopped cyan button.
  // All primary controls must now fit fully without horizontal scrolling.
  const rail=await page.evaluate(()=>{
    const ids=['togglePause','cinemaMode','hero','mobileMoreControls'];
    const parent=document.querySelector('.bottom .controls');
    const footer=document.querySelector('.bottom').getBoundingClientRect();
    return {overflow:parent.scrollWidth-parent.clientWidth,
      buttons:ids.map(id=>{const r=document.getElementById(id).getBoundingClientRect();
        return {id,x:r.x,right:r.right,width:r.width,height:r.height,top:r.top,bottom:r.bottom};}),
      footerTop:footer.top,footerBottom:footer.bottom};
  });
  assert.ok(rail.overflow<=1,'phone footer must not require horizontal scrolling');
  for(const button of rail.buttons){
    assert.ok(button.x>=0&&button.right<=391,'clipped phone button: '+button.id);
    assert.ok(button.width>=44&&button.height>=44,'undersized phone control: '+button.id);
    assert.ok(button.top>=rail.footerTop-1&&button.bottom<=rail.footerBottom+1,
      'mobile control collides with footer: '+button.id);
  }
  const closedColors=await page.evaluate(()=>{
    const bg=id=>getComputedStyle(document.getElementById(id)).backgroundImage;
    return {pause:bg('togglePause'),sound:bg('sound'),more:bg('mobileMoreControls')};
  });
  assert.notEqual(closedColors.sound,closedColors.pause,
    'SOUND must not inherit the highlighted PAUSE style while disabled');
  assert.notEqual(closedColors.more,closedColors.pause,
    'closed MORE must not look like the highlighted PAUSE action');
  await page.locator('#mobileMoreControls').click();
  assert.equal(await page.locator('#mobileMoreControls').getAttribute('aria-expanded'),'true');
  const openMoreColor=await page.locator('#mobileMoreControls').evaluate(el=>getComputedStyle(el).backgroundImage);
  assert.notEqual(openMoreColor,closedColors.more,'MORE visual state must change only when opened');
  for(const id of ['sound','focus','rosterToggle'])
    assert.equal(await page.locator('#'+id).isVisible(),true,'secondary action must remain accessible: '+id);
  await page.screenshot({path:root+'mobile-more-controls.png'});
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#mobileMoreControls').getAttribute('aria-expanded'),'false');
  assert.equal(await page.locator('#sound').isVisible(),false);
  report.checks.mobileCommandRail=true;

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
  // Compact crisis warning must retain a readable 3D phone playfield.
  await page.goto('http://127.0.0.1:4177/web/3d.html?scenario=large-horde&freeze=1',{waitUntil:'load'});
  await page.waitForFunction(()=>document.querySelector('#alertBanner')?.hidden===false,{timeout:12000});
  const warning=await page.locator('#alertBanner').evaluate(el=>{
    const r=el.getBoundingClientRect();
    const s=document.querySelector('.mobileOverview').getBoundingClientRect();
    return {height:r.height,width:r.width,top:r.top,bottom:r.bottom,
      summaryBottom:s.bottom,visible:!el.hidden,
      titleSize:parseFloat(getComputedStyle(document.querySelector('#alertLabel')).fontSize),
      detailSize:parseFloat(getComputedStyle(document.querySelector('#alertDetail')).fontSize)};
  });
  assert.equal(warning.visible,true);
  assert.ok(warning.height>=32&&warning.height<=42,'mobile alert must use two compact lines');
  assert.ok(warning.top>=warning.summaryBottom+2,'warning overlaps survival vitals');
  assert.ok(warning.bottom<=155,'warning obscures the phone action after compact masthead');
  assert.ok(warning.width<=390,'mobile warning overflows phone width');
  assert.ok(warning.titleSize>=10&&warning.detailSize>=11,'warning typography too small');
  await page.screenshot({path:root+'mobile-critical-alert.png',animations:'disabled'});
  report.checks.mobileCriticalAlertViewport=true;
  await page.goto('http://127.0.0.1:4177/web/3d.html?scenario=failure&restartMs=750',{waitUntil:'load'});
  await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.includes('RUN 2'),{timeout:15000});
  assert.match(await page.locator('#status').textContent(),/RUN 2/);
  report.checks.unattendedRestart=true;
  await page.goto('http://127.0.0.1:4177/web/progress.html',{waitUntil:'load'});
  await page.frameLocator('iframe').locator('#scene').waitFor();
  assert.equal(await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.name.includes('api.github.com')).length),0,
    'local progress page must not make a GitHub API request');
  report.checks.localProgressOfflineSafe=true;
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
