'use strict';
const { test, expect } = require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const { restorePreR56Portrait }=require('../helpers/snake-r56-portrait-camera-archive.cjs');
test.use({trace:'off',video:'off',launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}});
const root=path.resolve(__dirname,'../..');
const artifact=name=>{const dir=path.join(root,'artifacts/phase3');fs.mkdirSync(dir,{recursive:true});return path.join(dir,name);};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
test('R56 real Chromium/WebGL camera A/B expands portrait board while all gameplay cues and resources remain',async({browser,baseURL})=>{
  test.setTimeout(160000);
  const source=fs.readFileSync(path.join(root,'public/snake-stream/camera.mjs'),'utf8');
  const original=restorePreR56Portrait(source);
  const oldBlob=crypto.createHash('sha1').update('blob '+Buffer.byteLength(original)+'\0').update(original).digest('hex');
  expect(oldBlob).toBe('c40b3dafd5becf38e77c72e7b8d7dba5414f6c12');
  const frame=JSON.parse(fs.readFileSync(path.join(root,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
  const frozen=JSON.stringify(frame),records=[];
  for(const [label,viewport] of [['tall-390x844',{width:390,height:844}],['portrait-368x598',{width:368,height:598}]]){
    const captures=[];
    for(const [version,body] of [['before',original],['r56',source]]){
      const page=await browser.newPage({viewport,reducedMotion:'reduce'});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      try{
        await page.route('**/snapshot',route=>route.fulfill({json:frame}));
        if(version==='before')await page.route('**/camera.mjs',route=>route.fulfill({contentType:'text/javascript',body}));
        await page.goto(baseURL+'/?quality=low&camera=overview',{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.__snakePresentation?.stats().frameCount>=5,{}, {timeout:80000});
        const state=await page.evaluate(()=>({
          stats:window.__snakePresentation.stats(),
          caption:document.querySelector('#caption')?.textContent?.trim()||'',
          primary:document.querySelector('#primary')?.textContent?.trim()||'',
          glError:document.getElementById('game').getContext('webgl2').getError(),
          overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth
        }));
        expect(state.stats.renderer).toBe('webgl');
        expect(state.stats.cameraMode).toBe('overview');
        expect(state.stats.reducedMotion).toBe(true);
        expect(state.stats.serpent.bodyRings).toBeGreaterThan(2);
        expect(state.stats.world.portalEnds).toBeGreaterThan(0);
        expect(state.stats.world.hazards).toBeGreaterThan(0);
        expect(state.primary).toContain('LENGTH');
        expect(state.caption.length).toBeGreaterThan(8);
        expect(state.glError).toBe(0);expect(state.overflow).toBe(false);expect(errors).toEqual([]);
        const png=await page.screenshot({path:artifact('snake-r56-'+label+'-'+version+'-synthetic-real-webgl.png')});
        expect(png.length).toBeGreaterThan(10000);
        records.push({label,version,viewport,sha256:sha(png),bytes:png.length,
          frameCount:state.stats.frameCount,drawCalls:state.stats.drawCalls,
          triangles:state.stats.triangles,geometries:state.stats.geometries,textures:state.stats.textures,
          world:state.stats.world,glError:state.glError});
        captures.push({png,stats:state.stats});
      }finally{await page.close();}
    }
    expect(captures[0].png.equals(captures[1].png)).toBe(false);
    for(const key of ['geometries','textures'])
      expect(captures[0].stats[key]).toBe(captures[1].stats[key]);
    for(const key of ['staticMeshes','staticInstances','drawObjects','geometries','materials','textures'])
      expect(captures[0].stats.world[key]).toBe(captures[1].stats.world[key]);
  }
  expect(JSON.stringify(frame)).toBe(frozen);
  fs.writeFileSync(artifact('snake-r56-portrait-stage-real-webgl.json'),JSON.stringify({
    originalCameraGitBlob:oldBlob,sourceControlled:true,actualChromiumWebGL:true,
    reducedMotion:true,unchangedStrictMinActualRendererSubmissions:17,
    noClaimOfThroughputOrDevicePresentFps:true,independentVisualCritic:false,records
  },null,2)+'\n');
  console.log('SNAKE_R56_REAL_PORTRAIT_WEBGL',JSON.stringify({captures:records.length,
    actualWebGL:true,sourceVerified:true,onlyCameraCompositionChanged:true}));
});
