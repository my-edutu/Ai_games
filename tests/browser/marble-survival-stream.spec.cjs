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
  // The self-running test server advances every 4ms. Freeze its *existing*
  // authority before interacting with live list buttons, then restart to a
  // known round. Without this the top-ranked element can legitimately change
  // between pointer-down and pointer-up, masking the real UX defect.
  await operator('pause');
  await operator('restart');
  await expect(page.locator('#tick-value')).toHaveText('0', {timeout:3000});
  await expect(page.locator('#view-toggle')).toBeVisible();
  await expect(page.locator('#leaderboard .inspect-marble').first()).toBeVisible({timeout:15000});
  // UI controls must never mutate the autonomous race or operator authority.
  const selected = await page.locator('#leaderboard .inspect-marble').first().getAttribute('data-marble-id');
  await page.locator(`#leaderboard .inspect-marble[data-marble-id="${selected}"]`).click();
  await expect(page.locator('#spotlight-card')).toBeVisible();
  await expect(page.locator(`#leaderboard .inspect-marble[data-marble-id="${selected}"]`)).toHaveAttribute('aria-pressed','true');
  // Hold the clicked DOM node and prove a fresh server poll never swaps it.
  const nodeStayedAttached=await page.evaluate(async id=>{
    const button=document.querySelector(`#leaderboard .inspect-marble[data-marble-id="${id}"]`);
    await new Promise(resolve=>setTimeout(resolve,400));
    return button?.isConnected===true
      &&button===document.querySelector(`#leaderboard .inspect-marble[data-marble-id="${id}"]`);
  },selected);
  expect(nodeStayedAttached).toBe(true);
  const spotlight = await page.evaluate(async id => {
    const state = await (await fetch('/api/snapshot')).json();
    const marble = state.marbles.find(candidate => candidate.id === Number(id));
    return { name: marble.name, number: marble.number, status: marble.status };
  }, selected);
  await expect(page.locator('#spotlight-name')).toHaveText(spotlight.name);
  await expect(page.locator('#spotlight-number')).toHaveText(String(spotlight.number).padStart(2,'0'));
  await page.screenshot({path:path.join(artifacts,'00c-competitor-dossier.png'),fullPage:true});
  await page.locator('#spotlight-close').click();
  await expect(page.locator('#spotlight-card')).toBeHidden();
  await page.locator('#view-toggle').click();
  await expect(shell).toHaveAttribute('data-view', 'cinematic');
  await expect(page.locator('.leaderboard-panel.broadcast-overlay')).toBeHidden();
  await expect(page.locator('#arena-webgl')).toBeVisible();
  await page.screenshot({path:path.join(artifacts,'00d-cinematic-view.png'),fullPage:true});
  await page.locator('#view-toggle').click();
  await expect(shell).toHaveAttribute('data-view', 'broadcast');
  await expect(shell).toHaveAttribute('data-biome', 'seeding-sprint');
  await expect(page.locator('#arena-biome-title')).toHaveText('AURORA SPEEDWAY');
  await expect(page.locator('#qualification-meter')).toHaveAttribute('role', 'progressbar');
  await page.evaluate(() => {
    const root = document.querySelector('.broadcast-shell');
    const palette = getComputedStyle(root);
    if (!palette.getPropertyValue('--arena-accent').trim()) throw new Error('Vivid arena accent missing');
    if (!document.querySelector('link[href="/arena-reborn.css"]')) throw new Error('Premium art-direction stylesheet missing');
  });

  // Critic gate: labels must be drawn from the exact frame's projection,
  // not a separately moving presentation camera.
  await expect(shell).toHaveAttribute('data-identity-source', 'webgl-frame', { timeout: 20_000 });
  await page.waitForFunction(() => {
    const shell = document.querySelector('.broadcast-shell');
    return shell?.dataset.identitySource === 'webgl-frame' &&
      shell.dataset.identityTick === shell.dataset.webglTick &&
      shell.dataset.identityTick !== '';
  }, undefined, { timeout: 15_000 });

  const gauntletPage = await page.context().newPage();
  try {
    await gauntletPage.goto(`${base}/gauntlet.html`, { waitUntil: 'domcontentloaded' });
    await expect(gauntletPage.locator('#iteration')).toContainText('Loop', { timeout: 10_000 });
    await expect(gauntletPage.locator('#sync-status')).toContainText('connected', { timeout: 10_000 });
    await expect(gauntletPage.locator('#comparison-status')).toContainText('NOT YET VERIFIED');
    await gauntletPage.screenshot({ path: path.join(artifacts, '00-gauntlet-progress.png'), fullPage: true });
  } finally {
    await gauntletPage.close();
  }


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
  const biomeEvidence = new Set();
  const visualPixelMetrics = {};
  const measureActualVisualPixels = async () => {
    // Decode actual Chromium-composited game canvas, never a concept image
    // and never a source-palette guess. Explicitly distinguish this machine
    // colour check from a blinded human A/B art critique.
    const jpeg = await page.locator('#arena-webgl').screenshot({ type: 'jpeg', quality: 60 });
    return page.evaluate(async encoded => {
      const image = new Image();
      image.src = 'data:image/jpeg;base64,' + encoded;
      await image.decode();
      const probe = document.createElement('canvas');
      probe.width = Math.min(640, image.naturalWidth);
      probe.height = Math.min(400, image.naturalHeight);
      const ctx = probe.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(image, 0, 0, probe.width, probe.height);
      const data = ctx.getImageData(0, 0, probe.width, probe.height).data;
      let samples = 0, saturationSum = 0, brightnessSum = 0, colorful = 0, dark = 0;
      let redSum=0,greenSum=0,blueSum=0;
      for (let y = 0; y < probe.height; y += 9) {
        for (let x = 0; x < probe.width; x += 9) {
          const index = (y * probe.width + x) * 4;
          const r = data[index], g = data[index + 1], b = data[index + 2];
          const high = Math.max(r, g, b), low = Math.min(r, g, b);
          const saturation = high ? (high - low) / high : 0;
          samples++;
          saturationSum += saturation;
          redSum+=r;greenSum+=g;blueSum+=b;
          brightnessSum += (r * 0.2126 + g * 0.7152 + b * 0.0722);
          if (saturation >= 0.22 && high >= 74) colorful++;
          if (high <= 8) dark++;
        }
      }
      return {
        samples,
        averageSaturation: Number((saturationSum / samples).toFixed(3)),
        averageLuminance: Number((brightnessSum / samples).toFixed(1)),
        meanRgb: [Math.round(redSum/samples),Math.round(greenSum/samples),Math.round(blueSum/samples)],
        colorfulFraction: Number((colorful / samples).toFixed(3)),
        nearBlackFraction: Number((dark / samples).toFixed(3)),
        source: 'actual WebGL canvas captured and decoded by Chromium',
        independentVisualParityVerified: false,
      };
    }, jpeg.toString('base64'));
  };
  const capture = async name => {
    if (captured.has(name)) return;
    // A frozen screenshot is not useful if the racing HUD and WebGL renderer
    // represent different authority rounds. Wait for real projected parity.
    await page.waitForFunction(() => {
      const node=document.querySelector('.broadcast-shell');
      if (!node) return false;
      return Boolean(node.dataset.webglArena &&
        node.dataset.webglArena===node.dataset.hudArena &&
        node.dataset.webglArchetype===node.dataset.hudArchetype &&
        node.dataset.webglTick===node.dataset.hudTick);
    },undefined,{timeout:12_000});
    captured.add(name);
    await page.screenshot({ path: path.join(artifacts, `${name}.png`), fullPage: false });
    if (name === '01-race-start' || name.startsWith('11-biome-')) {
      const metric = await measureActualVisualPixels();
      const proof=await page.evaluate(()=>{
        const shell=document.querySelector('.broadcast-shell');
        const gl=document.getElementById('arena-webgl')?.getContext('webgl2');
        return {
          biome:shell?.dataset.webglArchetype,
          architecture:shell?.dataset.stadiumStyle,
          landmark:shell?.dataset.landmarkStyle,
          stadiumModules:Number(shell?.dataset.stadiumModules||0),
          horizonTriangles:Number(shell?.dataset.horizonGeometry||0),
          cinematicSpotlights:Number(shell?.dataset.spotlightVolumes||0),
          activePostprocess:shell?.dataset.postprocess,
          stadiumCrowd:Number(shell?.dataset.crowdCount||0),
          renderer:shell?.dataset.renderer,
          glError:gl?.getError(),
          glNoError:gl?.NO_ERROR,
        };
      });
      expect(proof.renderer).toBe('webgl2');
      expect(proof.architecture).toBe(proof.biome);
      expect(proof.landmark).toBe(proof.biome);
      expect(proof.stadiumModules).toBeGreaterThan(300);
      expect(proof.horizonTriangles).toBeGreaterThan(300);
      expect(proof.cinematicSpotlights).toBeGreaterThan(0);
      expect(proof.stadiumCrowd).toBeGreaterThanOrEqual(320);
      expect(proof.activePostprocess).toBe('neon-glow');
      expect(proof.glError).toBe(proof.glNoError);
      visualPixelMetrics[name] = { ...metric, actualWebglProof:proof };
      fs.writeFileSync(path.join(artifacts, 'visual-pixel-metrics.json'),JSON.stringify(visualPixelMetrics,null,2));
      expect(metric.samples).toBeGreaterThan(100);
      expect(metric.averageLuminance).toBeGreaterThan(30);
      expect(metric.averageSaturation).toBeGreaterThan(0.16);
      expect(metric.colorfulFraction).toBeGreaterThan(0.10);
      expect(metric.nearBlackFraction).toBeLessThan(0.72);
    }
  };

  // Always capture the normal Balanced presentation before any CI-only fallback benchmark tier.
  await capture('01-race-start');
  // Real mobile game capture, not a CSS concept mock-up. Reuse the same browser
  // context and close this graphics surface before starting performance timing.
  const mobileScene = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await mobileScene.goto(base, { waitUntil: 'domcontentloaded' });
    await expect(mobileScene.locator('.broadcast-shell')).toHaveAttribute('data-renderer', 'webgl2', { timeout: 20_000 });
    await expect(mobileScene.locator('#arena-biome-title')).toHaveText('AURORA SPEEDWAY', { timeout: 10_000 });
    const mobileBounds = await mobileScene.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(mobileBounds.scroll).toBeLessThanOrEqual(mobileBounds.client + 1);
    await mobileScene.screenshot({ path: path.join(artifacts, '01b-mobile-3d-arena.png'), fullPage: true });
  } finally {
    await mobileScene.close();
  }

  // Verify that the critic's file-based A/B tool operates on real captured pixels
  // and never automatically turns a tie into a product-quality victory.
  const criticPage = await page.context().newPage();
  try {
    await criticPage.goto(`${base}/gauntlet.html`, { waitUntil: 'domcontentloaded' });
    const realCapture = path.join(artifacts, '01-race-start.png');
    await criticPage.locator('#ab-candidate').setInputFiles(realCapture);
    await criticPage.locator('#ab-reference').setInputFiles(realCapture);
    await criticPage.locator('#ab-start').click();
    await expect(criticPage.locator('#ab-voting')).toBeVisible();
    await criticPage.locator('[data-ab-vote="tie"]').click();
    await expect(criticPage.locator('#ab-result')).toContainText('No winner claimed.');
    await criticPage.screenshot({ path: path.join(artifacts, '00b-blind-comparison-lab.png'), fullPage: true });
  } finally {
    await criticPage.close();
  }

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
    const biomeName = state.arena.archetype;
    const biomeCapture = '11-biome-' + biomeName;
    if (!biomeEvidence.has(biomeName)) {
      biomeEvidence.add(biomeName);
      captures.push(biomeCapture);
    }
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
      if (captures.includes('11-biome-' + biomeName)) {
        await expect(shell).toHaveAttribute('data-biome', biomeName, { timeout: 3_000 });
        await expect(page.locator('#arena-biome-title')).not.toBeEmpty();
      }
      if (biomeName==='hazard-circuit' && Array.isArray(state.arena.windZones) && state.arena.windZones.length>0){
        await expect(shell).toHaveAttribute('data-public-wind-zones', String(state.arena.windZones.length));
      }
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

  const stagePaletteSamples=Object.entries(visualPixelMetrics)
    .filter(([name,metric])=>name.startsWith('11-biome-')&&Array.isArray(metric.meanRgb))
    .map(([,metric])=>metric.meanRgb);
  expect(stagePaletteSamples.length).toBeGreaterThanOrEqual(3);
  let maximumPaletteDistance=0;
  for(let i=0;i<stagePaletteSamples.length;i++){
    for(let j=i+1;j<stagePaletteSamples.length;j++){
      const difference=Math.hypot(...stagePaletteSamples[i].map((value,channel)=>
        value-stagePaletteSamples[j][channel]));
      maximumPaletteDistance=Math.max(maximumPaletteDistance,difference);
    }
  }
  expect(maximumPaletteDistance).toBeGreaterThan(15);
  fs.writeFileSync(path.join(artifacts,'visual-critic-summary.json'),
    JSON.stringify({maximumPaletteDistance,stageCount:stagePaletteSamples.length,
      independentVisualParityVerified:false,source:'actual desktop WebGL screenshots'},null,2));
  expect(biomeEvidence.size).toBeGreaterThanOrEqual(3);
  expect(archetypes.size).toBeGreaterThanOrEqual(3);
  expect(captured.has('03-moving-obstacle')).toBe(true);
  expect(captured.has('04-high-speed-ramp')).toBe(true);
  expect(captured.has('07-themed-arena')).toBe(true);
  expect(captured.has('08-semifinal-final')).toBe(true);
  expect(championSeen).toBe(true);
  expect(failures).toEqual([]);
});