'use strict';
const {historicalRendererGitBlob} = require('../helpers/snake-t1-living-archive.cjs');
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {stripR54ShadowStartup}=require('../helpers/snake-r54-shadow-startup-archive.cjs');
test.use({trace:'off',video:'off',launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}});
const repo=path.resolve(__dirname,'../..');
const artifact=name=>{const dir=path.join(repo,'artifacts/phase3');fs.mkdirSync(dir,{recursive:true});return path.join(dir,name);};
const blob = historicalRendererGitBlob;
test('R54 genuine Chromium/WebGL 1080p shadow-atlas first paint plus native/retina controls',async({browser,baseURL})=>{
  test.setTimeout(220000);
  const current=fs.readFileSync(path.join(repo,'public/snake-stream/renderer.mjs'),'utf8');
  const prior=stripR54ShadowStartup(current);
  expect(blob(prior)).toBe('af7b56a8bdf40090e201b4d08f86a5c318aebe0c');
  const publicFrame=JSON.parse(fs.readFileSync(path.join(repo,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
  publicFrame.snapshot.dangerLevel=0;
  const immutable=JSON.stringify(publicFrame);
  // These test-only switches freeze *presentation* clock and late scaling.
  // Strict live pacing in snake-stream.spec.cjs remains unchanged.
  function frozenSource(source){
    const markers=[
      ['    const time = timestamp / 1000;', '    const time = 0; // synthetic public frame only'],
      ['let scaleAdjusted = false;', 'let scaleAdjusted = true; // synthetic first-paint comparison'],
      ['    renderer.setSize(width, height, false);', '    window.__snakeR54ShadowAtlasSize = sun.shadow.mapSize.x;\n    renderer.setSize(width, height, false);'],
    ];
    for(const [find,replacement] of markers){
      expect(source.split(find)).toHaveLength(2);
      source=source.replace(find,replacement);
    }
    return source;
  }
  const modes=[
    {label:'1080p',viewport:{width:1920,height:1080},deviceScaleFactor:1,shadowAfter:1024},
    {label:'native',viewport:{width:960,height:640},deviceScaleFactor:1,shadowAfter:2048},
    {label:'portrait-retina',viewport:{width:390,height:844},deviceScaleFactor:1.5,shadowAfter:2048},
  ];
  const rows=[];
  for(const mode of modes){
    const pair=[];
    for(const [variant,source] of [['before',prior],['after',current]]){
      const page=await browser.newPage({viewport:mode.viewport,deviceScaleFactor:mode.deviceScaleFactor,reducedMotion:'reduce'});
      const errors=[];page.on('pageerror',error=>errors.push(error.message));
      try{
        await page.route('**/snapshot',route=>route.fulfill({json:publicFrame}));
        await page.route('**/renderer.mjs',route=>route.fulfill({contentType:'text/javascript',body:frozenSource(source)}));
        await page.goto(baseURL+'/?camera=overview',{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.__snakePresentation?.stats().frameCount>=4,{}, {timeout:75000});
        const data=await page.evaluate(()=>({
          atlasSize:window.__snakeR54ShadowAtlasSize,stats:window.__snakePresentation.stats(),
          scrollWidth:document.documentElement.scrollWidth,
          viewportWidth:document.documentElement.clientWidth,
          primary:document.querySelector('#primary')?.textContent||'',
          caption:document.querySelector('#caption')?.textContent?.trim()||'',
          glError:document.getElementById('game').getContext('webgl2').getError()
        }));
        expect(data.atlasSize).toBe(variant==='before'?2048:mode.shadowAfter);
        expect(data.stats.renderer).toBe('webgl');
        expect(data.stats.serpent.bodyRings).toBeGreaterThan(3);
        expect(data.stats.world.hazards).toBeGreaterThan(0);
        expect(data.stats.world.portalEnds).toBeGreaterThan(0);
        expect(data.primary).toContain('LENGTH');
        expect(data.caption.length).toBeGreaterThan(10);
        expect(data.scrollWidth).toBe(data.viewportWidth);
        expect(data.glError).toBe(0);
        expect(errors).toEqual([]);
        const png=await page.screenshot({path:artifact('snake-r54-'+mode.label+'-'+variant+'-synthetic-real-webgl.png')});
        expect(png.length).toBeGreaterThan(10000);
        pair.push({variant,data,png});
        rows.push({mode:mode.label,variant,atlasSize:data.atlasSize,pngSha256:crypto.createHash('sha256').update(png).digest('hex'),
          pngBytes:png.length,drawCalls:data.stats.drawCalls,triangles:data.stats.triangles,
          pixelRatio:data.stats.pixelRatio,drawingBuffer:data.stats.drawingBuffer,world:data.stats.world,serpent:data.stats.serpent,
          glError:data.glError,errors});
      }finally{await page.close();}
    }
    expect(pair).toHaveLength(2);
    expect(pair[0].data.stats.pixelRatio).toBe(pair[1].data.stats.pixelRatio);
    expect(pair[0].data.stats.drawingBuffer).toEqual(pair[1].data.stats.drawingBuffer);
    for(const key of ['drawCalls','triangles'])expect(pair[0].data.stats[key]).toBe(pair[1].data.stats[key]);
    for(const key of ['staticMeshes','staticInstances','geometries','materials','textures','drawObjects'])
      expect(pair[0].data.stats.world[key]).toBe(pair[1].data.stats.world[key]);
    for(const key of ['bodyRings','bodyTriangles','geometries','materials','textures','paths'])
      expect(pair[0].data.stats.serpent[key]).toBe(pair[1].data.stats.serpent[key]);
  }
  expect(JSON.stringify(publicFrame)).toBe(immutable);
  fs.writeFileSync(artifact('snake-r54-shadow-atlas-real-webgl.json'),JSON.stringify({
    preR54RendererGitBlob:blob(prior),realChromiumWebGL:true,syntheticFrozenPublic:true,
    untouchedStrictGateMinimum:17,notDevicePresentFps:true,notIndependentVisualApproval:true,rows
  },null,2)+'\n');
  console.log('SNAKE_R54_SHADOW_WEBGL',JSON.stringify({modes:modes.map(m=>m.label),variants:rows.length,
    sourceHashVerified:true,actualWebGL:true,realPacingNotAssessedHere:true}));
});
