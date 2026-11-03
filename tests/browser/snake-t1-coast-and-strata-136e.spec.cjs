'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const evidence=name=>{const dir=path.join(root,'artifacts/phase3');fs.mkdirSync(dir,{recursive:true});return path.join(dir,name);};
const blob=x=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(x)+'\0').update(x).digest('hex');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
test.use({trace:'off',video:'off',launchOptions:{executablePath:process.env.SNAKE_SYSTEM_CHROMIUM||undefined,
  args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}});
const originalGarden=fs.readFileSync(path.join(root,'tests/fixtures/snake-t1-before-native-coast-136e.mjs'),'utf8');
const originalEcology=fs.readFileSync(path.join(root,'tests/fixtures/snake-t1-before-native-limestone-136e.mjs'),'utf8');
const candidateGarden=fs.readFileSync(path.join(root,'public/snake-stream/living-garden.mjs'),'utf8');
const candidateEcology=fs.readFileSync(path.join(root,'public/snake-stream/courtyard-ecology.mjs'),'utf8');
const frame=JSON.parse(fs.readFileSync(path.join(root,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
const untouched=JSON.stringify(frame);

test('T1 native coast and limestone: real exact 136e before/after whole-frame Chromium/WebGL on same immutable public game',async({browser,baseURL})=>{
  test.setTimeout(360000);
  expect(blob(originalGarden)).toBe('a73b6b4570691dc1d52d945363b8f92e6e9c2cd2');
  expect(blob(originalEcology)).toBe('1e9b11fd4b6024ba8d022e169f63509b8a1a1378');
  const records=[];
  for(const [scene,camera,viewport] of [
    ['hd-overview','overview',{width:1920,height:1080}],
    ['desktop-overview','overview',{width:960,height:640}],
    ['desktop-detail','detail',{width:960,height:640}],
    ['phone-overview','overview',{width:390,height:844}],
  ]){
    let prior=null;
    for(const [version,before] of [['exact-136e-before',true],['full-stage-candidate',false]]){
      const page=await browser.newPage({viewport,reducedMotion:'reduce'}),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      try{
        await page.route('**/snapshot',route=>route.fulfill({json:frame}));
        if(before){
          await page.route('**/living-garden.mjs',route=>route.fulfill({body:originalGarden,contentType:'text/javascript'}));
          await page.route('**/courtyard-ecology.mjs',route=>route.fulfill({body:originalEcology,contentType:'text/javascript'}));
        }
        await page.goto(baseURL+'/?camera='+camera+'&quality=low',{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.__snakePresentation?.stats()?.frameCount>=4,{}, {timeout:90000});
        const state=await page.evaluate(()=>({
          stats:window.__snakePresentation.stats(),
          glError:document.getElementById('game').getContext('webgl2').getError(),
          overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,
          caption:document.getElementById('caption')?.textContent?.trim()||''
        }));
        const s=state.stats;
        expect(errors).toEqual([]);expect(s.renderer).toBe('webgl');expect(s.cameraMode).toBe(camera);
        expect(s.livingGarden.meshCount).toBe(4);expect(s.livingGarden.textures).toBe(1);
        expect(s.livingGarden.canopyTrees).toBe(10);expect(s.world.portalEnds).toBeGreaterThan(0);
        expect(s.world.hazards).toBeGreaterThan(0);expect(s.serpent.bodyRings).toBeGreaterThan(2);
        expect(state.glError).toBe(0);expect(state.overflow).toBe(false);
        expect(state.caption.length).toBeGreaterThan(8);
        const image=await page.screenshot({path:evidence(`snake-t1-native-136e-${scene}-${version}.png`)});
        expect(image.byteLength).toBeGreaterThan(10000);
        if(prior){
          expect(s.livingGarden).toEqual(prior.stats.livingGarden);
          expect(s.world).toEqual(prior.stats.world);
          expect(s.courtyardEcology).toEqual(prior.stats.courtyardEcology);
          expect(s.drawCalls).toBe(prior.stats.drawCalls);
          expect(s.triangles).toBe(prior.stats.triangles);
          expect(image.equals(prior.image)).toBe(false);
        }
        else prior={stats:s,image};
        records.push({scene,camera,viewport,version,publicTick:frame.tick,
          actualChromiumWebGL:true,sourceGardenBlob:blob(before?originalGarden:candidateGarden),
          sourceEcologyBlob:blob(before?originalEcology:candidateEcology),
          capturedSha256:sha(image),drawingBuffer:s.drawingBuffer,drawCalls:s.drawCalls,
          sceneTriangles:s.triangles,resources:{garden:s.livingGarden,world:s.world},
          cameraMode:s.cameraMode,glError:state.glError});
      }finally{await page.close();}
    }
  }
  expect(JSON.stringify(frame)).toBe(untouched);
  fs.writeFileSync(evidence('snake-t1-native-136e-true-webgl-matched.json'),JSON.stringify({
    exactBeforeCommit:'136e76ce6ca6b51642d433a0305351cd3d063df2',
    candidateGardenBlob:blob(candidateGarden),candidateEcologyBlob:blob(candidateEcology),
    realSourceMatched:true,unchangedOriginal17GenuineDesktopSubmissionGate:true,
    actualDevicePresentedFps:'NOT MEASURED', independentWholeGameCritic:'NOT AVAILABLE',
    milestone:'T1 BUILDING / SELF REVIEW / ACCEPTANCE PENDING',records
  },null,2)+'\n');
});
