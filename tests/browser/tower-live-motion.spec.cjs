'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { test, expect } = require('@playwright/test');
const { assessTowerMotion } = require('../../scripts/tower-motion-evidence.cjs');

// No intercepted snapshots, replay scrubbing, virtual time, time acceleration or
// post-processed poses: this visits the live, seeded 20 Hz expedition host.
// VIDEO TRUTH: the viewport must be configured at CONTEXT CREATION, not changed
// after Playwright allocated its default 800x450 recorder. Prior portrait WebM
// had the real 390x844 game squeezed into a tiny upper-left inset surrounded
// by grey. Native layout video is mandatory for meaningful blind full-motion
// mobile criticism; it is still NOT a supported-device FPS measurement.
const viewports = [
  { name: 'desktop', width: 960, height: 600 },
  { name: 'portrait', width: 390, height: 844 },
];
for (const viewport of viewports) {
  test.describe('source-pinned ' + viewport.name + ' native recording', () => {
    test.use({
      viewport: { width: viewport.width, height: viewport.height },
      video: { mode: 'on', size: { width: viewport.width, height: viewport.height } },
    });
    test('normal-speed Tower motion ' + viewport.name, async ({ page }, testInfo) => {
  test.setTimeout(240000);
  const scenario = process.env.TOWER_MOTION_SCENARIO || 'ascent';
  const dir = path.resolve('artifacts', 'tower-motion', scenario, viewport.name);
  fs.mkdirSync(dir, { recursive: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  expect(page.viewportSize()).toEqual({ width: viewport.width, height: viewport.height });
  await page.goto('/tower?quality=low&reducedMotion=0&muted=1', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const d = window.__TOWER_RENDER_DIAGNOSTICS__?.();
    return d?.frames >= 8 && d.renderProgress?.state === 'current' && d.lighting?.environmentState !== 'pending';
  }, null, { timeout: 90000 });
  const observations = [];
  const canvas = page.locator('#tower-canvas');
  async function sample(index) {
    const observation = await page.evaluate(() => {
      const d = window.__TOWER_RENDER_DIAGNOSTICS__();
      const s = window.__TOWER_PUBLIC_STATE__;
      return { atMs: Date.now(), tick: s?.tick, runToken: s?.runToken, checksum: s?.publicChecksum,
        floor: s?.floor, scene: s?.lifecycle, state: s?.player?.state, dangerPermille: s?.dangerPermille,
        guardianActive: (s?.enemies || []).some(e => e.active && e.kind === 'guardian'),
        guardianHealth: (s?.enemies || []).filter(e => e.kind === 'guardian').map(e => ({ active: e.active, health: e.health, maxHealth: e.maxHealth })),
        observedGate: d.world?.guardianGates || [],
        // Exact presented-camera world projection at the time of a genuine
        // source HP observation. Unlike a source-only geometry fixture, this
        // records whether the guardian and gate are actually inside the
        // continuous desktop/portrait video camera crop.
        observedCamera: d.encounterCamera || null,
        observedPassage: d.passage?.active ? { runToken: d.passage.runToken, floor: d.passage.floor,
          sourceTick: d.passage.sourceTick, ageSeconds: d.passage.ageSeconds,
           anchorPosition: d.passage.anchorPosition,
           focusPosition: d.passage.focusPosition } : null,
        telegraphedEnemies: (s?.enemies || []).filter(e => e.active && e.telegraph).length,
        attacking: !!s?.player?.attacking, enemyKinds: (s?.enemies || []).filter(e => e.active).map(e => e.kind),
        frames: d.frames, frameMs: d.frameMs, contextLost: d.contextLost,
        renderErrors: d.renderErrors, renderState: d.renderProgress?.state,
        climberPosition: d.climberPosition, cameraPosition: d.cameraPosition,
        calls: d.calls, triangles: d.triangles, geometries: d.geometries, textures: d.textures,
        canvasHash: null };
    });
    if (index % 10 === 0) {
      const file = 'canvas-' + String(index).padStart(2, '0') + '.png';
      const png = await canvas.screenshot({ path: path.join(dir, file), timeout: 90000 });
      observation.canvasHash = createHash('sha256').update(png).digest('hex');
      if (index === 0 || index === 20) await page.screenshot({
        path: path.join(dir, 'full-' + String(index).padStart(2, '0') + '.png'), timeout: 90000 });
    }
    observations.push(observation);
  }
  await sample(0);
  // The frozen baseline can have a one-tick terminal phase; an authentic
  // frame still may not be present in composited video. Do not imply a visible
  // terminal result from a run-token change alone. Sample danger more densely
  // to observe any genuine guardian HP split and next-floor passage.
  // Every scenario still records >=68s of uninterrupted host play at native
  // wall-clock speed (nominal 20 fixed-step authority ticks per second).
  // No mocked state, accelerated page clock or replay scrubbing.
  const cadenceMs = scenario === 'outcome' || scenario === 'danger' ? 1000 : 2000;
  const intervals = 68000 / cadenceMs;
  for (let i = 1; i <= intervals; i++) {
    await page.waitForTimeout(cadenceMs);
    await sample(i);
  }
  const assessment = assessTowerMotion(observations, {
    minDurationMs: 60000, requireOutcomeRestart: scenario === 'outcome',
  });
  fs.writeFileSync(path.join(dir, 'motion.json'), JSON.stringify({
    method: 'Real live unmodified host at nominal 20 authoritative ticks/s; browser video and distinct WebGL canvas captures; CI software renderer, not intended device',
    sourceSha: process.env.TOWER_CAPTURE_SOURCE_SHA || process.env.GITHUB_SHA || null,
    seed: process.env.TOWER_SEED || 'tower-stream-reference',
    scenario, launchFloor: process.env.TOWER_LAUNCH_FLOOR || '0',
    viewport, graphicsTier: 'low', reducedMotion: false, soundEnabled: false,
    videoGeometry: { width: viewport.width, height: viewport.height,
      fixture: 'playwright-context-created-with-native-viewport-and-recording-size' },
    actualWallSeconds: assessment.wallMs / 1000, minimumRequiredSeconds: 60,
    outcomeCapture: scenario === 'outcome' ? { maxTicks: 900, noProgressTicks: 850, intermissionTicks: 36 } : null,
    capturedAt: new Date().toISOString(), observations, assessment, errors,
    independentReview: false,
    gates: { captureIntegrity: assessment.scopedPass ? 'PASS' : 'FAIL',
      completeMotion: 'OPEN: manually review unedited normal-speed video for climbing, guardian danger, true result and restart',
      sustainedDeviceFps: 'OPEN: no real device or presented-frame measurement',
      jusantAstroComparison: 'OPEN: requires fresh independent side-by-side evaluation' },
  }, null, 2));
  const video = page.video();
  await page.close();
  if (video) await video.saveAs(path.join(dir, 'live.webm'));
  expect(errors, 'real browser and WebGL errors must remain visible').toEqual([]);
  expect(assessment.blockers, 'capture integrity: ' + JSON.stringify(assessment)).toEqual([]);
  expect(assessment.scopedPass).toBe(true);
    });
  });
}
