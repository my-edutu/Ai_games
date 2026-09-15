'use strict';

const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const BASE = 'http://127.0.0.1:4317';
const ARTIFACT_DIR = path.resolve('artifacts/marble-visual-rebuild');

test.setTimeout(180000);

async function snapshot(request) {
  const response = await request.get(`${BASE}/api/snapshot`);
  expect(response.ok()).toBeTruthy();
  return response.json();
}

async function waitFor(request, predicate, label, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  let latest;
  while (Date.now() < deadline) {
    latest = await snapshot(request);
    if (predicate(latest)) return latest;
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  throw new Error(`Timed out waiting for ${label}; latest=${JSON.stringify({ tick: latest?.tick, round: latest?.round, archetype: latest?.arena?.archetype, lifecycle: latest?.lifecycle, camera: latest?.camera })}`);
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(ARTIFACT_DIR, name), animations: 'disabled' });
}

test('Marble Survival renders real Three.js tournament states and capture evidence', async ({ page, request }) => {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  const consoleErrors = [];
  page.on('pageerror', (error) => consoleErrors.push(String(error)));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });

  const shell = page.locator('.broadcast-shell');
  try {
    await expect(shell).toHaveClass(/three-ready/, { timeout: 20000 });
  } catch (error) {
    const state = await shell.getAttribute('data-three-state');
    throw new Error(`Three.js did not become ready; state=${state || 'unset'}; browserErrors=${consoleErrors.join(' | ') || 'none'}; original=${error.message}`);
  }

  await expect(page.locator('#arena-webgl')).toBeVisible();
  await expect(page.locator('#arena-canvas')).toHaveCSS('opacity', '0');

  await page.locator('#quality-select').selectOption('high');
  await page.waitForTimeout(350);

  const initial = await waitFor(request, (value) => value.arena?.archetype === 'seeding-sprint' && value.marbles?.length >= 16, 'seeding sprint');
  expect(initial.round.remaining).toBeGreaterThan(1);
  await shot(page, '01-full-arena-overview.png');
  await page.waitForTimeout(450);
  await shot(page, '02-pack-racing.png');

  const gate = await waitFor(request, (value) => value.arena?.archetype === 'gate-gauntlet' && value.arena?.sweepers?.length > 0, 'gate gauntlet sweeper');
  expect(gate.arena.sweepers.length).toBeGreaterThan(0);
  await page.waitForTimeout(180);
  await shot(page, '03-moving-sweeper.png');

  const hazard = await waitFor(request, (value) => value.arena?.archetype === 'hazard-circuit' && value.arena?.hazards?.length > 0, 'hazard circuit');
  expect(hazard.arena.hazards.length).toBeGreaterThan(0);
  await shot(page, '04-hazard-collision-course.png');

  await waitFor(request, (value) => (value.camera?.dangerIds?.length || 0) > 0 || value.events?.some((event) => event.type === 'shield-recovery'), 'near elimination or recovery');
  await shot(page, '05-near-elimination.png');

  await waitFor(request, (value) => value.events?.some((event) => event.type === 'marble-eliminated'), 'elimination event');
  await shot(page, '06-elimination.png');

  const finalFour = await waitFor(request, (value) => value.arena?.archetype === 'final-four', 'final four theme');
  expect(finalFour.round.remaining).toBeLessThanOrEqual(4);
  await shot(page, '07-alternate-sky-temple-theme.png');
  await page.waitForTimeout(220);
  await shot(page, '08-final-competitors.png');

  const championship = await waitFor(request, (value) => value.arena?.archetype === 'championship', 'championship arena');
  expect(championship.round.remaining).toBeLessThanOrEqual(2);
  await shot(page, '09-championship-arena.png');

  await waitFor(
    request,
    (value) => Number.isInteger(value.camera?.championId) || value.events?.some((event) => event.type === 'tournament-champion'),
    'champion confirmation',
  );
  await shot(page, '10-champion-moment.png');

  await shell.evaluate((element) => { element.dataset.clean = 'true'; });
  await expect(page.locator('.leaderboard-panel')).toBeHidden();
  await shot(page, '11-clean-feed-gameplay.png');

  const canvas = page.locator('#arena-webgl');
  const bounds = await canvas.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds.width).toBeGreaterThan(1000);
  expect(bounds.height).toBeGreaterThan(500);
  expect(consoleErrors, `browser errors: ${consoleErrors.join('\n')}`).toEqual([]);
});
