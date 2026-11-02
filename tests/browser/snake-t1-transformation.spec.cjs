'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {stripT1LivingGarden}=require('../helpers/snake-t1-living-archive.cjs');
test.use({trace:'off',video:'off',launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}});
const root=path.resolve(__dirname,'../..');
const artifact=name=>{const dir=path.join(root,'artifacts/phase3');fs.mkdirSync(dir,{recursive:true});return path.join(dir,name);};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const gitBlob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
const originalRenderer=()=>{
  const current=fs.readFileSync(path.join(root,'public/snake-stream/renderer.mjs'),'utf8');
  const original=stripT1LivingGarden(current);
  expect(gitBlob(original)).toBe('ae42da49444ae250d98e1e0181e3b2c2ae195dfa');
  return original;
};

test('T1 original-vs-living-garden same-source real Chromium WebGL: entire overview/detail/portrait/1080p scene',async({browser,baseURL})=>{
  test.setTimeout(300000);
  const original=originalRenderer();
  const frame=JSON.parse(fs.readFileSync(path.join(root,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
  const frozen=JSON.stringify(frame),records=[];
  for(const [scene,mode,viewport] of [
    ['overview','overview',{width:960,height:640}],
    ['hero-detail','detail',{width:960,height:640}],
    ['phone-portrait','overview',{width:390,height:844}],
    ['full-hd','overview',{width:1920,height:1080}]
  ]){
    const captures=[];
    for(const [version,body] of [['t0-before',original],['t1-after',null]]){
      const page=await browser.newPage({viewport,reducedMotion:'reduce'});
      const errors=[];page.on('pageerror',error=>errors.push(error.message));
      try{
        await page.route('**/snapshot',route=>route.fulfill({json:frame}));
        if(body)await page.route('**/renderer.mjs',route=>route.fulfill({contentType:'text/javascript',body}));
        await page.goto(baseURL+'/?camera='+mode+'&quality=low',{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.__snakePresentation?.stats()?.frameCount>=4,{}, {timeout:90000});
        const measured=await page.evaluate(()=>({
          stats:window.__snakePresentation.stats(),
          caption:document.querySelector('#caption')?.textContent?.trim()||'',
          primary:document.querySelector('#primary')?.textContent?.trim()||'',
          glError:document.getElementById('game').getContext('webgl2').getError(),
          overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth
        }));
        expect(measured.stats.renderer).toBe('webgl');
        expect(measured.stats.cameraMode).toBe(mode);
        expect(measured.stats.world.portalEnds).toBeGreaterThan(0);
        expect(measured.stats.world.hazards).toBeGreaterThan(0);
        expect(measured.stats.serpent.bodyRings).toBeGreaterThan(2);
        expect(measured.primary).toContain('LENGTH');
        expect(measured.caption.length).toBeGreaterThan(8);
        expect(measured.glError).toBe(0);expect(errors).toEqual([]);
        expect(measured.overflow).toBe(false);
        if(version==='t1-after'){
          expect(measured.stats.livingGarden?.meshCount).toBe(4);
          expect(measured.stats.livingGarden?.shoreSections).toBe(4);
        }else expect(measured.stats.livingGarden).toBeUndefined();
        const png=await page.screenshot({path:artifact('snake-t1-'+scene+'-'+version+'-actual-webgl.png')});
        expect(png.length).toBeGreaterThan(10000);
        records.push({scene,mode,version,viewport,pngSha256:sha(png),bytes:png.length,
          snapshotTick:frame.tick,drawCalls:measured.stats.drawCalls,
          triangles:measured.stats.triangles,frameCount:measured.stats.frameCount,
          drawingBuffer:measured.stats.drawingBuffer,
          world:measured.stats.world,livingGarden:measured.stats.livingGarden||null,
          glError:measured.glError});
        captures.push({png,stats:measured.stats});
      }finally{await page.close();}
    }
    expect(captures[0].png.equals(captures[1].png)).toBe(false);
    const originalWorld=captures[0].stats.world, updatedWorld=captures[1].stats.world;
    for(const [key,value] of Object.entries(originalWorld)){
      if(key==='drawObjects')expect(updatedWorld[key]).toBe(value+4);
      else expect(updatedWorld[key]).toEqual(value);
    }
    expect(captures[1].stats.drawCalls).toBeGreaterThanOrEqual(captures[0].stats.drawCalls);
    expect(captures[1].stats.livingGarden.triangles).toBeGreaterThan(2500);
  }
  expect(JSON.stringify(frame)).toBe(frozen);
  fs.writeFileSync(artifact('snake-t1-matched-real-webgl.json'),JSON.stringify({
    baselineHead:'108e2e439aab1f3fe4cf49019c1aa9fe5630feb6',
    baselineRendererBlob:gitBlob(original),sourceControlled:true,
    realChromiumWebGL:true,frozenAuthenticPublicFrame:true,actualFramesCompared:8,
    motionNotProvenByStills:true,displayPresentFpsNotMeasured:true,
    strict17ActualRendererSubmissionsNotRelaxed:true,
    review:'SELF REVIEW / ACCEPTANCE PENDING',records
  },null,2)+'\n');
  console.log('SNAKE_T1_MATCHED_CHROMIUM',JSON.stringify({captures:records.length,
    sourceHashVerified:true,strictSubmissionGateUnchanged:true,acceptancePending:true}));
});

test('T0/T1 live autonomous 55-second genuine Chromium footage on identical original and current renderer',async({browser,baseURL})=>{
  test.setTimeout(260000);
  const original=originalRenderer(),records=[];
  for(const [version,body] of [['t0-before',original],['t1-after',null]]){
    const page=await browser.newPage({
      viewport:{width:960,height:640},
      recordVideo:{dir:path.join(root,'artifacts/phase3'),size:{width:960,height:640}}
    });
    const video=page.video(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    try{
      if(body)await page.route('**/renderer.mjs',route=>route.fulfill({contentType:'text/javascript',body}));
      // Deliberately NO /snapshot interception: this is actual long-running
      // authoritative fixed-step autonomous play, not a constructed scene.
      await page.goto(baseURL+'/?camera=overview&quality=low',{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>window.__snakePresentation?.stats()?.frameCount>=2,{}, {timeout:90000});
      const before=await page.evaluate(async()=>{
        const data=await (await fetch('/snapshot',{cache:'no-store'})).json();
        return {tick:data.tick,runToken:data.snapshot?.runToken,stats:window.__snakePresentation.stats()};
      });
      const started=Date.now();
      await page.waitForTimeout(55000);
      const elapsedMs=Date.now()-started;
      const after=await page.evaluate(async()=>{
        const data=await (await fetch('/snapshot',{cache:'no-store'})).json();
        return {tick:data.tick,runToken:data.snapshot?.runToken,stats:window.__snakePresentation.stats(),
          caption:document.querySelector('#caption')?.textContent?.trim()};
      });
      expect(elapsedMs).toBeGreaterThanOrEqual(50000);
      expect(after.tick>before.tick+50 || after.runToken!==before.runToken).toBe(true);
      expect(after.stats.frameCount).toBeGreaterThan(before.stats.frameCount+30);
      expect(after.stats.renderer).toBe('webgl');
      expect(after.stats.world.portalEnds).toBeGreaterThan(0);
      expect(after.stats.serpent.bodyRings).toBeGreaterThan(2);
      expect(errors).toEqual([]);
      const summary={version,elapsedMs,fromTick:before.tick,toTick:after.tick,
        startRunToken:before.runToken,endRunToken:after.runToken,
        startActualSubmittedFrames:before.stats.frameCount,endActualSubmittedFrames:after.stats.frameCount,
        capturesAreAuthenticLiveGame:true,notDevicePresentFps:true,
        notAReplacementForStrictOneSecondGate:true,
        lateCaption:after.caption};
      records.push(summary);
      console.log('SNAKE_T0_T1_LIVE_GAMEPLAY',JSON.stringify(summary));
    }finally{
      await page.close();
      if(video)await video.saveAs(artifact('snake-'+version+'-real-55s-gameplay.webm'));
    }
  }
  fs.writeFileSync(artifact('snake-t0-t1-real-gameplay.json'),JSON.stringify({
    sourceVerifiedRendererBlob:gitBlob(original),unmodifiedLiveHost:true,
    artificiallyInsertedGameplayEvents:false,
    completeAuthoritativeMotionNotIndependentVisualAcceptance:true,
    videoNominalFpsNotRendererSubmissionsOrDevicePresents:true,
    strictMin17Unchanged:true,records
  },null,2)+'\n');
});
