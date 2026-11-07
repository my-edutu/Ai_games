'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {restorePreR47}=require('../helpers/snake-r47-overview-archive.cjs');
const repo=path.resolve(__dirname,'../..');
const evidence=name=>{const dir=path.join(repo,'artifacts/phase3');fs.mkdirSync(dir,{recursive:true});return path.join(dir,name);};
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const gitBlob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
test.use({trace:'off',video:'off',launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}});

test('R47 real Chromium live-WebGL follow minimap A/B preserves pixels while skipping unchanged-public paints',async({browser,baseURL,request})=>{
  test.setTimeout(150000);
  const live=await (await request.get('/snapshot')).json();
  const frozen=JSON.stringify(live);
  const currentSource=fs.readFileSync(path.join(repo,'public/snake-stream/overview.mjs'),'utf8');
  const preR47=restorePreR47(currentSource);
  expect(gitBlob(preR47)).toBe('1c74bf0cc0caa87c74c961a149aae3ea82c05502');
  const records=[],miniImages=[];
  for(const [variant,source] of [['prior',preR47],['current',currentSource]]){
    const page=await browser.newPage({viewport:{width:960,height:640},reducedMotion:'reduce'});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    let frame=live,polls=0;
    try{
      await page.addInitScript(()=>{
        window.__r47MiniPaints=0;
        const clear=CanvasRenderingContext2D.prototype.clearRect;
        CanvasRenderingContext2D.prototype.clearRect=function(...args){
          if(this.canvas?.parentElement?.id==='board-overview')window.__r47MiniPaints++;
          return clear.apply(this,args);
        };
      });
      await page.route('**/snapshot',route=>{polls++;return route.fulfill({json:frame});});
      await page.route('**/overview.mjs',route=>route.fulfill({contentType:'text/javascript',body:source}));
      await page.goto(baseURL+'/?camera=follow&quality=low&controls=1',{waitUntil:'domcontentloaded'});
      await expect(page.locator('#board-overview')).toBeVisible();
      await page.waitForFunction(()=>window.__r47MiniPaints>=1 && window.__snakePresentation?.stats().frameCount>=3);
      const baselinePolls=polls;
      await page.waitForTimeout(750);
      const unchanged=await page.evaluate(()=>({paints:window.__r47MiniPaints,
        mini:document.querySelector('#board-overview canvas').toDataURL('image/png'),
        stats:window.__snakePresentation.stats()}));
      expect(polls).toBeGreaterThan(baselinePolls+1);
      expect(unchanged.stats.renderer).toBe('webgl');
      expect(unchanged.stats.cameraMode).toBe('follow');
      expect(unchanged.stats.serpent.paths).toBeGreaterThan(0);
      if(variant==='prior')expect(unchanged.paints).toBeGreaterThanOrEqual(3);
      else expect(unchanged.paints).toBe(1);
      miniImages.push(unchanged.mini);
      const fullScreenshot=await page.screenshot({path:evidence('snake-r47-'+variant+'-real-webgl-follow.png')});
      expect(fullScreenshot.length).toBeGreaterThan(10000);
      // A changed caption on the same public revision is live and does not
      // invalidate the 2D map; UI captions remain their own authority.
      const sameRevisionCaption='R47 public-caption propagation remains live';
      frame={...frame,hud:{...frame.hud,caption:sameRevisionCaption}};
      await expect(page.locator('#caption')).toHaveText(sameRevisionCaption);
      const afterCaption=await page.evaluate(()=>window.__r47MiniPaints);
      if(variant==='current')expect(afterCaption).toBe(unchanged.paints);
      // Public trap activation can change on a non-movement tick; it MUST repaint.
      // The visual signal is preserved without rewriting the authoritative model.
      expect(frame.snapshot.hazards.length).toBeGreaterThan(0);
      const originalHazards=frame.snapshot.hazards;
      frame={...frame,snapshot:{...frame.snapshot,hazards:originalHazards.map((hazard,index)=>
        index===0?{...hazard,active:!hazard.active}:hazard)}};
      await page.waitForFunction(previous=>window.__r47MiniPaints>previous,afterCaption);
      const afterTrap=await page.evaluate(()=>window.__r47MiniPaints);
      if(variant==='current')expect(afterTrap).toBe(afterCaption+1);
      expect(await page.evaluate(()=>document.querySelector('#board-overview canvas').toDataURL('image/png'))).not.toBe(unchanged.mini);
      frame={...frame,snapshot:{...frame.snapshot,hazards:originalHazards}};
      await page.waitForFunction(previous=>window.__r47MiniPaints>previous,afterTrap);
      const afterTrapRestore=await page.evaluate(()=>window.__r47MiniPaints);
      if(variant==='current')expect(afterTrapRestore).toBe(afterTrap+1);
      expect(await page.evaluate(()=>document.querySelector('#board-overview canvas').toDataURL('image/png'))).toBe(unchanged.mini);
      // Only revision changes, with identical real public cell contents.
      frame={...frame,snapshot:{...frame.snapshot,revision:frame.snapshot.revision+1}};
      await page.waitForFunction(previous=>window.__r47MiniPaints>previous,afterTrapRestore);
      const afterRevision=await page.evaluate(()=>window.__r47MiniPaints);
      if(variant==='current')expect(afterRevision).toBe(afterTrapRestore+1);
      expect(await page.evaluate(()=>document.querySelector('#board-overview canvas').toDataURL('image/png'))).toBe(unchanged.mini);
      // Verify hidden camera overview and the follow return repaint the board.
      await page.locator('#board-overview').click();
      await expect(page.locator('#board-overview')).toBeHidden();
      const beforeReturn=await page.evaluate(()=>window.__r47MiniPaints);
      await page.locator('[data-control="camera"]').click();
      await expect(page.locator('#board-overview')).toBeVisible();
      await page.waitForFunction(previous=>window.__r47MiniPaints>previous,beforeReturn);
      const afterReturn=await page.evaluate(()=>window.__r47MiniPaints);
      if(variant==='current')expect(afterReturn).toBe(beforeReturn+1);
      const glError=await page.evaluate(()=>document.getElementById('game').getContext('webgl2').getError());
      expect(glError).toBe(0);
      expect(errors).toEqual([]);
      records.push({variant,realChromiumWebGL:true,syntheticFrozenPublicSnapshot:true,
        initialFixedRevisionPaints:unchanged.paints,afterCaption,afterTrap,afterTrapRestore,
        afterRevision,beforeReturn,afterReturn,glError,
        rawMiniCanvasSha256:sha(unchanged.mini),realFullScreenshotSha256:sha(fullScreenshot),
        drawSubmissionsAtCapture:unchanged.stats.frameCount,
        allLiveCues:!!(frame.snapshot?.portals&&frame.snapshot?.hazards&&frame.snapshot?.food),
        camera:unchanged.stats.cameraMode,renderer:unchanged.stats.renderer});
    }finally{await page.close();}
  }
  expect(miniImages[0]).toBe(miniImages[1]);
  expect(JSON.stringify(live)).toBe(frozen);
  fs.writeFileSync(evidence('snake-r47-overview-actual-webgl-evidence.json'),JSON.stringify({
    priorOverviewGitBlob:'1c74bf0cc0caa87c74c961a149aae3ea82c05502',
    exactMiniCanvasPixelParity:true,modelNotModified:true,
    syntheticFrozenPublicSnapshot:true,notLiveDefaultDesktopPacing:true,
    notDeviceDisplayPresentFps:true,notIndependentVisualReview:true,records
  },null,2)+'\n');
});
