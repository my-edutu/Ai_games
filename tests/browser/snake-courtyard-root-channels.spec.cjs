'use strict';
const {stripR52Canopy} = require('../helpers/snake-r52-canopy-archive.cjs');
const {stripR50Stone} = require('../helpers/snake-stone-archive.cjs');
const { stripR44Fruit } = require('../helpers/snake-fruit-archive.cjs');
const { restorePreR42Water, applyR42Water } = require('../helpers/snake-water-flow-archive.cjs');
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
test.use({launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}});
const repo = path.resolve(__dirname,'../..');
const begin='      // BEGIN R41 COURTYARD ROOT CHANNELS\n',end='      // END R41 COURTYARD ROOT CHANNELS\n';
const blob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
const artifact=name=>{const dir=path.join(repo,'artifacts/phase3');fs.mkdirSync(dir,{recursive:true});return path.join(dir,name);};
test('R41 real WebGL original 3D courtyard A/B: same public frame, overview, detail, scene budget',async({browser,baseURL})=>{
  test.setTimeout(120000);
  const src=fs.readFileSync(path.join(repo,'public/snake-stream/world.mjs'),'utf8');
  const a=src.indexOf(begin),b=src.indexOf(end);
  expect(a).toBeGreaterThan(-1);expect(b).toBeGreaterThan(a);
  const old=src.slice(0,a)+src.slice(b+end.length);
  expect(blob(stripR52Canopy(stripR50Stone(restorePreR42Water(stripR44Fruit(old)))))).toBe('6a4c53673b8ef922ce2363f7c899760c06358b5f');
  const frame=JSON.parse(fs.readFileSync(path.join(repo,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
  const immutable=JSON.stringify(frame),captured={};
  for(const mode of ['overview','detail']){
    captured[mode]={};
    for(const [label,worldSource] of [['before',old],['after',src]]){
      const page=await browser.newPage({viewport:{width:960,height:640},reducedMotion:'reduce'});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      try{
        await page.route('**/snapshot',route=>route.fulfill({json:frame}));
        if(label==='before')await page.route('**/world.mjs',route=>route.fulfill({contentType:'text/javascript',body:worldSource}));
        await page.goto(baseURL+'/?camera='+mode+'&quality=low',{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.__snakePresentation?.stats().frameCount>=3);
        const result=await page.evaluate(()=>({stats:window.__snakePresentation.stats(),glError:document.getElementById('game').getContext('webgl2').getError()}));
        expect(result.stats.renderer).toBe('webgl');expect(result.stats.cameraMode).toBe(mode);
        expect(result.stats.world.staticMeshes).toBe(13);expect(result.stats.world.textures).toBe(4);
        expect(result.glError).toBe(0);expect(errors).toEqual([]);
        const png=await page.screenshot({path:artifact('snake-r41-drainage-'+mode+'-'+label+'-synthetic.png')});
        captured[mode][label]={png,stats:result.stats};
      }finally{await page.close();}
    }
    for(const key of ['staticMeshes','staticInstances','drawObjects','geometries','materials','textures'])
      expect(captured[mode].after.stats.world[key]).toBe(captured[mode].before.stats.world[key]);
    console.log('SNAKE_R41_WEBGL',JSON.stringify({mode,synthetic:true,changed:!captured[mode].before.png.equals(captured[mode].after.png),
      beforePngSha256:crypto.createHash('sha256').update(captured[mode].before.png).digest('hex'),
      afterPngSha256:crypto.createHash('sha256').update(captured[mode].after.png).digest('hex'),
      drawCalls:[captured[mode].before.stats.drawCalls,captured[mode].after.stats.drawCalls]}));
  }
  expect(captured.overview.before.png.equals(captured.overview.after.png)).toBe(false);
  expect(JSON.stringify(frame)).toBe(immutable);
});
