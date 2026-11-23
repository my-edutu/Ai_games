'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const blob=x=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(x)+'\0').update(x).digest('hex');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const dir=path.join(root,'artifacts/phase3');
const assets=[
 ['world','b5ee2db7f91653f3f2fd1b548ab5414950068c1d'],
 ['courtyard-ecology','fec0a9903b8666ca0a22bf9d6fb9747bcf75ca65'],
 ['living-garden','adc2752507543d7f90dd7ebda36864dffa220be4'],
 ['renderer','494e8f7e7fb60e306b5887cba7752494ca707b5d'],
].map(([module,sha])=>({module,sha,original:fs.readFileSync(path.join(root,'tests/fixtures/snake-t1-before-f0-'+module+'.mjs'),'utf8'),
 current:fs.readFileSync(path.join(root,'public/snake-stream/'+module+'.mjs'),'utf8')}));
const frame=JSON.parse(fs.readFileSync(path.join(root,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
const frozen=JSON.stringify(frame);
test.use({trace:'off',video:'off',launchOptions:{executablePath:process.env.SNAKE_SYSTEM_CHROMIUM||undefined,
 args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}});

test('T1 exactly pinned f0 visual baseline versus integrated native earth/forest/light: genuine 8-frame full-game WebGL',async({browser,baseURL})=>{
 test.setTimeout(360000);
 for(const file of assets)expect(blob(file.original),'immutable real Git baseline '+file.module).toBe(file.sha);
 const output=[];
 for(const [scene,camera,viewport] of [
  ['full-hd','overview',{width:1920,height:1080}],
  ['desktop','overview',{width:960,height:640}],
  ['actor-detail','detail',{width:960,height:640}],
  ['portrait','overview',{width:390,height:844}],
 ]){
  let previous=null;
  for(const [kind,isBefore] of [['exact-f0-before',true],['rainforest-bedrock-candidate',false]]){
   const page=await browser.newPage({viewport,reducedMotion:'reduce'}),errors=[];
   page.on('pageerror',err=>errors.push(err.message));
   try{
    await page.route('**/snapshot',route=>route.fulfill({json:frame}));
    if(isBefore)for(const file of assets){
     await page.route('**/'+file.module+'.mjs',route=>route.fulfill({body:file.original,contentType:'text/javascript'}));
    }
    await page.goto(baseURL+'/?camera='+camera+'&quality=low',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__snakePresentation?.stats()?.frameCount>=4,{}, {timeout:90000});
    const result=await page.evaluate(()=>({
     stats:window.__snakePresentation.stats(),
     glError:document.getElementById('game').getContext('webgl2').getError(),
     overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,
     caption:document.getElementById('caption')?.textContent?.trim()||''
    }));
    const s=result.stats;
    expect(errors).toEqual([]);expect(s.renderer).toBe('webgl');expect(s.cameraMode).toBe(camera);
    expect(result.glError).toBe(0);expect(result.overflow).toBe(false);
    expect(result.caption.length).toBeGreaterThan(8);
    expect(s.world.hazards).toBeGreaterThan(0);
    expect(s.world.portalEnds).toBeGreaterThan(0);expect(s.serpent.bodyRings).toBeGreaterThan(2);
    expect(s.livingGarden.meshCount).toBe(4);expect(s.livingGarden.canopyTrees).toBe(10);
    expect(s.livingGarden.textures).toBe(1);expect(s.courtyardEcology.publicCellsMoved).toBe(0);
    const image=await page.screenshot();expect(image.byteLength).toBeGreaterThan(10000);
    fs.mkdirSync(dir,{recursive:true});
    const name='snake-t1-f0-rainforest-'+scene+'-'+kind+'.png';
    fs.writeFileSync(path.join(dir,name),image);
    if(previous){
     expect(image.equals(previous.image)).toBe(false);
     for(const key of ['livingGarden','courtyardEcology','world'])expect(s[key]).toEqual(previous.stats[key]);
     expect(s.drawCalls).toBe(previous.stats.drawCalls);
     expect(s.triangles).toBe(previous.stats.triangles);
    }else previous={image,stats:s};
    output.push({scene,kind,camera,viewport,publicTick:frame.tick,trueChromiumWebGL:true,
     sha256:hash(image),sourceBlobs:assets.map(a=>({module:a.module,sha:blob(isBefore?a.original:a.current)})),
     drawingBuffer:s.drawingBuffer,drawCalls:s.drawCalls,triangles:s.triangles});
   }finally{await page.close();}
  }
 }
 expect(JSON.stringify(frame)).toBe(frozen);
 fs.writeFileSync(path.join(dir,'snake-t1-f0-rainforest-matched-captures.json'),JSON.stringify({
  baselineCommit:'f0dac902d64ae92e22ce083b6eda8d63618e4fae',
  baselineBlobs:assets.map(a=>({module:a.module,sha:a.sha})),
  authoritativeSnapshotUnmodified:true,unchangedOriginalStrict17Gate:true,
  devicePresentedFps:'NOT VERIFIED',independentCritic:'NOT AVAILABLE',
  visualAcceptance:'T1 BUILDING / SELF REVIEW / ACCEPTANCE PENDING',captures:output
 },null,2)+'\n');
});
