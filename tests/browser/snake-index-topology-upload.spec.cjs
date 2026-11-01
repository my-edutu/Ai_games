'use strict';
const { restorePreR45 } = require('../helpers/snake-r45-archive.cjs');
const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

test.use({launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}});
const repo=path.resolve(__dirname,'../..');
const blocks=/^[ \t]*\/\/ BEGIN R36 [^\n]*\n[\s\S]*?^[ \t]*\/\/ END R36 [^\n]*\n/gm;
const blob = s => crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
const evidence = name => { const directory=path.join(repo,'artifacts/phase3');fs.mkdirSync(directory,{recursive:true});return path.join(directory,name);};

test('real WebGL overview and detail preserve exact prior pixels while unnecessary body index reuploads are avoided', async ({browser,baseURL}) => {
  test.setTimeout(150000);
  const frame=JSON.parse(fs.readFileSync(path.join(repo,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
  // This is a controlled *synthetic* screenshot fixture, not live gameplay.
  // Its original dangerLevel=1 drives eased eye/face poses: captures at 4 vs 5
  // rendered frames differ by nine 1/255 face pixels independently of indices.
  // Freeze this unrelated easing stimulus to preserve the exact-zero pixel
  // parity threshold; separate danger/active-trap tests use their own fixtures.
  frame.snapshot.dangerLevel=0;
  const publicBytes=JSON.stringify(frame);
  const current=fs.readFileSync(path.join(repo,'public/snake-stream/serpent.mjs'),'utf8');
  expect((current.match(blocks)||[]).length).toBe(7);
  const original=current.replace(blocks,'');
  const r37Blocks = /^[ \t]*\/\/ BEGIN R37 [^\n]*\n[\s\S]*?^[ \t]*\/\/ END R37 [^\n]*\n/gm;
  const r39Blocks = /^[ \t]*\/\/ BEGIN R39 [^\n]*\n[\s\S]*?^[ \t]*\/\/ END R39 [^\n]*\n/gm;
  expect((current.match(r39Blocks) || []).length).toBe(3);
  expect((original.match(r37Blocks) || []).length).toBe(2);
  // Both visual arms retain R37. Only the archived R36-parent SHA is stripped.
  expect(blob(restorePreR45(original.replace(r37Blocks, '').replace(r39Blocks, '')))).toBe('feb317e2c4f8465ff77f33f4d400a4292a795330');
  const evidenceRows=[];
  for(const mode of ['overview','detail']){
    const captures=[];
    for(const [label,source] of [['before',original],['after',current]]){
      const page=await browser.newPage({viewport:{width:960,height:640},reducedMotion:'reduce'});
      const errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      try {
        await page.route('**/snapshot',route=>route.fulfill({json:frame}));
        if(label==='before') await page.route('**/serpent.mjs',route=>route.fulfill({contentType:'text/javascript',body:source}));
        await page.goto(baseURL+'/?camera='+mode+'&quality=low',{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.__snakePresentation?.stats().frameCount>=4);
        const measure=await page.evaluate(()=>({
          stats:window.__snakePresentation.stats(),
          glError:document.getElementById('game').getContext('webgl2').getError(),
        }));
        expect(measure.stats.renderer).toBe('webgl');
        expect(measure.stats.cameraMode).toBe(mode);
        expect(measure.glError).toBe(0);
        expect(errors).toEqual([]);
        const png=await page.screenshot({path:evidence('snake-index-topology-'+mode+'-'+label+'-synthetic.png')});
        captures.push({label,png,measure});
        evidenceRows.push({mode,label,frameCount:measure.stats.frameCount,indexUploadRequests:measure.stats.serpent.indexUploadRequests,
          indexReuseFrames:measure.stats.serpent.indexReuseFrames,bodyRings:measure.stats.serpent.bodyRings,drawCalls:measure.stats.drawCalls});
      } finally {await page.close();}
    }
    expect(Buffer.compare(captures[0].png,captures[1].png)).toBe(0);
    for(const key of ['geometries','materials','textures','bodyRings','bodyTriangles','bufferBytes','paths'])
      expect(captures[1].measure.stats.serpent[key]).toBe(captures[0].measure.stats.serpent[key]);
    expect(captures[1].measure.stats.serpent.indexReuseFrames).toBeGreaterThan(0);
    expect(captures[1].measure.stats.serpent.indexUploadRequests).toBeGreaterThan(0);
  }
  fs.writeFileSync(evidence('snake-index-topology-comparison.json'),JSON.stringify({controlledSyntheticFrame:true,
    notDevicePresentFps:true,notActualDisplayedFps:true,rows:evidenceRows},null,2)+'\n');
  expect(JSON.stringify(frame)).toBe(publicBytes);
});
