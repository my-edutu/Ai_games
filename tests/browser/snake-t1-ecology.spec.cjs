'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
test.use({trace:'off',video:'off',launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}});
const root=path.resolve(__dirname,'../..');
const artifact=name=>{const dir=path.join(root,'artifacts/phase3');fs.mkdirSync(dir,{recursive:true});return path.join(dir,name);};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const gitBlob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
const previousGarden=fs.readFileSync(path.join(root,'tests/fixtures/snake-t1-before-ecology-b8ae526.mjs'),'utf8');
const latestGarden=fs.readFileSync(path.join(root,'public/snake-stream/living-garden.mjs'),'utf8');
const previousGitBlob='06a307da365c0a75471c75c43f5f1361ddcfea30';

test('T1 ecology genuine current WebGL: four matched b8ae garden-vs-new garden views and every public cue',async({browser,baseURL})=>{
  test.setTimeout(300000);
  expect(gitBlob(previousGarden)).toBe(previousGitBlob);
  expect(gitBlob(latestGarden)).not.toBe(previousGitBlob);
  const publicFrame=JSON.parse(fs.readFileSync(path.join(root,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
  const frozen=JSON.stringify(publicFrame),records=[];
  for(const [scene,mode,viewport] of [
    ['overview','overview',{width:960,height:640}],
    ['hero-detail','detail',{width:960,height:640}],
    ['portrait','overview',{width:390,height:844}],
    ['full-hd','overview',{width:1920,height:1080}]
  ]){
    const captures=[];
    for(const [version,oldGarden] of [['old-b8ae',true],['new-ecology',false]]){
      const page=await browser.newPage({viewport,reducedMotion:'reduce'});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      try{
        await page.route('**/snapshot',route=>route.fulfill({json:publicFrame}));
        if(oldGarden)await page.route('**/living-garden.mjs',route=>route.fulfill({contentType:'text/javascript',body:previousGarden}));
        await page.goto(baseURL+'/?camera='+mode+'&quality=low',{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.__snakePresentation?.stats()?.frameCount>=4,{}, {timeout:90000});
        const observed=await page.evaluate(()=>({
          stats:window.__snakePresentation.stats(),
          caption:document.querySelector('#caption')?.textContent?.trim()||'',
          primary:document.querySelector('#primary')?.textContent?.trim()||'',
          glError:document.getElementById('game').getContext('webgl2').getError(),
          overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth
        }));
        const s=observed.stats;
        expect(s.renderer).toBe('webgl');expect(s.cameraMode).toBe(mode);
        expect(s.livingGarden?.meshCount).toBe(4);
        expect(s.livingGarden?.shoreSections).toBe(4);
        expect(s.world.portalEnds).toBeGreaterThan(0);
        expect(s.world.hazards).toBeGreaterThan(0);
        expect(s.serpent.bodyRings).toBeGreaterThan(2);
        expect(observed.primary).toContain('LENGTH');
        expect(observed.caption.length).toBeGreaterThan(8);
        expect(observed.glError).toBe(0);
        expect(observed.overflow).toBe(false);
        expect(errors).toEqual([]);
        if(oldGarden)expect(s.livingGarden.roundedBoulders).toBeUndefined();
        else{
          expect(s.livingGarden.roundedBoulders).toBeGreaterThanOrEqual(18);
          expect(s.livingGarden.rootRibbons).toBeGreaterThanOrEqual(16);
          expect(s.livingGarden.fernFronds).toBeGreaterThanOrEqual(500);
        }
        const png=await page.screenshot({path:artifact('snake-t1-ecology-'+scene+'-'+version+'.png')});
        expect(png.length).toBeGreaterThan(10000);
        records.push({scene,mode,version,viewport,publicTick:publicFrame.tick,
          sha256:sha(png),bytes:png.length,drawCalls:s.drawCalls,triangles:s.triangles,
          drawingBuffer:s.drawingBuffer,world:s.world,livingGarden:s.livingGarden,glError:observed.glError});
        captures.push({png,stats:s});
      }finally{await page.close();}
    }
    expect(captures[0].png.equals(captures[1].png)).toBe(false);
    expect(captures[1].stats.drawCalls).toBe(captures[0].stats.drawCalls);
    expect(captures[1].stats.livingGarden.meshCount).toBe(captures[0].stats.livingGarden.meshCount);
    expect(captures[1].stats.world).toEqual(captures[0].stats.world);
    expect(captures[1].stats.livingGarden.triangles-captures[0].stats.livingGarden.triangles).toBeLessThan(22000);
  }
  expect(JSON.stringify(publicFrame)).toBe(frozen);
  fs.writeFileSync(artifact('snake-t1-ecology-matched-real-webgl.json'),JSON.stringify({
    previousBranchHead:'b8ae5260b17c67358ff3a75e2644bab49110b170',
    previousGardenGitBlob:previousGitBlob,candidateGardenGitBlob:gitBlob(latestGarden),
    samePublicSnapshot:true,actualChromiumWebGL:true,mockups:false,matchedCaptures:records.length,
    fullFrameQualityAcceptance:'SELF REVIEW / ACCEPTANCE PENDING',
    beforeAfterFilmNotTrajectoryMatched:true,physicalDisplayPresentNotMeasured:true,
    strictOriginalFullDesktop17SubmissionsGateUnchanged:true,records
  },null,2)+'\n');
  console.log('SNAKE_T1_ECOLOGY_MATCHED_WEBGL',JSON.stringify({captures:records.length,
    sourceHashVerified:true,actualWebGL:true,unchangedStrict17Gate:true,visualAcceptancePending:true}));
});

test('T1 ecology new scene survives 55 uninterrupted seconds of authentic autonomous WebGL game',async({browser,baseURL})=>{
  test.setTimeout(160000);
  const page=await browser.newPage({viewport:{width:960,height:640},
    recordVideo:{dir:path.join(root,'artifacts/phase3'),size:{width:960,height:640}}});
  const video=page.video(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  try{
    // No /snapshot interception. The actual autonomous host owns tick, run,
    // direction, scoring, fruit, hazards, portals and any real restart.
    await page.goto(baseURL+'/?camera=overview&quality=low',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__snakePresentation?.stats()?.frameCount>=2,{}, {timeout:90000});
    const before=await page.evaluate(async()=>{
      const d=await (await fetch('/snapshot',{cache:'no-store'})).json();
      return {tick:d.tick,runToken:d.snapshot?.runToken,stats:window.__snakePresentation.stats()};
    });
    const started=Date.now();await page.waitForTimeout(55000);const elapsedMs=Date.now()-started;
    const after=await page.evaluate(async()=>{
      const d=await (await fetch('/snapshot',{cache:'no-store'})).json();
      return {tick:d.tick,runToken:d.snapshot?.runToken,stats:window.__snakePresentation.stats(),
        caption:document.querySelector('#caption')?.textContent?.trim()};
    });
    expect(elapsedMs).toBeGreaterThanOrEqual(50000);
    expect(after.tick>before.tick+50||after.runToken!==before.runToken).toBe(true);
    expect(after.stats.renderer).toBe('webgl');
    expect(after.stats.livingGarden.roundedBoulders).toBeGreaterThanOrEqual(18);
    expect(after.stats.world.hazards).toBeGreaterThan(0);
    expect(after.stats.serpent.bodyRings).toBeGreaterThan(2);
    expect(after.stats.frameCount).toBeGreaterThan(before.stats.frameCount+30);
    expect(errors).toEqual([]);
    const record={elapsedMs,startTick:before.tick,endTick:after.tick,
      startRunToken:before.runToken,endRunToken:after.runToken,
      startSubmittedFrames:before.stats.frameCount,endSubmittedFrames:after.stats.frameCount,
      fromAuthenticUnmodifiedHost:true,scriptedEvents:false,notDisplayPresentFps:true,
      notTheOneSecondStrict17FrameGate:true,lateCaption:after.caption};
    fs.writeFileSync(artifact('snake-t1-ecology-live-gameplay.json'),JSON.stringify(record,null,2)+'\n');
    console.log('SNAKE_T1_ECOLOGY_LIVE_GAMEPLAY',JSON.stringify(record));
  }finally{
    await page.close();
    if(video)await video.saveAs(artifact('snake-t1-ecology-real-55s-gameplay.webm'));
  }
});
