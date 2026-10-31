'use strict';

const { test, expect } = require('@playwright/test');
const base = 'http://127.0.0.1:4174';

test('maze camera focuses the discovered public map instead of the full hidden grid', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${base}/maze`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__MAZE_PUBLIC_STATE__ && window.__MAZE_VIEW__);
  const value = await page.evaluate(() => ({ state: window.__MAZE_PUBLIC_STATE__, view: window.__MAZE_VIEW__ }));
  expect(value.view.widthCells).toBeGreaterThanOrEqual(6);
  expect(value.view.heightCells).toBeGreaterThanOrEqual(5);
  expect(value.view.widthCells).toBeLessThanOrEqual(value.state.width);
  expect(value.view.heightCells).toBeLessThanOrEqual(value.state.height);
  if (value.state.progressPermille < 600) {
    expect(value.view.widthCells < value.state.width || value.view.heightCells < value.state.height).toBe(true);
  }
  expect(value.view.containsCurrentCell).toBe(true);
});

test('slow state responses never create overlapping browser-source polls', async ({ page }) => {
  let active = 0;
  let maximum = 0;
  await page.route('**/maze/state*', async route => {
    active += 1;
    maximum = Math.max(maximum, active);
    await new Promise(resolve => setTimeout(resolve, 420));
    active -= 1;
    await route.continue();
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${base}/maze`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1450);
  expect(maximum).toBe(1);
});


test('a real close public encounter frames both autonomous actors and saves dated evidence', async ({ page }) => {
  const fs = require('node:fs');
  const path = require('node:path');
  const { createHash } = require('node:crypto');
  const { scenarios } = require('../../scripts/capture-maze-3d.cjs');
  const { encounter, sequences } = scenarios();
  // Never fabricate or move a guardian into place just to obtain a screenshot.
  expect(encounter, 'A production run must expose two nearby, distinct real actors').toBeTruthy();
  const frame = encounter.frame;
  expect(frame.snapshot.threats.length).toBeGreaterThan(0);
  expect(encounter.distanceCells).toBeGreaterThanOrEqual(1);
  expect(encounter.distanceCells).toBeLessThanOrEqual(2.25);

  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1280, height: 900 });
  let activeFrame = frame;
  await page.route('**/maze/state*', route => route.fulfill({ json: activeFrame }));
  await page.goto(base + '/maze?camera=detail&reducedMotion=1', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(({ tick, token }) =>
    window.__MAZE_3D__?.frames >= 3
    && window.__MAZE_3D__?.tick === tick
    && window.__MAZE_3D__?.runToken === token
    && window.__MAZE_3D__?.encounterAttention > 0,
    { tick: frame.snapshot.tick, token: frame.snapshot.runToken });
  const diagnostics = await page.evaluate(() => window.__MAZE_3D__);
  expect(diagnostics.disclosedThreats).toBeGreaterThan(0);
  expect(diagnostics.characterCount).toBeGreaterThan(1);
  expect(diagnostics.wardensInFrame, 'At least one disclosed guardian must actually share the camera with Pip').toBeGreaterThan(0);
  expect(diagnostics.encounterAttention).toBeGreaterThan(0);
  expect(diagnostics.explorerInFrame).toBe(true);
  expect(errors).toEqual([]);

  const dir = path.resolve(__dirname, '../../artifacts/maze-phase3');
  fs.mkdirSync(dir, { recursive: true });
  const imagePath = path.join(dir, 'encounter-public.png');
  await page.screenshot({ path: imagePath, fullPage: true });
  const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  const sourceDir = path.resolve(__dirname, '../../public/ai-maze-escape');
  fs.writeFileSync(path.join(dir, 'encounter-public.json'), JSON.stringify({
    capturedAt: new Date().toISOString(),
    source: 'Actual MazeRuntime public snapshot, production browser renderer; no inserted actors',
    seed: encounter.seed,
    tick: frame.snapshot.tick,
    publicThreatDistanceCells: encounter.distanceCells,
    imageSha256: hash(imagePath),
    sourceSha256: Object.fromEntries(
      ['app.js', 'scene.js', 'characters.js', 'world.js']
        .map(name => [name, hash(path.join(sourceDir, name))])
    ),
    diagnostics: {
      quality: diagnostics.quality,
      triangles: diagnostics.triangles,
      characterCount: diagnostics.characterCount,
      disclosedThreats: diagnostics.disclosedThreats,
      wardensInFrame: diagnostics.wardensInFrame,
      encounterAttention: diagnostics.encounterAttention,
      explorerInFrame: diagnostics.explorerInFrame,
      frameP50Ms: diagnostics.frameP50Ms,
    },
    caveat: 'Screenshot is CI software-rendered evidence, not hardware FPS, blind A/B or benchmark parity.',
  }, null, 2));

  // Separate authentic screenshot gate for an actionable *known* landmark.
  // Reuse this page/browser, not another CPU-heavy graphics process.
  const {publicObjective} = await import('../../public/ai-maze-escape/map-view.mjs');
  const objectiveSamples = sequences.flat().map(sample => ({...sample, goal: publicObjective(sample.frame.snapshot)}))
    .filter(sample => sample.goal && sample.goal.steps > 0 && sample.goal.steps <= 2
      && sample.frame.snapshot.lifecycle === 'running' && !sample.frame.snapshot.threats.length)
    .sort((a, b) => a.goal.steps - b.goal.steps || b.frame.snapshot.cells.length - a.frame.snapshot.cells.length);
  expect(objectiveSamples.length, 'A real production exploration must reveal an observed connected landmark').toBeGreaterThan(0);
  const observed = objectiveSamples[0];
  activeFrame = observed.frame;
  await page.goto(base + '/maze?reducedMotion=1', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(({tick, token}) => window.__MAZE_3D__?.frames >= 3
    && window.__MAZE_3D__?.tick === tick && window.__MAZE_3D__?.runToken === token,
    {tick: activeFrame.snapshot.tick, token: activeFrame.snapshot.runToken});
  const observedDiagnostic = await page.evaluate(() => window.__MAZE_3D__);
  expect(observedDiagnostic.objectiveCue).toEqual(observed.goal);
  expect(observedDiagnostic.objectiveInFrame, 'Actual landmark should be visible in the captured camera').toBe(true);
  const landmarkPath = path.join(dir, 'observed-landmark.png');
  await page.screenshot({path: landmarkPath, fullPage: true});
  fs.writeFileSync(path.join(dir, 'observed-landmark.json'), JSON.stringify({
    capturedAt: new Date().toISOString(),
    source: 'Real seeded MazeRuntime public snapshot, actual WebGL browser; no invented landmarks',
    seed: observed.seed, tick: activeFrame.snapshot.tick,
    publicGoal: observed.goal,
    imageSha256: hash(landmarkPath),
    sourceSha256: Object.fromEntries(['app.js', 'map-view.mjs', 'scene.js', 'world.js'].map(name => [name, hash(path.join(sourceDir, name))])),
    diagnostic: {objectiveCue: observedDiagnostic.objectiveCue, objectiveInFrame: observedDiagnostic.objectiveInFrame,
      quality: observedDiagnostic.quality, frameP50Ms: observedDiagnostic.frameP50Ms},
    caveat: 'Known connection only, not safety; CPU-throttled CI software rendering; independent visual acceptance pending.',
  }, null, 2));
});
