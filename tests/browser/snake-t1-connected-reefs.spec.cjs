'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const sourcePath=path.join(root,'public/snake-stream/living-garden.mjs');
const blob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
const sha256=data=>crypto.createHash('sha256').update(data).digest('hex');
const output=name=>{const dir=path.join(root,'artifacts/phase3');fs.mkdirSync(dir,{recursive:true});return path.join(dir,name);};
test.use({trace:'off',video:'off',launchOptions:{
 executablePath:process.env.SNAKE_SYSTEM_CHROMIUM||undefined,
 args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']
}});

test('T1 original connected coastal ridge relief: matched real WebGL complete-scene, portrait and detail views versus exact 43a5e04',async({browser,baseURL})=>{
 test.setTimeout(360000);
 const after=fs.readFileSync(sourcePath,'utf8');
 const begin='    // BEGIN T1 CONNECTED COASTAL RIDGES\n',end='    // END T1 CONNECTED COASTAL RIDGES\n';
 const a=after.indexOf(begin),b=after.indexOf(end);
 expect(a).toBeGreaterThanOrEqual(0);expect(b).toBeGreaterThan(a);
 expect(after.indexOf(begin,a+1)).toBe(-1);expect(after.indexOf(end,b+1)).toBe(-1);
 const before=after.slice(0,a)+after.slice(b+end.length);
 expect(blob(before)).toBe('ab20ddc7db0eecbc0726d26beb3c12ea32649a93');
 const frame=JSON.parse(fs.readFileSync(path.join(root,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
 const immutable=JSON.stringify(frame),evidence=[];
 for(const [view,camera,viewport] of [
  ['overview','overview',{width:960,height:640}],
  ['hero-detail','detail',{width:960,height:640}],
  ['portrait','overview',{width:390,height:844}],
  ['full-desktop','overview',{width:1920,height:1080}]
 ]){
  const states=[];
  for(const [label,prior] of [['exact-43a5-before',true],['linked-ridges-after',false]]){
   const page=await browser.newPage({viewport,reducedMotion:'reduce'}),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   try{
    await page.route('**/snapshot',route=>route.fulfill({json:frame}));
    if(prior)await page.route('**/living-garden.mjs',route=>route.fulfill({body:before,contentType:'text/javascript'}));
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
    expect(s.livingGarden.terracedPromontories).toBe(8);
    expect(s.livingGarden.meshCount).toBe(4);expect(s.livingGarden.textures).toBe(1);
    expect(state.glError).toBe(0);expect(errors).toEqual([]);
    expect(state.caption.length).toBeGreaterThan(8);expect(state.primary).toContain('LENGTH');
    expect(state.overflow).toBe(false);
    const png=await page.screenshot({path:output('snake-t1-ridges-'+view+'-'+label+'.png')});
    expect(png.length).toBeGreaterThan(10000);
    states.push({s,png});
    evidence.push({view,label,viewport,publicTick:frame.tick,genuineChromiumWebGL:true,
      sourceBlob:prior?blob(before):blob(after),imageSha256:sha256(png),bytes:png.length,
      drawingBuffer:s.drawingBuffer,drawCalls:s.drawCalls,triangles:s.triangles,
      world:s.world,environment:s.livingGarden,hero:s.serpent,glError:state.glError});
   }finally{await page.close();}
  }
  expect(states[0].png.equals(states[1].png)).toBe(false);
  expect(states[0].s.world).toEqual(states[1].s.world);
  expect(states[0].s.livingGarden).toEqual(states[1].s.livingGarden);
  expect(states[0].s.drawCalls).toEqual(states[1].s.drawCalls);
  expect(states[0].s.triangles).toEqual(states[1].s.triangles);
  for(const key of ['bodyRings','bodyVertices','bodyTriangles','paths','bufferBytes','truncated'])
    expect(states[0].s.serpent[key]).toEqual(states[1].s.serpent[key]);
 }
 expect(JSON.stringify(frame)).toBe(immutable);
 fs.writeFileSync(output('snake-t1-linked-ridges-real-webgl.json'),JSON.stringify({
  exactParentHead:'43a5e04194e510eb82e1bfb30c7302dcf8a4fc71',
  exactParentGardenBlob:blob(before),currentGardenBlob:blob(after),
  realWebGL:true,sameSourcePublicFrame:true,originalStrict17RenderGateUnchanged:true,
  trueDevicePresentFps:'UNKNOWN',wholeGameIndependentCritic:'NOT AVAILABLE',
  verdict:'T1 BUILDING / genuine whole-game visual review pending',evidence
 },null,2)+'\n');
 console.log('SNAKE_T1_LINKED_RIDGES_REAL_WEBGL',JSON.stringify({views:evidence.length,
  oldSourceVerified:true,unchangedStrictGate:true,qualityAcceptancePending:true}));
});

test('T1 connected ridge environment holds genuine uninterrupted 55-second autonomous host game',async({browser,baseURL})=>{
 test.setTimeout(190000);
 const page=await browser.newPage({viewport:{width:960,height:640},
  recordVideo:{dir:path.join(root,'artifacts/phase3'),size:{width:960,height:640}}});
 const video=page.video(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 let record;
 try{
  await page.goto(baseURL+'/?camera=overview&quality=low',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__snakePresentation?.stats()?.frameCount>=2,{}, {timeout:90000});
  const snap=()=>page.evaluate(async()=>{
   const frame=await(await fetch('/snapshot',{cache:'no-store'})).json();
   return {tick:frame.tick,token:frame.snapshot?.runToken,
    stats:window.__snakePresentation.stats(),
    glError:document.getElementById('game').getContext('webgl2').getError(),
    caption:document.getElementById('caption')?.textContent?.trim()};
  });
  const before=await snap(),start=Date.now();
  await page.waitForTimeout(55000);
  const after=await snap(),elapsed=Date.now()-start;
  expect(elapsed).toBeGreaterThanOrEqual(50000);
  expect(after.tick>before.tick+50||after.token!==before.token).toBe(true);
  expect(after.stats.frameCount).toBeGreaterThan(before.stats.frameCount+30);
  expect(after.stats.renderer).toBe('webgl');expect(after.glError).toBe(0);
  expect(after.stats.world.portalEnds).toBeGreaterThan(0);
  expect(after.stats.serpent.bodyRings).toBeGreaterThan(2);
  expect(after.caption.length).toBeGreaterThan(8);expect(errors).toEqual([]);
  record={elapsedMs:elapsed,startTick:before.tick,endTick:after.tick,
   startRunToken:before.token,endRunToken:after.token,
   actualSubmittedFramesBefore:before.stats.frameCount,actualSubmittedFramesAfter:after.stats.frameCount,
   unmodifiedHostGameplay:true,scriptedEvents:false,
   movieFrameRateIsNotRealDevicePresentFPS:true,notOriginalOneSecond17SubmissionGate:true,
   independentWholeGameReview:'NOT AVAILABLE',t1:'BUILDING'};
  console.log('SNAKE_T1_LINKED_RIDGES_AUTHENTIC_55S',JSON.stringify(record));
 }finally{await page.close();if(video)await video.saveAs(output('snake-t1-ridges-authentic-55s.webm'));}
 fs.writeFileSync(output('snake-t1-ridges-authentic-55s.json'),JSON.stringify(record,null,2)+'\n');
});
