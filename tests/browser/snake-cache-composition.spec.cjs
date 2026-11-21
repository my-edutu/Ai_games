'use strict';
const {historicalRendererGitBlob} = require('../helpers/snake-t1-living-archive.cjs');
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {restorePreR46}=require('../helpers/snake-r46-cache-archive.cjs');
test.use({trace:'off',video:'off',launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}});
const root=path.resolve(__dirname,'../..');
const evidence=name=>{const folder=path.join(root,'artifacts/phase3');fs.mkdirSync(folder,{recursive:true});return path.join(folder,name);};
const gitBlob = historicalRendererGitBlob;
test('R46 actual Chromium/WebGL cached depth/color one-pass vs exact prior in overview and detail',async({browser,baseURL})=>{
  test.setTimeout(170000);
  const current=fs.readFileSync(path.join(root,'public/snake-stream/renderer.mjs'),'utf8');
  const prior=restorePreR46(current);
  expect(gitBlob(prior)).toBe('126d5b5f387f4ad5f22b274bd26cd8b19bdcccd5');
  const frame=JSON.parse(fs.readFileSync(path.join(root,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
  const frozen=JSON.stringify(frame),rows=[],images={};
  const anchor='  renderer.info.autoReset = false;';
  const instrumentation="\n  // R46 test-only instrumentation; renderer.render calls are NOT actual FPS.\n  const nativeR46Render = renderer.render.bind(renderer);\n  let r46Passes = 0;\n  renderer.render = (...args) => { r46Passes++; return nativeR46Render(...args); };\n  window.__r46Passes = () => r46Passes;";
  function instrument(source){
    expect(source.split(anchor).length).toBe(2);
    // Freeze ONLY this historical WebGL A/B fixture's internal raster scale.
    // Real runner pacing and production adaptation remain unchanged. Without
    // this, different Chromium GPU scheduling yields different 3D backing
    // resolutions and false pixel diffs between the same two valid scenes.
    const initial='function applyQuality(pixelRatio = Math.min(window.devicePixelRatio || 1, 0.75)) {';
    const adaptive='let scaleAdjusted = false;';
    expect(source.split(initial).length).toBe(2);
    expect(source.split(adaptive).length).toBe(2);
    return source.replace(initial,'function applyQuality(pixelRatio = 0.4) {')
      .replace(adaptive,'let scaleAdjusted = true; // R46 synthetic A/B raster pinned')
      .replace(anchor,anchor+instrumentation);
  }
  for(const camera of ['overview','detail']){
    images[camera]={};
    for(const [variant,source] of [['prior',prior],['current',current]]){
      const page=await browser.newPage({viewport:{width:960,height:640},reducedMotion:'reduce'});
      const errors=[];page.on('pageerror',error=>errors.push(error.message));
      try{
        await page.route('**/snapshot',route=>route.fulfill({json:frame}));
        await page.route('**/renderer.mjs',route=>route.fulfill({contentType:'text/javascript',body:instrument(source)}));
        await page.goto(baseURL+'/?camera='+camera+'&quality=low',{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.__snakePresentation?.stats().frameCount>=24);
        if(camera==='overview') await page.waitForFunction(()=>window.__snakePresentation.stats().staticCache.hits>=8);
        const begin=await page.evaluate(()=>({stats:window.__snakePresentation.stats(),calls:window.__r46Passes()}));
        await page.waitForFunction(n=>window.__snakePresentation.stats().frameCount>=n+3,begin.stats.frameCount);
        const end=await page.evaluate(()=>({stats:window.__snakePresentation.stats(),calls:window.__r46Passes(),
          glError:document.getElementById('game').getContext('webgl2').getError()}));
        expect(end.stats.renderer).toBe('webgl');
        expect(end.stats.cameraMode).toBe(camera);
        expect(end.stats.serpent.paths).toBeGreaterThan(0);
        expect(end.stats.pixelRatio).toBeCloseTo(0.4,7);
        expect(end.stats.renderScale.adjusted).toBe(true);
        expect(end.glError).toBe(0);
        expect(errors).toEqual([]);
        if(camera==='overview'){
          expect(end.stats.staticCache.active).toBe(true);
          expect(end.stats.staticCache.builds).toBe(begin.stats.staticCache.builds);
          expect(end.calls-begin.calls).toBe((end.stats.frameCount-begin.stats.frameCount)*(variant==='prior'?2:1));
        }
        const png=await page.screenshot({path:evidence('snake-r46-'+camera+'-'+variant+'-webgl-synthetic.png')});
        expect(png.length).toBeGreaterThan(10000);
        images[camera][variant]=png;
        rows.push({camera,variant,pngSha256:crypto.createHash('sha256').update(png).digest('hex'),
          scenePasses:end.calls-begin.calls,actualSubmittedDraws:end.stats.frameCount-begin.stats.frameCount,
          pixelRatio:end.stats.pixelRatio,drawingBuffer:end.stats.drawingBuffer,
          staticCache:end.stats.staticCache,drawCalls:end.stats.drawCalls,triangles:end.stats.triangles,
          world:end.stats.world,serpent:end.stats.serpent,glError:end.glError});
      }finally{await page.close();}
    }
    expect(images[camera].prior.equals(images[camera].current)).toBe(true);
  }
  fs.writeFileSync(evidence('snake-r46-source-true-webgl.json'),JSON.stringify({
    priorRendererGitBlob:'126d5b5f387f4ad5f22b274bd26cd8b19bdcccd5',
    syntheticPublicFixture:true,actualWebglCaptures:true,
    notActualLivePacingGate:true,notDisplayPresentFPS:true,notIndependentVisualReview:true,rows
  },null,2)+'\n');
  expect(JSON.stringify(frame)).toBe(frozen);
});
