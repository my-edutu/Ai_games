'use strict';
const {historicalRendererGitBlob} = require('../helpers/snake-t1-living-archive.cjs');
const { test, expect } = require('@playwright/test');
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { stripR51Adaptive } = require('../helpers/snake-r51-adaptive-archive.cjs');
test.use({ trace:'off', video:'off',
  launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']} });
const root = path.resolve(__dirname,'../..');
const blob = historicalRendererGitBlob;
const artifact = name => { const dir=path.join(root,'artifacts/phase3');fs.mkdirSync(dir,{recursive:true});return path.join(dir,name); };

test('R51 actual Chromium/WebGL checks bounded-raster rescue readability and exact-source parity', async ({ browser, baseURL }) => {
  test.setTimeout(180000);
  const current = fs.readFileSync(path.join(root,'public/snake-stream/renderer.mjs'),'utf8');
  const parent = stripR51Adaptive(current);
  expect(blob(parent)).toBe('01b67f66c6212d4d416013558650965420e77b93');
  expect(stripR51Adaptive(parent)).toBe(parent);
  const frame = JSON.parse(fs.readFileSync(path.join(root,
    'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
  frame.snapshot.dangerLevel = 0;
  const frozen = JSON.stringify(frame);
  // This is a frozen-public visual consequence test, not the live performance
  // gate. Both source versions keep identical clocks/ratios in the control.
  function pin(source, ratio) {
    const initial = 'function applyQuality(pixelRatio = Math.min(window.devicePixelRatio || 1, 0.75)) {';
    const adaptive = 'let scaleAdjusted = false;';
    const clock = '    const time = timestamp / 1000;';
    for (const anchor of [initial,adaptive,clock]) expect(source.split(anchor)).toHaveLength(2);
    let pinned = source.replace(initial, 'function applyQuality(pixelRatio = '+ratio+') {')
      .replace(adaptive, 'let scaleAdjusted = true; // R51 synthetic raster control')
      .replace(clock, '    const time = 1.5; // R51 frozen-public visual control');
    const state = 'let rescueSettled = false, rescueSampleMs = 0;';
    if (pinned.includes(state)) pinned=pinned.replace(state,
      'let rescueSettled = true, rescueSampleMs = 0; // R51 synthetic visual control');
    return pinned;
  }
  const variants = [
    {name:'r50-control-053',source:parent,ratio:.53,viewport:{width:960,height:640}},
    {name:'r51-control-053',source:current,ratio:.53,viewport:{width:960,height:640}},
    {name:'r51-rescue-040',source:current,ratio:.4,viewport:{width:960,height:640}},
    {name:'r51-rescue-portrait-040',source:current,ratio:.4,viewport:{width:390,height:844}},
  ];
  const captured = {},rows = [];
  for (const variant of variants) {
    const page = await browser.newPage({viewport:variant.viewport,reducedMotion:'reduce'});
    const errors=[];page.on('pageerror', error=>errors.push(error.message));
    try {
      await page.route('**/snapshot',route=>route.fulfill({json:frame}));
      await page.route('**/renderer.mjs',route=>route.fulfill({
        contentType:'text/javascript',body:pin(variant.source,variant.ratio)}));
      await page.goto(baseURL+'/?quality=low&camera=overview',{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>window.__snakePresentation?.stats().frameCount>=8);
      const data = await page.evaluate(()=>({
        stats:window.__snakePresentation.stats(),
        caption:document.querySelector('#caption')?.textContent?.trim()||'',
        horizontalOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,
        glError:document.getElementById('game').getContext('webgl2').getError(),
      }));
      expect(data.stats.renderer).toBe('webgl');
      expect(data.stats.pixelRatio).toBeCloseTo(variant.ratio,7);
      expect(data.stats.serpent.bodyRings).toBeGreaterThan(2);
      expect(data.stats.world.hazards).toBeGreaterThan(0);
      expect(data.stats.world.portalEnds).toBeGreaterThan(0);
      expect(data.caption.length).toBeGreaterThan(10);
      expect(data.horizontalOverflow).toBe(false);
      expect(data.glError).toBe(0);expect(errors).toEqual([]);
      const png=await page.screenshot({path:artifact('snake-r51-'+variant.name+'-real-webgl-synthetic.png')});
      expect(png.length).toBeGreaterThan(10000);
      captured[variant.name]={png,stats:data.stats};
      rows.push({variant:variant.name,viewport:variant.viewport,actualWebgl:true,
        syntheticPublic:true,pngSha256:crypto.createHash('sha256').update(png).digest('hex'),
        pixelRatio:data.stats.pixelRatio,drawingBuffer:data.stats.drawingBuffer,
        drawCalls:data.stats.drawCalls,triangles:data.stats.triangles,
        world:data.stats.world,serpent:data.stats.serpent,
        caption:data.caption,glError:data.glError,errors});
    } finally {await page.close();}
  }
  const a=captured['r50-control-053'],b=captured['r51-control-053'],c=captured['r51-rescue-040'];
  expect(a.png.equals(b.png)).toBe(true);
  expect(b.png.equals(c.png)).toBe(false);
  for (const target of [b,c]) {
    expect(target.stats.drawCalls).toBe(a.stats.drawCalls);
    expect(target.stats.triangles).toBe(a.stats.triangles);
    for (const key of ['geometries','materials','textures','staticMeshes','staticInstances'])
      expect(target.stats.world[key]).toBe(a.stats.world[key]);
  }
  expect(JSON.stringify(frame)).toBe(frozen,'frozen authoritative public fixture remains untouched');
  fs.writeFileSync(artifact('snake-r51-adaptive-rescue-webgl.json'),JSON.stringify({
    priorRendererGitBlob:blob(parent),sameRatioPixelParityRequired:true,
    screenshots:rows.length,realChromiumWebgl:true,frozenSyntheticSnapshot:true,
    notActualLiveCadence:true,notDevicePresentFps:true,notIndependentVisualReview:true,
    performanceGateUnchangedMinimumActualSubmissions:17,rows
  },null,2)+'\n');
  console.log('SNAKE_R51_WEBGL',JSON.stringify({sameSourceRatioExactPixels:true,
    lowRatioCaptured:true,portraitCaptured:true,strictGateUntouched:true}));
});
