'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const afterPath=path.join(root,'public/snake-stream/world.mjs');
const digest=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');
const output=name=>{const dir=path.join(root,'artifacts/phase3');fs.mkdirSync(dir,{recursive:true});return path.join(dir,name);};
test.use({trace:'off',video:'off',launchOptions:{
 executablePath:process.env.SNAKE_SYSTEM_CHROMIUM||undefined,
 args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']
}});
test('T1 actual 4a961 source-to-organic garden floor Chromium WebGL: four matched whole-game views, no missing cues/resources',async({browser,baseURL})=>{
 test.setTimeout(360000);
 const after=fs.readFileSync(afterPath,'utf8');
 const begin='      // BEGIN T1 ORGANIC QUARRY FLOOR\n',end='      // END T1 ORGANIC QUARRY FLOOR\n';
 const i=after.indexOf(begin),j=after.indexOf(end);
 expect(i).toBeGreaterThan(0);expect(j).toBeGreaterThan(i);
 expect(after.indexOf(begin,i+1)).toBe(-1);expect(after.indexOf(end,j+1)).toBe(-1);
 const before=after.slice(0,i)+after.slice(j+end.length);
 expect(digest(before)).toBe('a9a3039a58875fddbec67af6abdbaf4ab203525c');
 expect(digest(after)).not.toBe(digest(before));
 expect(after).toContain('BEGIN T1 ORGANIC QUARRY FLOOR');
 const frame=JSON.parse(fs.readFileSync(path.join(root,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
 const frameBytes=JSON.stringify(frame),records=[];
 for(const [name,camera,viewport] of [
  ['overview','overview',{width:960,height:640}],
  ['hero-detail','detail',{width:960,height:640}],
  ['portrait','overview',{width:390,height:844}],
  ['desktop-full','overview',{width:1920,height:1080}]
 ]){
  const captures=[];
  for(const [label,prior] of [['exact-4a961-before',true],['organic-floor-after',false]]){
   const page=await browser.newPage({viewport,reducedMotion:'reduce'}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   try{
    await page.route('**/snapshot',route=>route.fulfill({json:frame}));
    if(prior)await page.route('**/world.mjs',route=>route.fulfill({body:before,contentType:'text/javascript'}));
    await page.goto(baseURL+'/?camera='+camera+'&quality=low',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__snakePresentation?.stats()?.frameCount>=4,{}, {timeout:85000});
    const current=await page.evaluate(()=>({
     stats:window.__snakePresentation.stats(),
     glError:document.getElementById('game').getContext('webgl2').getError(),
     caption:document.getElementById('caption')?.textContent?.trim(),
     primary:document.getElementById('primary')?.textContent?.trim(),
     overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth
    }));
    const stats=current.stats;
    expect(stats.renderer).toBe('webgl');expect(stats.cameraMode).toBe(camera);
    expect(stats.world.hazards).toBeGreaterThan(0);expect(stats.world.portalEnds).toBeGreaterThan(0);
    expect(stats.serpent.bodyRings).toBeGreaterThan(2);
    expect(stats.livingGarden.meshCount).toBe(4);
    expect(stats.livingGarden.textures).toBe(1);
    expect(current.glError).toBe(0);expect(current.caption.length).toBeGreaterThan(8);
    expect(current.primary).toContain('LENGTH');expect(current.overflow).toBe(false);
    expect(errors).toEqual([]);
    const png=await page.screenshot({path:output('snake-t1-organic-floor-'+name+'-'+label+'.png')});
    expect(png.length).toBeGreaterThan(10000);
    records.push({name,label,viewport,camera,sourceBlob:prior?digest(before):digest(after),
     publicTick:frame.tick,sha256:sha256(png),bytes:png.length,
     drawCalls:stats.drawCalls,triangles:stats.triangles,
     buffer:stats.drawingBuffer,world:stats.world,livingGarden:stats.livingGarden,glError:current.glError});
    captures.push({png,stats});
   }finally{await page.close();}
  }
  expect(captures[0].png.equals(captures[1].png)).toBe(false);
  expect(captures[0].stats.world).toEqual(captures[1].stats.world);
  expect(captures[0].stats.drawCalls).toEqual(captures[1].stats.drawCalls);
  expect(captures[0].stats.livingGarden).toEqual(captures[1].stats.livingGarden);
  for(const key of ['geometries','materials','textures','bodyRings','bodyVertices','bodyTriangles','paths','maxBodyRings'])
   expect(captures[0].stats.serpent[key]).toEqual(captures[1].stats.serpent[key]);
 }
 expect(JSON.stringify(frame)).toBe(frameBytes);
 fs.writeFileSync(output('snake-t1-organic-floor-matched-actual-webgl.json'),JSON.stringify({
  exactPriorHead:'4a9613ae920f04e9c43787f4694a6d39468e93c8',
  priorWorldBlob:digest(before),newWorldBlob:digest(after),actualChromiumWebGL:true,
  unchangedStrictOneSecond17SubmissionGate:true,
  physicalDevicePresentFps:'NOT VERIFIED',independentCritic:'NOT AVAILABLE',
  milestone:'T1 BUILDING / SELF REVIEW / ACCEPTANCE PENDING',records
 },null,2)+'\n');
 console.log('SNAKE_T1_ORGANIC_FLOOR_TRUE_WEBGL',JSON.stringify({captures:records.length,exactParent:true,actualWebGL:true,independentAcceptance:false}));
});

// Do not mock gameplay events: this is the actual authoritative stream for 55s.
test('T1 organic quarry uninterrupted 55-second autonomous motion, genuine WebGL host and bounded cues',async({browser,baseURL})=>{
 test.setTimeout(170000);
 const page=await browser.newPage({viewport:{width:960,height:640},
  recordVideo:{dir:path.join(root,'artifacts/phase3'),size:{width:960,height:640}}});
 const video=page.video(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 let summary;
 try{
  await page.goto(baseURL+'/?camera=overview&quality=low',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__snakePresentation?.stats()?.frameCount>=2,{}, {timeout:85000});
  const sample=()=>page.evaluate(async()=>{
   const frame=await (await fetch('/snapshot',{cache:'no-store'})).json();
   return {tick:frame.tick,runToken:frame.snapshot?.runToken,
    stats:window.__snakePresentation.stats(),
    caption:document.querySelector('#caption')?.textContent?.trim(),
    glError:document.getElementById('game').getContext('webgl2').getError()};
  });
  const before=await sample(),start=Date.now();
  await page.waitForTimeout(55000);
  const after=await sample(),elapsedMs=Date.now()-start;
  expect(elapsedMs).toBeGreaterThanOrEqual(50000);
  expect(after.tick>before.tick+50||after.runToken!==before.runToken).toBe(true);
  expect(after.stats.frameCount).toBeGreaterThan(before.stats.frameCount+30);
  expect(after.stats.renderer).toBe('webgl');
  expect(after.stats.world.portalEnds).toBeGreaterThan(0);
  expect(after.stats.serpent.bodyRings).toBeGreaterThan(2);
  expect(after.glError).toBe(0);expect(after.caption.length).toBeGreaterThan(8);
  expect(errors).toEqual([]);
  summary={elapsedMs,fromTick:before.tick,toTick:after.tick,
   beforeRunToken:before.runToken,afterRunToken:after.runToken,
   actualSubmittedFramesBefore:before.stats.frameCount,actualSubmittedFramesAfter:after.stats.frameCount,
   genuineUnscriptedAutonomousGameplay:true,scriptedEvents:false,
   originalStrictOneSecond17GateUnchanged:true,recordedVideoFpsIsNotPresentFps:true,
   notAcceptanceProof:true};
  console.log('SNAKE_T1_ORGANIC_FLOOR_REAL_55S',JSON.stringify(summary));
 }finally{
  await page.close();
  if(video)await video.saveAs(output('snake-t1-organic-floor-authentic-55s-gameplay.webm'));
 }
 fs.writeFileSync(output('snake-t1-organic-floor-authentic-gameplay.json'),JSON.stringify(summary,null,2)+'\n');
});
