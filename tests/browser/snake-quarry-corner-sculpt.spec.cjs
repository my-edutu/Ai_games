'use strict';
const {stripR52Canopy,reapplyR52Canopy}=require('../helpers/snake-r52-canopy-archive.cjs');
const {stripR50Stone,reapplyR50Stone} = require('../helpers/snake-stone-archive.cjs');
const {stripR44Fruit,reapplyR44Fruit}=require('../helpers/snake-fruit-archive.cjs');
const { restorePreR42Water, applyR42Water } = require('../helpers/snake-water-flow-archive.cjs');
const { test,expect } = require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
test.use({launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}});
const repo=path.resolve(__dirname,'../..');
const evidence=name=>{const dir=path.join(repo,'artifacts/phase3');fs.mkdirSync(dir,{recursive:true});return path.join(dir,name);};
test('true WebGL frozen public frame A/B: contained quarry chips versus SHA-verified original court',async({browser,baseURL})=>{
  test.setTimeout(90000);
  const frame=JSON.parse(fs.readFileSync(path.join(repo,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
  const frozen=JSON.stringify(frame);
  const current=fs.readFileSync(path.join(repo,'public/snake-stream/world.mjs'),'utf8');
  // Isolate later R41 for archived SHA only, preserve it in both visual arms.
  const r41Begin = '      // BEGIN R41 COURTYARD ROOT CHANNELS\n';
  const r41End = '      // END R41 COURTYARD ROOT CHANNELS\n';
  const r41A = current.indexOf(r41Begin), r41B = current.indexOf(r41End);
  expect(r41A).toBeGreaterThan(-1);
  expect(r41B).toBeGreaterThan(r41A);
  const r41Block = current.slice(r41A, r41B + r41End.length);
  const historicalSource = stripR52Canopy(stripR50Stone(restorePreR42Water(stripR44Fruit(current.slice(0, r41A) + current.slice(r41B + r41End.length)))));
  // Later R35 foliage tint must not contaminate historic R31/R32 source SHAs,
  // but must remain equally present on both A/B rendered visual candidates.
  const lichenBegin='      // BEGIN R35 PERIMETER LICHEN\n';
  const lichenEnd='      // END R35 PERIMETER LICHEN\n';
  const lichenA=historicalSource.indexOf(lichenBegin),lichenB=historicalSource.indexOf(lichenEnd);
  expect(lichenA).toBeGreaterThan(-1);expect(lichenB).toBeGreaterThan(lichenA);
  const historicWorld=historicalSource.slice(0,lichenA)+historicalSource.slice(lichenB+lichenEnd.length);
  const begin='          // BEGIN R32 ORIGINAL QUARRY CORNER SCULPT\n';
  const end='          // END R32 ORIGINAL QUARRY CORNER SCULPT\n';
  const a=historicWorld.indexOf(begin), b=historicWorld.indexOf(end);
  expect(a).toBeGreaterThan(-1);expect(b).toBeGreaterThan(a);
  expect(historicWorld.indexOf(begin,a+1)).toBe(-1);
  const normals='\n    if (sourceMaterial === tileMat) merged.computeVertexNormals();';
  expect(historicWorld.split(normals).length).toBe(2);
  const prior=(historicWorld.slice(0,a)+historicWorld.slice(b+end.length)).replace(normals,'');
  const gitBlob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
  expect(gitBlob(prior)).toBe('4c50160ffb9c78b822cf2cb8d670e29baf994fea');
  const matchedLichen=historicalSource.slice(lichenA,lichenB+lichenEnd.length);
  const priorWithLichen=reapplyR52Canopy(reapplyR50Stone(reapplyR44Fruit(applyR42Water(prior.replace('      data[i+3]=255;\n','      data[i+3]=255;\n'+matchedLichen+r41Block)),current),current),current);
  const captures={};
  for(const mode of ['overview','detail']){
    captures[mode]={};
    for(const [label,source] of [['before',priorWithLichen],['after',current]]){
      const page=await browser.newPage({viewport:{width:960,height:640},reducedMotion:'reduce'});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      try {
        await page.route('**/snapshot',route=>route.fulfill({json:frame}));
        if(label==='before')await page.route('**/world.mjs',route=>route.fulfill({contentType:'text/javascript',body:source}));
        await page.goto(baseURL+'/?camera='+mode+'&quality=low',{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.__snakePresentation?.stats().frameCount>=3);
        const result=await page.evaluate(()=>({stats:window.__snakePresentation.stats(),glError:document.getElementById('game').getContext('webgl2').getError()}));
        expect(result.stats.renderer).toBe('webgl');expect(result.stats.cameraMode).toBe(mode);
        expect(result.stats.world.staticMeshes).toBe(13);expect(result.stats.world.textures).toBe(4);
        expect(result.glError).toBe(0);expect(errors).toEqual([]);
        const image=await page.screenshot({path:evidence('snake-quarry-corners-'+mode+'-'+label+'-frozen.png')});
        captures[mode][label]={image,stats:result.stats};
      } finally {await page.close();}
    }
    for(const key of ['staticMeshes','drawObjects','geometries','materials','textures'])
      expect(captures[mode].after.stats.world[key]).toBe(captures[mode].before.stats.world[key]);
  }
  expect(Buffer.compare(captures.overview.before.image,captures.overview.after.image)).not.toBe(0);
  expect(JSON.stringify(frame)).toBe(frozen);
});
