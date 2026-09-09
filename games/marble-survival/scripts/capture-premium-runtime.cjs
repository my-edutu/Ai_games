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

async function withCaptureHost(seed, callback) {
  const { server } = createServer({ seed, operatorToken: 'capture-only', schedulerIntervalMs: 4, replayCapacity: 60 });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  const base = `http://127.0.0.1:${address.port}`;
  try {
    return await callback(base);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
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
    const topbar = document.querySelector('.topbar');
    const spectatorRail = document.querySelector('.spectator-rail');
    const eventRail = document.querySelector('.event-rail');
    const connection = document.querySelector('#connection')?.textContent?.trim() || '';
    const round = document.querySelector('#round-name')?.textContent?.trim() || '';
    const survivors = document.querySelector('#survivor-value')?.textContent?.trim() || '';
    const quota = document.querySelector('#quota-value')?.textContent?.trim() || '';
    const voteStatus = document.querySelector('#vote-status')?.textContent?.trim() || '';
    const arenaState = document.querySelector('#arena-state-label')?.textContent?.trim() || '';
    const visible = element => element ? getComputedStyle(element).display !== 'none' : false;
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
      topbarVisible: visible(topbar),
      spectatorRailVisible: visible(spectatorRail),
      eventRailVisible: visible(eventRail),
      connection,
      round,
      survivors,
      quota,
      voteStatus,
      arenaState,
    };
  }, label);
}

async function capture(page, label, fileName, options = {}) {
  await waitForAuthority(page);
  await page.waitForTimeout(options.settleMs ?? 1_500);
  const inspection = await inspectPage(page, label);
  if (inspection.horizontalOverflow) throw new Error(`${label} has horizontal overflow`);
  if (!inspection.canvasCss || inspection.canvasCss.width < 240 || inspection.canvasCss.height < 180) throw new Error(`${label} arena canvas is too small`);
  if (options.forbidReplay && /replay/i.test(inspection.arenaState)) throw new Error(`${label} inherited replay state`);
  if (options.requireCleanUiHidden && (inspection.topbarVisible || inspection.spectatorRailVisible || inspection.eventRailVisible)) {
    throw new Error(`${label} clean feed still exposes spectator HUD`);
  }
  const filePath = path.join(SCREENSHOT_ROOT, fileName);
  await page.screenshot({ path: filePath, fullPage: false });
  return { ...inspection, file: `screenshots/${fileName}` };
}

async function main() {
  ensureDirectories();
  const browser = await chromium.launch({ headless: true });
  const captures = [];

  try {
    captures.push(await withCaptureHost('premium-desktop-balanced', async base => {
      const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
      try {
        await page.goto(`${base}/?quality=balanced`, { waitUntil: 'domcontentloaded' });
        return await capture(page, 'desktop-balanced', 'desktop-balanced.png', { forbidReplay: true });
      } finally {
        await page.close();
      }
    }));

    captures.push(await withCaptureHost('premium-desktop-assisted', async base => {
      const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
      try {
        await page.goto(`${base}/?quality=balanced`, { waitUntil: 'domcontentloaded' });
        await waitForAuthority(page);
        await page.waitForTimeout(900);
        await page.locator('[data-family="wind-vote"][data-option="east"]').click();
        await page.waitForFunction(() => (document.querySelector('#record-category')?.textContent || '').includes('Assisted'), null, { timeout: 5_000 });
        return await capture(page, 'desktop-assisted-wind', 'desktop-assisted-wind.png', { settleMs: 450, forbidReplay: true });
      } finally {
        await page.close();
      }
    }));

    captures.push(await withCaptureHost('premium-phone-low', async base => {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
      try {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto(`${base}/?quality=low`, { waitUntil: 'domcontentloaded' });
        return await capture(page, 'phone-low-reduced-motion', 'phone-low-reduced-motion.png', { forbidReplay: true });
      } finally {
        await page.close();
      }
    }));

    captures.push(await withCaptureHost('premium-clean-low', async base => {
      const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
      try {
        await page.goto(`${base}/?quality=low&clean=1`, { waitUntil: 'domcontentloaded' });
        return await capture(page, 'desktop-clean-low', 'desktop-clean-low.png', { forbidReplay: true, requireCleanUiHidden: true });
      } finally {
        await page.close();
      }
    }));
  } finally {
    await browser.close();
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    game: 'Game 7 — Marble Survival Tournament',
    deterministicVersion: 'marble-physics-v2',
    browser: 'Chromium via Playwright',
    captureIsolation: 'fresh authority host per scenario',
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