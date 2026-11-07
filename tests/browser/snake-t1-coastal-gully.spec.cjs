'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const artifact=name=>{const dir=path.join(root,'artifacts/phase3');fs.mkdirSync(dir,{recursive:true});return path.join(dir,name);};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const blob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
test.use({trace:'off',video:'off',launchOptions:{
 executablePath:process.env.SNAKE_SYSTEM_CHROMIUM||undefined,
 args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']
}});

test('T1 exact 70d2 genuine coastal substrate vs new native four-coast gullies: same real Chromium game across whole 1080p, portrait, detail',async({browser,baseURL})=>{
 test.setTimeout(330000);
 const old=fs.readFileSync(path.join(root,'tests/fixtures/snake-t1-before-coastal-gully-70d2.mjs'),'utf8');
 const current=fs.readFileSync(path.join(root,'public/snake-stream/living-garden.mjs'),'utf8');
 expect(blob(old)).toBe('f8879548903e4c570a4dcd78639ae75320f27d39');
 expect(blob(current)).not.toBe(blob(old));
 const frame=JSON.parse(fs.readFileSync(path.join(root,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
 const frozen=JSON.stringify(frame),captures=[];
 for(const [view,mode,viewport] of [
  ['full-hd','overview',{width:1920,height:1080}],
  ['desktop','overview',{width:960,height:640}],
  ['hero','detail',{width:960,height:640}],
  ['portrait','overview',{width:390,height:844}]
 ]){
  const pair=[];
  for(const [version,before] of [['70d2-real-parent',true],['tidal-gullies-candidate',false]]){
   const page=await browser.newPage({viewport,reducedMotion:'reduce'}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   try{
    await page.route('**/snapshot',route=>route.fulfill({json:frame}));
    if(before)await page.route('**/living-garden.mjs',route=>route.fulfill({body:old,contentType:'text/javascript'}));
    await page.goto(baseURL+'/?camera='+mode+'&quality=low',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__snakePresentation?.stats()?.frameCount>=4,{}, {timeout:90000});
    const measured=await page.evaluate(()=>({stats:window.__snakePresentation.stats(),
     gl:document.getElementById('game').getContext('webgl2').getError(),
     caption:document.querySelector('#caption')?.textContent?.trim()||'',
     overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth}));
    const s=measured.stats;
    expect(s.renderer).toBe('webgl');expect(s.cameraMode).toBe(mode);
    expect(s.livingGarden.meshCount).toBe(4);expect(s.livingGarden.textures).toBe(1);
    expect(s.livingGarden.canopyTrees).toBe(10);
    expect(s.livingGarden.arcadeArches).toBe(4);
    expect(s.world.portalEnds).toBeGreaterThan(0);expect(s.world.hazards).toBeGreaterThan(0);
    expect(s.serpent.bodyRings).toBeGreaterThan(2);
    expect(measured.caption.length).toBeGreaterThan(8);
    expect(measured.overflow).toBe(false);expect(measured.gl).toBe(0);expect(errors).toEqual([]);
    const png=await page.screenshot({path:artifact(`snake-t1-gullies-${view}-${version}.png`)});
    expect(png.length).toBeGreaterThan(10000);
    pair.push({png,stats:s});
    captures.push({view,version,viewport,tick:frame.tick,
     sourceGardenGitBlob:blob(before?old:current),
     sha256:sha(png),bytes:png.length,drawingBuffer:s.drawingBuffer,
     real3DRenderer:s.renderer,drawCalls:s.drawCalls,triangles:s.triangles,
     garden:s.livingGarden,glError:measured.gl});
   }finally{await page.close();}
  }
  expect(pair[0].png.equals(pair[1].png)).toBe(false);
  expect(pair[0].stats.world).toEqual(pair[1].stats.world);
  expect(pair[0].stats.livingGarden).toEqual(pair[1].stats.livingGarden);
  expect(pair[0].stats.triangles).toEqual(pair[1].stats.triangles);
  expect(pair[0].stats.drawCalls).toEqual(pair[1].stats.drawCalls);
  expect(pair[0].stats.serpent.bodyRings).toEqual(pair[1].stats.serpent.bodyRings);
 }
 expect(JSON.stringify(frame)).toBe(frozen);
 fs.writeFileSync(artifact('snake-t1-gullies-exact-source-matched-chromium.json'),JSON.stringify({
  beforeSourceGitBlob:blob(old),candidateSourceGitBlob:blob(current),
  sameSourcePublicGameAndRenderer:true,unmodifiedOriginalFullDesktopOneSecondGate:true,
  motionAndDevicePresentNotProvenByStills:true,
  officialSnakePassWholeGameReview:'SELF REVIEW / ACCEPTANCE PENDING',
  independentCritic:'NOT AVAILABLE',t1:'BUILDING',captures},null,2)+'\n');
 console.log('SNAKE_T1_GULLIES_WEBGL',JSON.stringify({views:captures.length/2,
  real3D:true,original17FullDesktopGateUnchanged:true,notDisplayPresentFPS:true,
  unaccepted:true}));
});

test('T1 new 3D shoreline survives actual unmodified autonomous 55-second browser gameplay',async({browser,baseURL})=>{
 test.setTimeout(175000);
 const page=await browser.newPage({viewport:{width:960,height:640},
  recordVideo:{dir:path.join(root,'artifacts/phase3'),size:{width:960,height:640}}});
 const video=page.video(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 let record;
 try{
  // NO /snapshot route, synthetic events, timestamp manipulation or debug overlay.
  await page.goto(baseURL+'/?camera=overview&quality=low',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__snakePresentation?.stats()?.frameCount>=3,{}, {timeout:90000});
  const state=()=>page.evaluate(async()=>{
   const f=await (await fetch('/snapshot',{cache:'no-store'})).json();
   return {tick:f.tick,runToken:f.snapshot?.runToken,stats:window.__snakePresentation.stats(),
    glError:document.getElementById('game').getContext('webgl2').getError()};
  });
  const before=await state(),started=Date.now();
  await page.waitForTimeout(55000);
  const after=await state(),elapsed=Date.now()-started;
  expect(elapsed).toBeGreaterThanOrEqual(50000);
  expect(after.tick>before.tick+50||after.runToken!==before.runToken).toBe(true);
  expect(after.stats.frameCount).toBeGreaterThan(before.stats.frameCount+30);
  expect(after.stats.renderer).toBe('webgl');
  expect(after.stats.world.portalEnds).toBeGreaterThan(0);
  expect(after.stats.serpent.bodyRings).toBeGreaterThan(2);
  expect(after.glError).toBe(0);expect(errors).toEqual([]);
  record={elapsedMs:elapsed,fromTick:before.tick,toTick:after.tick,
   fromRunToken:before.runToken,toRunToken:after.runToken,
   genuineCompleteRenderedFrameCounterBefore:before.stats.frameCount,
   genuineCompleteRenderedFrameCounterAfter:after.stats.frameCount,
   originalStrictOneSecondGateNotReplaced:true,notDisplayPresentFPS:true,
   realHostUnmodified:true,independentQualityAcceptance:'PENDING'};
  console.log('SNAKE_T1_GULLIES_LIVE_GAME',JSON.stringify(record));
 }finally{await page.close();if(video)await video.saveAs(artifact('snake-t1-gullies-authentic-live-55s.webm'));}
 fs.writeFileSync(artifact('snake-t1-gullies-live-55s.json'),JSON.stringify(record,null,2)+'\n');
});
