'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('@playwright/test');
const { createServer } = require('./serve-complete-runtime.cjs');

const ARTIFACT_ROOT = path.resolve(__dirname, '../artifacts');
const SCREENSHOT_ROOT = path.join(ARTIFACT_ROOT, 'screenshots');

function ensureDirectories() {
  fs.mkdirSync(SCREENSHOT_ROOT, { recursive: true });
}

async function waitForAuthority(page) {
  await page.waitForFunction(() => {
    const value = document.querySelector('#connection')?.textContent || '';
    return value.includes('Authority live');
  }, null, { timeout: 10_000 });
}

async function inspectPage(page, label) {
  return page.evaluate((captureLabel) => {
    const canvas = document.querySelector('#arena-canvas');
    const shell = document.querySelector('.broadcast-shell');
    const connection = document.querySelector('#connection')?.textContent?.trim() || '';
    const round = document.querySelector('#round-name')?.textContent?.trim() || '';
    const survivors = document.querySelector('#survivor-value')?.textContent?.trim() || '';
    const quota = document.querySelector('#quota-value')?.textContent?.trim() || '';
    const voteStatus = document.querySelector('#vote-status')?.textContent?.trim() || '';
    return {
      label: captureLabel,
      viewport: { width: innerWidth, height: innerHeight },
      devicePixelRatio,
      documentWidth: document.documentElement.scrollWidth,
      documentHeight: document.documentElement.scrollHeight,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 2,
      canvasCss: canvas ? { width: canvas.getBoundingClientRect().width, height: canvas.getBoundingClientRect().height } : null,
      canvasPixels: canvas ? { width: canvas.width, height: canvas.height } : null,
      cleanFeed: shell?.dataset.clean === 'true',
      quality: shell?.dataset.quality || null,
      connection,
      round,
      survivors,
      quota,
      voteStatus,
    };
  }, label);
}

async function capture(page, label, fileName) {
  await waitForAuthority(page);
  await page.waitForTimeout(500);
  const inspection = await inspectPage(page, label);
  if (inspection.horizontalOverflow) throw new Error(`${label} has horizontal overflow`);
  if (!inspection.canvasCss || inspection.canvasCss.width < 240 || inspection.canvasCss.height < 180) throw new Error(`${label} arena canvas is too small`);
  const filePath = path.join(SCREENSHOT_ROOT, fileName);
  await page.screenshot({ path: filePath, fullPage: false });
  return { ...inspection, file: `screenshots/${fileName}` };
}

async function main() {
  ensureDirectories();
  const { server } = createServer({ seed: 'premium-browser-capture', operatorToken: 'capture-only', schedulerIntervalMs: 4, replayCapacity: 60 });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  const base = `http://127.0.0.1:${address.port}`;
  const browser = await chromium.launch({ headless: true });
  const captures = [];

  try {
    const desktop = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    await desktop.goto(`${base}/?quality=balanced`, { waitUntil: 'networkidle' });
    captures.push(await capture(desktop, 'desktop-balanced', 'desktop-balanced.png'));

    const eastButton = desktop.locator('[data-family="wind-vote"][data-option="east"]');
    await eastButton.click();
    await desktop.waitForFunction(() => (document.querySelector('#record-category')?.textContent || '').includes('Assisted'), null, { timeout: 5_000 });
    captures.push(await capture(desktop, 'desktop-assisted-wind', 'desktop-assisted-wind.png'));
    await desktop.close();

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    await mobile.emulateMedia({ reducedMotion: 'reduce' });
    await mobile.goto(`${base}/?quality=low`, { waitUntil: 'networkidle' });
    captures.push(await capture(mobile, 'phone-low-reduced-motion', 'phone-low-reduced-motion.png'));
    await mobile.close();

    const clean = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    await clean.goto(`${base}/?quality=low&clean=1`, { waitUntil: 'networkidle' });
    captures.push(await capture(clean, 'desktop-clean-low', 'desktop-clean-low.png'));
    await clean.close();
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    game: 'Game 7 — Marble Survival Tournament',
    deterministicVersion: 'marble-physics-v2',
    browser: 'Chromium via Playwright',
    captures,
    note: 'These screenshots validate browser layout/render output only. They do not substitute for independent accessibility review, OBS compression review, 72-hour soak, or seven-day canary.',
  };
  fs.writeFileSync(path.join(ARTIFACT_ROOT, 'game7-browser-capture.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
