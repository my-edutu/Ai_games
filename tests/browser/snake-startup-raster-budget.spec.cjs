'use strict';
const {historicalRendererGitBlob} = require('../helpers/snake-t1-living-archive.cjs');
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {stripR53Startup}=require('../helpers/snake-r53-startup-archive.cjs');
const {stripR54ShadowStartup}=require('../helpers/snake-r54-shadow-startup-archive.cjs');
test.use({trace:'off',video:'off',launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}});
const repo=path.resolve(__dirname,'../..');
const artifact=name=>{const dir=path.join(repo,'artifacts/phase3');fs.mkdirSync(dir,{recursive:true});return path.join(dir,name);};
const blob = historicalRendererGitBlob;

test('R53 original/current first-paint WebGL 1080p + portrait; exact prior source, unchanged semantics and readability',async({browser,baseURL})=>{
  test.setTimeout(210000);
  const current=stripR54ShadowStartup(fs.readFileSync(path.join(repo,'public/snake-stream/renderer.mjs'),'utf8'));
  // R53's historical baseline stays exactly R53, not the later R54 shadow experiment.
  const prior=stripR53Startup(current);
  expect(blob(prior)).toBe('bd7636ee3460fc09e6a9782ae66d37c20836f7f0');
  expect(stripR53Startup(prior)).toBe(prior);
  const publicFrame=JSON.parse(fs.readFileSync(path.join(repo,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
  publicFrame.snapshot.dangerLevel=0;
  const frozen=JSON.stringify(publicFrame);
  // Only this historical A/B capture freezes the scene clock and prevents
  // late measured adaptation. The real full-app desktop pacing test is untouched.
  const clock='    const time = timestamp / 1000;';
  const adaptive='let scaleAdjusted = false;';
  const sceneSource=source=>{
    for(const anchor of [clock,adaptive])expect(source.split(anchor)).toHaveLength(2);
    return source.replace(clock,'    const time = 0; // R53 synthetic frozen public frame')
      .replace(adaptive,'let scaleAdjusted = true; // R53 synthetic-only isolate first-raster budget');
  };
  const modes=[
    {viewport:{width:1920,height:1080},deviceScaleFactor:1,label:'desktop-1080p'},
    {viewport:{width:390,height:844},deviceScaleFactor:1.5,label:'portrait-retina'},
  ];
  const rows=[];
  for(const mode of modes){
    const captures={};
    for(const [variant,source] of [['before',prior],['after',current]]){
      const page=await browser.newPage({viewport:mode.viewport,deviceScaleFactor:mode.deviceScaleFactor,reducedMotion:'reduce'});
      const errors=[];page.on('pageerror',error=>errors.push(error.message));
      try{
        await page.route('**/snapshot',route=>route.fulfill({json:publicFrame}));
        await page.route('**/renderer.mjs',route=>route.fulfill({contentType:'text/javascript',body:sceneSource(source)}));
        await page.goto(baseURL+'/?camera=overview',{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.__snakePresentation?.stats().frameCount>=4,{}, {timeout:70000});
        const data=await page.evaluate(()=>({
          stats:window.__snakePresentation.stats(),
          css:document.getElementById('game').getBoundingClientRect().toJSON(),
          scrollWidth:document.documentElement.scrollWidth,
          viewportWidth:document.documentElement.clientWidth,
          primary:document.querySelector('#primary')?.textContent||'',
          caption:document.querySelector('#caption')?.textContent?.trim()||'',
          glError:document.getElementById('game').getContext('webgl2').getError(),
        }));
        expect(data.stats.renderer).toBe('webgl');
        expect(data.stats.cameraMode).toBe('overview');
        expect(data.stats.serpent.bodyRings).toBeGreaterThan(3);
        expect(data.stats.world.hazards).toBeGreaterThan(0);
        expect(data.stats.world.portalEnds).toBeGreaterThan(0);
        expect(data.primary).toContain('LENGTH');
        expect(data.caption.length).toBeGreaterThan(10);
        expect(data.scrollWidth).toBe(data.viewportWidth);
        expect(data.glError).toBe(0);expect(errors).toEqual([]);
        const png=await page.screenshot({path:artifact('snake-r53-'+mode.label+'-'+variant+'-real-webgl-synthetic.png')});
        expect(png.length).toBeGreaterThan(10000);
        captures[variant]={data,png};
        rows.push({mode:mode.label,variant,viewport:mode.viewport,deviceScaleFactor:mode.deviceScaleFactor,
          actualChromiumWebGL:true,syntheticFrozenPublic:true,pngSha256:crypto.createHash('sha256').update(png).digest('hex'),
          pixelRatio:data.stats.pixelRatio,drawingBuffer:data.stats.drawingBuffer,
          css:{width:data.css.width,height:data.css.height},drawCalls:data.stats.drawCalls,
          triangles:data.stats.triangles,world:data.stats.world,serpent:data.stats.serpent,
          caption:data.caption,glError:data.glError,errors});
      } finally {await page.close();}
    }
    const before=captures.before.data,after=captures.after.data;
    for(const key of ['drawCalls','triangles'])expect(after.stats[key]).toBe(before.stats[key]);
    for(const key of ['staticMeshes','staticInstances','geometries','materials','textures','drawObjects'])
      expect(after.stats.world[key]).toBe(before.stats.world[key]);
    for(const key of ['geometries','materials','textures','bodyRings','bodyTriangles','paths'])
      expect(after.stats.serpent[key]).toBe(before.stats.serpent[key]);
    if(mode.label==='desktop-1080p'){
      expect(before.stats.pixelRatio).toBe(1);
      expect(after.stats.pixelRatio).toBeGreaterThanOrEqual(0.4);
      expect(after.stats.pixelRatio).toBeLessThan(0.75);
      expect(after.stats.drawingBuffer.width*after.stats.drawingBuffer.height)
        .toBeLessThanOrEqual(770000);
      expect(captures.before.png.equals(captures.after.png)).toBe(false,
        'actual raster budget visibly differs in original-vs-updated first paint');
    } else {
      expect(before.stats.pixelRatio).toBe(1.5);
      expect(after.stats.pixelRatio).toBe(1.5);
      expect(after.stats.drawingBuffer).toEqual(before.stats.drawingBuffer);
    }
  }
  expect(JSON.stringify(publicFrame)).toBe(frozen);
  fs.writeFileSync(artifact('snake-r53-startup-raster-true-webgl.json'),JSON.stringify({
    exactPreviousRendererGitBlob:blob(prior),realChromiumWebGL:true,
    syntheticPublicFrame:true,notSteadyLivePacing:true,notDisplayPresentFps:true,
    notIndependentVisualApproval:true,fullAppMinimumActualSubmissions:17,rows
  },null,2)+'\n');
  console.log('SNAKE_R53_STARTUP_WEBGL',JSON.stringify({variants:rows.length,exactOldSource:true,
    firstPaint1080pCaptured:true,portraitCaptured:true,strictGateUnchanged:true}));
});
