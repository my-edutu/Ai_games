'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
test.use({trace:'off',video:'off',launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}});
const root=path.resolve(__dirname,'../..');
const image=name=>{const dir=path.join(root,'artifacts/phase3');fs.mkdirSync(dir,{recursive:true});return path.join(dir,name);};
const blob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
const remove=(s,a,b)=>{
 const i=s.indexOf(a),j=s.indexOf(b);
 expect(i).toBeGreaterThanOrEqual(0);expect(j).toBeGreaterThan(i);
 expect(s.indexOf(a,i+1)).toBe(-1);expect(s.indexOf(b,j+1)).toBe(-1);
 return s.slice(0,i)+s.slice(j+b.length);
};

test('T1 exact-head riparian water garden: actual full-scene, portrait, detail and desktop WebGL before/after',async({browser,baseURL})=>{
 test.setTimeout(320000);
 const world=fs.readFileSync(path.join(root,'public/snake-stream/world.mjs'),'utf8');
 const garden=fs.readFileSync(path.join(root,'public/snake-stream/living-garden.mjs'),'utf8');
 const oldWorld=remove(world,'      // BEGIN T1 WETLAND MASONRY PATINA\n',
  '      // END T1 WETLAND MASONRY PATINA\n');
 const gardenBeforeAmphitheatre=remove(remove(garden,'  // BEGIN T1 ESCARPMENT AMPHITHEATRE\n',
  '  // END T1 ESCARPMENT AMPHITHEATRE\n'),
  '      // BEGIN T1 AMPHITHEATRE STATS\n','      // END T1 AMPHITHEATRE STATS\n');
 const oldGarden=remove(remove(gardenBeforeAmphitheatre,'  // BEGIN T1 LIVING WATER GARDEN\n',
  '  // END T1 LIVING WATER GARDEN\n'),
  '      // BEGIN T1 WATER GARDEN STATS\n','      // END T1 WATER GARDEN STATS\n');
 expect(blob(oldWorld)).toBe('0f69c6ae6324d7fcfa6e0c1e9659fc4be37cc66d');
 expect(blob(oldGarden)).toBe('bdfe91e5305bbe87f3d23d858e03e90b87c47159');
 const frame=JSON.parse(fs.readFileSync(path.join(root,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
 const preserved=JSON.stringify(frame),records=[];
 for(const [scene,camera,viewport] of [
  ['overview','overview',{width:960,height:640}],
  ['hero-detail','detail',{width:960,height:640}],
  ['phone-portrait','overview',{width:390,height:844}],
  ['full-desktop','overview',{width:1920,height:1080}]
 ]){
  const pair=[];
  for(const [version,prior] of [['exact-8c9409c-before',true],['wetland-after',false]]){
   const page=await browser.newPage({viewport,reducedMotion:'reduce'});
   const errors=[];page.on('pageerror',error=>errors.push(error.message));
   try{
    await page.route('**/snapshot',route=>route.fulfill({json:frame}));
    if(prior){
     await page.route('**/world.mjs',route=>route.fulfill({body:oldWorld,contentType:'text/javascript'}));
     await page.route('**/living-garden.mjs',route=>route.fulfill({body:oldGarden,contentType:'text/javascript'}));
    }
    await page.goto(baseURL+'/?camera='+camera+'&quality=low',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__snakePresentation?.stats()?.frameCount>=4,{}, {timeout:90000});
    const observed=await page.evaluate(()=>({stats:window.__snakePresentation.stats(),
     glError:document.getElementById('game').getContext('webgl2').getError(),
     caption:document.getElementById('caption')?.textContent?.trim(),
     primary:document.getElementById('primary')?.textContent?.trim(),
     overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth}));
    const s=observed.stats;
    expect(s.renderer).toBe('webgl');expect(s.cameraMode).toBe(camera);
    expect(s.world.hazards).toBeGreaterThan(0);expect(s.world.portalEnds).toBeGreaterThan(0);
    expect(s.serpent.bodyRings).toBeGreaterThan(2);
    expect(s.livingGarden.meshCount).toBe(4);expect(s.livingGarden.textures).toBe(1);
    if(prior)expect(s.livingGarden.waterGardenPads).toBeUndefined();
    else {expect(s.livingGarden.waterGardenPads).toBe(192);
     expect(s.livingGarden.waterGardenBlooms).toBe(72);}
    expect(observed.primary).toContain('LENGTH');expect(observed.caption.length).toBeGreaterThan(8);
    expect(observed.glError).toBe(0);expect(observed.overflow).toBe(false);
    expect(errors).toEqual([]);
    const png=await page.screenshot({path:image('snake-t1-wetland-'+scene+'-'+version+'-actual-webgl.png')});
    expect(png.length).toBeGreaterThan(10000);
    const info={scene,camera,version,viewport,publicTick:frame.tick,
      worldGitBlob:prior?blob(oldWorld):blob(world),gardenGitBlob:prior?blob(oldGarden):blob(garden),
      imageSHA256:crypto.createHash('sha256').update(png).digest('hex'),imageBytes:png.length,
      drawCalls:s.drawCalls,triangles:s.triangles,drawingBuffer:s.drawingBuffer,
      livingGarden:s.livingGarden,glError:observed.glError};
    records.push(info);pair.push({png,stats:s});
   }finally{await page.close();}
  }
  expect(pair[1].png.equals(pair[0].png)).toBe(false);
  expect(pair[1].stats.drawCalls).toBe(pair[0].stats.drawCalls);
  expect(pair[1].stats.world).toEqual(pair[0].stats.world);
  expect(pair[1].stats.livingGarden.triangles-pair[0].stats.livingGarden.triangles).toBe(2784+pair[1].stats.livingGarden.amphitheatreTriangles);
  for(const key of ['geometries','materials','textures','bodyRings','bodyVertices','bodyTriangles','paths',
   'maxBodyRings','bufferBytes','truncated'])
   expect(pair[1].stats.serpent[key]).toBe(pair[0].stats.serpent[key]);
 }
 expect(JSON.stringify(frame)).toBe(preserved);
 fs.writeFileSync(image('snake-t1-wetland-matched-actual-webgl.json'),JSON.stringify({
  priorExactHead:'8c9409c63fcc85a0ca2fb6db5f69ba82a378d869',
  priorWorldBlob:blob(oldWorld),priorGardenBlob:blob(oldGarden),
  newWorldBlob:blob(world),newGardenBlob:blob(garden),
  snapshotFrozen:true,genuineChromiumWebGL:true,submittedDrawGateUnchanged:true,
  physicalHardwareDisplayPresentFps:'NOT VERIFIED',independentArtReview:'NOT AVAILABLE',
  acceptance:'T1 BUILDING / SELF REVIEW PENDING',records
 },null,2)+'\n');
 console.log('SNAKE_T1_WETLAND_MATCHED_WEBGL',JSON.stringify({views:records.length,
  sourceVerified:true,actualWebGL:true,originalOneSecondHardGateIntact:true,
  independentVisualReview:false,acceptancePending:true}));
});
