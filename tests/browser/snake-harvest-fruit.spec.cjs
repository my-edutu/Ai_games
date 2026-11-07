'use strict';
const {stripR52Canopy}=require('../helpers/snake-r52-canopy-archive.cjs');
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {stripR44Fruit}=require('../helpers/snake-fruit-archive.cjs');
const {stripR50Stone}=require('../helpers/snake-stone-archive.cjs');
test.use({trace:'off',video:'off',launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}});
const root=path.resolve(__dirname,'../..');
const artifact=n=>{const d=path.join(root,'artifacts/phase3');fs.mkdirSync(d,{recursive:true});return path.join(d,n);};
const gitBlob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
test('R44 genuine Chromium/WebGL sculpted food vs prior, same synthetic public frame both cameras',async({browser,baseURL})=>{
  test.setTimeout(150000);
  const source=fs.readFileSync(path.join(root,'public/snake-stream/world.mjs'),'utf8'),old=stripR44Fruit(source);
  expect(gitBlob(stripR52Canopy(stripR50Stone(old)))).toBe('41f8b168bb765af04b4f893fdd44d80cbca1250b');
  const frame=JSON.parse(fs.readFileSync(path.join(root,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
  frame.snapshot.dangerLevel=0;frame.snapshot.food={...frame.snapshot.food,cell:251,kind:'normal'};
  const frozen=JSON.stringify(frame),result={};
  for(const mode of ['overview','detail']){
    result[mode]={};
    for(const [label,worldSource] of [['before',old],['after',source]]){
      const page=await browser.newPage({viewport:{width:960,height:640},reducedMotion:'reduce'});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      try{
        await page.route('**/snapshot',route=>route.fulfill({json:frame}));
        if(label==='before')await page.route('**/world.mjs',route=>route.fulfill({contentType:'text/javascript',body:worldSource}));
        await page.goto(baseURL+'/?camera='+mode+'&quality=low',{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.__snakePresentation?.stats().frameCount>=4);
        const details=await page.evaluate(()=>({stats:window.__snakePresentation.stats(),
          glError:document.getElementById('game').getContext('webgl2').getError()}));
        expect(details.stats.renderer).toBe('webgl');expect(details.stats.cameraMode).toBe(mode);
        expect(details.stats.world.staticMeshes).toBe(13);expect(details.stats.world.textures).toBe(4);
        expect(details.glError).toBe(0);expect(errors).toEqual([]);
        const png=await page.screenshot({path:artifact('snake-r44-harvest-'+mode+'-'+label+'-synthetic.png')});
        expect(png.length).toBeGreaterThan(10000);
        result[mode][label]={png,stats:details.stats};
      }finally{await page.close();}
    }
    for(const key of ['staticMeshes','staticInstances','drawObjects','geometries','materials','textures'])
      expect(result[mode].before.stats.world[key]).toBe(result[mode].after.stats.world[key]);
    expect(result[mode].after.stats.drawCalls).toBe(result[mode].before.stats.drawCalls);
    console.log('SNAKE_R44_HARVEST_WEBGL',JSON.stringify({mode,synthetic:true,foodCell:251,
      changed:!result[mode].before.png.equals(result[mode].after.png),
      beforeSha256:crypto.createHash('sha256').update(result[mode].before.png).digest('hex'),
      afterSha256:crypto.createHash('sha256').update(result[mode].after.png).digest('hex'),
      draws:result[mode].after.stats.drawCalls}));
  }
  expect(result.detail.before.png.equals(result.detail.after.png)).toBe(false);
  expect(JSON.stringify(frame)).toBe(frozen);
});
