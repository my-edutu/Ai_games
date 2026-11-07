'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const gitBlob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
const sha256=data=>crypto.createHash('sha256').update(data).digest('hex');
const artifact=name=>{const dir=path.join(root,'artifacts/phase3');fs.mkdirSync(dir,{recursive:true});return path.join(dir,name);};
const snapshot=JSON.parse(fs.readFileSync(path.join(root,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
const sources=Object.fromEntries(['world.mjs','garden-watersheds.mjs','courtyard-ecology.mjs'].map(f=>[f,fs.readFileSync(path.join(root,'public/snake-stream',f),'utf8')]));
const OLD={
 'world.mjs':'31581b9f3bfafd955bf0aa609271ab3c3574dafe',
 'garden-watersheds.mjs':'4c97b55f1f11e60ba47fad3fb5b159d262573827',
 'courtyard-ecology.mjs':'3269c5ccacbdd6c2600b73e1316d7a2a5bbce56d'
};
function oldSource(name){
 let s=sources[name];
 const replace=(from,to)=>{
   if(!(typeof from==='string'?s.includes(from):from.test(s)))throw Error('Exact-source predecessor restoration failed: '+name);
   s=s.replace(from,to);
 };
 if(name==='garden-watersheds.mjs'){
   replace(/\/\*\*\n \* Two deeply weathered, winding root galleries[\s\S]*?\n}\n\n(?=export function sampleGardenWatershed)/, '');
   replace(/  \/\/ Each gallery crosses and truly CONNECTS[\s\S]*?  return \{ distance, course, branch, crosslink \};/,
     '  return { distance, course, branch };');
 } else if(name==='world.mjs'){
   replace(/  \/\/ Actual wet forest beds weather[\s\S]*?  const base=\.979\+\.008\*hash\(x\+59,z\+37\)-weatheredRim-\.010\*forest;/,
     '  const base=.970+.018*hash(x+59,z+37)+.006*(1-forest);');
   replace('1-fade(.045,.395,Math.max(0,basinDistance+valleyWarp))',
     '1-fade(.045,.255,Math.max(0,basinDistance+valleyWarp))');
   replace('forest*1.12+forestEdge*.17','forest*.97+forestEdge*.19');
 } else {
   replace('1 - smooth(.03, .455, Math.max(0, groveDistance + forestWarp))',
     '1 - smooth(.03, .235, Math.max(0, groveDistance + forestWarp))');
   replace('const canopyShade = smooth(.10, .57, planted)',
     'const canopyShade = smooth(.11, .69, planted)');
   replace(/      \/\/ Cross-valley galleries are genuine shaded mineral-and-leaf bedding,[\s\S]*?      targetB -= galleryMoss \* 27;\n/,'');
 }
 expect(gitBlob(s)).toBe(OLD[name]);
 expect(gitBlob(sources[name])).not.toBe(OLD[name]);
 return s;
}
function validateSource(){
 for(const file of Object.keys(OLD))oldSource(file);
 expect(fs.readFileSync(path.join(root,'tests/browser/snake-stream.spec.cjs'),'utf8'))
   .toMatch(/expect\(animation\.actualDraws\)\.toBeGreaterThanOrEqual\(17\)/);
}
async function beforeRoutes(page){
 for(const name of Object.keys(OLD)){
   await page.route('**/'+name,r=>r.fulfill({body:oldSource(name),contentType:'text/javascript'}));
 }
}

test.use({trace:'off',video:'off',launchOptions:{
  executablePath:process.env.SNAKE_SYSTEM_CHROMIUM||undefined,
  args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']
}});

test('T1 same-public-state full WebGL BEFORE/AFTER of physically interwoven garden at 1080p, overview, detail and portrait',async({browser,baseURL})=>{
  test.setTimeout(390000);
  validateSource();
  const snapshotBytes=JSON.stringify(snapshot),shots=[];
  for(const [mode,viewport,label] of [
    ['overview',{width:960,height:640},'overview'],
    ['detail',{width:960,height:640},'character-detail'],
    ['overview',{width:390,height:844},'portrait'],
    ['overview',{width:1920,height:1080},'full-hd']
  ]){
    const pair=[];
    for(const [version,isBefore] of [['exact-cfc-before',true],['interwoven-after',false]]){
      const page=await browser.newPage({viewport,reducedMotion:'reduce'});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      try{
        await page.route('**/snapshot',r=>r.fulfill({json:snapshot}));
        if(isBefore)await beforeRoutes(page);
        await page.goto(baseURL+'/?camera='+mode+'&quality=low',{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.__snakePresentation?.stats()?.frameCount>=4,{}, {timeout:100000});
        const state=await page.evaluate(()=>({
          stats:window.__snakePresentation.stats(),
          glError:document.getElementById('game').getContext('webgl2')?.getError(),
          caption:document.getElementById('caption')?.textContent?.trim(),
          length:document.getElementById('primary')?.textContent?.trim(),
          overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,
          fallback:document.getElementById('game').dataset.renderer
        }));
        expect(state.fallback).toBe('webgl');
        expect(state.stats.renderer).toBe('webgl');
        expect(state.stats.cameraMode).toBe(mode);
        expect(state.stats.world.portalEnds).toBeGreaterThan(0);
        expect(state.stats.world.hazards).toBeGreaterThan(0);
        expect(state.stats.courtyardEcology.publicCellsMoved).toBe(0);
        expect(state.stats.courtyardEcology.triangles).toBeLessThan(3100);
        expect(state.stats.world.textures).toBe(4);
        expect(state.stats.courtyardEcology.textures).toBe(0);
        expect(state.stats.serpent.bodyRings).toBeGreaterThan(2);
        expect(state.glError).toBe(0);
        expect(errors).toEqual([]);
        expect(state.overflow).toBe(false);
        expect(state.caption.length).toBeGreaterThan(8);
        expect(state.length).toContain('LENGTH');
        const png=await page.screenshot({path:artifact('snake-t1-interwoven-'+label+'-'+version+'.png')});
        expect(png.length).toBeGreaterThan(10000);
        pair.push({version,pngSha256:sha256(png),png,stats:state.stats});
        shots.push({label,mode,viewport,version,actualWebGL:true,
          snapshotSha256:sha256(Buffer.from(snapshotBytes)),pngSha256:sha256(png),
          drawCalls:state.stats.drawCalls,triangles:state.stats.triangles,
          drawingBuffer:state.stats.drawingBuffer,glError:state.glError});
      }finally{await page.close();}
    }
    expect(pair[0].png.equals(pair[1].png)).toBe(false);
    expect(pair[0].stats.serpent.bodyRings).toBe(pair[1].stats.serpent.bodyRings);
    expect(pair[0].stats.courtyardEcology.publicCellsMoved).toBe(0);
    expect(pair[1].stats.courtyardEcology.publicCellsMoved).toBe(0);
  }
  expect(JSON.stringify(snapshot)).toBe(snapshotBytes);
  const report={sourceBaseline:'cfc65853dbfbc7d551505b351322f125c889c0f9',
    currentModuleBlobs:Object.fromEntries(Object.entries(sources).map(([name,data])=>[name,gitBlob(data)])),
    originalBlobs:OLD,
    shots,strictFullDesktop17Gate:'UNCHANGED / SEPARATE TEST',
    devicePresentFps:'NOT MEASURED',visualVerdict:'SELF REVIEW / ACCEPTANCE PENDING'};
  fs.writeFileSync(artifact('snake-t1-interwoven-authentic-real-webgl.json'),JSON.stringify(report,null,2)+'\n');
});

test('T1 actual unchanged authoritative stream: uncut 55-second interwoven forest 3D gameplay',async({browser,baseURL})=>{
  test.setTimeout(220000);
  validateSource();
  const page=await browser.newPage({viewport:{width:960,height:640},
    recordVideo:{dir:path.join(root,'artifacts/phase3'),size:{width:960,height:640}}});
  const video=page.video(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    // Deliberately NO /snapshot interception and NO scripted gameplay events.
    await page.goto(baseURL+'/?camera=overview&quality=low',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__snakePresentation?.stats()?.frameCount>=2,{}, {timeout:90000});
    const capture=()=>page.evaluate(async()=>{
      const s=await(await fetch('/snapshot',{cache:'no-store'})).json();
      return {tick:s.tick,token:s.snapshot?.runToken,foods:s.snapshot?.foodsCollected,
        stats:window.__snakePresentation.stats(),
        glError:document.getElementById('game').getContext('webgl2')?.getError(),
        caption:document.getElementById('caption')?.textContent?.trim()};
    });
    const before=await capture(),started=Date.now();
    await page.waitForTimeout(55000);
    const after=await capture(),elapsedMs=Date.now()-started;
    expect(elapsedMs).toBeGreaterThanOrEqual(50000);
    expect(after.tick>before.tick+50||after.token!==before.token).toBe(true);
    expect(after.stats.frameCount).toBeGreaterThan(before.stats.frameCount+30);
    expect(after.stats.renderer).toBe('webgl');
    expect(after.stats.courtyardEcology.publicCellsMoved).toBe(0);
    expect(after.glError).toBe(0);expect(errors).toEqual([]);
    expect(after.caption.length).toBeGreaterThan(8);
    fs.writeFileSync(artifact('snake-t1-interwoven-authentic-gameplay.json'),JSON.stringify({
      sourceBlobs:Object.fromEntries(Object.entries(sources).map(([name,data])=>[name,gitBlob(data)])),
      authenticHost:true,scriptedEvents:false,elapsedMs,before,after,
      videoFrameRateIsNotSubmittedRenders:true,
      strictFullDesktop17Gate:'UNCHANGED / SEPARATE TEST',deviceDisplayedFps:'NOT MEASURED',
      independentQualityVerdict:'PENDING'},null,2)+'\n');
  }finally{
    await page.close();
    if(video)await video.saveAs(artifact('snake-t1-interwoven-actual-55s.webm'));
  }
});
