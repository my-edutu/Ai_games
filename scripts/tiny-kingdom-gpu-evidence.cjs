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
