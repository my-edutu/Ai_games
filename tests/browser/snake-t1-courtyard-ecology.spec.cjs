'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const code=fs.readFileSync(path.join(root,'public/snake-stream/renderer.mjs'),'utf8');
const gitBlob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
const sha256=s=>crypto.createHash('sha256').update(s).digest('hex');
const out=name=>{const dir=path.join(root,'artifacts/phase3');fs.mkdirSync(dir,{recursive:true});return path.join(dir,name);};
const originalSections=[['IMPORT',''],['STATE','  '],['RENEWAL','      '],
  ['ATTACH','      '],['STATS','      '],['RELEASE','    ']];
function reconstructBefore(){
  let old=code;
  for(const [name,indent] of originalSections){
    const begin=indent+'// BEGIN T1 COURTYARD ECOLOGY '+name+'\n';
    const end=indent+'// END T1 COURTYARD ECOLOGY '+name+'\n';
    const a=old.indexOf(begin),b=old.indexOf(end);
    expect(a).toBeGreaterThanOrEqual(0);expect(b).toBeGreaterThan(a);
    expect(old.indexOf(begin,a+1)).toBe(-1);
    old=old.slice(0,a)+old.slice(b+end.length);
  }
  expect(gitBlob(old)).toBe('95802b5c5b558b7af5e28b01ec83bbaeb1c13944');
  return old;
}
test.use({trace:'off',video:'off',launchOptions:{
  executablePath:process.env.SNAKE_SYSTEM_CHROMIUM||undefined,
  args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']
}});
test('T1 actual courtyard-shaping ecology: eight source-matched real WebGL before/after full scenes, portrait and detail',async({browser,baseURL})=>{
  test.setTimeout(360000);
  const before=reconstructBefore();
  const publicFrame=JSON.parse(fs.readFileSync(path.join(root,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
  const immutable=JSON.stringify(publicFrame),captures=[];
  for(const [label,mode,viewport] of [
    ['overview','overview',{width:960,height:640}],
    ['hero-detail','detail',{width:960,height:640}],
    ['portrait','overview',{width:390,height:844}],
    ['desktop','overview',{width:1920,height:1080}]
  ]){
    const images=[];
    for(const [revision,isOld] of [['exact-a939-before',true],['authored-court-after',false]]){
      const page=await browser.newPage({viewport,reducedMotion:'reduce'}),errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      try{
        await page.route('**/snapshot',route=>route.fulfill({json:publicFrame}));
        if(isOld)await page.route('**/renderer.mjs',route=>route.fulfill({body:before,contentType:'text/javascript'}));
        await page.goto(baseURL+'/?camera='+mode+'&quality=low',{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.__snakePresentation?.stats()?.frameCount>=4,{}, {timeout:90000});
        const state=await page.evaluate(()=>({
          stats:window.__snakePresentation.stats(),
          webgl:document.getElementById('game').getContext('webgl2')?.getError(),
          caption:document.getElementById('caption')?.textContent?.trim(),
          primary:document.getElementById('primary')?.textContent?.trim(),
          overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth
        }));
        expect(state.stats.renderer).toBe('webgl');
        expect(state.stats.cameraMode).toBe(mode);
        expect(state.stats.world.portalEnds).toBeGreaterThan(0);
        expect(state.stats.world.hazards).toBeGreaterThan(0);
        expect(state.stats.serpent.bodyRings).toBeGreaterThan(2);
        expect(state.stats.livingGarden.meshCount).toBe(4);
        expect(state.webgl).toBe(0);
        expect(errors).toEqual([]);
        expect(state.caption.length).toBeGreaterThan(8);
        expect(state.primary).toContain('LENGTH');
        expect(state.overflow).toBe(false);
        if(!isOld){
          expect(state.stats.courtyardEcology.meshCount).toBe(1);
          expect(state.stats.courtyardEcology.triangles).toBeGreaterThan(200);
        }
        const png=await page.screenshot({path:out('snake-t1-courtyard-'+label+'-'+revision+'.png')});
        expect(png.length).toBeGreaterThan(10000);
        images.push({png,stats:state.stats});
        captures.push({label,revision,viewport,rendererSource:gitBlob(isOld?before:code),
          exactImmutablePublicFrame:sha256(immutable),trueChromiumWebGL:true,
          pngSha256:sha256(png),pngBytes:png.length,
          gpuDrawingBuffer:state.stats.drawingBuffer,
          world:state.stats.world,livingGarden:state.stats.livingGarden,
          courtyardEcology:state.stats.courtyardEcology??null,
          serpent:state.stats.serpent,glError:state.webgl,
          deviceDisplayedFPS:'NOT MEASURED',strictFullDesktopOneSecondGate:'UNCHANGED SEPARATE CHECK'});
      }finally{await page.close();}
    }
    expect(images[0].png.equals(images[1].png)).toBe(false);
    // Exact topology, not an arbitrary historic integer: the recovered
    // renderer attaches ONE extra static original ecology mesh group.
    // Compare every other genuine world resource/cue unchanged. These scene
    // nodes are NOT real GPU submissions; the ≥17 full-desktop gate stays.
    const { drawObjects: beforeObjects, ...beforeWorld } = images[0].stats.world;
    const { drawObjects: afterObjects, ...afterWorld } = images[1].stats.world;
    expect(beforeObjects).toBeGreaterThan(30);
    expect(afterObjects).toBe(beforeObjects+images[1].stats.courtyardEcology.meshCount);
    expect(afterWorld).toEqual(beforeWorld);
    expect(images[0].stats.livingGarden).toEqual(images[1].stats.livingGarden);
    expect(images[0].stats.serpent.geometries).toBe(images[1].stats.serpent.geometries);
  }
  expect(JSON.stringify(publicFrame)).toBe(immutable);
  fs.writeFileSync(out('snake-t1-courtyard-exact-WebGL-comparison.json'),JSON.stringify({
    predecessor:'a93938e55736539ed31b347d53f9573d74d125ee',
    gameRuntimeBefore:'9d3f9ede321a886afcfe7c70cef93bc00c55a54d',
    candidate:'source-matched real scene, no quality verdict inferred',
    independentWholeGameCritic:'NOT AVAILABLE',
    original17GenuineRendererSubmissionGate:'UNTOUCHED',
    visualAcceptance:'T1 BUILDING / SELF REVIEW PENDING',captures
  },null,2)+'\n');
});
test('T1 uninterrupted actual seeded autonomous 55-second gameplay with real new courtyard ecology, not a fake cinematic',async({browser,baseURL})=>{
  test.setTimeout(220000);
  const page=await browser.newPage({viewport:{width:960,height:640},
    recordVideo:{dir:path.join(root,'artifacts/phase3'),size:{width:960,height:640}}});
  const video=page.video(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.goto(baseURL+'/?camera=overview&quality=low',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__snakePresentation?.stats()?.frameCount>=2,{}, {timeout:90000});
    const sample=()=>page.evaluate(async()=>{
      const frame=await(await fetch('/snapshot',{cache:'no-store'})).json();
      return {tick:frame.tick,token:frame.snapshot?.runToken,
        stats:window.__snakePresentation.stats(),
        glError:document.getElementById('game').getContext('webgl2').getError(),
        caption:document.getElementById('caption')?.textContent?.trim()};
    });
    const before=await sample(),start=Date.now();
    await page.waitForTimeout(55000);
    const after=await sample(),elapsedMs=Date.now()-start;
    expect(elapsedMs).toBeGreaterThanOrEqual(50000);
    expect(after.tick>before.tick+50||after.token!==before.token).toBe(true);
    expect(after.stats.frameCount).toBeGreaterThan(before.stats.frameCount+30);
    expect(after.stats.renderer).toBe('webgl');
    expect(after.stats.courtyardEcology.meshCount).toBe(1);
    expect(after.glError).toBe(0);expect(errors).toEqual([]);
    expect(after.caption.length).toBeGreaterThan(8);
    fs.writeFileSync(out('snake-t1-courtyard-genuine-55s.json'),JSON.stringify({
      elapsedMs,fromTick:before.tick,toTick:after.tick,
      fromRunToken:before.token,toRunToken:after.token,
      submittedRendererFramesAcrossEntireMovie:after.stats.frameCount-before.stats.frameCount,
      originalHostAutonomousGameplay:true,scriptedGameEvents:false,
      nominalVideoRateIsNotActualPresentFPS:true,
      movieSubmissionsNotOriginalOneSecond17Gate:true,
      wholeGameReferenceVerdict:'NOT ACCEPTED — self-review pending',
      drawingBuffer:after.stats.drawingBuffer
    },null,2)+'\n');
  }finally{
    await page.close();
    if(video)await video.saveAs(out('snake-t1-courtyard-genuine-55s.webm'));
  }
});

test('T1 real courtyard module is delivered and imported over the existing same-origin browser route', async ({ page }) => {
  const response = await page.request.get('/courtyard-ecology.mjs');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toMatch(/^text\/javascript/);
  const source = await response.text();
  expect(source).toContain('export function createCourtyardEcology');
  await page.goto('/');
  const exported = await page.evaluate(async () => {
    const authoredModule = await import('/courtyard-ecology.mjs');
    return typeof authoredModule.createCourtyardEcology;
  });
  expect(exported).toBe('function');
  await expect(page.locator('#game')).toHaveAttribute('data-renderer', 'webgl');
  expect((await page.evaluate(() => window.__snakePresentation?.stats()?.renderer))).toBe('webgl');
});
