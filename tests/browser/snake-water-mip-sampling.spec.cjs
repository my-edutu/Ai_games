'use strict';
const {historicalRendererGitBlob} = require('../helpers/snake-t1-living-archive.cjs');
const {test,expect}=require('@playwright/test');
const {restorePreR46}=require('../helpers/snake-r46-cache-archive.cjs');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
test.use({trace:'off',video:'off',launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}});
const root=path.resolve(__dirname,'../..');
const blob = historicalRendererGitBlob;
function predecessor(source){
  for(const name of ['WATER SAMPLING HELPER','WATER SAMPLING ADAPT','WATER SAMPLING INIT','WATER SAMPLING STATS']){
    const begin='// BEGIN R43 '+name+'\n',end='// END R43 '+name+'\n';
    const a=source.indexOf(begin),b=source.indexOf(end);
    expect(a).toBeGreaterThanOrEqual(0);expect(b).toBeGreaterThan(a);
    expect(source.indexOf(begin,a+1)).toBe(-1);
    source=source.slice(0,source.lastIndexOf('\n',a-1)+1)+source.slice(b+end.length);
  }
  return source;
}
function output(name){const p=path.join(root,'artifacts/phase3');fs.mkdirSync(p,{recursive:true});return path.join(p,name);}
test('R43 true Chromium WebGL prior/current low-tier original lake, frozen-public dual-view capture',async({browser,baseURL})=>{
  test.setTimeout(150000);
  const source=fs.readFileSync(path.join(root,'public/snake-stream/renderer.mjs'),'utf8');
  const old=predecessor(source);
  // Verify actual historical R43 blob by removing only later R46; compare both visuals with R46 unchanged.
  expect(blob(restorePreR46(old))).toBe('dce31f68dcc0a28b5792a502f6575e7939f6289d');
  const frame=JSON.parse(fs.readFileSync(path.join(root,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
  frame.snapshot.dangerLevel=0; // frozen SYNTHETIC public frame only, not a production override
  const frozen=JSON.stringify(frame),anchor='    const time = timestamp / 1000;';
  expect(source.split(anchor).length).toBe(2);
  const rows=[];
  for(const mode of ['overview','detail']){
    const captures={};
    for(const [label,variant] of [['before',old],['after',source]]){
      const page=await browser.newPage({viewport:{width:960,height:640},reducedMotion:'reduce'});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      try{
        await page.route('**/snapshot',route=>route.fulfill({json:frame}));
        await page.route('**/renderer.mjs',route=>route.fulfill({contentType:'text/javascript',
          body:variant.replace(anchor,'    const time = 0; // R43 synthetic-only fixed scene time')}));
        await page.goto(baseURL+'/?camera='+mode+'&quality=low',{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.__snakePresentation?.stats().frameCount>=5);
        const sample=await page.evaluate(async()=>({stats:window.__snakePresentation.stats(),
          mipNearest:(await import('/vendor/three.module.js')).LinearMipmapNearestFilter,
          glError:document.getElementById('game').getContext('webgl2').getError()}));
        expect(sample.stats.renderer).toBe('webgl');
        expect(sample.stats.cameraMode).toBe(mode);
        if(label==='after')expect(sample.stats.waterTextureMinFilter).toBe(sample.mipNearest);
        expect(sample.stats.world.textures).toBe(4);
        expect(sample.glError).toBe(0);expect(errors).toEqual([]);
        const png=await page.screenshot({path:output('snake-r43-water-mip-'+mode+'-'+label+'-synthetic.png')});
        expect(png.length).toBeGreaterThan(10000);
        captures[label]={png,sample};
        rows.push({label,mode,pngSha256:crypto.createHash('sha256').update(png).digest('hex'),
          waterTextureMinFilter:sample.stats.waterTextureMinFilter??null,
          drawCalls:sample.stats.drawCalls,triangles:sample.stats.triangles,world:sample.stats.world});
      }finally{await page.close();}
    }
    const before=captures.before.sample.stats,after=captures.after.sample.stats;
    expect(after.drawCalls).toBe(before.drawCalls);
    expect(after.triangles).toBe(before.triangles);
    for(const key of ['staticMeshes','staticInstances','geometries','materials','textures','drawObjects'])
      expect(after.world[key]).toBe(before.world[key]);
    for(const key of ['geometries','materials','textures','bodyRings','bodyTriangles','paths'])
      expect(after.serpent[key]).toBe(before.serpent[key]);
  }
  fs.writeFileSync(output('snake-r43-water-mip-actual-webgl.json'),JSON.stringify({
    priorRendererGitBlob:'dce31f68dcc0a28b5792a502f6575e7939f6289d',
    fixedPublicSyntheticFrame:true,reducedMotion:true,lowTier:true,
    notLiveFps:true,notDisplayPresentFps:true,notIndependentCritic:true,rows
  },null,2)+'\n');
  expect(JSON.stringify(frame)).toBe(frozen);
});
