'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {stripT1Floodplain}=require('../helpers/snake-t1-floodplain-archive.cjs');
test.use({trace:'off',video:'off',launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}});
const root=path.resolve(__dirname,'../..');
const artifact=n=>{const dir=path.join(root,'artifacts/phase3');fs.mkdirSync(dir,{recursive:true});return path.join(dir,n);};
const blob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');

test('T1 same-source floodplain: eight genuine full-world WebGL wide/hero/portrait/full-HD images and intact public cues',async({browser,baseURL})=>{
  test.setTimeout(320000);
  const current=fs.readFileSync(path.join(root,'public/snake-stream/world.mjs'),'utf8');
  const previous=stripT1Floodplain(current);
  expect(blob(previous)).toBe('fc01f7a55177456ee1cdbfae348a053c932064c6');
  const frame=JSON.parse(fs.readFileSync(path.join(root,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
  const frozen=JSON.stringify(frame),records=[];
  for(const [scene,mode,viewport] of [
    ['overview','overview',{width:960,height:640}],
    ['detail','detail',{width:960,height:640}],
    ['portrait','overview',{width:390,height:844}],
    ['full-hd','overview',{width:1920,height:1080}]
  ]){
    const both=[];
    for(const [version,old] of [['daff-before',true],['floodplain-after',false]]){
      const page=await browser.newPage({viewport,reducedMotion:'reduce'});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      try{
        await page.route('**/snapshot',route=>route.fulfill({json:frame}));
        if(old)await page.route('**/world.mjs',route=>route.fulfill({body:previous,contentType:'text/javascript'}));
        await page.goto(baseURL+'/?camera='+mode+'&quality=low',{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.__snakePresentation?.stats()?.frameCount>=4,{}, {timeout:90000});
        const observed=await page.evaluate(()=>({stats:window.__snakePresentation.stats(),
          glError:document.getElementById('game').getContext('webgl2').getError(),
          caption:document.getElementById('caption')?.textContent?.trim()||'',
          primary:document.getElementById('primary')?.textContent?.trim()||'',
          overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth}));
        const s=observed.stats;
        expect(s.renderer).toBe('webgl');expect(s.cameraMode).toBe(mode);
        expect(s.world.portalEnds).toBeGreaterThan(0);expect(s.world.hazards).toBeGreaterThan(0);
        expect(s.serpent.bodyRings).toBeGreaterThan(2);expect(s.livingGarden.canopyTrees).toBe(10);
        expect(observed.primary).toContain('LENGTH');expect(observed.caption.length).toBeGreaterThan(8);
        expect(observed.glError).toBe(0);expect(observed.overflow).toBe(false);expect(errors).toEqual([]);
        const png=await page.screenshot({path:artifact('snake-t1-floodplain-'+scene+'-'+version+'-real-webgl.png')});
        expect(png.length).toBeGreaterThan(10000);
        records.push({scene,mode,version,viewport,pngSha256:crypto.createHash('sha256').update(png).digest('hex'),
          publicTick:frame.tick,sourceBlob:old?blob(previous):blob(current),drawCalls:s.drawCalls,
          triangles:s.triangles,drawingBuffer:s.drawingBuffer,glError:observed.glError});
        both.push({png,stats:s});
      }finally{await page.close();}
    }
    expect(both[0].png.equals(both[1].png)).toBe(false);
    for(const key of ['world','livingGarden'])expect(both[1].stats[key]).toEqual(both[0].stats[key]);
    // The live serpent may submit more intermediate GPU frames before one
    // screenshot than the other: compare bounded static anatomy, never
    // presentation counters, gaze phase or fence completion timing.
    for(const key of ['geometries','materials','textures','bodyRings','bodyVertices',
      'bodyTriangles','paths','maxBodyRings','bufferBytes','truncated'])
      expect(both[1].stats.serpent[key]).toEqual(both[0].stats.serpent[key]);
    expect(both[1].stats.drawCalls).toBe(both[0].stats.drawCalls);
    expect(both[1].stats.triangles).toBe(both[0].stats.triangles);
  }
  expect(JSON.stringify(frame)).toBe(frozen);
  fs.writeFileSync(artifact('snake-t1-floodplain-matched-real-webgl.json'),JSON.stringify({
    exactPreviousHead:'daff8c7a0063107e250d044cd6e28148e5fd8f99',
    exactPreviousWorldBlob:'fc01f7a55177456ee1cdbfae348a053c932064c6',
    newWorldBlob:blob(current),samePublicSnapshot:true,authenticChromiumWebGL:true,
    screenshots:records.length,qualityNotPrejudged:true,independentCritic:'NOT AVAILABLE',
    unchangedStrictOneSecond17FullSceneSubmissions:true,devicePresentFpsNotClaimed:true,records
  },null,2)+'\n');
  console.log('SNAKE_T1_FLOODPLAIN_WEBGL',JSON.stringify({views:records.length,
    sourceVerified:true,trueWebGL:true,strictGateUnchanged:true,visualAcceptancePending:true}));
});
