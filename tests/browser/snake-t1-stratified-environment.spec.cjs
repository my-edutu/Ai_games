'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const read=name=>fs.readFileSync(path.join(root,'public/snake-stream',name),'utf8');
const gitBlob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
const sha256=s=>crypto.createHash('sha256').update(s).digest('hex');
function strip(src,name,indent){
 const begin=indent+'// BEGIN '+name+'\n',end=indent+'// END '+name+'\n';
 const a=src.indexOf(begin),b=src.indexOf(end);
 expect(a).toBeGreaterThanOrEqual(0);expect(b).toBeGreaterThan(a);
 expect(src.indexOf(begin,a+1)).toBe(-1);expect(src.indexOf(end,b+1)).toBe(-1);
 return src.slice(0,a)+src.slice(b+end.length);
}
const world=read('world.mjs'),garden=read('living-garden.mjs');
const oldWorld=strip(world,'T1 COAST-TO-COURT BIOME CHROMA','      ');
const oldGarden=strip(garden,'T1 STRATIFIED ESCARPMENT SILHOUETTES','    ');
const out=name=>{const dir=path.join(root,'artifacts/phase3');fs.mkdirSync(dir,{recursive:true});return path.join(dir,name);};
test.use({trace:'off',video:'off',launchOptions:{
 executablePath:process.env.SNAKE_SYSTEM_CHROMIUM||undefined,
 args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']
}});
test('T1 stratified whole environment: eight true WebGL current-feature-reversal source-matched frames',async({browser,baseURL})=>{
 test.setTimeout(360000);
 expect(gitBlob(oldWorld)).toBe('5da8528a5895b7d4ba39c38fae3fed266bff711b');
 expect(gitBlob(fs.readFileSync(path.join(root,'tests/fixtures/snake-t1-historical-strata-1a8.mjs'),'utf8'))).toBe('1a8fec973bbe5bca82246ec630ced30984073020');
 expect(gitBlob(oldGarden)).not.toBe(gitBlob(garden));
 const frame=JSON.parse(fs.readFileSync(path.join(root,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
 const immutable=JSON.stringify(frame),images=[];
 for(const [view,camera,viewport] of [
   ['overview','overview',{width:960,height:640}],
   ['detail','detail',{width:960,height:640}],
   ['portrait','overview',{width:390,height:844}],
   ['desktop-1920','overview',{width:1920,height:1080}]
 ]){
  const pair=[];
  for(const [label,old] of [['reversed-current-feature',true],['integrated-sculpt-after',false]]){
   const page=await browser.newPage({viewport,reducedMotion:'reduce'}),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   try{
    await page.route('**/snapshot',route=>route.fulfill({json:frame}));
    if(old){
     await page.route('**/world.mjs',route=>route.fulfill({body:oldWorld,contentType:'text/javascript'}));
     await page.route('**/living-garden.mjs',route=>route.fulfill({body:oldGarden,contentType:'text/javascript'}));
    }
    await page.goto(baseURL+'/?camera='+camera+'&quality=low',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__snakePresentation?.stats()?.frameCount>=4,{}, {timeout:90000});
    const state=await page.evaluate(()=>({
      stats:window.__snakePresentation.stats(),
      glError:document.getElementById('game').getContext('webgl2').getError(),
      caption:document.getElementById('caption')?.textContent?.trim(),
      primary:document.getElementById('primary')?.textContent?.trim(),
      overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth
    }));
    const s=state.stats;
    expect(s.renderer).toBe('webgl');expect(s.cameraMode).toBe(camera);
    expect(s.world.portalEnds).toBeGreaterThan(0);expect(s.world.hazards).toBeGreaterThan(0);
    expect(s.serpent.bodyRings).toBeGreaterThan(2);
    expect(s.livingGarden.meshCount).toBe(4);expect(s.livingGarden.textures).toBe(1);
    expect(state.glError).toBe(0);expect(errors).toEqual([]);
    expect(state.caption.length).toBeGreaterThan(8);expect(state.primary).toContain('LENGTH');
    expect(state.overflow).toBe(false);
    const png=await page.screenshot({path:out('snake-t1-integrated-'+view+'-'+label+'.png')});
    expect(png.length).toBeGreaterThan(10000);
    pair.push({png,s});
    images.push({view,label,viewport,actualWebGL:true,sourceWorldBlob:old?gitBlob(oldWorld):gitBlob(world),
      sourceGardenBlob:old?gitBlob(oldGarden):gitBlob(garden),sha256:sha256(png),bytes:png.length,
      world:s.world,environment:s.livingGarden,serpent:s.serpent,drawCalls:s.drawCalls,
      triangles:s.triangles,gpuBuffer:s.drawingBuffer,glError:state.glError,
      displayPresentFps:'NOT MEASURED',strict17OriginalGate:'UNMODIFIED, measured separately'});
   }finally{await page.close();}
  }
  expect(pair[0].png.equals(pair[1].png)).toBe(false);
  expect(pair[0].s.world).toEqual(pair[1].s.world);
  expect(pair[0].s.livingGarden).toEqual(pair[1].s.livingGarden);
  expect(pair[0].s.drawCalls).toEqual(pair[1].s.drawCalls);
  expect(pair[0].s.triangles).toEqual(pair[1].s.triangles);
 }
 expect(JSON.stringify(frame)).toBe(immutable);
 fs.writeFileSync(out('snake-t1-integrated-real-webgl.json'),JSON.stringify({
  archivedHistoricalHead:'e2283963cd066261447955b05414389da3dae06e',
  original17FullDesktopRenderSubmissionsGate:'UNMODIFIED',historicalGardenGitBlobPinned:true,sameHeadFeatureIsolation:true,
  acceptance:'BUILDING — true whole-scene visual and independent review PENDING',
  independentCritic:'UNAVAILABLE',images
 },null,2)+'\n');
});
test('T1 authentic 55-second autonomous reversible-current-feature versus integrated motion, no scripted events',async({browser,baseURL})=>{
 test.setTimeout(220000);
 expect(gitBlob(oldWorld)).toBe('5da8528a5895b7d4ba39c38fae3fed266bff711b');
 const records=[];
 for(const [label,old] of [['reversed-current-feature',true],['integrated-after',false]]){
  const page=await browser.newPage({viewport:{width:960,height:640},
   recordVideo:{dir:path.join(root,'artifacts/phase3'),size:{width:960,height:640}}});
  const video=page.video(),errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  try{
   if(old){
    await page.route('**/world.mjs',route=>route.fulfill({body:oldWorld,contentType:'text/javascript'}));
    await page.route('**/living-garden.mjs',route=>route.fulfill({body:oldGarden,contentType:'text/javascript'}));
   }
   await page.goto(baseURL+'/?camera=overview&quality=low',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__snakePresentation?.stats()?.frameCount>=2,{}, {timeout:90000});
   const sample=()=>page.evaluate(async()=>{
     const frame=await(await fetch('/snapshot',{cache:'no-store'})).json();
     return {tick:frame.tick,token:frame.snapshot?.runToken,stats:window.__snakePresentation.stats(),
       error:document.getElementById('game').getContext('webgl2').getError(),
       caption:document.getElementById('caption')?.textContent?.trim()};
   });
   const begin=await sample(),start=Date.now();
   await page.waitForTimeout(55000);
   const end=await sample(),elapsed=Date.now()-start;
   expect(elapsed).toBeGreaterThanOrEqual(50000);
   expect(end.tick>begin.tick+50||end.token!==begin.token).toBe(true);
   expect(end.stats.frameCount).toBeGreaterThan(begin.stats.frameCount+30);
   expect(end.stats.renderer).toBe('webgl');expect(end.error).toBe(0);
   expect(end.stats.serpent.bodyRings).toBeGreaterThan(2);expect(end.stats.world.portalEnds).toBeGreaterThan(0);
   expect(end.caption.length).toBeGreaterThan(8);expect(errors).toEqual([]);
   records.push({label,elapsed,startTick:begin.tick,endTick:end.tick,startRunToken:begin.token,endRunToken:end.token,
    renderedSubmissionsBefore:begin.stats.frameCount,renderedSubmissionsAfter:end.stats.frameCount,
    originalHostGameplay:true,scriptedEvents:false,captureVideoFpsNotDevicePresent:true,
    longRunSubmissionCountNotOriginalOneSecondGate:true,independentVisualVerdict:'PENDING'});
  }finally{await page.close();if(video)await video.saveAs(out('snake-t1-integrated-'+label+'-authentic-55s.webm'));}
 }
 fs.writeFileSync(out('snake-t1-integrated-authentic-55s.json'),JSON.stringify({
   oldSource:'e2283963cd066261447955b05414389da3dae06e',
   completeUneditedHostGameplay:true,sourceMatchedSceneFiles:true,actualUserDeviceFPS:'UNKNOWN',records
 },null,2)+'\n');
});
