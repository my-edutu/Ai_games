'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
test.use({trace:'off',video:'off',launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}});
const root=path.resolve(__dirname,'../..');
const image=name=>{const dir=path.join(root,'artifacts/phase3');fs.mkdirSync(dir,{recursive:true});return path.join(dir,name);};
const blob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
const remove=(s,a,b)=>{const i=s.indexOf(a),j=s.indexOf(b);
 expect(i).toBeGreaterThanOrEqual(0);expect(j).toBeGreaterThan(i);
 expect(s.indexOf(a,i+1)).toBe(-1);expect(s.indexOf(b,j+1)).toBe(-1);
 return s.slice(0,i)+s.slice(j+b.length);};
test('T1 whole-shore amphitheatre: actual source-verified Chromium WebGL overview/detail/portrait/HD',async({browser,baseURL})=>{
 test.setTimeout(320000);
 const latest=fs.readFileSync(path.join(root,'public/snake-stream/living-garden.mjs'),'utf8');
 const original=remove(remove(latest,'  // BEGIN T1 ESCARPMENT AMPHITHEATRE\n',
  '  // END T1 ESCARPMENT AMPHITHEATRE\n'),
  '      // BEGIN T1 AMPHITHEATRE STATS\n','      // END T1 AMPHITHEATRE STATS\n');
 expect(blob(original)).toBe('05f09d6f4a114c426ad7d96fa6670f93295b93c4');
 const frame=JSON.parse(fs.readFileSync(path.join(root,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
 const intact=JSON.stringify(frame),records=[];
 for(const [scene,mode,viewport] of [
  ['overview','overview',{width:960,height:640}],
  ['hero-detail','detail',{width:960,height:640}],
  ['portrait','overview',{width:390,height:844}],
  ['full-desktop','overview',{width:1920,height:1080}]
 ]){
  const both=[];
  for(const [label,before] of [['exact-1b73-before',true],['amphitheatre-after',false]]){
   const page=await browser.newPage({viewport,reducedMotion:'reduce'}),errors=[];
   page.on('pageerror',err=>errors.push(err.message));
   try{
    await page.route('**/snapshot',route=>route.fulfill({json:frame}));
    if(before)await page.route('**/living-garden.mjs',route=>route.fulfill({body:original,contentType:'text/javascript'}));
    await page.goto(baseURL+'/?camera='+mode+'&quality=low',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__snakePresentation?.stats()?.frameCount>=4,{}, {timeout:90000});
    const state=await page.evaluate(()=>({
     stats:window.__snakePresentation.stats(),
     glError:document.getElementById('game').getContext('webgl2').getError(),
     primary:document.getElementById('primary')?.textContent?.trim(),
     caption:document.getElementById('caption')?.textContent?.trim(),
     overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth
    }));
    const s=state.stats;expect(s.renderer).toBe('webgl');expect(s.cameraMode).toBe(mode);
    expect(s.world.portalEnds).toBeGreaterThan(0);expect(s.world.hazards).toBeGreaterThan(0);
    expect(s.serpent.bodyRings).toBeGreaterThan(2);expect(state.glError).toBe(0);
    expect(state.primary).toContain('LENGTH');expect(state.caption.length).toBeGreaterThan(8);
    expect(state.overflow).toBe(false);expect(errors).toEqual([]);
    expect(s.livingGarden.meshCount).toBe(4);expect(s.livingGarden.textures).toBe(1);
    if(before)expect(s.livingGarden.terracedPromontories).toBeUndefined();
    else {expect(s.livingGarden.terracedPromontories).toBe(8);
     expect(s.livingGarden.canopyTrees).toBe(10);}
    const png=await page.screenshot({path:image('snake-t1-amphitheatre-'+scene+'-'+label+'-actual-webgl.png')});
    expect(png.length).toBeGreaterThan(10000);
    records.push({scene,mode,viewport,version:label,publicTick:frame.tick,
     sourceGitBlob:before?blob(original):blob(latest),
     imageSha256:crypto.createHash('sha256').update(png).digest('hex'),
     drawingBuffer:s.drawingBuffer,drawCalls:s.drawCalls,
     triangles:s.triangles,livingGarden:s.livingGarden,glError:state.glError});
    both.push({png,stats:s});
   }finally{await page.close();}
  }
  expect(both[0].png.equals(both[1].png)).toBe(false);
  expect(both[1].stats.world).toEqual(both[0].stats.world);
  expect(both[1].stats.drawCalls).toBe(both[0].stats.drawCalls);
  expect(both[1].stats.livingGarden.triangles-both[0].stats.livingGarden.triangles)
   .toBe(both[1].stats.livingGarden.amphitheatreTriangles);
  for(const key of ['geometries','materials','textures','bodyRings','bodyVertices',
   'bodyTriangles','paths','maxBodyRings','bufferBytes','truncated'])
   expect(both[1].stats.serpent[key]).toEqual(both[0].stats.serpent[key]);
 }
 expect(JSON.stringify(frame)).toBe(intact);
 fs.writeFileSync(image('snake-t1-amphitheatre-matched-actual-webgl.json'),
  JSON.stringify({exactBeforeHead:'1b73d621d5ebf8adf19a7277b0ad88a00563b3c6',
   exactBeforeGardenBlob:blob(original),newGardenBlob:blob(latest),
   genuineChromiumWebGL:true,actualOneSecondGateUntouched:true,
   physicalDeviceDisplayPresentFps:'NOT VERIFIED',
   independentArtReview:'NOT AVAILABLE',milestone:'T1 BUILDING; SELF-REVIEW PENDING',
   records},null,2)+'\n');
 console.log('SNAKE_T1_AMPHITHEATRE_WEBGL',JSON.stringify({
  images:records.length,exactParentSource:true,fullScene:true,
  oneSecondStrictGateIntact:true,qualityAcceptancePending:true}));
});
