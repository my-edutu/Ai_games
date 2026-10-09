'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const ROOT = 'http://127.0.0.1:4177';
test.describe('Eko Run 3D Gauntlet slice', () => {
  test('desktop: renders real WebGL gameplay from advancing authority', async ({ page }) => {
    const failures = [];
    page.on('pageerror', error => failures.push(error.message));
    expect((await page.request.post(ROOT+'/eko/control',{data:{resetPreview:true,mode:'ai'}})).ok()).toBeTruthy();
    await page.goto(ROOT + '/eko/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#connection')).toContainText('CONNECTED', { timeout: 20000 });
    await expect(page.locator('#state')).toHaveText('RUN LIVE');
    const first = (await (await page.request.get(ROOT + '/eko/state')).json()).snapshot.tick;
    await page.waitForTimeout(1800);
    const second = (await (await page.request.get(ROOT + '/eko/state')).json()).snapshot.tick;
    expect(second).toBeGreaterThan(first + 20);
    const info = await page.locator('canvas').evaluate(canvas => ({
      width: canvas.width,
      height: canvas.height,
      gl: !!canvas.getContext('webgl2') || !!canvas.getContext('webgl')
    }));
    expect(info.gl).toBeTruthy();
    expect(info.width).toBeGreaterThan(800);
    expect(info.height).toBeGreaterThan(400);
    const audit = await page.evaluate(() => window.__EKO_VISUAL_AUDIT__?.());
    expect(audit?.character.type).toBe('original-procedural-joint-rig');
    expect(audit.character.joints).toBeGreaterThanOrEqual(14);
    expect(audit.character.instancedDetails).toBe(23);
    expect(audit.character.expressiveFacialParts).toBeGreaterThanOrEqual(8);
    expect(audit.character.meshes).toBeGreaterThanOrEqual(60);
    expect(audit.character.inFrame).toBeTruthy();
    expect(audit.character.safeHorizontalPadding).toBe(true);
    expect(audit.character.heightPx).toBeGreaterThan(65);
    expect(audit.character.outfits).toHaveLength(4);
    expect(audit.environment.materials.source).toBe('generated-original');
    expect(audit.environment.materials.textures).toBe(3);
    expect(audit.environment.vibrance.kind).toBe('original-lagos-chromatic');
    expect(audit.environment.vibrance.features).toBeGreaterThan(500);
    expect(audit.environment.landmarks.authorityNeutral).toBe(true);
    expect(audit.environment.landmarks.arches).toBeGreaterThanOrEqual(3);
    expect(audit.environment.landmarks.signs.length).toBeGreaterThanOrEqual(1);
    expect(audit.environment.horizonLength).toBeGreaterThanOrEqual(235);
    expect(audit.performance.crowd.avatars).toBeGreaterThanOrEqual(20);
    expect(audit.performance.crowd.drawCalls).toBeLessThanOrEqual(12);
    expect(audit.environment.batching.vertexColorChunks).toBeGreaterThan(0);
    expect(audit.environment.atmosphere).toBe('single-shader-city-sky');
    expect(audit.environment.batching.sourceMeshes).toBeGreaterThan(250);
    expect(audit.environment.batching.batchedMeshes).toBeLessThan(audit.environment.batching.sourceMeshes*0.55);
    expect(audit.environment.batching.vertexColorChunks).toBeGreaterThan(0);
    expect(audit.environment.meshes).toBeLessThan(audit.environment.batching.sourceMeshes);
    expect(audit.performance.drawCalls).toBeGreaterThan(0);
    await expect(page.locator('#route-progress')).toHaveAttribute('aria-valuenow', /\d+/);
    await expect(page.locator('#route-percent')).toContainText('%');
    await expect(page.locator('#next-checkpoint')).not.toBeEmpty();
    expect(await page.evaluate(()=>getComputedStyle(document.querySelector('.score')).borderTopColor))
      .not.toBe('rgba(0, 0, 0, 0)');
    expect(await page.evaluate(()=>document.documentElement.dataset.district))
      .toBe('mainland-morning');
    fs.mkdirSync('artifacts/eko-gauntlet', { recursive: true });
    fs.writeFileSync('artifacts/eko-gauntlet/desktop-metrics.json', JSON.stringify(audit,null,2));
    expect(failures).toEqual([]);
    fs.mkdirSync('artifacts/eko-gauntlet', { recursive: true });
    await page.screenshot({ path: path.join('artifacts/eko-gauntlet', 'desktop.png'), fullPage: true });
  });

  test('Tayo outfit changes preserve the same authoritative player physics', async ({ page }) => {
    await page.request.post(ROOT+'/eko/control',{data:{resetPreview:true,mode:'ai'}});
    await page.goto(ROOT+'/eko/',{waitUntil:'domcontentloaded'});
    await expect(page.locator('#connection')).toContainText('CONNECTED',{timeout:20000});
    await page.locator('#mode').click();
    await expect(page.locator('#mode')).toContainText('SWITCH TO AI');
    const before=(await (await page.request.get(ROOT+'/eko/state')).json()).snapshot;
    for(const outfit of ['yoruba-agbada-fila','igbo-isi-agu-red-cap','hausa-baban-riga-cap','lagos-streetwear']){
      await page.locator('#outfit').selectOption(outfit);
      await expect.poll(async()=>page.evaluate(()=>window.__EKO_VISUAL_AUDIT__().character.outfit)).toBe(outfit);
      const current=await (await page.request.get(ROOT+'/eko/state')).json();
      expect(current.snapshot.runId).toEqual(before.runId);
      expect(current.snapshot.version).toEqual(before.version);
      expect(current.snapshot.player.facing).toBe(1);
    }
    fs.mkdirSync('artifacts/eko-gauntlet',{recursive:true});
    await page.locator('#outfit').selectOption('yoruba-agbada-fila');
    await expect.poll(async()=>page.evaluate(()=>window.__EKO_VISUAL_AUDIT__().character.outfit)).toBe('yoruba-agbada-fila');
    await page.screenshot({path:'artifacts/eko-gauntlet/outfit-agbada.png',fullPage:true});
  });

  test('mobile: displays 3D scene and touch controls without horizontal overflow', async ({ page }) => {
    // Tests share the same long-running authority. The preceding outfit test deliberately
    // switches to player mode, so restore a deterministic AI precondition explicitly.
    const reset = await page.request.post(ROOT+'/eko/control',{data:{resetPreview:true,mode:'ai'}});
    expect(reset.ok()).toBeTruthy();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ROOT + '/eko/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#connection')).toContainText('CONNECTED', { timeout: 20000 });
    await expect(page.locator('[data-control="Space"]')).toBeHidden();
    const widths = await page.evaluate(() => ({
      viewport: innerWidth,
      body: document.body.scrollWidth,
      html: document.documentElement.scrollWidth,
    }));
    expect(widths.body).toBeLessThanOrEqual(widths.viewport+1);
    expect(widths.html).toBeLessThanOrEqual(widths.viewport+1);
    await page.locator('#mode').click();
    await expect(page.locator('#mode')).toContainText('SWITCH TO AI');
    await expect(page.locator('[data-control="Space"]')).toBeVisible();
    await page.locator('[data-control="Space"]').click();
    const audit=await page.evaluate(()=>window.__EKO_VISUAL_AUDIT__());
    expect(audit.character.inFrame).toBeTruthy();
    expect(audit.character.safeHorizontalPadding).toBe(true);
    expect(audit.character.heightPx).toBeGreaterThan(60);
    fs.mkdirSync('artifacts/eko-gauntlet', { recursive: true });
    fs.writeFileSync('artifacts/eko-gauntlet/mobile-metrics.json',JSON.stringify(audit,null,2));
    await page.screenshot({ path: path.join('artifacts/eko-gauntlet', 'mobile.png'), fullPage: true });
  });

  test('Gauntlet progress captures actual WebGL image pixels for honest in-browser review', async ({ page }) => {
    await page.goto(ROOT+'/eko/progress',{waitUntil:'domcontentloaded'});
    await page.locator('#open-preview').click();
    await expect(page.locator('#live-frame')).toHaveClass(/ready/,{timeout:25000});
    await expect(page.frameLocator('#live-frame').locator('#connection')).toContainText('CONNECTED',{timeout:25000});
    await page.locator('#capture-frame').click();
    await expect(page.locator('#snapshots figure').first()).toBeVisible({timeout:25000});
    const captured=await page.locator('#snapshots img').first().evaluate(image=>({
      startsAsRealPng:image.src.startsWith('data:image/png;base64,'),
      naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight
    }));
    expect(captured.startsAsRealPng).toBe(true);
    expect(captured.naturalWidth).toBeGreaterThanOrEqual(300);
    expect(captured.naturalHeight).toBeGreaterThanOrEqual(200);
    // UI mechanics test ONLY: use this same WebGL image as the local test fixture.
    // This intentionally does not claim a comparison with SYBO or a blind visual win.
    const pngSource=await page.locator('#snapshots img').first().getAttribute('src');
    await page.locator('#reference-upload').setInputFiles({
      name:'UI-fixture.png',mimeType:'image/png',
      buffer:Buffer.from(pngSource.slice('data:image/png;base64,'.length),'base64')
    });
    await expect(page.locator('#blind-start')).toBeEnabled();
    await page.locator('#blind-start').click();
    await expect(page.locator('#blind-grid')).toBeVisible();
    await expect(page.locator('#blind-a')).toHaveAttribute('src',new RegExp('^(data:image/png|blob:)'));
    await page.locator('[data-blind-vote="A"]').click();
    await expect(page.locator('#blind-result')).toContainText('Reveal: Eko = Image');
    await expect(page.locator('[data-blind-vote="B"]')).toBeDisabled();
    const label=await page.locator('#snapshots figcaption').first().textContent();
    expect(label).toContain('draw calls');
    await page.screenshot({path:'artifacts/eko-gauntlet/live-review-progress.png',fullPage:true});
  });

  test('progress dashboard shows grounded claims and live authority', async ({ page }) => {
    await page.goto(ROOT+'/eko/progress');
    await expect.poll(async () => Number(await page.locator('#iterations').innerText())).toBeGreaterThanOrEqual(4);
    await expect(page.locator('#open')).not.toHaveText('—');
    await expect(page.locator('#tick')).not.toHaveText('—');
    await expect.poll(async () => page.locator('#rounds .card').count()).toBeGreaterThanOrEqual(4);
    await expect(page.locator('#status')).toContainText('Iteration');
    await expect(page.locator('#evidence-history a').first()).toHaveAttribute('href',new RegExp('actions/runs/[0-9]+/artifacts/[0-9]+'));
    await expect(page.locator('#snapshots')).toContainText('No real frames captured yet');
    fs.mkdirSync('artifacts/eko-gauntlet', { recursive: true });
    await page.screenshot({ path: path.join('artifacts/eko-gauntlet','progress.png'), fullPage:true });
  });
});
