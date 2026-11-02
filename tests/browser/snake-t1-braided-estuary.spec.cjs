'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const original=name=>fs.readFileSync(path.join(root,'public/snake-stream',name),'utf8');
const blob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
const sha256=s=>crypto.createHash('sha256').update(s).digest('hex');
function undo(source,label,indent){
 const begin=indent+'// BEGIN '+label+'\n',end=indent+'// END '+label+'\n';
 const i=source.indexOf(begin),j=source.indexOf(end);
 expect(i).toBeGreaterThanOrEqual(0);expect(j).toBeGreaterThan(i);
 expect(source.indexOf(begin,i+1)).toBe(-1);
 return source.slice(0,i)+source.slice(j+end.length);
}
function file(name){const d=path.join(root,'artifacts/phase3');fs.mkdirSync(d,{recursive:true});return path.join(d,name);}
test.use({trace:'off',video:'off',launchOptions:{
 executablePath:process.env.SNAKE_SYSTEM_CHROMIUM||undefined,
 args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']
}});
test('T1 braided 3D coast+court: exact-parent matched genuine Chromium/WebGL whole-game A/B (8 real images)',async({browser,baseURL})=>{
 test.setTimeout(360000);
 const currentWorld=original('world.mjs'),currentGarden=original('living-garden.mjs');
 const priorWorld=undo(currentWorld,'T1 BRAIDED ESTUARY WHOLE-FIELD','      ');
 const priorGarden=undo(currentGarden,'T1 CURVED GEOLOGICAL COAST','    ');
 expect(blob(priorWorld)).toBe('862d9e879dc7ebd814e7041b59372e1984b04ded');
 expect(blob(priorGarden)).toBe('f478a8c6593d7ff89429599f0edbe0314b83e3b6');
 const publicFrame=JSON.parse(fs.readFileSync(path.join(root,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
 const frozen=JSON.stringify(publicFrame),images=[];
 for(const [view,camera,viewport] of [
  ['overview','overview',{width:960,height:640}],
  ['detail','detail',{width:960,height:640}],
  ['portrait','overview',{width:390,height:844}],
  ['desktop-1920','overview',{width:1920,height:1080}]
 ]){
  const states=[];
  for(const [label,old] of [['exact-aa7-before',true],['braided-estuary-after',false]]){
   const page=await browser.newPage({viewport,reducedMotion:'reduce'}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   try{
    await page.route('**/snapshot',route=>route.fulfill({json:publicFrame}));
    if(old){
     await page.route('**/world.mjs',route=>route.fulfill({body:priorWorld,contentType:'text/javascript'}));
     await page.route('**/living-garden.mjs',route=>route.fulfill({body:priorGarden,contentType:'text/javascript'}));
    }
    await page.goto(baseURL+'/?camera='+camera+'&quality=low',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__snakePresentation?.stats()?.frameCount>=4,{}, {timeout:90000});
    const state=await page.evaluate(()=>({
     stats:window.__snakePresentation.stats(),
     glError:document.getElementById('game').getContext('webgl2').getError(),
     caption:document.getElementById('caption')?.textContent?.trim(),
     primary:document.getElementById('primary')?.textContent?.trim(),
     overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth
    }));
    expect(state.stats.renderer).toBe('webgl');expect(state.stats.cameraMode).toBe(camera);
    expect(state.stats.world.portalEnds).toBeGreaterThan(0);
    expect(state.stats.world.hazards).toBeGreaterThan(0);
    expect(state.stats.serpent.bodyRings).toBeGreaterThan(2);
    expect(state.stats.livingGarden.meshCount).toBe(4);
    expect(state.stats.livingGarden.textures).toBe(1);
    expect(state.glError).toBe(0);expect(errors).toEqual([]);
    expect(state.caption.length).toBeGreaterThan(8);
    expect(state.primary).toContain('LENGTH');
    expect(state.overflow).toBe(false);
    const screenshot=await page.screenshot({path:file('snake-t1-braided-'+view+'-'+label+'.png')});
    expect(screenshot.length).toBeGreaterThan(10000);
    images.push({view,label,viewport,sourceWorld:old?blob(priorWorld):blob(currentWorld),
     sourceGarden:old?blob(priorGarden):blob(currentGarden),sha256:sha256(screenshot),
     genuineWebGL:true,unmodifiedPublicFrame:true,glError:state.glError,
     original17GateUnchanged:true,displayPresentFps:'UNKNOWN',
     stats:state.stats});
    states.push({screenshot,stats:state.stats});
   }finally{await page.close();}
  }
  expect(states[0].screenshot.equals(states[1].screenshot)).toBe(false);
  expect(states[0].stats.world).toEqual(states[1].stats.world);
  expect(states[0].stats.livingGarden).toEqual(states[1].stats.livingGarden);
  expect(states[0].stats.drawCalls).toEqual(states[1].stats.drawCalls);
  expect(states[0].stats.triangles).toEqual(states[1].stats.triangles);
  for(const key of ['bodyRings','bodyVertices','bodyTriangles','paths','bufferBytes','truncated'])
   expect(states[0].stats.serpent[key]).toEqual(states[1].stats.serpent[key]);
 }
 expect(JSON.stringify(publicFrame)).toBe(frozen);
 fs.writeFileSync(file('snake-t1-braided-authentic-webgl.json'),JSON.stringify({
  predecessorHead:'aa7bb05acaa4a69996bf1e8ec469993e6666c665',
  predecessorWorldBlob:blob(priorWorld),predecessorGardenBlob:blob(priorGarden),
  realChromiumWebGL:true,unchangedReal17Gate:true,independentVerdict:'NOT AVAILABLE',
  visualAcceptance:'PENDING actual same-source image/motion inspection',
  actualUnscripted55sVideo:'Collected separately by existing snake-t1-connected-reefs.spec.cjs',
  images
 },null,2)+'\n');
 console.log('T1_BRAIDED_WHOLE_SCENE_REAL_WEBGL',JSON.stringify({imageCount:images.length,exactParent:true,acceptance:'PENDING'}));
});
