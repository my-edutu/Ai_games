'use strict';
const { restorePreR45 } = require('../helpers/snake-r45-archive.cjs');
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
test.use({launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}});
const repo=path.resolve(__dirname,'../..');
const blocks=/^[ \t]*\/\/ BEGIN R37 [^\n]*\n[\s\S]*?^[ \t]*\/\/ END R37 [^\n]*\n/gm;
const r39Blocks=/^[ \t]*\/\/ BEGIN R39 [^\n]*\n[\s\S]*?^[ \t]*\/\/ END R39 [^\n]*\n/gm;
const blob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
const evidence=name=>{const dir=path.join(repo,'artifacts/phase3');fs.mkdirSync(dir,{recursive:true});return path.join(dir,name);};
test('real Chromium WebGL: articulated upper lids cover original eye during fixed synthetic blink without extra GPU resources',async({browser,baseURL})=>{
  test.setTimeout(130000);
  const frame=JSON.parse(fs.readFileSync(path.join(repo,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
  // Synthetic controlled eye-capture, NOT normal live gameplay/actual screen FPS.
  frame.snapshot.dangerLevel=0;
  const saved=JSON.stringify(frame);
  const current=fs.readFileSync(path.join(repo,'public/snake-stream/serpent.mjs'),'utf8');
  const old=current.replace(blocks,'');
  expect((current.match(r39Blocks) || []).length).toBe(3);
  expect((current.match(blocks)||[]).length).toBe(2);
  expect(blob(restorePreR45(old.replace(r39Blocks, '')))).toBe('636d51031c6e3f1b6d304d66ab2a34534f9fe506');
  const renderer=fs.readFileSync(path.join(repo,'public/snake-stream/renderer.mjs'),'utf8');
  const anchor='    const time = timestamp / 1000;';
  expect(renderer.split(anchor).length).toBe(2);
  const peakRenderer=renderer.replace(anchor,'    const time = 2.67; // R37 synthetic fixed blink clock, not production');
  const captures={};
  for(const mode of ['detail','overview']){
    captures[mode]={};
    for(const [label,source] of [['before',old],['after',current]]){
      const page=await browser.newPage({viewport:{width:960,height:640},reducedMotion:'no-preference'});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      try{
        await page.route('**/snapshot',route=>route.fulfill({json:frame}));
        await page.route('**/renderer.mjs',route=>route.fulfill({contentType:'text/javascript',body:peakRenderer}));
        if(label==='before') await page.route('**/serpent.mjs',route=>route.fulfill({contentType:'text/javascript',body:source}));
        await page.goto(baseURL+'/?camera='+mode+'&quality=low',{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.__snakePresentation?.stats().frameCount>=5);
        const state=await page.evaluate(()=>({stats:window.__snakePresentation.stats(),
          glError:document.getElementById('game').getContext('webgl2').getError()}));
        expect(state.stats.renderer).toBe('webgl');
        expect(state.stats.cameraMode).toBe(mode);
        expect(state.stats.serpent.paths).toBeGreaterThan(0);
        expect(state.glError).toBe(0);
        expect(errors).toEqual([]);
        const png=await page.screenshot({path:evidence('snake-r37-lid-'+mode+'-'+label+'-synthetic.png')});
        captures[mode][label]={png,stats:state.stats};
      }finally{await page.close();}
    }
    for(const key of ['geometries','materials','textures','bodyVertices','bodyTriangles','bufferBytes','paths'])
      expect(captures[mode].after.stats.serpent[key]).toBe(captures[mode].before.stats.serpent[key]);
    for(const key of ['staticMeshes','textures','geometries','materials','drawObjects'])
      expect(captures[mode].after.stats.world[key]).toBe(captures[mode].before.stats.world[key]);
  }
  expect(Buffer.compare(captures.detail.before.png,captures.detail.after.png)).not.toBe(0);
  fs.writeFileSync(evidence('snake-r37-lid-capture-meta.json'),JSON.stringify({
    syntheticClockSeconds:2.67,neutralPublicDanger:true,controlledRealChromiumWebGL:true,
    priorGitBlob:'636d51031c6e3f1b6d304d66ab2a34534f9fe506',
    verdict:'localized character gesture only; whole-game visual/actual-submission gate remain open',
    resourcesPreserved:true,notActualLiveGameplay:true,notDisplayPresentFps:true
  },null,2)+'\n');
  expect(JSON.stringify(frame)).toBe(saved);
});
