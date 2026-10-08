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
    try {
      await page.waitForFunction(()=>Boolean(window.__tinyKingdom),{timeout:10000});
    } catch (error) {
      // The shader/program compilation exception previously hid behind a generic
      // waitForFunction timeout. Preserve pageerrors to expose actual root cause.
      await page.screenshot({path:path.join(out,'bootstrap-failure.png'),fullPage:true,timeout:90000}).catch(()=>{});
      throw Error('Browser bootstrap failed: '+errors.join(' | ')+'; '+String(error.message));
    }
    // In CI, SwiftShader is a software Vulkan/GL implementation and the shader
    // executes millions of procedural noise instructions per HD screenshot.
    // Throttle pixel count and scene updates before the first capture.
    const softwareRendererRenderBudget=await page.evaluate(()=>{
      const game=window.__tinyKingdom;
      const tier=game.renderQuality();
      if(tier.tier!=='hardware-webgl')game.setRenderQuality(.55);
      return game.renderQuality();
    });
    await page.waitForTimeout(1200);
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

    evidence.materials=await page.evaluate(()=>window.__tinyKingdom.getMaterialSystem());
    evidence.materialVertexAttribute=await page.evaluate(()=>{
      const gl=document.getElementById('world').getContext('webgl');
      if(!gl)return -1;
      const program=gl.getParameter(gl.CURRENT_PROGRAM);
      return program?gl.getAttribLocation(program,'materialId'):-1;
    });
    if(evidence.webglVerified&&evidence.materialVertexAttribute<0)throw Error('GPU material attribute was optimized away or omitted');
    if(evidence.materials.vertexStride!==10||evidence.materials.materials.length!==8)
      throw Error('GPU material layout mismatch');
    // GPU static vertex upload invariant: camera motion must never re-upload
    // dense terrain and village meshes; only moving agents update per frame.
    evidence.staticGPU=await page.evaluate(()=>window.__tinyKingdom.renderStats());
    await page.evaluate(()=>window.__tinyKingdom.setCamera({zoom:24,pitch:.51,yaw:.82,focus:[0,0]}));
    await page.waitForTimeout(450);
    evidence.staticGPUAfterCamera=await page.evaluate(()=>window.__tinyKingdom.renderStats());
    if(evidence.webglVerified){
      if(!evidence.staticGPU.dualBufferGPU||evidence.staticGPU.staticGpuUploads<1)
        throw Error('Static GPU vertex buffer was not uploaded');
      if(evidence.staticGPUAfterCamera.staticGpuUploads!==evidence.staticGPU.staticGpuUploads)
        throw Error('Moving camera re-uploaded static world');
    }
    evidence.renderBudget=softwareRendererRenderBudget;
    evidence.errors=errors;
    await page.screenshot({path:path.join(out,'day1.png'),fullPage:true,timeout:90000});
    // Matched camera framing and a deterministic later-day sample are essential
    // to distinguish lighting/geometry progress from a fortunate opening frame.
    await page.evaluate(() => {
      const g=window.__tinyKingdom;
      g.setCamera({zoom:14,pitch:0.43,focus:[0,-1]});
    });
    await page.waitForTimeout(300);
    await page.screenshot({path:path.join(out,'settlement-close.png'),fullPage:true,timeout:90000});
    const replay=await page.evaluate(() => {
      const g=window.__tinyKingdom;
      g.reset();
      for(let i=0;i<10*24*30;i++)g.step(1/30);
      return {metrics:g.metrics(),snapshot:JSON.stringify(g.exportSnapshot())};
    });
    await page.waitForTimeout(300);
    await page.screenshot({path:path.join(out,'day11-close.png'),fullPage:true,timeout:90000});
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
      await page.screenshot({path:path.join(out,shot.name),fullPage:true,timeout:90000});
    }
    await page.setViewportSize({width:390,height:844});
    await page.waitForTimeout(300);
    evidence.mobileViewport=await page.evaluate(()=>({
      clientWidth:document.documentElement.clientWidth,
      scrollWidth:document.documentElement.scrollWidth,
      tourWidth:document.querySelector('.world-tour').getBoundingClientRect().width,
    }));
    await page.screenshot({path:path.join(out,'mobile-sanctuary.png'),fullPage:true,timeout:90000});
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
