'use strict';
const { test, expect } = require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'public/snake-stream/serpent.mjs'),'utf8');
const blob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
const sha256=s=>crypto.createHash('sha256').update(s).digest('hex');
const out=n=>{const d=path.join(root,'artifacts/phase3');fs.mkdirSync(d,{recursive:true});return path.join(d,n);};
const {restoreBendParent,previousBlob:beforeBlob}=require('../fixtures/snake-t2-restore-bend-parent.cjs');
const prior=restoreBendParent(source);
test.use({trace:'off',video:'off',launchOptions:{executablePath:process.env.SNAKE_SYSTEM_CHROMIUM||undefined,
  args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}});

test('T2 real same-snapshot 3D desktop, full-1080, follow and portrait: unchanged full-serpent geometry spend redirected to actual corners',async({browser,baseURL})=>{
  test.setTimeout(360000);
  const publicFrame=JSON.parse(fs.readFileSync(path.join(root,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
  const frozen=JSON.stringify(publicFrame),records=[];
  expect(publicFrame.snapshot.snake.length).toBeGreaterThan(40);
  for(const [name,mode,viewport] of [
    ['broadcast','overview',{width:960,height:640}],
    ['full-1080p','overview',{width:1920,height:1080}],
    ['living-hero','follow',{width:960,height:640}],
    ['phone','overview',{width:390,height:844}],
  ]){
    let first=null;
    for(const [label,parent] of [['exact-parent',true],['T2-bend-density',false]]){
      const page=await browser.newPage({viewport,reducedMotion:'reduce'}),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      try {
        await page.route('**/snapshot',route=>route.fulfill({json:publicFrame}));
        if(parent)await page.route('**/serpent.mjs',route=>route.fulfill({body:prior,contentType:'text/javascript'}));
        await page.goto(baseURL+'/?camera='+mode+'&quality=low',{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.__snakePresentation?.stats()?.frameCount>=4,{}, {timeout:90000});
        const state=await page.evaluate(()=>({s:window.__snakePresentation.stats(),
          error:document.getElementById('game').getContext('webgl2')?.getError(),
          caption:document.getElementById('caption')?.textContent?.trim(),
          overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth}));
        expect(state.s.renderer).toBe('webgl');expect(state.s.cameraMode).toBe(mode);
        expect(state.s.serpent.paths).toBeGreaterThan(1);
        expect(state.s.serpent.bodyRings).toBeGreaterThan(75);
        expect(state.s.world.hazards).toBeGreaterThan(0);
        expect(state.s.world.portalEnds).toBeGreaterThan(0);
        expect(state.s.serpent.truncated).toBe(false);
        expect(state.error).toBe(0);expect(errors).toEqual([]);
        expect(state.caption.length).toBeGreaterThan(8);expect(state.overflow).toBe(false);
        const png=await page.screenshot({path:out('snake-t2-bend-'+name+'-'+label+'.png')});
        expect(png.length).toBeGreaterThan(12000);
        records.push({name,label,mode,viewport,actualWebGL:true,sourceBlob:blob(parent?prior:source),
          realPublicTick:publicFrame.tick,sha256:sha256(png),bytes:png.length,
          drawingBuffer:state.s.drawingBuffer,drawCalls:state.s.drawCalls,
          bodyRings:state.s.serpent.bodyRings,bodyTriangles:state.s.serpent.bodyTriangles,
          portalFragments:state.s.serpent.paths,glError:state.error});
        if(first){
          expect(png.equals(first.png)).toBe(false);
          for(const k of ['bodyRings','bodyVertices','bodyTriangles','paths','maxBodyRings','bufferBytes','truncated'])
            expect(state.s.serpent[k]).toEqual(first.s.serpent[k]);
          expect(state.s.world).toEqual(first.s.world);
          expect(state.s.drawCalls).toBe(first.s.drawCalls);
        }else first={png,s:state.s};
      }finally {await page.close();}
    }
  }
  expect(JSON.stringify(publicFrame)).toBe(frozen);
  fs.writeFileSync(out('snake-t2-bend-8-real-WebGL-views.json'),JSON.stringify({
    exactParent:'df113ebbe2ce426b7294bf682b3fbfedaf31351f',parentBlob:beforeBlob,
    currentBlob:blob(source),realChromium:true,sameFrozenPublicSnapshot:true,
    originalCompleteDesktop17Gate:'UNCHANGED / NOT SUBSTITUTED',
    displayPresentP95:'NOT MEASURED',independentCritic:'NOT AVAILABLE',
    milestone:'T1 BUILDING / T2 native candidate SELF REVIEW ONLY / T4 HARD RED',records,
  },null,2)+'\n');
  console.log('SNAKE_T2_BEND_TRUE_WEBGL',JSON.stringify({views:records.length,sourceMatched:true,accepted:false}));
});

test('T2 55 seconds of untouched real host/AI gameplay with 3D movement, portal/cues, no scripted events or fake FPS',async({browser,baseURL})=>{
  test.setTimeout(190000);
  const page=await browser.newPage({viewport:{width:960,height:640},
    recordVideo:{dir:path.join(root,'artifacts/phase3'),size:{width:960,height:640}}});
  const video=page.video(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const sample=()=>page.evaluate(async()=>{
    const frame=await(await fetch('/snapshot',{cache:'no-store'})).json();
    return {tick:frame.tick,runToken:frame.snapshot?.runToken,s:window.__snakePresentation.stats(),
      glError:document.getElementById('game').getContext('webgl2')?.getError()};
  });
  let first,last,elapsed;
  try{
    // No route interception: the real server advances real autonomous seeded play.
    await page.goto(baseURL+'/?camera=overview&quality=low',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__snakePresentation?.stats()?.frameCount>=2,{}, {timeout:90000});
    first=await sample();const start=Date.now();await page.waitForTimeout(55000);
    last=await sample();elapsed=Date.now()-start;
    expect(last.tick>first.tick+50||last.runToken!==first.runToken).toBe(true);
    expect(last.s.renderer).toBe('webgl');
    expect(last.s.frameCount).toBeGreaterThan(first.s.frameCount+25);
    expect(last.glError).toBe(0);expect(errors).toEqual([]);
  }finally{
    await page.close();if(video)await video.saveAs(out('snake-t2-bend-unmodified-autonomous-55s.webm'));
  }
  fs.writeFileSync(out('snake-t2-bend-authentic-55s.json'),JSON.stringify({
    exactSourceBlob:blob(source),head:'PENDING_SOURCE_COMMIT',realAutonomousHost:true,
    noSnapshotMock:true,noArtificialEvents:true,elapsedMs:elapsed,
    firstTick:first?.tick,lastTick:last?.tick,firstRun:first?.runToken,lastRun:last?.runToken,
    actualWebGLSubmissions:last?.s.frameCount-first?.s.frameCount,
    originalStrict17Gate:'UNCHANGED / SEPARATE ORIGINAL ONE SECOND',
    devicePresentedFPS:'NOT MEASURED',independentQuality:'PENDING',
  },null,2)+'\n');
});
