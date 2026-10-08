'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const ROOT = 'http://127.0.0.1:4177';
test.describe('Eko Run 3D Gauntlet slice', () => {
  test('desktop: renders real WebGL gameplay from advancing authority', async ({ page }) => {
    const failures = [];
    page.on('pageerror', error => failures.push(error.message));
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
    expect(audit.character.meshes).toBeGreaterThanOrEqual(60);
    expect(audit.character.inFrame).toBeTruthy();
    expect(audit.character.heightPx).toBeGreaterThan(65);
    expect(audit.character.outfits).toHaveLength(4);
    expect(audit.environment.batching.sourceMeshes).toBeGreaterThan(250);
    expect(audit.environment.batching.batchedMeshes).toBeLessThan(audit.environment.batching.sourceMeshes*0.55);
    expect(audit.environment.meshes).toBeLessThan(audit.environment.batching.sourceMeshes);
    expect(audit.performance.drawCalls).toBeGreaterThan(0);
    fs.mkdirSync('artifacts/eko-gauntlet', { recursive: true });
    fs.writeFileSync('artifacts/eko-gauntlet/desktop-metrics.json', JSON.stringify(audit,null,2));
    expect(failures).toEqual([]);
    fs.mkdirSync('artifacts/eko-gauntlet', { recursive: true });
    await page.screenshot({ path: path.join('artifacts/eko-gauntlet', 'desktop.png'), fullPage: true });
  });

  test('Tayo outfit changes preserve the same authoritative player physics', async ({ page }) => {
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
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ROOT + '/eko/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#connection')).toContainText('CONNECTED', { timeout: 20000 });
    await expect(page.locator('[data-control="Space"]')).toBeVisible();
    const widths = await page.evaluate(() => ({
      viewport: innerWidth,
      body: document.body.scrollWidth,
      html: document.documentElement.scrollWidth,
    }));
    expect(widths.body).toBeLessThanOrEqual(widths.viewport+1);
    expect(widths.html).toBeLessThanOrEqual(widths.viewport+1);
    await page.locator('#mode').click();
    await expect(page.locator('#mode')).toContainText('SWITCH TO AI');
    await page.locator('[data-control="Space"]').click();
    const audit=await page.evaluate(()=>window.__EKO_VISUAL_AUDIT__());
    expect(audit.character.inFrame).toBeTruthy();
    expect(audit.character.heightPx).toBeGreaterThan(60);
    fs.mkdirSync('artifacts/eko-gauntlet', { recursive: true });
    fs.writeFileSync('artifacts/eko-gauntlet/mobile-metrics.json',JSON.stringify(audit,null,2));
    await page.screenshot({ path: path.join('artifacts/eko-gauntlet', 'mobile.png'), fullPage: true });
  });

  test('progress dashboard shows grounded claims and live authority', async ({ page }) => {
    await page.goto(ROOT+'/eko/progress');
    await expect.poll(async () => Number(await page.locator('#iterations').innerText())).toBeGreaterThanOrEqual(4);
    await expect(page.locator('#open')).not.toHaveText('—');
    await expect(page.locator('#tick')).not.toHaveText('—');
    await expect.poll(async () => page.locator('#rounds .card').count()).toBeGreaterThanOrEqual(4);
    await expect(page.locator('#status')).toContainText('Iteration');
    fs.mkdirSync('artifacts/eko-gauntlet', { recursive: true });
    await page.screenshot({ path: path.join('artifacts/eko-gauntlet','progress.png'), fullPage:true });
  });
});
