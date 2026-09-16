'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const eko = require('../../dist/games/eko-street-run/src/index.js');

const CAPTURE_DIR = path.join(process.cwd(), 'evidence', 'eko-run', 'phase7', 'browser');

function buildModel(viewport, accessibility, quality = 'high') {
  const state = eko.createPhase6State(eko.createDefaultConfig({ seed: `phase7-browser-${viewport.width}x${viewport.height}` }));
  const encounter = state.hazards.encounters[0];
  encounter.phase = 'warned';
  encounter.warningTick = state.tick;
  const snapshot = eko.createRenderSnapshot(state);
  return eko.createBroadcastPresentation(snapshot, {
    viewport: { width: viewport.width, height: viewport.height, devicePixelRatio: 1, safeArea: viewport.safeArea },
    quality,
    accessibility,
    presentationHz: 60,
  });
}

async function verifyLayout(page, viewport, accessibility, quality, captureName) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  const model = buildModel(viewport, accessibility, quality);
  await page.setContent(eko.renderBroadcastOverlayHtml(model));
  const primary = page.getByTestId('primary-progress');
  const danger = page.getByTestId('danger');
  await expect(primary).toBeVisible();
  await expect(danger).toBeVisible();
  const p = await primary.boundingBox();
  const d = await danger.boundingBox();
  expect(p).not.toBeNull();
  expect(d).not.toBeNull();
  for (const box of [p, d]) {
    expect(box.x).toBeGreaterThanOrEqual(viewport.safeArea.left - 1);
    expect(box.y).toBeGreaterThanOrEqual(viewport.safeArea.top - 1);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width - viewport.safeArea.right + 1);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height - viewport.safeArea.bottom + 1);
  }
  const overlap = !(p.x + p.width <= d.x || d.x + d.width <= p.x || p.y + p.height <= d.y || d.y + d.height <= p.y);
  expect(overlap).toBe(false);
  expect(await page.locator('body').getAttribute('class')).toBe(viewport.height > viewport.width ? 'portrait' : 'landscape');
  const html = await page.content();
  for (const forbidden of ['rootSeed', 'randomStreams', 'commandWatermarks', 'sourceSequence']) expect(html.includes(forbidden)).toBe(false);
  fs.mkdirSync(CAPTURE_DIR, { recursive: true });
  await page.screenshot({ path: path.join(CAPTURE_DIR, captureName), fullPage: true });
}

test('Eko Run Phase 7 portrait mobile safe-area and danger hierarchy', async ({ page }) => {
  await verifyLayout(page, { width: 390, height: 844, safeArea: { top: 28, right: 16, bottom: 28, left: 16 } }, { muted: true, reducedMotion: true, reducedFlash: true }, 'portrait-muted-reduced-low.png');
});

test('Eko Run Phase 7 landscape broadcast safe-area and danger hierarchy', async ({ page }) => {
  await verifyLayout(page, { width: 1366, height: 768, safeArea: { top: 24, right: 32, bottom: 24, left: 32 } }, { muted: false, reducedMotion: false, reducedFlash: false }, 'landscape-high.png');
});
