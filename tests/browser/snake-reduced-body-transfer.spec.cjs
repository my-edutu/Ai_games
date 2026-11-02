'use strict';
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { restorePreR55 } = require('../helpers/snake-r45-archive.cjs');
test.use({trace:'off',video:'off',
  launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}});
const repo = path.resolve(__dirname,'../..');
const artifact = name => {
  const dir=path.join(repo,'artifacts/phase3');
  fs.mkdirSync(dir,{recursive:true});return path.join(dir,name);
};
const blob = source => crypto.createHash('sha1')
  .update('blob '+Buffer.byteLength(source)+'\0').update(source).digest('hex');

test('R55 same-art Chromium WebGL reduced-motion overview/detail preserve exact pixels without body reuploads', async({browser,baseURL})=>{
  test.setTimeout(200000);
  const source=fs.readFileSync(path.join(repo,'public/snake-stream/serpent.mjs'),'utf8');
  // Keep the exact pre-R55 Git blob as immutable provenance. That original
  // predates the new T2 botanical skin, so rendering it directly against the
  // present shader would compare DIFFERENT ART rather than the R55 transfer.
  const prior=restorePreR55(source);
  expect(blob(prior)).toBe('5c999e0bf4c4f7803527af42da8c680aa1a2144e');
  const newline=String.fromCharCode(10);
  const pigmentStart='        // BEGIN T2 BOTANICAL DORSAL PIGMENT'+newline;
  const pigmentEnd='        // END T2 BOTANICAL DORSAL PIGMENT'+newline;
  const start=source.indexOf(pigmentStart),end=source.indexOf(pigmentEnd);
  expect(start).toBeGreaterThanOrEqual(0);expect(end).toBeGreaterThan(start);
  expect(source.indexOf(pigmentStart,start+1)).toBe(-1);
  expect(source.indexOf(pigmentEnd,end+1)).toBe(-1);
  const pigment=source.slice(start,end+pigmentEnd.length);
  const anchor='        r += (238 - r) * sideGold * 0.48;';
  expect(prior.split(anchor)).toHaveLength(2);
  const matchedPreR55=prior.replace(anchor,pigment+anchor);
  // Independent exact-source check: the old visual arm is now IDENTICAL to
  // today's entire character source except the five bounded R55 blocks.
  // The original pixel-exact and resource-equality assertions remain strict.
  const kept=[];let inside=false,blocks=0;
  for(const line of source.split(newline)){
    const marker=line.trim();
    if(marker.startsWith('// BEGIN R55 ')){
      expect(inside).toBe(false);inside=true;blocks++;continue;
    }
    if(marker.startsWith('// END R55 ')){
      expect(inside).toBe(true);inside=false;continue;
    }
    if(!inside)kept.push(line);
  }
  expect(inside).toBe(false);expect(blocks).toBe(5);
  expect(matchedPreR55).toBe(kept.join(newline));
  const frame=JSON.parse(fs.readFileSync(path.join(repo,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
  frame.snapshot.dangerLevel=0; // neutralize unrelated eased eye danger in fixed A/B
  const immutable=JSON.stringify(frame),rows=[];
  for(const mode of ['overview','detail']){
    const pair=[];
    for(const [variant,serpentSource] of [['before',matchedPreR55],['after',source]]){
      const page=await browser.newPage({viewport:{width:960,height:640},reducedMotion:'reduce'});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      try{
        await page.route('**/snapshot',route=>route.fulfill({json:frame}));
        if(variant==='before')await page.route('**/serpent.mjs',
          route=>route.fulfill({contentType:'text/javascript',body:serpentSource}));
        await page.goto(baseURL+'/?camera='+mode+'&quality=low',{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.__snakePresentation?.stats().frameCount>=6,{}, {timeout:80000});
        const data=await page.evaluate(()=>({
          stats:window.__snakePresentation.stats(),
          glError:document.getElementById('game').getContext('webgl2').getError(),
          primary:document.querySelector('#primary')?.textContent||'',
          caption:document.querySelector('#caption')?.textContent?.trim()||'',
          scrollWidth:document.documentElement.scrollWidth,
          viewportWidth:document.documentElement.clientWidth
        }));
        expect(data.stats.renderer).toBe('webgl');
        expect(data.stats.reducedMotion).toBe(true);
        expect(data.stats.cameraMode).toBe(mode);
        expect(data.stats.serpent.bodyRings).toBeGreaterThan(4);
        expect(data.stats.world.portalEnds).toBeGreaterThan(0);
        expect(data.stats.world.hazards).toBeGreaterThan(0);
        expect(data.primary).toContain('LENGTH');
        expect(data.caption.length).toBeGreaterThan(10);
        expect(data.glError).toBe(0);
        expect(data.scrollWidth).toBe(data.viewportWidth);
        expect(errors).toEqual([]);
        if(variant==='after')expect(data.stats.serpent.reducedBodyTransfer.reusedFrames).toBeGreaterThan(1);
        const png=await page.screenshot({path:artifact('snake-r55-reduced-'+mode+'-'+variant+'-synthetic-real-webgl.png')});
        expect(png.length).toBeGreaterThan(10000);
        pair.push({variant,png,data});
        rows.push({mode,variant,pngSha256:crypto.createHash('sha256').update(png).digest('hex'),
          frameCount:data.stats.frameCount,drawCalls:data.stats.drawCalls,
          triangles:data.stats.triangles,world:data.stats.world,serpent:data.stats.serpent,
          glError:data.glError});
      }finally{await page.close();}
    }
    expect(pair).toHaveLength(2);
    expect(Buffer.compare(pair[0].png,pair[1].png)).toBe(0);
    expect(pair[0].data.stats.drawCalls).toBe(pair[1].data.stats.drawCalls);
    expect(pair[0].data.stats.triangles).toBe(pair[1].data.stats.triangles);
    for(const key of ['geometries','materials','textures','bodyRings','bodyTriangles','paths'])
      expect(pair[0].data.stats.serpent[key]).toBe(pair[1].data.stats.serpent[key]);
  }
  expect(JSON.stringify(frame)).toBe(immutable);
  fs.writeFileSync(artifact('snake-r55-reduced-body-real-webgl.json'),
    JSON.stringify({originalGitBlob:blob(prior),matchedModernBotanicalPigment:true,
      preR55SameArtBlob:blob(matchedPreR55),actualChromiumWebGL:true,
      controlledFrozenPublicFrame:true,noClaimOfThroughputOrDisplayedFps:true,
      untouchedStrictDrawMinimum:17,independentVisualReview:false,rows},null,2)+'\n');
  console.log('SNAKE_R55_REAL_WEBGL_REDUCED',JSON.stringify({modes:['overview','detail'],
    actualWebGL:true,sourceVerified:true,strictLivePacingNotMeasuredByThisTest:true}));
});
