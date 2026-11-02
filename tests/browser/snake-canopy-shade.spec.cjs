'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {stripR52Canopy}=require('../helpers/snake-r52-canopy-archive.cjs');
const {reapplyT1Floodplain}=require('../helpers/snake-t1-floodplain-archive.cjs');
test.use({launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}});
const root=path.resolve(__dirname,'../..');
const artifact=name=>{const dir=path.join(root,'artifacts/phase3');fs.mkdirSync(dir,{recursive:true});return path.join(dir,name);};
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const gitBlob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
test('R52 real Chromium/WebGL grove-canopy shadow A/B: original geometry, all cues and portrait remain',async({browser,baseURL})=>{
  test.setTimeout(175000);
  const source=fs.readFileSync(path.join(root,'public/snake-stream/world.mjs'),'utf8');
  const old=stripR52Canopy(source);
  const oldWithCurrentFloor=reapplyT1Floodplain(old,source);
  expect(gitBlob(old)).toBe('14d4190dc05801e9698c4b7de76365a1eb9e3910');
  const frame=JSON.parse(fs.readFileSync(path.join(root,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
  const frozen=JSON.stringify(frame),records=[];
  for(const [scene,mode,viewport] of [
    ['overview','overview',{width:960,height:640}],
    ['detail','detail',{width:960,height:640}],
    ['portrait','overview',{width:390,height:844}],
  ]){
    const captures={};
    for(const [version,body] of [['parent',oldWithCurrentFloor],['r52',source]]){
      const page=await browser.newPage({viewport,reducedMotion:'reduce'});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      try{
        await page.route('**/snapshot',route=>route.fulfill({json:frame}));
        await page.route('**/world.mjs',route=>route.fulfill({contentType:'text/javascript',body}));
        await page.goto(baseURL+'/?quality=low&camera='+mode,{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.__snakePresentation?.stats().frameCount>=4);
        const value=await page.evaluate(()=>({
          stats:window.__snakePresentation.stats(),
          caption:document.querySelector('#caption')?.textContent||'',
          glError:document.getElementById('game').getContext('webgl2').getError(),
          overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,
        }));
        expect(value.stats.renderer).toBe('webgl');expect(value.stats.cameraMode).toBe(mode);
        expect(value.stats.world.portalEnds).toBeGreaterThan(0);
        expect(value.stats.world.hazards).toBeGreaterThan(0);
        expect(value.stats.serpent.bodyRings).toBeGreaterThan(2);
        expect(value.caption.length).toBeGreaterThan(8);expect(value.overflow).toBe(false);
        expect(value.glError).toBe(0);expect(errors).toEqual([]);
        const image=await page.screenshot({path:artifact('snake-r52-grove-'+scene+'-'+version+'-synthetic-webgl.png')});
        expect(image.length).toBeGreaterThan(10000);
        captures[version]={image,stats:value.stats};
        records.push({scene,version,viewport,sha256:sha(image),bytes:image.length,
          drawCalls:value.stats.drawCalls,triangles:value.stats.triangles,
          geometries:value.stats.geometries,textures:value.stats.textures,
          world:value.stats.world,caption:value.caption,glError:value.glError});
      }finally{await page.close();}
    }
    expect(captures.parent.image.equals(captures.r52.image)).toBe(false);
    for(const key of ['drawCalls','triangles','geometries','textures'])
      expect(captures.r52.stats[key]).toBe(captures.parent.stats[key]);
    for(const key of ['staticMeshes','staticInstances','drawObjects','geometries','materials','textures'])
      expect(captures.r52.stats.world[key]).toBe(captures.parent.stats.world[key]);
  }
  expect(JSON.stringify(frame)).toBe(frozen);
  fs.writeFileSync(artifact('snake-r52-grove-real-webgl.json'),JSON.stringify({
    parentBlob:gitBlob(old),actualChromiumWebGL:true,sourceControlled:true,
    frozenPublic:true,notLiveFramePacing:true,notDisplayPresentFps:true,
    notIndependentVisualReview:true,strictMinimumActualSubmissionsUnchanged:17,records
  },null,2)+'\n');
  console.log('SNAKE_R52_GROVE_WEBGL',JSON.stringify({screenshots:records.length,
    sourceControlled:true,capturesChanged:true,noResourceBudgetIncrease:true}));
});
