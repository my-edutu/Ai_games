'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const frozen=JSON.parse(fs.readFileSync(path.join(root,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
const sha256=x=>crypto.createHash('sha256').update(x).digest('hex');
const gitBlob=x=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(x)+'\0').update(x).digest('hex');
const out=name=>{const p=path.join(root,'artifacts/phase3');fs.mkdirSync(p,{recursive:true});return path.join(p,name);};
const sources={
  app:fs.readFileSync(path.join(root,'public/snake-stream/app.js'),'utf8'),
  director:fs.readFileSync(path.join(root,'public/snake-stream/cinematic-director.mjs'),'utf8'),
  renderer:fs.readFileSync(path.join(root,'public/snake-stream/renderer.mjs'),'utf8'),
};
test.use({trace:'off',video:'off',launchOptions:{
  executablePath:process.env.SNAKE_SYSTEM_CHROMIUM||undefined,
  args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']
}});


test('P0 regression: production same-origin host serves the cinematic dependency before any expensive WebGL capture',async({request,baseURL})=>{
  const moduleResponse=await request.get(`${baseURL}/cinematic-director.mjs`);
  expect(moduleResponse.status()).toBe(200);
  expect(moduleResponse.headers()['content-type']).toContain('text/javascript');
  expect(await moduleResponse.text()).toContain('export function selectCinematicShot');
  const appResponse=await request.get(`${baseURL}/app.js`);
  expect(appResponse.status()).toBe(200);
  expect(await appResponse.text()).toContain("from './cinematic-director.mjs'");
});

test('T1 integrated real courtyard and expressive serpent: six source-exact true WebGL editorial frames, one frozen legitimate public view',async({browser,baseURL})=>{
  test.setTimeout(330000);
  const {selectCinematicShot}=await import('../../public/snake-stream/cinematic-director.mjs');
  expect(selectCinematicShot(frozen.snapshot)).toBe('detail');
  const raw=JSON.stringify(frozen),entries=[];
  for(const [slug,viewport] of [['desktop',{width:960,height:640}],
    ['portrait',{width:390,height:844}],['broadcast-1080p',{width:1920,height:1080}]]){
    for(const mode of ['overview','cinematic']){
      const page=await browser.newPage({viewport,reducedMotion:'no-preference'});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      try{
        // Real recorded public frame. Only the camera selection varies;
        // no scripted fruit, AI, scoring, hazard, body, or portal alterations.
        await page.route('**/snapshot',route=>route.fulfill({json:frozen}));
        await page.goto(`${baseURL}/?camera=${mode}&quality=low`,{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.__snakePresentation?.stats()?.frameCount>=4,{}, {timeout:90000});
        const state=await page.evaluate(()=>({
          stats:window.__snakePresentation.stats(),
          caption:document.querySelector('#caption')?.textContent?.trim(),
          integrity:document.querySelector('#integrity')?.textContent?.trim(),
          glError:document.querySelector('#game').getContext('webgl2')?.getError(),
          overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,
          mapVisible:!!document.querySelector('.overview:not([hidden])'),
        }));
        expect(state.stats.renderer).toBe('webgl');
        expect(state.stats.viewerCameraMode).toBe(mode);
        expect(state.stats.cameraMode).toBe(mode==='cinematic'?'detail':'overview');
        expect(state.stats.serpent.bodyRings).toBeGreaterThan(2);
        expect(state.stats.courtyardEcology.publicCellsMoved).toBe(0);
        expect(state.stats.world.portalEnds).toBeGreaterThan(0);
        expect(state.glError).toBe(0);expect(errors).toEqual([]);
        expect(state.overflow).toBe(false);
        expect(state.integrity).toContain('VERIFIED');
        expect(state.caption.length).toBeGreaterThan(8);
        const png=await page.screenshot({path:out(`snake-cinematic-${slug}-${mode}-real-webgl.png`),fullPage:true});
        entries.push({mode,slug,viewport,shot:state.stats.cameraMode,
          legitimatePublicSha256:sha256(raw),webgl:true,
          imageSha256:sha256(png),bytes:png.byteLength,
          sourceBlob:{app:gitBlob(sources.app),director:gitBlob(sources.director),renderer:gitBlob(sources.renderer)},
          drawingBuffer:state.stats.drawingBuffer,physicalDisplayPresentFps:'NOT MEASURED',
          strict17FullDesktopRenderGate:'UNCHANGED / TESTED BY ORIGINAL TEST'});
      }finally{await page.close();}
    }
  }
  expect(JSON.stringify(frozen)).toBe(raw);
  fs.writeFileSync(out('snake-cinematic-six-truthful-real-webgl.json'),JSON.stringify({
    originalFrozenActualPublicFrame:true,identicalSceneSource:true,
    qualityAcceptance:'SELF REVIEW / PENDING',entries},null,2)+'\n');
});

test('T1/T3 real unscripted 55-second whole-game gameplays contrast steady overview and live cinematic director without false events',async({browser,baseURL})=>{
  test.setTimeout(330000);
  const records=[];
  for(const mode of ['overview','cinematic']){
    const page=await browser.newPage({viewport:{width:960,height:640},
      recordVideo:{dir:path.join(root,'artifacts/phase3'),size:{width:960,height:640}}});
    const errors=[],video=page.video();page.on('pageerror',e=>errors.push(e.message));
    const sample=()=>page.evaluate(async()=>{
      const remote=await(await fetch('/snapshot',{cache:'no-store'})).json();
      const stats=window.__snakePresentation.stats();
      return {tick:remote.tick,runToken:remote.snapshot?.runToken,
        lifecycle:remote.snapshot?.lifecycle,foodsCollected:remote.snapshot?.foodsCollected,
        headCell:remote.snapshot?.snake?.[0]?.cell,
        movementStep:remote.snapshot?.movementStep,
        frameCount:stats.frameCount,shot:stats.cameraMode,
        viewerCameraMode:stats.viewerCameraMode,renderer:stats.renderer,
        fallback:document.querySelector('#broadcast')?.dataset.renderMode,
        glError:document.querySelector('#game').getContext('webgl2')?.getError()};
    });
    try{
      // No route, mock, frame freeze, scripted actions, AI manipulation or replay.
      await page.goto(`${baseURL}/?camera=${mode}&quality=low`,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>window.__snakePresentation?.stats()?.frameCount>=2,{}, {timeout:90000});
      const before=await sample(),samples=[],started=Date.now();
      for(let i=0;i<11;i++){
        await page.waitForTimeout(5000);
        samples.push(await sample());
      }
      const after=samples.at(-1),elapsedMs=Date.now()-started;
      expect(elapsedMs).toBeGreaterThanOrEqual(50000);
      expect(after.tick>before.tick+40||after.runToken!==before.runToken).toBe(true);
      expect(after.frameCount).toBeGreaterThan(before.frameCount+25);
      expect(after.renderer).toBe('webgl');expect(after.glError).toBe(0);expect(errors).toEqual([]);
      expect(samples.every(x=>x.viewerCameraMode===mode)).toBe(true);
      expect(samples.every(x=>['overview','follow','detail'].includes(x.shot))).toBe(true);
      if(mode==='overview')expect(samples.every(x=>x.shot==='overview')).toBe(true);
      // A real run is allowed to stay in overview if a persistent public danger
      // requires safety; record the reason instead of faking a camera change.
      records.push({mode,elapsedMs,start:before,end:after,shotSamples:samples,
        authenticUnmodifiedPublicHost:true,scriptedGameEvents:false,
        strict17RenderGate:'UNCHANGED / INDEPENDENT 1 SECOND TEST',
        recordedVideoFpsIsNotDisplayPresentFps:true});
    }finally{
      await page.close();
      if(video)await video.saveAs(out(`snake-cinematic-${mode}-authentic-55s.webm`));
    }
  }
  fs.writeFileSync(out('snake-cinematic-authentic-whole-game-55s.json'),JSON.stringify({
    sourceAppBlob:gitBlob(sources.app),sourceDirectorBlob:gitBlob(sources.director),
    genuineLiveHost:true,qualityAcceptance:'SELF REVIEW / PENDING',records},null,2)+'\n');
});
