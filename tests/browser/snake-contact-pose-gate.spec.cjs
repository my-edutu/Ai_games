'use strict';
const {historicalRendererGitBlob} = require('../helpers/snake-t1-living-archive.cjs');
const { test, expect } = require('@playwright/test');
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { stripR49Contact } = require('../helpers/snake-r49-contact-archive.cjs');
test.use({trace:'off',video:'off',launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}});
const root = path.resolve(__dirname,'../..');
const hash = historicalRendererGitBlob;
const artifact = name => { const dir=path.join(root,'artifacts/phase3');fs.mkdirSync(dir,{recursive:true});return path.join(dir,name); };
test('R49 real Chromium/WebGL unchanged contact pose avoids repeat uploads with exact original pixels', async ({browser,baseURL}) => {
  test.setTimeout(170000);
  const current = fs.readFileSync(path.join(root,'public/snake-stream/renderer.mjs'),'utf8');
  const original = stripR49Contact(current);
  expect(hash(original)).toBe('ab6c17109846f1c607a6d1be0e936d4efb87ff8a');
  // Only the synthetic A/B is frozen: production adaptive resolution, motion
  // clock and the strict >=17 submitted-render gate remain untouched.
  function pin(source) {
    for(const anchor of [
      'function applyQuality(pixelRatio = Math.min(window.devicePixelRatio || 1, 0.75)) {',
      'let scaleAdjusted = false;',
      '    const time = timestamp / 1000;',
    ]) expect(source.split(anchor)).toHaveLength(2);
    return source.replace('function applyQuality(pixelRatio = Math.min(window.devicePixelRatio || 1, 0.75)) {',
      'function applyQuality(pixelRatio = 0.4) {')
      .replace('let scaleAdjusted = false;', 'let scaleAdjusted = true; // R49 frozen-public only')
      .replace('    const time = timestamp / 1000;', '    const time = 1.5; // R49 frozen-public only');
  }
  const frame = JSON.parse(fs.readFileSync(path.join(root,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
  frame.snapshot.dangerLevel = 0;
  const frozen = JSON.stringify(frame), rows = [];
  for(const mode of ['overview','detail']) {
    const captures = {};
    for(const [label,source] of [['before',original],['after',current]]) {
      const page = await browser.newPage({viewport:{width:960,height:640},reducedMotion:'reduce'});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      try {
        await page.route('**/snapshot',route=>route.fulfill({json:frame}));
        await page.route('**/renderer.mjs',route=>route.fulfill({contentType:'text/javascript',body:pin(source)}));
        await page.goto(baseURL+'/?camera='+mode+'&quality=low',{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.__snakePresentation?.stats().frameCount>=8);
        const state=await page.evaluate(()=>({stats:window.__snakePresentation.stats(),
          glError:document.getElementById('game').getContext('webgl2').getError()}));
        expect(state.stats.renderer).toBe('webgl');
        expect(state.stats.pixelRatio).toBeCloseTo(.4,7);
        expect(state.stats.cameraMode).toBe(mode);
        expect(state.stats.contactShadowUpload.instances).toBeGreaterThan(0);
        expect(state.stats.contactShadowUpload.accumulatedRequestedBytes).toBeGreaterThan(0);
        expect(state.glError).toBe(0);expect(errors).toEqual([]);
        const png=await page.screenshot({path:artifact('snake-r49-stable-contact-'+mode+'-'+label+'-synthetic.png')});
        captures[label]={png,stats:state.stats};
        rows.push({mode,label,actualWebgl:true,syntheticFrozenPublic:true,
          pngSha256:crypto.createHash('sha256').update(png).digest('hex'),
          actualSubmittedAtCapture:state.stats.frameCount,contactShadowUpload:state.stats.contactShadowUpload,
          drawCalls:state.stats.drawCalls,triangles:state.stats.triangles,world:state.stats.world,
          serpent:state.stats.serpent,pixelRatio:state.stats.pixelRatio,glError:state.glError});
      }finally {await page.close();}
    }
    expect(captures.before.stats.contactShadowUpload.requestedSubrangeBytes)
      .toBe(captures.before.stats.contactShadowUpload.instances*64);
    expect(captures.after.stats.contactShadowUpload.requestedSubrangeBytes).toBe(0);
    expect(captures.before.stats.drawCalls).toBe(captures.after.stats.drawCalls);
    expect(captures.before.stats.triangles).toBe(captures.after.stats.triangles);
    for(const key of ['geometries','materials','textures','drawObjects','staticMeshes'])
      expect(captures.before.stats.world[key]).toBe(captures.after.stats.world[key]);
    expect(captures.before.png.equals(captures.after.png)).toBe(true);
  }
  expect(JSON.stringify(frame)).toBe(frozen);
  fs.writeFileSync(artifact('snake-r49-contact-pose-actual-webgl.json'),JSON.stringify({
    originalGitBlob:hash(original),realWebgl:true,frozenSyntheticSnapshot:true,
    originalPixelParityRequired:true,notLiveCadence:true,notDevicePresentFps:true,notCausalSpeedup:true,
    independentCritic:false,rows},null,2)+'\n');
  console.log('SNAKE_R49_WEBGL',JSON.stringify({oldGitBlob:hash(original),pixelParityBothCameras:true,
    duplicateUploadSkipped:true,notLiveCadence:true,notDisplayPresentFps:true}));
});
