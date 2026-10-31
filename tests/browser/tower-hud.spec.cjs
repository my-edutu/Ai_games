'use strict';

const { test, expect } = require('@playwright/test');

// The actual shipped HTML, CSS and HUD run in the browser. Only the app boundary
// is replaced: these are DOM/layout tests, so no second WebGL renderer is needed.
const fixture = {
  scene: 'upgrade', audio: { captions: [{ text: 'Floor cleared', expiresTick: 240 }] },
  snapshot: {
    tick: 219, runToken: 'hud-layout', floor: 4, theme: 'void',
    player: { health: 3, maxHealth: 5, stamina: 87, maxStamina: 100, shieldCharges: 0, score: 320 },
    progress: { height: 1435000, nextGuardianFloor: 8, floorProgressPermille: 0 },
    intent: { summary: 'Selecting an upgrade', mode: 'upgrade', confidencePermille: 900 },
    buildTags: [], upgradeOffers: [
      { name: 'Pickup Field', family: 'utility' },
      { name: 'Reinforced Core', family: 'health' },
      { name: 'Phase Shield', family: 'shield' },
    ],
  },
};

async function hudPage(page, viewport) {
  await page.setViewportSize(viewport);
  await page.route('**/tower/app.js', route => route.fulfill({ contentType: 'text/javascript', body: `
    import { createHUD } from '/tower/visuals/hud.mjs';
    window.hudFrame = ${JSON.stringify(fixture)};
    window.hud = createHUD({ initialQuality: 'high', onFullscreen() {
      Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: document.fullscreenElement ? null : document.documentElement });
      document.dispatchEvent(new Event('fullscreenchange'));
    } });
    window.hud.update(window.hudFrame, { renderProgress: { state: 'current', lastSubmitted: { tick: 219 } } });
    window.hud.status('LIVE EXPEDITION', 'online');
    window.hudReady = true;
  ` }));
  await page.goto('/tower');
  await page.waitForFunction(() => window.hudReady);
}

const insideViewport = (box, viewport) => {
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
};

for (const viewport of [{ width: 1600, height: 1000 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
  test(`upgrade and caption occupy separate space at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await hudPage(page, viewport);
    for (const caption of ['Floor cleared', 'Floor cleared. The climber is choosing an upgrade before continuing toward the next guardian.']) {
      await page.evaluate(text => {
        window.hudFrame.audio.captions[0].text = text;
        window.hud.update(window.hudFrame, { renderProgress: { state: 'current', lastSubmitted: { tick: 219 } } });
      }, caption);
      await expect(page.locator('#caption-text')).toHaveText(caption);
      const card = await page.locator('#choice-card').boundingBox();
      const captions = await page.locator('[data-testid="captions"]').boundingBox();
      insideViewport(card, viewport); insideViewport(captions, viewport);
      expect(captions.y - (card.y + card.height)).toBeGreaterThanOrEqual(8);
      expect(await page.locator('[data-testid="captions"]').evaluate(element => {
        const rect = element.getBoundingClientRect();
        return document.elementsFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)
          .every(node => !node.closest('#choice-card'));
      })).toBe(true);
    }
  });

  test(`retained danger and recovery notices fit together at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await hudPage(page, viewport);
    await page.evaluate(() => window.hud.update({ ...window.hudFrame, scene: 'recovery' }, {
      sourceScene: 'guardian', recoveryKind: 'stalled', renderProgress: { state: 'stalled', lastSubmitted: { tick: 219 } },
    }));
    await expect(page.locator('#phase-alert')).toBeVisible();
    await expect(page.locator('#phase-alert-text')).toHaveText('Guardian');
    await expect(page.locator('#recovery-message')).toHaveText('3D view delayed');
    const phase = await page.locator('#phase-alert').boundingBox();
    const recovery = await page.locator('#recovery-card').boundingBox();
    insideViewport(phase, viewport); insideViewport(recovery, viewport);
    const overlapX = Math.min(phase.x + phase.width, recovery.x + recovery.width) - Math.max(phase.x, recovery.x);
    const overlapY = Math.min(phase.y + phase.height, recovery.y + recovery.height) - Math.max(phase.y, recovery.y);
    expect(overlapX <= 0 || overlapY <= 0).toBe(true);
    await page.evaluate(() => window.hud.update({ ...window.hudFrame, scene: 'recovery' }, {
      sourceScene: 'guardian', recoveryKind: 'connection', renderProgress: { state: 'current', lastSubmitted: { tick: 219 } },
    }));
    await expect(page.locator('#phase-alert-text')).toHaveText('Last known: Guardian');
  });
}

test('toggle names and their keyboard tooltips describe coherent settings', async ({ page }) => {
  await hudPage(page, { width: 390, height: 844 });
  for (const [id, name, nextAction] of [
    ['sound-toggle', 'Sound', 'Mute sound'],
    ['motion-toggle', 'Reduced motion', 'Enable full motion'],
    ['quality-toggle', 'Low graphics quality', 'Use high graphics quality'],
    ['fullscreen-toggle', 'Fullscreen', 'Exit fullscreen'],
  ]) {
    const control = page.locator(`#${id}`);
    await expect(control).toHaveAccessibleName(name);
    await expect(control).toHaveAttribute('aria-pressed', 'false');
    await control.focus();
    await page.keyboard.press('Space');
    await expect(control).toHaveAccessibleName(name);
    await expect(control).toHaveAttribute('aria-pressed', 'true');
    await expect(control).toHaveAttribute('title', nextAction);
    expect(await control.evaluate(element => getComputedStyle(element, '::after').content)).toContain(nextAction);
    expect(await control.evaluate(element => getComputedStyle(element, '::after').visibility)).toBe('visible');
  }
  await page.locator('#details-toggle').click();
  await expect(page.locator('.controls-legend')).toBeVisible();
  await expect(page.getByText('Peak height', { exact: true })).toBeVisible();
});
