'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {restorePreR48}=require('../helpers/snake-r45-archive.cjs');
test.use({trace:'off',video:'off',launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}});
const root=path.resolve(__dirname,'../..');
const output=name=>{const dir=path.join(root,'artifacts/phase3');fs.mkdirSync(dir,{recursive:true});return path.join(dir,name);};
const hash=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
test('R48 exact-parent danger acting is visible in actual Chromium/WebGL both cameras',async({browser,baseURL})=>{
 test.setTimeout(170000);
 const source=fs.readFileSync(path.join(root,'public/snake-stream/serpent.mjs'),'utf8');
 const old=restorePreR48(source);
 expect(hash(old)).toBe('3c05c3720e5cbe0eb767c48783fd58d303d19bba');
 const renderer=fs.readFileSync(path.join(root,'public/snake-stream/renderer.mjs'),'utf8');
 const raster='function applyQuality(pixelRatio = Math.min(window.devicePixelRatio || 1, 0.75)) {';
 const adapt='let scaleAdjusted = false;',clock='    const time = timestamp / 1000;';
 for(const anchor of [raster,adapt,clock])expect(renderer.split(anchor)).toHaveLength(2);
 const fixed=renderer.replace(raster,'function applyQuality(pixelRatio = 0.4) {')
  .replace(adapt,'let scaleAdjusted = true; // R48 synthetic only')
  .replace(clock,'    const time = 2.5; // R48 synthetic only');
 const frame=JSON.parse(fs.readFileSync(path.join(root,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
 frame.snapshot.snake=frame.snapshot.snake.slice(0,8).map((v,i)=>({...v,cell:14+28*(8-i)}));
 frame.snapshot.food={...frame.snapshot.food,cell:17+28*11};
 frame.snapshot.dangerLevel=1;
 const frozen=JSON.stringify(frame),images={},rows=[];
 for(const mode of ['overview','detail']){
  images[mode]={};
  for(const [label,character] of [['before',old],['after',source]]){
   const page=await browser.newPage({viewport:{width:960,height:640},reducedMotion:'reduce'});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   try{
    await page.route('**/snapshot',r=>r.fulfill({json:frame}));
    await page.route('**/renderer.mjs',r=>r.fulfill({contentType:'text/javascript',body:fixed}));
    if(label==='before')await page.route('**/serpent.mjs',r=>r.fulfill({contentType:'text/javascript',body:character}));
    await page.goto(baseURL+'/?camera='+mode+'&quality=low',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__snakePresentation?.stats().frameCount>=6);
    const result=await page.evaluate(()=>({stats:window.__snakePresentation.stats(),
     error:document.getElementById('game').getContext('webgl2').getError()}));
    expect(result.stats.renderer).toBe('webgl');
    expect(result.stats.cameraMode).toBe(mode);
    expect(result.stats.pixelRatio).toBeCloseTo(0.4,7);
    expect(result.stats.serpent.paths).toBe(1);
    expect(result.error).toBe(0);
    expect(errors).toEqual([]);
    const png=await page.screenshot({path:output('snake-r48-danger-'+mode+'-'+label+'-synthetic.png')});
    expect(png.length).toBeGreaterThan(10000);
    images[mode][label]={png,stats:result.stats};
    rows.push({mode,label,sha256:crypto.createHash('sha256').update(png).digest('hex'),
     actualSubmittedAtCapture:result.stats.frameCount,
     drawCalls:result.stats.drawCalls,triangles:result.stats.triangles,
     world:result.stats.world,serpent:result.stats.serpent,
     drawingBuffer:result.stats.drawingBuffer,pixelRatio:result.stats.pixelRatio,glError:result.error});
   }finally{await page.close();}
  }
  for(const k of ['geometries','materials','textures','bufferBytes','bodyRings','bodyVertices','bodyTriangles','paths'])
   expect(images[mode].before.stats.serpent[k]).toBe(images[mode].after.stats.serpent[k]);
  for(const k of ['staticMeshes','drawObjects','geometries','materials','textures'])
   expect(images[mode].before.stats.world[k]).toBe(images[mode].after.stats.world[k]);
  expect(images[mode].before.stats.drawCalls).toBe(images[mode].after.stats.drawCalls);
  expect(images[mode].before.stats.triangles).toBe(images[mode].after.stats.triangles);
 }
 expect(images.detail.before.png.equals(images.detail.after.png)).toBe(false);
 expect(JSON.stringify(frame)).toBe(frozen);
 fs.writeFileSync(output('snake-r48-danger-actual-webgl.json'),JSON.stringify({
  exactParentGitBlob:'3c05c3720e5cbe0eb767c48783fd58d303d19bba',
  actualWebGL:true,syntheticPublicFixture:true,notGameFrameRate:true,
  notDeviceDisplayPresentFps:true,notIndependentReview:true,rows},null,2)+'\n');
 console.log('SNAKE_R48_DANGER_WEBGL',JSON.stringify({
  detailChanged:true,overviewChanged:!images.overview.before.png.equals(images.overview.after.png),
  originalGitBlob:hash(old),actualWebGL:true,notDeviceFps:true}));
});
