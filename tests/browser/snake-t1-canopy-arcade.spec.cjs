'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
test.use({trace:'off',video:'off',launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}});
const root=path.resolve(__dirname,'../..');
const artifact=n=>{const dir=path.join(root,'artifacts/phase3');fs.mkdirSync(dir,{recursive:true});return path.join(dir,n);};
const blob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
const prior=fs.readFileSync(path.join(root,'tests/fixtures/snake-t1-before-canopy-b615.mjs'),'utf8');
const actual=fs.readFileSync(path.join(root,'public/snake-stream/living-garden.mjs'),'utf8');

test('T1 canopy, ruptured arches and new forest frame: eight true Chromium WebGL exact-parent matched public-snapshot views',async({browser,baseURL})=>{
 test.setTimeout(300000);
 expect(blob(prior)).toBe('2abd364f6666f1324e0294f7760a8e7a1978a71a');
 expect(blob(actual)).not.toBe(blob(prior));
 const frame=JSON.parse(fs.readFileSync(path.join(root,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
 const frozen=JSON.stringify(frame),records=[];
 for(const [scene,mode,viewport] of [
  ['overview','overview',{width:960,height:640}],
  ['detail','detail',{width:960,height:640}],
  ['portrait','overview',{width:390,height:844}],
  ['full-hd','overview',{width:1920,height:1080}],
 ]){
  const both=[];
  for(const [version,old] of [['b615-before',true],['forest-after',false]]){
   const page=await browser.newPage({viewport,reducedMotion:'reduce'});
   const errors=[];page.on('pageerror',error=>errors.push(error.message));
   try{
    await page.route('**/snapshot',route=>route.fulfill({json:frame}));
    if(old)await page.route('**/living-garden.mjs',route=>route.fulfill({body:prior,contentType:'text/javascript'}));
    await page.goto(baseURL+'/?camera='+mode+'&quality=low',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__snakePresentation?.stats()?.frameCount>=4,{}, {timeout:90000});
    const state=await page.evaluate(()=>({stats:window.__snakePresentation.stats(),
      glError:document.getElementById('game').getContext('webgl2').getError(),
      caption:document.getElementById('caption')?.textContent?.trim()||'',
      primary:document.getElementById('primary')?.textContent?.trim()||'',
      overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth}));
    const s=state.stats;
    expect(s.renderer).toBe('webgl');expect(s.cameraMode).toBe(mode);
    expect(s.livingGarden.meshCount).toBe(4);expect(s.livingGarden.shoreSections).toBe(4);
    expect(s.world.portalEnds).toBeGreaterThan(0);expect(s.world.hazards).toBeGreaterThan(0);
    expect(s.serpent.bodyRings).toBeGreaterThan(2);
    expect(state.primary).toContain('LENGTH');expect(state.caption.length).toBeGreaterThan(8);
    expect(state.glError).toBe(0);expect(errors).toEqual([]);expect(state.overflow).toBe(false);
    if(old)expect(s.livingGarden.canopyTrees).toBeUndefined();
    else {expect(s.livingGarden.canopyTrees).toBe(10);
      expect(s.livingGarden.canopyLeaflets).toBeGreaterThan(700);
      expect(s.livingGarden.arcadeStones).toBeGreaterThan(65);}
    const filepath=artifact('snake-t1-forest-'+scene+'-'+version+'.png');
    const png=await page.screenshot({path:filepath});expect(png.length).toBeGreaterThan(10000);
    const sha256=crypto.createHash('sha256').update(png).digest('hex');
    records.push({scene,mode,version,viewport,sha256,bytes:png.length,
      samePublicTick:frame.tick,drawCalls:s.drawCalls,triangles:s.triangles,
      drawingBuffer:s.drawingBuffer,livingGarden:s.livingGarden,glError:state.glError});
    both.push({png,stats:s});
   }finally{await page.close();}
  }
  expect(both[0].png.equals(both[1].png)).toBe(false);
  expect(both[0].stats.drawCalls).toBe(both[1].stats.drawCalls);
  expect(both[0].stats.world).toEqual(both[1].stats.world);
  expect(both[1].stats.livingGarden.triangles).toBeGreaterThan(both[0].stats.livingGarden.triangles+2200);
 }
 expect(JSON.stringify(frame)).toBe(frozen);
 fs.writeFileSync(artifact('snake-t1-forest-matched-WebGL.json'),JSON.stringify({
  exactPreviousHead:'b615b347a977844c4d08e4e95cb177c2d3e6bf29',
  exactPreviousGardenBlob:'2abd364f6666f1324e0294f7760a8e7a1978a71a',
  candidateGardenBlob:blob(actual),captureType:'real unmodified Chromium/WebGL screenshot',
  frozenPublicSnapshot:true,independentVisualCritic:'NOT AVAILABLE',
  visualMilestone:'BUILDING / NOT ACCEPTED',
  physicalDisplayPresentFps:'NOT MEASURED',
  originalStrict17SubmissionGate:'UNCHANGED, SEPARATE TEST',records
 },null,2)+'\n');
 console.log('SNAKE_T1_FOREST_MATCHED_WEBGL',JSON.stringify({views:records.length,
  previousSourceVerified:true,actualWebGL:true,qualityNotPrejudged:true,originalGateIntact:true}));
});
