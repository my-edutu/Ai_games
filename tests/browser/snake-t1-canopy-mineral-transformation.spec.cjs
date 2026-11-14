'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const artifact=name=>{const dir=path.join(root,'artifacts/phase3');fs.mkdirSync(dir,{recursive:true});return path.join(dir,name);};
const blob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
test.use({trace:'off',video:'off',launchOptions:{
 executablePath:process.env.SNAKE_SYSTEM_CHROMIUM||undefined,
 args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']
}});

test('T1 actual head same-source forest crowns plus owned mineral relief vs frozen 7d1: REAL WebGL HD/desktop/detail/phone',async({browser,baseURL})=>{
  test.setTimeout(330000);
  const oldGarden=fs.readFileSync(path.join(root,'tests/fixtures/snake-t1-before-folded-canopy-7d1.mjs'),'utf8');
  const oldCourt=fs.readFileSync(path.join(root,'tests/fixtures/snake-t1-before-mineral-field-7d1.mjs'),'utf8');
  const nowGarden=fs.readFileSync(path.join(root,'public/snake-stream/living-garden.mjs'),'utf8');
  const nowCourt=fs.readFileSync(path.join(root,'public/snake-stream/courtyard-ecology.mjs'),'utf8');
  expect(blob(oldGarden)).toBe('b3bece718beba994dd7eb50e13b96675aafb34c4');
  expect(blob(oldCourt)).toBe('8c25517a65f926578878f4b0770fd743296f8a1f');
  const frame=JSON.parse(fs.readFileSync(path.join(root,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
  const frozen=JSON.stringify(frame),captures=[];
  for(const [view,mode,viewport] of [
    ['full-hd','overview',{width:1920,height:1080}],
    ['desktop','overview',{width:960,height:640}],
    ['character','detail',{width:960,height:640}],
    ['phone','overview',{width:390,height:844}]
  ]){
    const pair=[];
    for(const [version,before] of [['7d1-real-head',true],['same-simulation-silhouette-candidate',false]]){
      const page=await browser.newPage({viewport,reducedMotion:'reduce'}),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      try{
        await page.route('**/snapshot',route=>route.fulfill({json:frame}));
        if(before){
          await page.route('**/living-garden.mjs',route=>route.fulfill({body:oldGarden,contentType:'text/javascript'}));
          await page.route('**/courtyard-ecology.mjs',route=>route.fulfill({body:oldCourt,contentType:'text/javascript'}));
        }
        await page.goto(baseURL+'/?camera='+mode+'&quality=low',{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.__snakePresentation?.stats()?.frameCount>=4,{}, {timeout:90000});
        const result=await page.evaluate(()=>({
          stats:window.__snakePresentation.stats(),
          gl:document.getElementById('game').getContext('webgl2').getError(),
          caption:document.querySelector('#caption')?.textContent?.trim()||'',
          overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth
        }));
        const s=result.stats;
        expect(s.renderer).toBe('webgl');
        expect(s.cameraMode).toBe(mode);
        expect(s.livingGarden.canopyTrees).toBe(10);
        expect(s.livingGarden.meshCount).toBe(4);
        expect(s.livingGarden.textures).toBe(1);
        expect(s.world.portalEnds).toBeGreaterThan(0);
        expect(s.world.hazards).toBeGreaterThan(0);
        expect(s.serpent.bodyRings).toBeGreaterThan(2);
        expect(result.gl).toBe(0);expect(result.overflow).toBe(false);
        expect(result.caption.length).toBeGreaterThan(8);
        expect(errors).toEqual([]);
        const png=await page.screenshot({path:artifact('snake-t1-canopy-mineral-'+view+'-'+version+'.png')});
        expect(png.length).toBeGreaterThan(10000);
        captures.push({view,version,viewport,publicTick:frame.tick,sourceGardenBlob:blob(before?oldGarden:nowGarden),
          sourceCourtyardBlob:blob(before?oldCourt:nowCourt),pngSha256:sha(png),bytes:png.length,
          drawingBuffer:s.drawingBuffer,genuine3D:true,drawCalls:s.drawCalls,triangles:s.triangles,
          garden:s.livingGarden,glError:result.gl});
        pair.push({png,stats:s});
      }finally{await page.close();}
    }
    expect(pair[0].png.equals(pair[1].png)).toBe(false);
    for(const key of ['world','livingGarden','drawCalls','triangles'])expect(pair[0].stats[key]).toEqual(pair[1].stats[key]);
  }
  expect(JSON.stringify(frame)).toBe(frozen);
  fs.writeFileSync(artifact('snake-t1-canopy-mineral-source-matched-real-webgl.json'),
    JSON.stringify({beforeGardenBlob:blob(oldGarden),beforeCourtBlob:blob(oldCourt),
      afterGardenBlob:blob(nowGarden),afterCourtBlob:blob(nowCourt),
      sourceMatchedRendererAndGame:true,realChromium:true,notDevicePresentFPS:true,
      authentic55SecondGameplayCoveredByExistingHostBrowserChecks:true,
      originalOneSecond17FullDesktopGateUnchanged:true,
      independentCritic:'NOT YET',acceptance:'T1 BUILDING / SELF REVIEW PENDING',captures},null,2)+'\n');
});
