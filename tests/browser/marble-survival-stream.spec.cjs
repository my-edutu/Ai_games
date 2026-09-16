'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { test, expect } = require('@playwright/test');

const base = 'http://127.0.0.1:4317';
const VIEWPORT = Object.freeze({ width: 1920, height: 1080 });
const artifacts = path.resolve(__dirname, '../../artifacts/marble-visual-rebuild');
const serverScript = path.resolve(__dirname, '../../games/marble-survival/scripts/serve-visual-evidence.cjs');
let serverProcess = null;

async function waitForServer() {
  let lastError = null;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`${base}/api/health`, { cache: 'no-store' });
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw lastError || new Error('Marble visual evidence server did not become ready');
}

test.beforeAll(async () => {
  fs.mkdirSync(artifacts, { recursive: true });
  serverProcess = spawn(process.execPath, [serverScript], {
    cwd: path.resolve(__dirname, '../..'),
    env: { ...process.env, PORT: '4317', GAME7_VISUAL_TICK_MS: '4' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let startupLog = '';
  serverProcess.stdout.on('data', chunk => { startupLog += chunk.toString(); });
  serverProcess.stderr.on('data', chunk => { startupLog += chunk.toString(); });
  serverProcess.once('exit', code => {
    if (code && code !== 0) process.stderr.write(`Marble evidence server exited ${code}: ${startupLog}\n`);
  });
  await waitForServer();
});

test.afterAll(async () => {
  if (!serverProcess || serverProcess.killed) return;
  serverProcess.kill('SIGTERM');
  await Promise.race([
    new Promise(resolve => serverProcess.once('exit', resolve)),
    new Promise(resolve => setTimeout(resolve, 2_000)),
  ]);
  if (!serverProcess.killed) serverProcess.kill('SIGKILL');
});

test('Marble WebGL broadcast renders authoritative tournament and captures runtime evidence', async ({ page, browser }) => {
  test.setTimeout(180_000);
  const failures = [];
  page.on('console', message => {
    if (message.type() === 'error') failures.push(`console: ${message.text()}`);
  });
  page.on('pageerror', error => failures.push(`page: ${error.message}`));

  await page.setViewportSize(VIEWPORT);
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#arena-webgl')).toBeVisible();
  const shell = page.locator('.broadcast-shell');
  await expect(shell).toHaveAttribute('data-renderer', 'webgl2', { timeout: 20_000 });
  await expect(shell).toHaveAttribute('data-identity', 'projected', { timeout: 20_000 });

  const gpu = await page.evaluate(() => {
    const canvas = document.getElementById('arena-webgl');
    const gl = canvas?.getContext('webgl2');
    if (!gl) return null;
    const debug = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor = debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
    const renderer = debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    return {
      vendor: String(vendor || 'unknown'),
      renderer: String(renderer || 'unknown'),
      drawingBufferWidth: gl.drawingBufferWidth,
      drawingBufferHeight: gl.drawingBufferHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
    };
  });
  expect(gpu).not.toBeNull();
  const softwareRenderer = /swiftshader|llvmpipe|software/i.test(`${gpu.vendor} ${gpu.renderer}`);

  const box = await page.locator('#arena-webgl').boundingBox();
  expect(box.width).toBeGreaterThan(1000);
  expect(box.height).toBeGreaterThan(500);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(VIEWPORT.width + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(VIEWPORT.height + 1);
  const visibleWidth = Math.max(0, Math.min(VIEWPORT.width, box.x + box.width) - Math.max(0, box.x));
  const visibleHeight = Math.max(0, Math.min(VIEWPORT.height, box.y + box.height) - Math.max(0, box.y));
  const viewportArea = VIEWPORT.width * VIEWPORT.height;
  const visibleArenaCoverage = (visibleWidth * visibleHeight) / viewportArea;
  expect(visibleArenaCoverage).toBeGreaterThan(0.78);

  const soundToggle = page.locator('#sound-toggle');
  await soundToggle.click();
  await expect(soundToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(shell).toHaveAttribute('data-audio', 'semantic');
  await page.waitForTimeout(250);
  await soundToggle.click();
  await expect(soundToggle).toHaveAttribute('aria-pressed', 'false');
  await expect(shell).toHaveAttribute('data-audio', 'off');

  const operator = async command => page.evaluate(async ({ command }) => {
    const response = await fetch('/api/operator', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer visual-evidence-only',
      },
      body: JSON.stringify({ command, actor: 'visual-evidence-browser', at: 1 }),
    });
    if (!response.ok) throw new Error(`operator ${command} ${response.status}`);
    return response.json();
  }, { command });

  const snapshot = async () => page.evaluate(async () => {
    const response = await fetch('/api/snapshot', { cache: 'no-store' });
    if (!response.ok) throw new Error(`snapshot ${response.status}`);
    return response.json();
  });

  const waitForHudRoundAtLeast = async roundNumber => {
    await page.waitForFunction((minimum) => {
      const text = document.getElementById('round-index')?.textContent || '';
      const match = text.match(/Round\s+(\d+)/i);
      return match && Number(match[1]) >= minimum;
    }, roundNumber, { timeout: 5_000 });
  };

  // The evidence harness owns only start timing, never tournament rules or outcomes.
  await operator('pause');
  await operator('restart');
  const resetState = await snapshot();
  expect(resetState.round.index).toBe(0);
  expect(resetState.lifecycle).toBe('active');
  await expect(page.locator('#tick-value')).toHaveText('0', { timeout: 2_000 });
  await expect(page.locator('#round-name')).toHaveText('Seeding Sprint', { timeout: 2_000 });

  const captured = new Set();
  const archetypes = new Set();
  const capture = async name => {
    if (captured.has(name)) return;
    captured.add(name);
    await page.screenshot({ path: path.join(artifacts, `${name}.png`), fullPage: false });
  };

  // Always capture the normal Balanced presentation before any CI-only fallback benchmark tier.
  await capture('01-race-start');

  const qualitySelect = page.locator('#quality-select');
  let benchmarkQuality = 'balanced';
  if (softwareRenderer) {
    benchmarkQuality = 'low';
    await qualitySelect.selectOption('low');
    await expect(shell).toHaveAttribute('data-render-scale', '0.58', { timeout: 2_000 });
    await page.waitForTimeout(250);
  } else {
    await expect(shell).toHaveAttribute('data-render-scale', '0.72', { timeout: 2_000 });
  }

  await operator('resume');
  const frameDeltas = await page.evaluate(() => new Promise(resolve => {
    const samples = [];
    let previous = null;
    function sample(now) {
      if (previous !== null) samples.push(now - previous);
      previous = now;
      if (samples.length >= 90) resolve(samples);
      else requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  }));
  const sortedFrameDeltas = frameDeltas.slice().sort((left, right) => left - right);
  const percentile = value => sortedFrameDeltas[Math.min(sortedFrameDeltas.length - 1, Math.floor(sortedFrameDeltas.length * value))];
  const measuredBuffer = await page.evaluate(() => {
    const gl = document.getElementById('arena-webgl')?.getContext('webgl2');
    return gl ? { width: gl.drawingBufferWidth, height: gl.drawingBufferHeight } : null;
  });
  const performanceEvidence = {
    renderer: 'webgl2',
    benchmarkClass: softwareRenderer ? 'software-fallback' : 'hardware-webgl',
    benchmarkQuality,
    gpu,
    drawingBuffer: measuredBuffer,
    viewport: VIEWPORT,
    visibleArenaCoverage,
    sampleCount: sortedFrameDeltas.length,
    frameMs: {
      p50: percentile(0.50),
      p95: percentile(0.95),
      p99: percentile(0.99),
      max: sortedFrameDeltas.at(-1),
    },
  };
  fs.writeFileSync(path.join(artifacts, 'performance-evidence.json'), JSON.stringify(performanceEvidence, null, 2) + '\n');
  expect(performanceEvidence.sampleCount).toBeGreaterThanOrEqual(90);
  if (softwareRenderer) {
    expect(performanceEvidence.frameMs.p95).toBeLessThan(140);
  } else {
    expect(performanceEvidence.frameMs.p95).toBeLessThan(100);
  }

  // All visual evidence below remains on the normal Balanced presentation tier.
  if (benchmarkQuality !== 'balanced') {
    await qualitySelect.selectOption('balanced');
    await expect(shell).toHaveAttribute('data-render-scale', '0.72', { timeout: 2_000 });
    await page.waitForTimeout(250);
  }

  // Performance sampling is deliberately a separate deterministic tournament. It must never
  // consume/freeze the tournament whose archetypes and decisive moments are under visual review.
  await operator('pause');
  await operator('restart');
  const visualState = await snapshot();
  expect(visualState.round.index).toBe(0);
  expect(visualState.lifecycle).toBe('active');
  expect(visualState.tick).toBe(0);
  await expect(page.locator('#tick-value')).toHaveText('0', { timeout: 2_000 });
  await expect(page.locator('#round-name')).toHaveText('Seeding Sprint', { timeout: 2_000 });
  await operator('resume');

  const startedAt = Date.now();
  let championSeen = false;
  while (Date.now() - startedAt < 145_000 && !championSeen) {
    const state = await snapshot();
    archetypes.add(state.arena.archetype);

    const captures = [];
    if (state.round.remaining >= 20 && !captured.has('02-large-marble-pack')) captures.push('02-large-marble-pack');
    if (state.lifecycle === 'active' && state.arena.sweepers.length > 0 && !captured.has('03-moving-obstacle')) captures.push('03-moving-obstacle');
    if (state.lifecycle === 'active' && state.arena.ramps.length > 0 && state.marbles.some(m => m.status !== 'eliminated' && Number(m.elevation) >= 120) && !captured.has('04-high-speed-ramp')) {
      captures.push('04-high-speed-ramp');
    }
    if (state.lifecycle === 'active' && state.arena.hazards.length > 0 && !captured.has('04-hazard-arena')) captures.push('04-hazard-arena');
    if ((state.camera.directive.mode === 'danger' || state.marbles.some(m => m.status === 'threatened' || m.status === 'recovering')) && !captured.has('05-near-elimination')) {
      captures.push('05-near-elimination');
    }
    if (state.events.some(event => event.type === 'marble-eliminated') && !captured.has('06-actual-elimination')) captures.push('06-actual-elimination');
    if (['hazard-circuit', 'final-four', 'championship'].includes(state.arena.archetype) && !captured.has('07-themed-arena')) captures.push('07-themed-arena');
    if (state.round.index >= 3 && !captured.has('08-semifinal-final')) captures.push('08-semifinal-final');

    // A screenshot can take hundreds of milliseconds on software WebGL. Freeze authority while
    // recording evidence so expensive capture work cannot make Playwright skip entire legal rounds.
    if (captures.length > 0 && state.lifecycle !== 'tournament-result') {
      await operator('pause');
      if (captures.includes('08-semifinal-final')) await waitForHudRoundAtLeast(4);
      for (const name of captures) await capture(name);
      await operator('resume');
    }

    if (state.lifecycle === 'tournament-result' && state.camera.championId !== null) {
      championSeen = true;
      await expect(page.locator('#champion-card')).toBeVisible({ timeout: 5_000 });
      await expect(page.locator('#camera-value')).toContainText('Champion', { timeout: 5_000 });
      const championBox = await page.locator('#champion-card').boundingBox();
      expect(championBox.x).toBeGreaterThanOrEqual(0);
      expect(championBox.y).toBeGreaterThanOrEqual(0);
      expect(championBox.x + championBox.width).toBeLessThanOrEqual(VIEWPORT.width + 1);
      expect(championBox.y + championBox.height).toBeLessThanOrEqual(VIEWPORT.height + 1);
      await capture('09-tournament-winner');
    }
    await page.waitForTimeout(30);
  }

  const cleanPage = await browser.newPage({ viewport: VIEWPORT });
  try {
    await cleanPage.goto(`${base}/?clean=1`, { waitUntil: 'domcontentloaded' });
    await expect(cleanPage.locator('.broadcast-shell')).toHaveAttribute('data-renderer', 'webgl2', { timeout: 20_000 });
    await expect(cleanPage.locator('.topbar')).toBeHidden();
    await cleanPage.screenshot({ path: path.join(artifacts, '10-hud-hidden.png'), fullPage: false });
  } finally {
    await cleanPage.close();
  }

  expect(archetypes.size).toBeGreaterThanOrEqual(3);
  expect(captured.has('03-moving-obstacle')).toBe(true);
  expect(captured.has('04-high-speed-ramp')).toBe(true);
  expect(captured.has('07-themed-arena')).toBe(true);
  expect(captured.has('08-semifinal-final')).toBe(true);
  expect(championSeen).toBe(true);
  expect(failures).toEqual([]);
});