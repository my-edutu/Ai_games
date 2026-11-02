'use strict';
const { restorePreR45 } = require('../helpers/snake-r45-archive.cjs');
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
test.use({launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}});
const repo=path.resolve(__dirname,'../..');
const evidence=name=>{const dir=path.join(repo,'artifacts/phase3');fs.mkdirSync(dir,{recursive:true});return path.join(dir,name);};
const hash=text=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(text)+'\0').update(text).digest('hex');

test('real WebGL: original public-food skull attention is visible against exact previous source',async({browser,baseURL})=>{
  test.setTimeout(120000);
  // Clearly labelled synthetic public frame. Not live game or performance proof.
  const frame=JSON.parse(fs.readFileSync(path.join(repo,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
  frame.snapshot.snake=frame.snapshot.snake.slice(0,8).map((part,i)=>({...part,cell:14+28*(8-i)}));
  frame.snapshot.food={...frame.snapshot.food,cell:17+28*11};
  const frozen=JSON.stringify(frame);
  const current=restorePreR45(fs.readFileSync(path.join(repo,'public/snake-stream/serpent.mjs'),'utf8'));
  // Frozen R34 head-focus A/B must not execute later R45 code against R34's absent focusYaw variable.
  const oldDecl='  let gazeX = 0, gazeY = 0, previousRunToken;';
  const newDecl='  let gazeX = 0, gazeY = 0, previousRunToken, focusYaw = 0;';
  const begin='    // BEGIN R34 PUBLIC FOOD ATTENTION\n';
  const end='    // END R34 PUBLIC FOOD ATTENTION\n';
  expect(current.split(newDecl).length).toBe(2);
  const a=current.indexOf(begin),b=current.indexOf(end);
  expect(a).toBeGreaterThan(-1);
  expect(b).toBeGreaterThan(a);
  expect(current.indexOf(begin,a+1)).toBe(-1);
  const previous=(current.slice(0,a)+current.slice(b+end.length)).replace(newDecl,oldDecl);
  // Newer R36 topology transfer belongs in BOTH R34 visual captures.
  // Strip R36 only for the prior-R34 historical blob guard.
  const r36Blocks = /^[ \t]*\/\/ BEGIN R36 [^\n]*\n[\s\S]*?^[ \t]*\/\/ END R36 [^\n]*\n/gm;
  expect((previous.match(r36Blocks) || []).length).toBe(7);
  const r37Blocks = /^[ \t]*\/\/ BEGIN R37 [^\n]*\n[\s\S]*?^[ \t]*\/\/ END R37 [^\n]*\n/gm;
  const r39Blocks = /^[ \t]*\/\/ BEGIN R39 [^\n]*\n[\s\S]*?^[ \t]*\/\/ END R39 [^\n]*\n/gm;
  expect((previous.match(r39Blocks) || []).length).toBe(3);
  expect((previous.match(r37Blocks) || []).length).toBe(2);
  expect(hash(previous.replace(r36Blocks, '').replace(r37Blocks, '').replace(r39Blocks, ''))).toBe('6d0dd900301c5f684567ab94a185f9535ee6d69c');
  const captures={};
  for(const mode of ['overview','detail']){
    captures[mode]={};
    for(const [name,source] of [['before',previous],['after',current]]){
      const page=await browser.newPage({viewport:{width:960,height:640},reducedMotion:'reduce'});
      const errors=[];page.on('pageerror',error=>errors.push(error.message));
      try{
        await page.route('**/snapshot',route=>route.fulfill({json:frame}));
        if(name==='before')await page.route('**/serpent.mjs',route=>route.fulfill({contentType:'text/javascript',body:source}));
        await page.goto(baseURL+'/?camera='+mode+'&quality=low',{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.__snakePresentation?.stats().frameCount>=3);
        const metrics=await page.evaluate(()=>({stats:window.__snakePresentation.stats(),glError:document.getElementById('game').getContext('webgl2').getError()}));
        expect(metrics.stats.renderer).toBe('webgl');
        expect(metrics.stats.cameraMode).toBe(mode);
        expect(metrics.stats.serpent.paths).toBe(1);
        expect(metrics.glError).toBe(0);
        expect(errors).toEqual([]);
        const png=await page.screenshot({path:evidence('snake-head-attention-'+mode+'-'+name+'-synthetic.png')});
        captures[mode][name]={png,stats:metrics.stats};
      }finally{await page.close();}
    }
    for(const key of ['geometries','materials','textures','bodyVertices','bufferBytes'])
      expect(captures[mode].after.stats.serpent[key]).toBe(captures[mode].before.stats.serpent[key]);
    for(const key of ['staticMeshes','drawObjects','geometries','materials','textures'])
      expect(captures[mode].after.stats.world[key]).toBe(captures[mode].before.stats.world[key]);
  }
  expect(Buffer.compare(captures.detail.before.png,captures.detail.after.png)).not.toBe(0);
  expect(JSON.stringify(frame)).toBe(frozen);
});
