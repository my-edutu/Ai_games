'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const oldFile=path.join(root,'tests/fixtures/snake-t1-57d6-ecology.mjs');
const currentFile=path.join(root,'public/snake-stream/courtyard-ecology.mjs');
const sha256=data=>crypto.createHash('sha256').update(data).digest('hex');
const gitBlob=data=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(data)+'\0').update(data).digest('hex');
const out=name=>{const folder=path.join(root,'artifacts/phase3');fs.mkdirSync(folder,{recursive:true});return path.join(folder,name);};
const old=fs.readFileSync(oldFile,'utf8');
const current=fs.readFileSync(currentFile,'utf8');
const ORIGINAL_GIT_BLOB='4fbfec70f4c6251a735d8f1f563dd7ec86bbe30c';
const snapshot=JSON.parse(fs.readFileSync(path.join(root,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));

test.use({trace:'off',video:'off',launchOptions:{
  executablePath:process.env.SNAKE_SYSTEM_CHROMIUM||undefined,
  args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']
}});

test('T1 three-course native vegetation and warm sunstone: same authentic public state in eight unretouched real WebGL views',async({browser,baseURL})=>{
  test.setTimeout(360000);
  expect(gitBlob(old)).toBe(ORIGINAL_GIT_BLOB);
  const rawFrame=JSON.stringify(snapshot),records=[];
  for(const [mode,viewport,name] of [
    ['overview',{width:960,height:640},'board-overview'],
    ['detail',{width:960,height:640},'head-and-garden'],
    ['overview',{width:390,height:844},'phone-portrait'],
    ['overview',{width:1920,height:1080},'full-1080p']
  ]){
    const images=[];
    for(const [version,baseline] of [['real-57d6-before',true],['current-coherent-valleys',false]]){
      const page=await browser.newPage({viewport,reducedMotion:'reduce'});
      const errors=[];page.on('pageerror',error=>errors.push(error.message));
      try{
        await page.route('**/snapshot',route=>route.fulfill({json:snapshot}));
        if(baseline)await page.route('**/courtyard-ecology.mjs',route=>route.fulfill({body:old,contentType:'text/javascript'}));
        await page.goto(baseURL+'/?camera='+mode+'&quality=low',{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.__snakePresentation?.stats()?.frameCount>=4,{}, {timeout:90000});
        const status=await page.evaluate(()=>({
          stats:window.__snakePresentation.stats(),
          glError:document.getElementById('game').getContext('webgl2')?.getError(),
          caption:document.getElementById('caption')?.textContent?.trim(),
          primary:document.getElementById('primary')?.textContent?.trim(),
          overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth
        }));
        expect(status.stats.renderer).toBe('webgl');
        expect(status.stats.cameraMode).toBe(mode);
        expect(status.stats.world.portalEnds).toBeGreaterThan(0);
        expect(status.stats.world.hazards).toBeGreaterThan(0);
        expect(status.stats.serpent.bodyRings).toBeGreaterThan(2);
        expect(status.stats.livingGarden.meshCount).toBe(4);
        expect(status.stats.courtyardEcology.meshCount).toBe(1);
        expect(status.stats.courtyardEcology.publicCellsMoved).toBe(0);
        expect(status.stats.courtyardEcology.triangles).toBeLessThan(3100);
        if(!baseline){
          expect(status.stats.courtyardEcology.fernBiomeCourses).toBe(3);
          expect(status.stats.courtyardEcology.stoneAtlas.sunstoneEtching).toBe(true);
        }
        expect(status.glError).toBe(0);expect(errors).toEqual([]);
        expect(status.caption.length).toBeGreaterThan(8);
        expect(status.primary).toContain('LENGTH');expect(status.overflow).toBe(false);
        const png=await page.screenshot({path:out('snake-t1-valleys-'+name+'-'+version+'.png')});
        expect(png.length).toBeGreaterThan(10000);
        images.push({png,stats:status.stats});
        records.push({name,viewport,version,gameplayFrameSha:sha256(rawFrame),
          ecologyBlob:gitBlob(baseline?old:current),actualWebGL:true,
          glError:status.glError,pngSha256:sha256(png),pngBytes:png.length,
          drawCalls:status.stats.drawCalls,triangles:status.stats.triangles,
          nativeDrawingBuffer:status.stats.drawingBuffer,world:status.stats.world,
          ecology:status.stats.courtyardEcology,
          strict17SubmittedRenders:'UNCHANGED / SEPARATE FULL-DESKTOP 1S TEST',
          deviceDisplayedFPS:'NOT MEASURED',independentVisualCritic:'NOT AVAILABLE'});
      }finally{await page.close();}
    }
    expect(images[0].png.equals(images[1].png)).toBe(false);
    expect(images[0].stats.world).toEqual(images[1].stats.world);
    expect(images[0].stats.livingGarden).toEqual(images[1].stats.livingGarden);
    expect(images[0].stats.serpent.geometries).toBe(images[1].stats.serpent.geometries);
  }
  expect(JSON.stringify(snapshot)).toBe(rawFrame);
  const evidence={sourceCommitBaseline:'57d6b88421376f281921acbc4f4fa3350e83dc6d',
    originalModuleBlob:ORIGINAL_GIT_BLOB,currentModuleBlob:gitBlob(current),
    originalGenuineFullscreenStrict17Gate:'NOT REPLACED',
    identicalPublicState:true,fullSceneIndependentQualityVerdict:'SELF REVIEW / PENDING',records};
  fs.writeFileSync(out('snake-t1-valleys-eight-real-webgl.json'),JSON.stringify(evidence,null,2)+'\n');
  console.log('SNAKE_T1_VALLEYS_WEBGL',JSON.stringify({views:records.length,exactParent:true,
    trueWebGL:true,originalStrictGateUntouched:true,qualityAcceptance:'PENDING'}));
});

test('T1 genuine unmodified autonomous gameplay before and after native garden environment, no fabricated events',async({browser,baseURL})=>{
  test.setTimeout(270000);
  expect(gitBlob(old)).toBe(ORIGINAL_GIT_BLOB);
  const records=[];
  for(const [version,baseline] of [['real-57d6-before',true],['current-coherent-valleys',false]]){
    const page=await browser.newPage({viewport:{width:960,height:640},
      recordVideo:{dir:path.join(root,'artifacts/phase3'),size:{width:960,height:640}}});
    const video=page.video(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    try{
      if(baseline)await page.route('**/courtyard-ecology.mjs',route=>route.fulfill({body:old,contentType:'text/javascript'}));
      // No snapshot interception: real server ticks and genuine seeded AI path.
      await page.goto(baseURL+'/?camera=overview&quality=low',{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>window.__snakePresentation?.stats()?.frameCount>=2,{}, {timeout:90000});
      const sample=()=>page.evaluate(async()=>{
        const state=await(await fetch('/snapshot',{cache:'no-store'})).json();
        return {tick:state.tick,runToken:state.snapshot?.runToken,
          stats:window.__snakePresentation.stats(),
          glError:document.getElementById('game').getContext('webgl2')?.getError(),
          caption:document.getElementById('caption')?.textContent?.trim()};
      });
      const before=await sample(),start=Date.now();
      await page.waitForTimeout(55000);
      const after=await sample(),elapsedMs=Date.now()-start;
      expect(elapsedMs).toBeGreaterThanOrEqual(50000);
      expect(after.tick>before.tick+50||after.runToken!==before.runToken).toBe(true);
      expect(after.stats.frameCount).toBeGreaterThan(before.stats.frameCount+30);
      expect(after.stats.renderer).toBe('webgl');
      expect(after.stats.world.portalEnds).toBeGreaterThanOrEqual(0);
      expect(after.glError).toBe(0);expect(errors).toEqual([]);
      expect(after.caption.length).toBeGreaterThan(8);
      records.push({version,elapsedMs,startTick:before.tick,endTick:after.tick,
        startToken:before.runToken,endToken:after.runToken,sourceModuleBlob:gitBlob(baseline?old:current),
        authenticLiveHost:true,scriptedEvents:false,
        actualSubmittedDuringWholeMovie:after.stats.frameCount-before.stats.frameCount,
        nominalVideoFrameRateIsNotDevicePresentFPS:true,
        originalStrictOneSecondSubmittedRenderGate:'UNCHANGED / TESTED ELSEWHERE',
        drawingBuffer:after.stats.drawingBuffer});
    }finally{
      await page.close();
      if(video)await video.saveAs(out('snake-t1-valleys-'+version+'-real-55s.webm'));
    }
  }
  fs.writeFileSync(out('snake-t1-valleys-genuine-55s.json'),JSON.stringify({records,
    noFalseGameActions:true,independentReferenceQualityVerdict:'PENDING',
    strictlyNoDevicePresentFPSClaim:true},null,2)+'\n');
  console.log('SNAKE_T1_VALLEYS_AUTONOMOUS',JSON.stringify({runs:records.length,
    authenticUnmodified:true,strict17GateUnchanged:true,qualityAcceptance:'PENDING'}));
});
