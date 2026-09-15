'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { test, expect } = require('@playwright/test');

const base = 'http://127.0.0.1:4317';
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

  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#arena-webgl')).toBeVisible();
  await expect(page.locator('.broadcast-shell')).toHaveAttribute('data-renderer', 'webgl2', { timeout: 20_000 });

  const webgl = await page.evaluate(() => {
    const canvas = document.getElementById('arena-webgl');
    return Boolean(canvas && canvas.getContext('webgl2'));
  });
  expect(webgl).toBe(true);

  const box = await page.locator('#arena-webgl').boundingBox();
  expect(box.width).toBeGreaterThan(1000);
  expect(box.height).toBeGreaterThan(500);
  const viewportArea = 1920 * 1080;
  const arenaCoverage = (box.width * box.height) / viewportArea;
  expect(arenaCoverage).toBeGreaterThan(0.72);

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

  // The evidence harness owns only start timing, never tournament rules or outcomes.
  await operator('pause');
  await operator('restart');
  const resetState = await snapshot();
  expect(resetState.round.index).toBe(0);
  expect(resetState.lifecycle).toBe('active');

  const captured = new Set();
  const archetypes = new Set();
  const capture = async name => {
    if (captured.has(name)) return;
    captured.add(name);
    await page.screenshot({ path: path.join(artifacts, `${name}.png`), fullPage: false });
  };

  await capture('01-race-start');
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
  const performanceEvidence = {
    renderer: 'webgl2',
    viewport: { width: 1920, height: 1080 },
    arenaCoverage,
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
  expect(performanceEvidence.frameMs.p95).toBeLessThan(100);

  const startedAt = Date.now();
  let championSeen = false;
  while (Date.now() - startedAt < 145_000 && !championSeen) {
    const state = await snapshot();
    archetypes.add(state.arena.archetype);

    if (state.round.remaining >= 20) await capture('02-large-marble-pack');
    if (state.lifecycle === 'active' && state.arena.sweepers.length > 0) await capture('03-moving-obstacle');
    if (state.lifecycle === 'active' && state.arena.hazards.length > 0) await capture('04-hazard-arena');
    if (state.camera.directive.mode === 'danger' || state.marbles.some(m => m.status === 'threatened' || m.status === 'recovering')) {
      await capture('05-near-elimination');
    }
    if (state.events.some(event => event.type === 'marble-eliminated')) await capture('06-actual-elimination');
    if (['hazard-circuit', 'final-four', 'championship'].includes(state.arena.archetype)) await capture('07-themed-arena');
    if (state.round.index >= 3) await capture('08-semifinal-final');
    if (state.lifecycle === 'tournament-result' && state.camera.championId !== null) {
      championSeen = true;
      await capture('09-tournament-winner');
    }
    await page.waitForTimeout(60);
  }

  const cleanPage = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
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
  expect(captured.has('07-themed-arena')).toBe(true);
  expect(captured.has('08-semifinal-final')).toBe(true);
  expect(championSeen).toBe(true);
  expect(failures).toEqual([]);
});
