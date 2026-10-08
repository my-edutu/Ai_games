'use strict';
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const out = path.resolve('artifacts/tiny-kingdom');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
  const page = await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  let evidence={errors,webglVerified:false};
  try {
    await page.goto('file://'+path.resolve('public/tiny-kingdom/index.html'),{waitUntil:'load',timeout:30000});
    await page.waitForFunction(()=>Boolean(window.__tinyKingdom),{timeout:20000});
    await page.waitForTimeout(1400);
    evidence = await page.evaluate(() => {
      const canvases=[...document.querySelectorAll('canvas')];
      const contexts=canvases.map(c=>{
        // Querying an existing renderer canvas for WebGL is safe only when the engine
        // has already created it; never count a newly allocated probe canvas.
        const gl=c.getContext('webgl2')||c.getContext('webgl');
        if(!gl)return {webgl:false,width:c.width,height:c.height};
        const ext=gl.getExtension('WEBGL_debug_renderer_info');
        return {webgl:true,width:c.width,height:c.height,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unavailable'};
      });
      return {contexts,metrics:window.__tinyKingdom.metrics(),webglVerified:contexts.some(x=>x.webgl)};
    });
    evidence.errors=errors;
    await page.screenshot({path:path.join(out,'day1.png'),fullPage:true});
    // Matched camera framing and a deterministic later-day sample are essential
    // to distinguish lighting/geometry progress from a fortunate opening frame.
    await page.evaluate(() => {
      const g=window.__tinyKingdom;
      g.setCamera({zoom:14,pitch:0.43,focus:[0,-1]});
    });
    await page.waitForTimeout(300);
    await page.screenshot({path:path.join(out,'settlement-close.png'),fullPage:true});
    const replay=await page.evaluate(() => {
      const g=window.__tinyKingdom;
      g.reset();
      for(let i=0;i<10*24*30;i++)g.step(1/30);
      return {metrics:g.metrics(),snapshot:JSON.stringify(g.exportSnapshot())};
    });
    await page.waitForTimeout(300);
    await page.screenshot({path:path.join(out,'day11-close.png'),fullPage:true});
    const second=await page.evaluate(() => {
      const g=window.__tinyKingdom;
      g.reset();
      for(let i=0;i<10*24*30;i++)g.step(1/30);
      return JSON.stringify(g.exportSnapshot());
    });
    // Inspect both original high-detail civic landmarks at fixed, repeatable cameras.
    // These are real browser captures, not authored screenshot mockups.
    evidence.landmarks=await page.evaluate(()=>window.__tinyKingdom.getScenicSites());
    for(const shot of [
      {name:'sanctuary-landmark.png',camera:{focus:[29,10],yaw:.75,pitch:.48,zoom:27}},
      {name:'stone-bridge.png',camera:{focus:[-6,18.1],yaw:.84,pitch:.64,zoom:26}},
    ]){
      await page.evaluate(camera=>window.__tinyKingdom.setCamera(camera),shot.camera);
      await page.waitForTimeout(400);
      await page.screenshot({path:path.join(out,shot.name),fullPage:true});
    }
    await page.setViewportSize({width:390,height:844});
    await page.waitForTimeout(300);
    evidence.mobileViewport=await page.evaluate(()=>({
      clientWidth:document.documentElement.clientWidth,
      scrollWidth:document.documentElement.scrollWidth,
      tourWidth:document.querySelector('.world-tour').getBoundingClientRect().width,
    }));
    await page.screenshot({path:path.join(out,'mobile-sanctuary.png'),fullPage:true});
    if(evidence.mobileViewport.scrollWidth>evidence.mobileViewport.clientWidth+1)
      throw Error('Mobile visual regression: horizontal page overflow');
    evidence.day11=replay.metrics;
    evidence.tenDayReplayIdentical=(replay.snapshot===second);
    if(!evidence.tenDayReplayIdentical)throw Error('10-day replay mismatch');
    if(!evidence.webglVerified)throw Error('No existing game canvas provides WebGL; evidence is not a WebGL capture');
    if(errors.length)throw Error('Uncaught page errors: '+errors.join('; '));
  } catch (error) {
    evidence.failure=String(error.stack||error);
    throw error;
  } finally {
    fs.writeFileSync(path.join(out,'evidence.json'),JSON.stringify(evidence,null,2));
    await browser.close();
  }
})().catch(e=>{console.error(e);process.exitCode=1});
