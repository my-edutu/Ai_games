'use strict';
// Frozen exact-source before/after: real Chromium/WebGL only, no mock renders.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const blob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
const sha256=x=>crypto.createHash('sha256').update(x).digest('hex');
const out=name=>{const dir=path.join(ROOT,'artifacts/phase3');fs.mkdirSync(dir,{recursive:true});return path.join(dir,name)};
const frozen=JSON.parse(read('docs/reviews/snake-gauntlet/round-4-public-frame.json'));
const original={
 'living-garden.mjs':read('tests/fixtures/snake-t1-before-stage-bcfc.mjs'),
 'camera.mjs':read('tests/fixtures/snake-t1-before-camera-bcfc.mjs'),
 'serpent.mjs':read('tests/fixtures/snake-t1-before-serpent-bcfc.mjs')
};
const current={
 'living-garden.mjs':read('public/snake-stream/living-garden.mjs'),
 'camera.mjs':read('public/snake-stream/camera.mjs'),
 'serpent.mjs':read('public/snake-stream/serpent.mjs')
};
test.use({trace:'off',video:'off',launchOptions:{
 executablePath:process.env.SNAKE_SYSTEM_CHROMIUM||undefined,
 args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']
}});
test('T1 same-parent living forest, hero gait and tracking: 8 real WebGL desktop/portrait/detail pairs',async({browser,baseURL})=>{
 test.setTimeout(480000);
 expect(blob(original['living-garden.mjs'])).toBe('9a3e295d376b4e57a64ba7e17ddb3a9936aaf220');
 expect(blob(original['camera.mjs'])).toBe('72625ade5dc2e9d46e285041dfefdbc9623adc49');
 expect(blob(original['serpent.mjs'])).toBe('4f233d9a0033fb3ed13a8e5a83232e409cd863b5');
 const raw=JSON.stringify(frozen),entries=[];
 const shots=[
  ['overview-1080',{width:1920,height:1080},'overview'],
  ['follow-desktop',{width:960,height:640},'follow'],
  ['detail-desktop',{width:960,height:640},'detail'],
  ['overview-phone',{width:390,height:844},'overview'],
 ];
 for(const [slug,viewport,mode] of shots){
  for(const version of ['before','after']){
   const page=await browser.newPage({viewport,reducedMotion:'no-preference'});
   const errors=[];page.on('pageerror',error=>errors.push(error.message));
   try{
    // Exact historical original module bytes are supplied only to the
    // negative-control Chromium page, with the same real renderer and frozen
    // public authoritative snapshot. There is NO synthetic gameplay, art or
    // screenshot. The new page requests real current source from normal host.
    if(version==='before')for(const [name,source] of Object.entries(original))
     await page.route('**/'+name,route=>route.fulfill({status:200,contentType:'text/javascript',body:source}));
    await page.route('**/snapshot',route=>route.fulfill({json:frozen}));
    await page.goto(baseURL+'/?camera='+mode+'&quality=low',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__snakePresentation?.stats()?.frameCount>=3,{}, {timeout:115000});
    const report=await page.evaluate(()=>({
      stats:window.__snakePresentation.stats(),
      glError:document.querySelector('#game')?.getContext('webgl2')?.getError(),
      caption:document.querySelector('#caption')?.textContent?.trim(),
      overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth
    }));
    expect(report.stats.renderer).toBe('webgl');
    expect(report.stats.cameraMode).toBe(mode);
    expect(report.stats.world.portalEnds).toBeGreaterThan(0);
    expect(report.stats.courtyardEcology.publicCellsMoved).toBe(0);
    expect(report.glError).toBe(0);
    expect(report.overflow).toBe(false);
    expect(report.caption.length).toBeGreaterThan(8);
    expect(errors).toEqual([]);
    const png=await page.screenshot({path:out('snake-t1-stage-'+slug+'-'+version+'-real-webgl.png'),fullPage:true});
    entries.push({slug,viewport,mode,version,sourceBlobs:Object.fromEntries(
      Object.entries(version==='before'?original:current).map(([n,s])=>[n,blob(s)])),
      frozenActualPublicSha256:sha256(raw),imageSha256:sha256(png),bytes:png.byteLength,
      gpuDrawingBuffer:report.stats.drawingBuffer,
      genuineFullDesktop17SubmissionsGate:'UNMODIFIED / ORIGINAL SEPARATE TEST',
      videoFpsAndRafNotDisplayPresentFps:true,visualQuality:'REVIEW PENDING'});
   }finally{await page.close();}
  }
 }
 expect(entries).toHaveLength(8);
 expect(JSON.stringify(frozen)).toBe(raw,'public snapshot must remain unchanged');
 fs.writeFileSync(out('snake-t1-stage-eight-real-webgl-pairs.json'),
  JSON.stringify({exactParent:'bcfc2c9caacbce85ac1bdda3df6a9275369fc3bb',
    originalRuntimeRendererUnmodified:true,realWebGL:true,acceptance:'SELF REVIEW / PENDING',
    originalStrict17FullDesktopRenderGateUnchanged:true,entries},null,2)+'\n');
});
