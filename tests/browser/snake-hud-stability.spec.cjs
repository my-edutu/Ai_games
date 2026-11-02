'use strict';
const { test, expect } = require('@playwright/test');

// Observe actual browser mutations, not mocked setters or source patterns.
async function observeHud(page, durationMs = 650) {
  return page.evaluate(duration => new Promise(resolve => {
    const root = document.getElementById('broadcast');
    const changes = [];
    const observer = new MutationObserver(records => {
      for (const record of records) changes.push({
        target: record.target.id || record.target.parentElement?.id || record.target.nodeName,
        type: record.type, attribute: record.attributeName,
      });
    });
    observer.observe(root, { subtree: true, childList: true, characterData: true,
      attributes: true, attributeFilter: ['data-scene', 'hidden'] });
    setTimeout(() => { observer.disconnect(); resolve(changes); }, duration);
  }), durationMs);
}

test('unchanged public frames leave the HUD DOM untouched while 3D keeps drawing', async ({ page, request }) => {
  const frame = await (await request.get('/snapshot')).json();
  let polls = 0;
  await page.route('**/snapshot', route => { polls++; return route.fulfill({ json: frame }); });
  await page.goto('/');
  await page.waitForFunction(() => window.__snakePresentation?.stats().frameCount >= 4);
  await expect(page.locator('#primary')).toContainText(`LENGTH ${frame.snapshot.length}`);
  const initial = await page.evaluate(() => window.__snakePresentation.stats().frameCount);
  const initialPolls = polls;
  const mutations = await observeHud(page);
  expect(polls).toBeGreaterThan(initialPolls + 1);
  expect(mutations).toEqual([]);
  expect(await page.evaluate(() => window.__snakePresentation.stats().frameCount)).toBeGreaterThan(initial);
});

test('HUD changes and reconnect recovery are not suppressed by unchanged snapshot revision', async ({ page, request }) => {
  const original = await (await request.get('/snapshot')).json();
  let current = original, offline = false;
  await page.route('**/snapshot', route => offline
    ? route.fulfill({ status: 503, body: 'temporarily unavailable' })
    : route.fulfill({ json: current }));
  await page.goto('/');
  await expect(page.locator('#primary')).toContainText('LENGTH');
  current = { ...original, hud: { ...original.hud, caption: 'A fresh caption on the same public frame.' } };
  await expect(page.locator('#caption')).toHaveText(current.hud.caption);
  offline = true;
  await expect(page.locator('#broadcast')).toHaveAttribute('data-scene', 'recovery');
  await expect(page.locator('#caption')).toContainText('Connection interrupted');
  offline = false;
  await expect(page.locator('#broadcast')).toHaveAttribute('data-scene', original.scene);
  await expect(page.locator('#caption')).toHaveText(current.hud.caption);
});

module.exports = { observeHud };
