'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const read=name=>fs.readFileSync(path.join(root,'public/snake-stream',name),'utf8');
const digest=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
const output=name=>{const dir=path.join(root,'artifacts/phase3');fs.mkdirSync(dir,{recursive:true});return path.join(dir,name);};
function exactPriorSerpent(current){
 const a='        // BEGIN T2 BOTANICAL DORSAL PIGMENT\n';
 const b='        // END T2 BOTANICAL DORSAL PIGMENT\n';
 const i=current.indexOf(a),j=current.indexOf(b);
 expect(i).toBeGreaterThanOrEqual(0);expect(j).toBeGreaterThan(i);
 expect(current.indexOf(a,i+1)).toBe(-1);expect(current.indexOf(b,j+1)).toBe(-1);
 const original=current.slice(0,i)+current.slice(j+b.length);
 expect(digest(original)).toBe('4384913e44a83473e2f886b5061d81ae3c300f78');
 return original;
}
function exactPriorWorld(current){
 const oldR='      const targetR=96+brightLimestone*95+(mineral-.5)*13;';
 const oldG='      const targetG=117+brightLimestone*9+(cloud-.5)*11;';
 const newR='      const targetR=91+brightLimestone*95+(mineral-.5)*13-richMoss*(1-brightLimestone)*16;';
 const newG='      const targetG=121+brightLimestone*9+(cloud-.5)*11+richMoss*(1-brightLimestone)*8;';
 const begin='      // Monotone material regrade:';
 const end='      // END T1 RECLAIMED GARDEN COMPOSITION';
 const i=current.indexOf(begin),j=current.indexOf(end,i);
 expect(i).toBeGreaterThan(0);expect(j).toBeGreaterThan(i);
 const oldBlock=[
 '      // Keep earlier carved sandstone (warm) and shaded ferns (cool) distinct.',
 '      // Shift neutral muddy stone more strongly than already-authored biomes.',
 '      const hueProtected=previousR>previousG+6||previousG>previousR+23;',
 '      // For previously warm/fern-rich regions shift the *shared luminance*,',
 '      // not the original hue split. This preserves recognizable natural',
 '      // sandstone and green moss instead of repainting one flat new color.',
 '      const oldLuma=(previousR+previousG+previousB)/3;',
 '      const newLuma=(targetR+targetG+targetB)/3+preservedGrain;',
 '      const sharedLift=Math.max(-28,Math.min(51,(newLuma-oldLuma)*tintStrength));',
 '      data[i]=Math.min(priorStoneR,previousR+51,Math.max(0,Math.round(hueProtected',
 '        ?previousR+sharedLift:previousR*(1-tintStrength)+(targetR+preservedGrain)*tintStrength)));',
 '      data[i+1]=Math.min(priorStoneG,previousG+51,Math.max(0,Math.round(hueProtected',
 '        ?previousG+sharedLift:previousG*(1-tintStrength)+(targetG+preservedGrain)*tintStrength)));',
 '      data[i+2]=Math.min(priorStoneB,previousB+51,Math.max(0,Math.round(hueProtected',
 '        ?previousB+sharedLift:previousB*(1-tintStrength)+(targetB+preservedGrain)*tintStrength)));',
 ].join('\n')+'\n';
 const old=current.slice(0,i)+oldBlock+current.slice(j);
 expect(old.split(newR).length).toBe(2);expect(old.split(newG).length).toBe(2);
 const exact=old.replace(newR,oldR).replace(newG,oldG);
 expect(digest(exact)).toBe('2e50161b38f4d82f5b89117b44f265d2c670bbc2');
 return exact;
}
test.use({trace:'off',video:'off',launchOptions:{executablePath:process.env.SNAKE_SYSTEM_CHROMIUM||undefined,
 args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}});
test('T1/T2 cohesive before-vs-current real 8-frame full-scene and serpent Chromium/WebGL comparison',async({browser,baseURL})=>{
 test.setTimeout(360000);
 const world=read('world.mjs'),serpent=read('serpent.mjs');
 const beforeWorld=exactPriorWorld(world),beforeSerpent=exactPriorSerpent(serpent);
 const frame=JSON.parse(fs.readFileSync(path.join(root,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
 const immutable=JSON.stringify(frame),records=[];
 for(const [view,camera,viewport] of [
  ['garden','overview',{width:960,height:640}],
  ['hero','detail',{width:960,height:640}],
  ['portrait','overview',{width:390,height:844}],
  ['full-desktop','overview',{width:1920,height:1080}],
 ]){
  const both=[];
  for(const [label,prior] of [['exact-1400168-before',true],['botanical-scene-after',false]]){
   const page=await browser.newPage({viewport,reducedMotion:'reduce'}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   try{
    await page.route('**/snapshot',route=>route.fulfill({json:frame}));
    if(prior){
     await page.route('**/world.mjs',route=>route.fulfill({body:beforeWorld,contentType:'text/javascript'}));
     await page.route('**/serpent.mjs',route=>route.fulfill({body:beforeSerpent,contentType:'text/javascript'}));
    }
    await page.goto(baseURL+'/?camera='+camera+'&quality=low',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__snakePresentation?.stats()?.frameCount>=4,{}, {timeout:90000});
    const state=await page.evaluate(()=>({
     stats:window.__snakePresentation.stats(),
     glError:document.getElementById('game').getContext('webgl2').getError(),
     caption:document.querySelector('#caption')?.textContent?.trim(),
     primary:document.querySelector('#primary')?.textContent?.trim(),
     overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,
    }));
    const s=state.stats;
    expect(s.renderer).toBe('webgl');expect(s.cameraMode).toBe(camera);
    expect(s.world.portalEnds).toBeGreaterThan(0);expect(s.world.hazards).toBeGreaterThan(0);
    expect(s.serpent.bodyRings).toBeGreaterThan(2);expect(s.livingGarden.meshCount).toBe(4);
    expect(s.livingGarden.textures).toBe(1);expect(state.glError).toBe(0);
    expect(state.caption.length).toBeGreaterThan(8);expect(state.primary).toContain('LENGTH');
    expect(state.overflow).toBe(false);expect(errors).toEqual([]);
    const png=await page.screenshot({path:output('snake-t2-scene-'+view+'-'+label+'.png')});
    expect(png.length).toBeGreaterThan(10000);both.push({png,s});
    records.push({view,label,viewport,publicTick:frame.tick,
     worldBlob:prior?digest(beforeWorld):digest(world),serpentBlob:prior?digest(beforeSerpent):digest(serpent),
     sha256:crypto.createHash('sha256').update(png).digest('hex'),bytes:png.length,
     gpuBuffer:s.drawingBuffer,drawCalls:s.drawCalls,triangles:s.triangles,
     world:s.world,hero:s.serpent,environment:s.livingGarden,glError:state.glError});
   }finally{await page.close();}
  }
  expect(both[0].png.equals(both[1].png)).toBe(false);
  expect(both[0].s.drawCalls).toEqual(both[1].s.drawCalls);
  expect(both[0].s.triangles).toEqual(both[1].s.triangles);
  expect(both[0].s.livingGarden).toEqual(both[1].s.livingGarden);
  for(const key of ['bodyRings','bodyVertices','bodyTriangles','paths','maxBodyRings','bufferBytes','truncated'])
   expect(both[0].s.serpent[key]).toEqual(both[1].s.serpent[key]);
 }
 expect(JSON.stringify(frame)).toBe(immutable);
 fs.writeFileSync(output('snake-t2-botanical-scene-exact-source.json'),JSON.stringify({
  previousHead:'14001680e960f8a63357fca112fef098e05da80c',
  realChromiumWebGL:true,originalHard17GateUnchanged:true,physicalDisplayP95:'NOT VERIFIED',
  independentQuality:'NOT AVAILABLE',milestone:'T1 BUILDING, provisional T2 skin; no acceptance',records,
 },null,2)+'\n');
 console.log('SNAKE_T2_BOTANICAL_SCENE_REAL_WEBGL',JSON.stringify({views:records.length,sourceReproduced:true,qualityAcceptance:false}));
});
