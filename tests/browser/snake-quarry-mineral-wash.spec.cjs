'use strict';
const {stripR52Canopy} = require('../helpers/snake-r52-canopy-archive.cjs');
const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {stripR50Stone} = require('../helpers/snake-stone-archive.cjs');
test.use({launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}});
const root = path.resolve(__dirname, '../..');
const evidence = name => {
  const directory = path.join(root, 'artifacts/phase3');
  fs.mkdirSync(directory, {recursive:true});
  return path.join(directory,name);
};
const gitBlob = s => crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
test('R50 genuine Chromium/WebGL quarry-patina A/B: identical public game, two cameras and portrait resource budgets',async({browser,baseURL})=>{
  test.setTimeout(145000);
  const source = fs.readFileSync(path.join(root,'public/snake-stream/world.mjs'),'utf8');
  const prior = stripR50Stone(source);
  expect(gitBlob(stripR52Canopy(prior))).toBe('0be8970978500ff369bfd0c132ff42aec4bf913b');
  const frame = JSON.parse(fs.readFileSync(path.join(root,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
  const frozen = JSON.stringify(frame);
  const results = [];
  for (const [scene, mode, size] of [
    ['overview','overview',{width:960,height:640}],
    ['detail','detail',{width:960,height:640}],
    ['portrait','overview',{width:390,height:844}],
  ]) {
    const pairs={};
    for (const [label,body] of [['original',prior],['r50',source]]) {
      const page=await browser.newPage({viewport:size,reducedMotion:'reduce'});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      try {
        await page.route('**/snapshot',route=>route.fulfill({json:frame}));
        await page.route('**/world.mjs',route=>route.fulfill({contentType:'text/javascript',body}));
        await page.goto(baseURL+'/?camera='+mode+'&quality=low',{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.__snakePresentation?.stats().frameCount>=4);
        const current=await page.evaluate(()=>({
          stats:window.__snakePresentation.stats(),
          glError:document.getElementById('game').getContext('webgl2').getError(),
          width:document.documentElement.clientWidth,
          scroll:document.documentElement.scrollWidth,
          caption:document.getElementById('caption').textContent,
        }));
        expect(current.stats.renderer).toBe('webgl');
        expect(current.stats.cameraMode).toBe(mode);
        expect(current.stats.world.staticMeshes).toBe(13);
        expect(current.stats.world.textures).toBe(4);
        expect(current.glError).toBe(0);
        expect(current.scroll).toBe(current.width);
        expect(current.caption.length).toBeGreaterThan(1);
        expect(errors).toEqual([]);
        const image=await page.screenshot({path:evidence('snake-r50-quarry-'+scene+'-'+label+'-synthetic.png')});
        pairs[label]={image,current};
        results.push({scene,label,sha256:sha(image),bytes:image.length,
          drawCalls:current.stats.drawCalls,triangles:current.stats.triangles,
          geometries:current.stats.geometries,textures:current.stats.textures,
          staticInstances:current.stats.world.staticInstances,glError:current.glError});
      } finally {await page.close();}
    }
    for (const key of ['staticMeshes','staticInstances','geometries','materials','textures','drawObjects'])
      expect(pairs.r50.current.stats.world[key]).toBe(pairs.original.current.stats.world[key]);
    expect(pairs.r50.current.stats.drawCalls).toBe(pairs.original.current.stats.drawCalls);
    expect(pairs.r50.current.stats.triangles).toBe(pairs.original.current.stats.triangles);
    if(scene!=='portrait')expect(pairs.r50.image.equals(pairs.original.image)).toBe(false);
  }
  fs.writeFileSync(evidence('snake-r50-quarry-real-webgl.json'),JSON.stringify({
    fixedPublicFixture:true,realChromiumWebGL:true,notAutonomousFps:true,
    notDisplayPresentFps:true,notIndependentCritic:true,sourceOriginalBlob:gitBlob(prior),results,
  },null,2)+'\n');
  console.log('SNAKE_R50_REAL_WEBGL',JSON.stringify(results));
  expect(JSON.stringify(frame)).toBe(frozen);
});
