'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const read=name=>fs.readFileSync(path.join(root,'public/snake-stream',name),'utf8');
const blob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
const artifact=name=>{const dir=path.join(root,'artifacts/phase3');fs.mkdirSync(dir,{recursive:true});return path.join(dir,name);};
const strip=(s,marker,indent)=>{
 const begin=indent+'// BEGIN '+marker+'\n',end=indent+'// END '+marker+'\n';
 const a=s.indexOf(begin),b=s.indexOf(end);
 expect(a).toBeGreaterThanOrEqual(0);expect(b).toBeGreaterThan(a);
 expect(s.indexOf(begin,a+1)).toBe(-1);expect(s.indexOf(end,b+1)).toBe(-1);
 return s.slice(0,a)+s.slice(b+end.length);
};
test.use({trace:'off',video:'off',launchOptions:{
 executablePath:process.env.SNAKE_SYSTEM_CHROMIUM||undefined,
 args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']
}});
test('T1 original 3d736 before versus reclaimed whole-garden and low shelf source-matched actual Chromium WebGL',async({browser,baseURL})=>{
 test.setTimeout(340000);
 const world=read('world.mjs'),garden=read('living-garden.mjs');
 const originalWorld=strip(world,'T1 RECLAIMED GARDEN COMPOSITION','      ');
 const originalGarden=strip(garden,'T1 BROKEN SHORE SHELF STAGING','    ');
 expect(blob(originalWorld)).toBe('f687f828c211dcd565f2a42a04d7e3be45cad776');
 expect(blob(originalGarden)).toBe('600f7f9346040f0182d0866ee70bdb54dc7e2148');
 const frame=JSON.parse(fs.readFileSync(path.join(root,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
 const frozen=JSON.stringify(frame),evidence=[];
 for(const [view,camera,viewport] of [
  ['overview','overview',{width:960,height:640}],
  ['hero-detail','detail',{width:960,height:640}],
  ['portrait','overview',{width:390,height:844}],
  ['full-desktop','overview',{width:1920,height:1080}]
 ]){
  const both=[];
  for(const [version,prior] of [['exact-3d736-before',true],['reclaimed-garden-after',false]]){
   const page=await browser.newPage({viewport,reducedMotion:'reduce'}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   try{
    await page.route('**/snapshot',route=>route.fulfill({json:frame}));
    if(prior){
     await page.route('**/world.mjs',route=>route.fulfill({body:originalWorld,contentType:'text/javascript'}));
     await page.route('**/living-garden.mjs',route=>route.fulfill({body:originalGarden,contentType:'text/javascript'}));
    }
    await page.goto(baseURL+'/?camera='+camera+'&quality=low',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__snakePresentation?.stats()?.frameCount>=4,{}, {timeout:90000});
    const state=await page.evaluate(()=>({
     stats:window.__snakePresentation.stats(),
     glError:document.getElementById('game').getContext('webgl2').getError(),
     caption:document.querySelector('#caption')?.textContent?.trim(),
     primary:document.querySelector('#primary')?.textContent?.trim(),
     overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth
    }));
    const s=state.stats;
    expect(s.renderer).toBe('webgl');expect(s.cameraMode).toBe(camera);
    expect(s.world.portalEnds).toBeGreaterThan(0);expect(s.world.hazards).toBeGreaterThan(0);
    expect(s.serpent.bodyRings).toBeGreaterThan(2);
    expect(s.livingGarden.terracedPromontories).toBe(8);
    expect(s.livingGarden.meshCount).toBe(4);expect(s.livingGarden.textures).toBe(1);
    expect(state.glError).toBe(0);expect(state.caption.length).toBeGreaterThan(8);
    expect(state.primary).toContain('LENGTH');expect(state.overflow).toBe(false);
    expect(errors).toEqual([]);
    const png=await page.screenshot({path:artifact('snake-t1-reclaimed-'+view+'-'+version+'.png')});
    expect(png.length).toBeGreaterThan(10000);
    both.push({png,stats:s});
    evidence.push({view,version,viewport,publicTick:frame.tick,
     oldSourceGitBlob:prior?blob(originalWorld):blob(world),
     oldGardenGitBlob:prior?blob(originalGarden):blob(garden),
     imageSha256:crypto.createHash('sha256').update(png).digest('hex'),
     bytes:png.length,gpuBuffer:s.drawingBuffer,drawCalls:s.drawCalls,
     triangles:s.triangles,world:s.world,environment:s.livingGarden,glError:state.glError});
   }finally{await page.close();}
  }
  expect(both[0].png.equals(both[1].png)).toBe(false);
  expect(both[0].stats.world).toEqual(both[1].stats.world);
  expect(both[0].stats.livingGarden).toEqual(both[1].stats.livingGarden);
  expect(both[0].stats.drawCalls).toEqual(both[1].stats.drawCalls);
  expect(both[0].stats.triangles).toEqual(both[1].stats.triangles);
  for(const key of ['bodyRings','bodyVertices','bodyTriangles','paths','bufferBytes','truncated'])
   expect(both[0].stats.serpent[key]).toEqual(both[1].stats.serpent[key]);
 }
 expect(JSON.stringify(frame)).toBe(frozen);
 fs.writeFileSync(artifact('snake-t1-reclaimed-matched-actual-webgl.json'),JSON.stringify({
  exactOldHead:'3d736ebc5b9ad128847336066e949c650cbdd265',
  genuineChromiumWebGL:true,fullSourceMatched:true,unchangedOriginalStrictDesktopGate:true,
  physicalDeviceDisplayPresent:'UNKNOWN',independentQualityReview:'NOT AVAILABLE',
  t1:'BUILDING, SELF REVIEW, VISUAL ACCEPTANCE PENDING',evidence},null,2)+'\n');
 console.log('SNAKE_T1_RECLAIMED_WEBGL',JSON.stringify({images:evidence.length,originalSourceVerified:true,genuineWebGL:true,originalGateUnchanged:true,acceptancePending:true}));
});
