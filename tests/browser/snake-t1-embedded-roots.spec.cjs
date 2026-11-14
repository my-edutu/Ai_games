'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const output=filename=>{const p=path.join(root,'artifacts/phase3');fs.mkdirSync(p,{recursive:true});return path.join(p,filename);};
const src=fs.readFileSync(path.join(root,'public/snake-stream/courtyard-ecology.mjs'),'utf8');
const predecessor=fs.readFileSync(path.join(root,'docs/reviews/snake-gauntlet/baselines/b649cb8-courtyard-ecology.mjs'),'utf8');
const blob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0'+s).digest('hex');
const sha256=x=>crypto.createHash('sha256').update(x).digest('hex');
const oldBlob='e9a418d775308200c13bafc97bbaaa8019582af8';
test.use({trace:'off',video:'off',launchOptions:{executablePath:process.env.SNAKE_SYSTEM_CHROMIUM||undefined,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}});

test('T1 source-exact WebGL eight-view before/after: replace opaque stage sheets with physical rooted ecology while keeping gameplay truthful',async({browser,baseURL})=>{
  test.setTimeout(360000);
  expect(blob(predecessor)).toBe(oldBlob);
  expect(blob(src)).not.toBe(oldBlob);
  const frame=JSON.parse(fs.readFileSync(path.join(root,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
  const frozen=JSON.stringify(frame),records=[];
  for(const [scene,mode,viewport] of [
    ['overview','overview',{width:960,height:640}],
    ['hero-detail','detail',{width:960,height:640}],
    ['portrait','overview',{width:390,height:844}],
    ['desktop','overview',{width:1920,height:1080}]
  ]){
    const pair=[];
    for(const [revision,older] of [['baseline-b649',true],['reclaimed-after',false]]){
      const page=await browser.newPage({viewport,reducedMotion:'reduce'}),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      try{
        await page.route('**/snapshot',route=>route.fulfill({json:frame}));
        if(older)await page.route('**/courtyard-ecology.mjs',route=>route.fulfill({body:predecessor,contentType:'text/javascript'}));
        await page.goto(baseURL+'/?camera='+mode+'&quality=low',{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.__snakePresentation?.stats()?.frameCount>=4,{}, {timeout:90000});
        const state=await page.evaluate(()=>({
          stats:window.__snakePresentation.stats(),
          gl:document.getElementById('game').getContext('webgl2')?.getError(),
          caption:document.querySelector('#caption')?.textContent?.trim()||'',
          primary:document.querySelector('#primary')?.textContent?.trim()||'',
          overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth
        }));
        expect(state.stats.renderer).toBe('webgl');
        expect(state.stats.cameraMode).toBe(mode);
        expect(state.stats.world.portalEnds).toBeGreaterThan(0);
        expect(state.stats.world.hazards).toBeGreaterThan(0);
        expect(state.stats.serpent.bodyRings).toBeGreaterThan(2);
        expect(state.stats.courtyardEcology.meshCount).toBe(1);
        if(!older) {
          expect(state.stats.courtyardEcology.stoneAtlas.regraded).toBe(true);
          expect(state.stats.courtyardEcology.stoneAtlas.pixels).toBe(524288);
          expect(state.stats.courtyardEcology.stoneAtlas.textureAdded).toBe(0);
        }
        expect(state.gl).toBe(0);expect(errors).toEqual([]);
        expect(state.caption.length).toBeGreaterThan(8);
        expect(state.primary).toContain('LENGTH');
        expect(state.overflow).toBe(false);
        const filename='snake-t1-roots-'+scene+'-'+revision+'.png';
        const png=await page.screenshot({path:output(filename)});
        expect(png.length).toBeGreaterThan(10000);
        records.push({scene,revision,viewport,sourceBlob:blob(older?predecessor:src),
          frozenPublicFrame:sha256(frozen),png:filename,sha256:sha256(png),bytes:png.length,
          drawingBuffer:state.stats.drawingBuffer,world:state.stats.world,
          livingGarden:state.stats.livingGarden,courtyardEcology:state.stats.courtyardEcology,
          serpentBodyRings:state.stats.serpent.bodyRings,
          realWebGL:true,devicePresentFPS:'NOT MEASURED',strict1sGate:'UNCHANGED SEPARATE TEST'});
        pair.push({png,stats:state.stats});
      }finally{await page.close();}
    }
    expect(pair[0].png.equals(pair[1].png)).toBe(false);
    expect(pair[0].stats.world).toEqual(pair[1].stats.world);
    expect(pair[0].stats.livingGarden).toEqual(pair[1].stats.livingGarden);
    expect(pair[0].stats.serpent.geometries).toBe(pair[1].stats.serpent.geometries);
    expect(pair[1].stats.courtyardEcology.meshCount).toBe(1);
    expect(pair[1].stats.courtyardEcology.textures).toBe(0);
  }
  expect(JSON.stringify(frame)).toBe(frozen);
  fs.writeFileSync(output('snake-t1-roots-exact-source-comparison.json'),JSON.stringify({
    fixedPreviousHead:'b649cb8a653d99497882edec3293dcafe6fe039c',sourcePreviousBlob:oldBlob,
    currentSourceBlob:blob(src),renderedImages:records.length,immutablePublicFrame:sha256(frozen),
    deterministicPresentationOnly:true,wholeGameVisualAcceptance:'SELF REVIEW / ACCEPTANCE PENDING',
    independentReviewer:'NOT AVAILABLE',strict17RendererSubmissionGate:'UNCHANGED SEPARATE TEST',records
  },null,2)+'\n');
  console.log('SNAKE_T1_ROOTS_WEBGL',JSON.stringify({images:records.length,oldBlob,newBlob:blob(src),qualityVerdict:'PENDING'}));
});

test('T1 authentic unmodified 55-second autonomous garden with physical roots and original authoritative cues',async({browser,baseURL})=>{
  test.setTimeout(240000);
  const page=await browser.newPage({viewport:{width:960,height:640},recordVideo:{dir:path.join(root,'artifacts/phase3'),size:{width:960,height:640}}});
  const video=page.video(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.goto(baseURL+'/?camera=overview&quality=low',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__snakePresentation?.stats()?.frameCount>=2,{}, {timeout:90000});
    const sample=()=>page.evaluate(async()=>{
      const f=await (await fetch('/snapshot',{cache:'no-store'})).json();
      return {tick:f.tick,token:f.snapshot?.runToken,scene:f.scene,stats:window.__snakePresentation.stats(),
        error:document.getElementById('game').getContext('webgl2')?.getError(),
        caption:document.querySelector('#caption')?.textContent?.trim()};
    });
    const before=await sample(),start=Date.now();
    await page.waitForTimeout(55000);
    const after=await sample(),elapsedMs=Date.now()-start;
    expect(elapsedMs).toBeGreaterThanOrEqual(50000);
    expect(after.tick>before.tick+50||before.token!==after.token).toBe(true);
    expect(after.stats.frameCount).toBeGreaterThan(before.stats.frameCount+30);
    expect(after.stats.renderer).toBe('webgl');
    expect(after.stats.courtyardEcology.meshCount).toBe(1);
    expect(after.error).toBe(0);expect(errors).toEqual([]);
    expect(after.caption.length).toBeGreaterThan(8);
    const record={fromTick:before.tick,toTick:after.tick,startRun:before.token,endRun:after.token,
      elapsedMs,authenticUnmodifiedAutonomousGame:true,scriptedEvents:false,realWebGL:true,
      startRendererFrames:before.stats.frameCount,endRendererFrames:after.stats.frameCount,
      nominalVideoFPSNotDisplayPresents:true,not17SubmissionGate:true,
      sourceBlob:blob(src),drawingBuffer:after.stats.drawingBuffer};
    fs.writeFileSync(output('snake-t1-roots-real-55s.json'),JSON.stringify(record,null,2)+'\n');
    console.log('SNAKE_T1_ROOTS_LIVE_GAME',JSON.stringify(record));
  }finally{
    await page.close();if(video)await video.saveAs(output('snake-t1-roots-real-55s.webm'));
  }
});
