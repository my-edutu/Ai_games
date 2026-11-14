'use strict';
const {test, expect} = require('@playwright/test');
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const out = name => {
  const dir = path.join(root, 'artifacts/phase3');
  fs.mkdirSync(dir, {recursive:true});
  return path.join(dir, name);
};
const source = Object.fromEntries(['index.html','app.js','ux-v2.css','view-copy.mjs'].map(name => {
  const bytes = fs.readFileSync(path.join(root,'public/snake-stream',name));
  return [name,crypto.createHash('sha256').update(bytes).digest('hex')];
}));
test.use({trace:'off', video:'off', launchOptions:{
  executablePath:process.env.SNAKE_SYSTEM_CHROMIUM||undefined,
  args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']
}});

test('T3 exact-source real WebGL UI gives the 3D stage the screen in desktop and portrait with truthful goal, readable captions and distinct controls', async ({browser,baseURL}) => {
  test.setTimeout(210000);
  const records = [];
  for (const [slug,viewport] of [['desktop-1920',{width:1920,height:1080}],['phone-390',{width:390,height:844}]]) {
    const page = await browser.newPage({viewport,reducedMotion:'reduce'});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    try {
      await page.goto(baseURL+'/?quality=low',{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>window.__snakePresentation?.stats()?.frameCount>=3,{}, {timeout:90000});
      await expect(page.locator('#primary')).toContainText('LENGTH');
      const result = await page.evaluate(() => {
        const rect = selector => {
          const r=document.querySelector(selector).getBoundingClientRect();
          return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};
        };
        const overlaps = (a,b) => a.x<b.right-1&&b.x<a.right-1&&a.y<b.bottom-1&&b.y<a.bottom-1;
        const stage=rect('.stage'), captions=rect('.captions'), viewer=rect('.viewer-tools');
        const meter=document.querySelector('#run-progress');
        const stats=window.__snakePresentation.stats();
        return {
          stage, captions, viewer, stats,
          overlaps:overlaps(captions,viewer),
          scrollWidth:document.documentElement.scrollWidth,
          scrollHeight:document.documentElement.scrollHeight,
          viewportWidth:innerWidth,viewportHeight:innerHeight,
          metric:document.querySelector('#primary').textContent.trim(),
          caption:document.querySelector('#caption').textContent.trim(),
          percentage:Number(meter.getAttribute('aria-valuenow')),
          text:meter.getAttribute('aria-valuetext'),
          controls:[...document.querySelectorAll('.viewer-tools [data-control]')].map(x=>x.dataset.control),
          glError:document.querySelector('#game').getContext('webgl2')?.getError(),
          canvas:rect('#game'),
        };
      });
      expect(result.stats.renderer).toBe('webgl');
      expect(result.glError).toBe(0);
      expect(result.stage.width/result.viewportWidth).toBeGreaterThan(.95);
      expect(result.stage.height/result.viewportHeight).toBeGreaterThan(.95);
      expect(result.scrollWidth).toBeLessThanOrEqual(result.viewportWidth);
      expect(result.scrollHeight).toBeLessThanOrEqual(result.viewportHeight);
      expect(result.metric).toContain('LENGTH');
      expect(result.caption.length).toBeGreaterThan(8);
      expect(result.text).toContain('Length');
      expect(result.percentage).toBeGreaterThanOrEqual(0);
      expect(result.percentage).toBeLessThanOrEqual(100);
      expect(result.controls).toEqual(['camera','muted','settings']);
      expect(result.overlaps).toBe(false);
      expect(errors).toEqual([]);
      const png=await page.screenshot({path:out('snake-t3-immersive-'+slug+'-current-head-webgl.png'),fullPage:true});
      records.push({slug,viewport,source,sha256:crypto.createHash('sha256').update(png).digest('hex'),
        measurements:result,devicePhysicalDisplayPresentFps:'NOT MEASURED',
        originalStrict17TrueCompleteDesktopRenderGate:'UNCHANGED / UNMEASURED BY THIS TEST',
        visualAcceptance:'SELF REVIEW / PENDING'});
    } finally {await page.close();}
  }
  fs.writeFileSync(out('snake-t3-immersive-ui-exact-source.json'),JSON.stringify({records,originalGameplayRulesUntouched:true},null,2)+'\n');
});
test('T3 displayed options open by touch; clean feed hides HUD then stage tap restores access', async ({page,baseURL}) => {
  test.setTimeout(120000);
  await page.setViewportSize({width:390,height:844});
  await page.goto(baseURL+'/?quality=low',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#primary')).toContainText('LENGTH');
  const settings=page.locator('[data-control="settings"]');
  await expect(settings).toHaveAttribute('aria-expanded','false');
  await settings.click();
  await expect(settings).toHaveAttribute('aria-expanded','true');
  await expect(page.locator('#display-options')).toBeVisible();
  await expect(page.locator('#display-options [data-control="reduced-motion"]')).toBeVisible();
  await page.locator('[data-control="clean-feed"]').click();
  await expect(page.locator('#broadcast')).toHaveClass(/clean-feed/);
  await expect(page.locator('.hud')).toBeHidden();
  await expect(page.locator('.viewer-tools')).toBeHidden();
  await page.locator('.stage').click({position:{x:32,y:160}});
  await expect(page.locator('#broadcast')).not.toHaveClass(/clean-feed/);
  await expect(settings).toBeVisible();
  await expect(settings).toHaveAttribute('aria-expanded','false');
});
