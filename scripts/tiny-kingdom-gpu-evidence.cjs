'use strict';
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const dir = path.resolve('artifacts/tiny-kingdom');
  fs.mkdirSync(dir, {recursive:true});
  const browser = await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
  const page = await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror', e=>errors.push(e.message));
  try {
    await page.goto('file://'+path.resolve('public/tiny-kingdom/index.html'),{waitUntil:'load',timeout:30000});
    await page.waitForFunction(()=>Boolean(window.__tinyKingdom),{timeout:20000});
    await page.waitForTimeout(1400);
    const result=await page.evaluate(()=>{
      const canvases=[...document.querySelectorAll('canvas')];
      return {webglContexts:canvases.map(c=>{
        const gl=c.getContext('webgl2')||c.getContext('webgl');
        if(!gl)return {webgl:false};
        const ext=gl.getExtension('WEBGL_debug_renderer_info');
        return {webgl:true,vendor:ext?gl.getParameter(ext.UNMASKED_VENDOR_WEBGL):null,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):null,width:c.width,height:c.height};
      }),metrics:window.__tinyKingdom.metrics()};
    });
    await page.screenshot({path:path.join(dir,'day1.png'),fullPage:true});
    fs.writeFileSync(path.join(dir,'evidence.json'),JSON.stringify({result,errors},null,2));
    if(!result.webglContexts.some(c=>c.webgl))throw Error('No WebGL context; screenshot is fallback, not GPU/WebGL evidence');
    if(errors.length)throw Error('Page errors: '+errors.join('; '));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
