'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {restorePreR45}=require('../helpers/snake-r45-archive.cjs');
test.use({trace:'off',video:'off',launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}});
const root=path.resolve(__dirname,'../..');
const output=name=>{const dir=path.join(root,'artifacts/phase3');fs.mkdirSync(dir,{recursive:true});return path.join(dir,name);};
const blob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
test('R45 real Chromium/WebGL public-food tongue gesture vs exact prior in both camera modes',async({browser,baseURL})=>{
  test.setTimeout(145000);
  const source=fs.readFileSync(path.join(root,'public/snake-stream/serpent.mjs'),'utf8'),old=restorePreR45(source);
  expect(blob(old)).toBe('73475b622c5a3dde49d35d0fb659c003845b4650');
  const renderer=fs.readFileSync(path.join(root,'public/snake-stream/renderer.mjs'),'utf8');
  const anchor='    const time = timestamp / 1000;';
  expect(renderer.split(anchor).length).toBe(2);
  const fixed=renderer.replace(anchor,'    const time = 1.25; // R45 synthetic-only fixed presentation clock');
  const frame=JSON.parse(fs.readFileSync(path.join(root,'docs/reviews/snake-gauntlet/round-4-public-frame.json'),'utf8'));
  frame.snapshot.snake=frame.snapshot.snake.slice(0,8).map((part,i)=>({...part,cell:14+28*(8-i)}));
  frame.snapshot.food={...frame.snapshot.food,cell:15+28*10};
  frame.snapshot.dangerLevel=0;
  const frozen=JSON.stringify(frame),rows=[];
  for(const mode of ['detail','overview']){
    const captures={};
    for(const [label,character] of [['before',old],['after',source]]){
      const page=await browser.newPage({viewport:{width:960,height:640},reducedMotion:'no-preference'});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      try{
        await page.route('**/snapshot',route=>route.fulfill({json:frame}));
        await page.route('**/renderer.mjs',route=>route.fulfill({contentType:'text/javascript',body:fixed}));
        if(label==='before')await page.route('**/serpent.mjs',route=>route.fulfill({contentType:'text/javascript',body:character}));
        await page.goto(baseURL+'/?camera='+mode+'&quality=low',{waitUntil:'domcontentloaded'});
        await page.waitForFunction(()=>window.__snakePresentation?.stats().frameCount>=5);
        const state=await page.evaluate(()=>({stats:window.__snakePresentation.stats(),
          glError:document.getElementById('game').getContext('webgl2').getError()}));
        expect(state.stats.renderer).toBe('webgl');expect(state.stats.cameraMode).toBe(mode);
        expect(state.stats.serpent.paths).toBe(1);expect(state.glError).toBe(0);
        expect(errors).toEqual([]);
        const png=await page.screenshot({path:output('snake-r45-tongue-'+mode+'-'+label+'-synthetic.png')});
        expect(png.length).toBeGreaterThan(10000);
        captures[label]={png,stats:state.stats};
        rows.push({mode,label,pngSha256:crypto.createHash('sha256').update(png).digest('hex'),
          drawCalls:state.stats.drawCalls,triangles:state.stats.triangles,
          world:state.stats.world,serpent:state.stats.serpent,glError:state.glError});
      }finally{await page.close();}
    }
    for(const key of ['geometries','materials','textures','bufferBytes','bodyRings','bodyVertices','bodyTriangles','paths'])
      expect(captures.before.stats.serpent[key]).toBe(captures.after.stats.serpent[key]);
    for(const key of ['drawObjects','geometries','materials','textures','staticMeshes'])
      expect(captures.before.stats.world[key]).toBe(captures.after.stats.world[key]);
    expect(captures.after.stats.drawCalls).toBeGreaterThanOrEqual(captures.before.stats.drawCalls);
    expect(captures.after.stats.drawCalls-captures.before.stats.drawCalls).toBeLessThanOrEqual(3);
    if(mode==='detail')expect(captures.before.png.equals(captures.after.png)).toBe(false);
    console.log('SNAKE_R45_TONGUE_WEBGL',JSON.stringify({mode,synthetic:true,
      changed:!captures.before.png.equals(captures.after.png),
      beforeSha256:crypto.createHash('sha256').update(captures.before.png).digest('hex'),
      afterSha256:crypto.createHash('sha256').update(captures.after.png).digest('hex'),
      beforeDraws:captures.before.stats.drawCalls,afterDraws:captures.after.stats.drawCalls}));
  }
  fs.writeFileSync(output('snake-r45-tongue-actual-webgl.json'),JSON.stringify({
    originalSerpentGitBlob:'73475b622c5a3dde49d35d0fb659c003845b4650',
    syntheticPublicFixture:true,fixedClockSeconds:1.25,
    notLiveGameplayFps:true,notDisplayPresentFps:true,notIndependentReview:true,rows
  },null,2)+'\n');
  expect(JSON.stringify(frame)).toBe(frozen);
});
