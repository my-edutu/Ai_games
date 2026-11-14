'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
test.use({trace:'off',video:'off',launchOptions:{
 executablePath:process.env.SNAKE_SYSTEM_CHROMIUM||undefined,
 args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']
}});
const root=path.resolve(__dirname,'../..');
const out=name=>{const p=path.join(root,'artifacts/phase3');fs.mkdirSync(p,{recursive:true});return path.join(p,name);};
const blob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
const former=fs.readFileSync(path.join(root,'tests/fixtures/snake-t1-pre-littoral-b127.mjs'),'utf8');
const current=fs.readFileSync(path.join(root,'public/snake-stream/living-garden.mjs'),'utf8');
const publicFrame=JSON.parse(fs.readFileSync(path.join(root,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
const immutable=JSON.stringify(publicFrame);

test('T1 matched true Chromium/WebGL: exact b127 parent to coherent four-bank native groves in 8 full-scene/detail/portrait/1080p frames',async({browser,baseURL})=>{
 test.setTimeout(330000);
 expect(blob(former)).toBe('ff3e631ba4cba768a89e4b39123c2a2ce68216b3');
 const records=[];
 for(const [scene,camera,viewport] of [
  ['overview','overview',{width:960,height:640}],
  ['detail','detail',{width:960,height:640}],
  ['portrait','overview',{width:390,height:844}],
  ['1080p','overview',{width:1920,height:1080}]
 ]){
  let baseline=null;
  for(const [name,old] of [['exact-b127-before',true],['integrated-after',false]]){
   const page=await browser.newPage({viewport,reducedMotion:'reduce'});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   try{
    await page.route('**/snapshot',route=>route.fulfill({json:publicFrame}));
    if(old)await page.route('**/living-garden.mjs',route=>route.fulfill({body:former,contentType:'text/javascript'}));
    await page.goto(baseURL+'/?camera='+camera+'&quality=low',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__snakePresentation?.stats().frameCount>=4,{}, {timeout:90000});
    const observed=await page.evaluate(()=>({
     s:window.__snakePresentation.stats(),
     glError:document.getElementById('game').getContext('webgl2').getError(),
     overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,
     caption:document.getElementById('caption')?.textContent?.trim()
    }));
    const s=observed.s;
    expect(errors).toEqual([]);expect(s.renderer).toBe('webgl');
    expect(s.cameraMode).toBe(camera);
    expect(s.livingGarden.meshCount).toBe(4);expect(s.livingGarden.textures).toBe(1);
    expect(s.world.portalEnds).toBeGreaterThan(0);
    expect(s.world.hazards).toBeGreaterThan(0);
    expect(s.serpent.bodyRings).toBeGreaterThan(2);
    expect(observed.glError).toBe(0);
    expect(observed.overflow).toBe(false);
    expect(observed.caption.length).toBeGreaterThan(8);
    const png=await page.screenshot({path:out('snake-four-shore-'+scene+'-'+name+'-real-webgl.png')});
    expect(png.byteLength).toBeGreaterThan(10000);
    if(old){
     expect(s.livingGarden.littoralGroveClumps).toBeUndefined();
     baseline={png,stats:s};
    }else{
     expect(s.livingGarden.littoralGroveClumps).toBe(72);
     expect(s.livingGarden.littoralGroveBoulders).toBe(12);
     expect(s.livingGarden.triangles-baseline.stats.livingGarden.triangles).toBe(1860+48);
     expect(s.livingGarden.cornerCatchments).toBe(4);
     expect(s.drawCalls).toBe(baseline.stats.drawCalls);
     expect(s.world).toEqual(baseline.stats.world);
     expect(png.equals(baseline.png)).toBe(false);
    }
    records.push({scene,camera,viewport,sourceGardenBlob:old?blob(former):blob(current),
     frozenPublicFrame:crypto.createHash('sha256').update(immutable).digest('hex'),
     actualWebGL:true,photoSha256:crypto.createHash('sha256').update(png).digest('hex'),
     drawingBuffer:s.drawingBuffer,drawCalls:s.drawCalls,triangles:s.livingGarden.triangles,
     oneSecondSeventeenRenderGate:'UNCHANGED / MEASURED IN ORIGINAL TEST'});
   }finally{await page.close();}
  }
 }
 expect(JSON.stringify(publicFrame)).toBe(immutable);
 fs.writeFileSync(out('snake-four-shore-eight-true-webgl.json'),JSON.stringify({
  originalParent:'b127138cdd32bf5089755cf7d43903ade3f062b8',
  exactParentGardenBlob:blob(former),candidateGardenBlob:blob(current),
  visualAccepted:false,independentWholeGameCritic:'NOT AVAILABLE',
  movieFrameRateIsNotDisplayedFps:true,strictFullDesktopRenderGate:'UNCHANGED',records
 },null,2)+'\n');
});

test('T1 integrated bank relief: authentic 55-second unmodified autonomous whole-game motion and render evidence',async({browser,baseURL})=>{
 test.setTimeout(190000);
 const page=await browser.newPage({viewport:{width:960,height:640},
  recordVideo:{dir:path.join(root,'artifacts/phase3'),size:{width:960,height:640}}});
 const video=page.video(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  // Do not intercept host snapshots: goal, danger, fruit, portals, run tokens
  // and score remain authored ONLY by the original seeded fixed-step host.
  await page.goto(baseURL+'/?camera=cinematic&quality=low',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__snakePresentation?.stats().frameCount>=2,{}, {timeout:90000});
  const sample=()=>page.evaluate(async()=>{
   const frame=await(await fetch('/snapshot',{cache:'no-store'})).json();
   const s=window.__snakePresentation.stats();
   return {tick:frame.tick,runToken:frame.snapshot?.runToken,
    length:frame.snapshot?.length,foodsCollected:frame.snapshot?.foodsCollected,
    movementStep:frame.snapshot?.movementStep,frameCount:s.frameCount,
    shot:s.cameraMode,groveCount:s.livingGarden?.littoralGroveClumps,
    renderer:s.renderer,glError:document.getElementById('game').getContext('webgl2').getError()};
  });
  const start=await sample(),started=Date.now(),samples=[];
  for(let i=0;i<11;i++){await page.waitForTimeout(5000);samples.push(await sample());}
  const end=samples.at(-1),elapsedMs=Date.now()-started;
  expect(elapsedMs).toBeGreaterThanOrEqual(50000);
  expect(end.tick>start.tick+40||end.runToken!==start.runToken).toBe(true);
  expect(end.frameCount).toBeGreaterThan(start.frameCount+25);
  expect(samples.every(p=>p.renderer==='webgl'&&p.glError===0&&p.groveCount===72)).toBe(true);
  expect(errors).toEqual([]);
  fs.writeFileSync(out('snake-four-shore-authentic-55s.json'),JSON.stringify({
   gardenSourceBlob:blob(current),start,end,elapsedMs,samples,
   authenticUnmodifiedHost:true,scriptedEvents:false,
   recordingFPSNotDisplayPresentFPS:true,originalStrict17GateUnchanged:true,
   visualVerdict:'SELF REVIEW / PENDING; KEEP T1 BUILDING'
  },null,2)+'\n');
 }finally{
  await page.close();
  if(video)await video.saveAs(out('snake-four-shore-unmodified-autonomous-55s.webm'));
 }
});
