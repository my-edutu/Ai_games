'use strict';
const {stripR52Canopy}=require('../helpers/snake-r52-canopy-archive.cjs');
const {stripR50Stone} = require('../helpers/snake-stone-archive.cjs');
const { stripR44Fruit } = require('../helpers/snake-fruit-archive.cjs');
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {restorePreR42Water}=require('../helpers/snake-water-flow-archive.cjs');
test.use({trace:'off',video:'off',launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}});
const repo=path.resolve(__dirname,'../..');
const output=name=>{const p=path.join(repo,'artifacts/phase3');fs.mkdirSync(p,{recursive:true});return path.join(p,name);};
const blob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
test('R42 actual Chromium WebGL old/new animated lake, same frozen public frame and GPU budget',async({browser,baseURL})=>{
  test.setTimeout(150000);
  const source=fs.readFileSync(path.join(repo,'public/snake-stream/world.mjs'),'utf8');
  const old=restorePreR42Water(source);
  expect(blob(stripR52Canopy(stripR50Stone(stripR44Fruit(old))))).toBe('95a533cb736030866ca0947328835b082909fa45');
  const frame=JSON.parse(fs.readFileSync(path.join(repo,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
  const frozen=JSON.stringify(frame),anchor='waterMaterial.uniforms.time.value=reducedMotion?0:time;';
  expect(source.split(anchor).length).toBe(2);
  const rows=[];
  for(const mode of ['overview','detail']){
    const captures={};
    for(const [label,world] of [['before',old],['after',source]]){
      const page=await browser.newPage({viewport:{width:960,height:640},reducedMotion:'reduce'});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      try{
        await page.route('**/snapshot',route=>route.fulfill({json:frame}));
        // Synthetic-only control holds other motion still and forces an identical
        // NONZERO animated water phase in both otherwise-real WebGL arms.
        const controlled=world.replace(anchor,'waterMaterial.uniforms.time.value=7.25; // R42 synthetic-only flow phase');
        await page.route('**/world.mjs',route=>route.fulfill({contentType:'text/javascript',body:controlled}));
        await page.goto(baseURL+'/?camera='+mode+'&quality=low',{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.__snakePresentation?.stats().frameCount>=4);
        const sample=await page.evaluate(()=>({stats:window.__snakePresentation.stats(),
          glError:document.getElementById('game').getContext('webgl2').getError()}));
        expect(sample.stats.renderer).toBe('webgl');expect(sample.stats.cameraMode).toBe(mode);
        expect(sample.stats.world.staticMeshes).toBe(13);expect(sample.stats.world.textures).toBe(4);
        expect(sample.glError).toBe(0);expect(errors).toEqual([]);
        const png=await page.screenshot({path:output('snake-r42-flow-'+mode+'-'+label+'-synthetic.png')});
        expect(png.length).toBeGreaterThan(10000);
        captures[label]={png,sample};
        rows.push({mode,label,pngSha256:crypto.createHash('sha256').update(png).digest('hex'),
          drawCalls:sample.stats.drawCalls,triangles:sample.stats.triangles,world:sample.stats.world});
      }finally{await page.close();}
    }
    for(const key of ['staticMeshes','staticInstances','geometries','materials','textures','drawObjects'])
      expect(captures.before.sample.stats.world[key]).toBe(captures.after.sample.stats.world[key]);
    expect(captures.before.sample.stats.drawCalls).toBe(captures.after.sample.stats.drawCalls);
    expect(captures.before.sample.stats.triangles).toBe(captures.after.sample.stats.triangles);
  }
  fs.writeFileSync(output('snake-r42-flow-actual-webgl.json'),JSON.stringify({
    originalWorldGitBlob:'95a533cb736030866ca0947328835b082909fa45',
    syntheticPublicFrame:true,syntheticWaterTime:7.25,notLiveGameplay:true,
    notRenderedFps:true,notDisplayPresentFps:true,notIndependentCritic:true,rows
  },null,2)+'\n');
  expect(JSON.stringify(frame)).toBe(frozen);
});
