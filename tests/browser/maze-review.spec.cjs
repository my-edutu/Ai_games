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

  // Render and preserve the *actual props* still missing from the visual
  // review. Both samples are selected from the same deterministic production
  // exploration sequences above; neither is a staged/invented world state.
  const keySample = objectiveSamples.find(sample => sample.goal.kind === 'key'
    && sample.frame.snapshot.keys.some(key => key.cell === sample.goal.cell && !key.collected));
  expect(keySample, 'Production public exploration must reveal an uncollected reachable key').toBeTruthy();
  activeFrame = keySample.frame;
  await page.goto(base + '/maze?reducedMotion=1', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(({tick, token}) => window.__MAZE_3D__?.frames >= 3
    && window.__MAZE_3D__?.tick === tick && window.__MAZE_3D__?.runToken === token,
    {tick: activeFrame.snapshot.tick, token: activeFrame.snapshot.runToken});
  const keyDiagnostic = await page.evaluate(() => window.__MAZE_3D__);
  expect(keyDiagnostic.keysInFrame, 'The actual uncollected key mesh must be inside the camera').toBeGreaterThan(0);
  expect(keyDiagnostic.objectiveCue?.kind).toBe('key');
  const keyImage = path.join(dir, 'known-key.png');
  await page.screenshot({path: keyImage, fullPage: true});
  fs.writeFileSync(path.join(dir, 'known-key.json'), JSON.stringify({
    capturedAt: new Date().toISOString(), seed: keySample.seed,
    source: 'Unaltered production MazeRuntime public frame rendered in the actual browser',
    tick: activeFrame.snapshot.tick, publicKey: keySample.goal,
    imageSha256: hash(keyImage),
    sourceSha256: Object.fromEntries(['app.js', 'map-view.mjs', 'scene.js', 'world.js'].map(name => [name, hash(path.join(sourceDir, name))])),
    diagnostic: {keysInFrame: keyDiagnostic.keysInFrame, objectiveCue: keyDiagnostic.objectiveCue,
      quality: keyDiagnostic.quality, frameP50Ms: keyDiagnostic.frameP50Ms},
    caveat: 'No disclosed path guarantees safety; CPU-throttled software render, not independent benchmark acceptance.',
  }, null, 2));

  // Reuse the same Chromium page and exactly the same genuine public key
  // snapshot for narrow portrait evidence; do not synthesize a key position.
  await page.setViewportSize({width: 390, height: 844});
  await page.waitForFunction(() => window.__MAZE_3D__?.frames > 4);
  const portraitKeyDiagnostic = await page.evaluate(() => window.__MAZE_3D__);
  const portraitKeyImage = path.join(dir, 'known-key-portrait.png');
  await page.screenshot({path: portraitKeyImage, fullPage: true});
  fs.writeFileSync(path.join(dir, 'known-key-portrait.json'), JSON.stringify({
    capturedAt: new Date().toISOString(), seed: keySample.seed, tick: keySample.frame.snapshot.tick,
    source: 'Same production public key snapshot and browser, 390px CSS viewport; not a synthetic scene',
    viewport: {width: 390, height: 844}, imageSha256: hash(portraitKeyImage),
    sourceSha256: Object.fromEntries(['app.js', 'map-view.mjs', 'scene.js', 'world.js'].map(name => [name, hash(path.join(sourceDir, name))])),
    diagnostic: {keysInFrame: portraitKeyDiagnostic.keysInFrame,
      explorerProjection: portraitKeyDiagnostic.explorerProjection, quality: portraitKeyDiagnostic.quality},
    caveat: 'Portrait composition needs native-size independent review; software-rendered CI is not hardware FPS.',
  }, null, 2));
  await page.setViewportSize({width: 1280, height: 900});

  const sealedSamples = sequences.flat().map(sample => {
    const s = sample.frame.snapshot, known = new Set(s.cells.map(cell => cell.cell));
    const doors = s.doors.filter(door => !door.open && (known.has(door.a) || known.has(door.b)));
    const distance = doors.length ? Math.min(...doors.map(door => Math.min(...[door.a, door.b]
      .filter(cell => known.has(cell)).map(cell =>
        Math.abs(cell % s.width - s.currentCell % s.width)
        + Math.abs(Math.floor(cell / s.width) - Math.floor(s.currentCell / s.width))))))
      : Infinity;
    return {...sample, distance, doors};
  }).filter(sample => sample.frame.snapshot.lifecycle === 'running' && sample.distance <= 2)
    .sort((a, b) => a.frame.snapshot.threats.length - b.frame.snapshot.threats.length
      || a.distance - b.distance || b.frame.snapshot.cells.length - a.frame.snapshot.cells.length);
  expect(sealedSamples.length, 'A real public run must reveal a nearby *closed* gate').toBeGreaterThan(0);
  const sealed = sealedSamples[0];
  activeFrame = sealed.frame;
  await page.goto(base + '/maze?reducedMotion=1', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(({tick, token}) => window.__MAZE_3D__?.frames >= 3
    && window.__MAZE_3D__?.tick === tick && window.__MAZE_3D__?.runToken === token,
    {tick: activeFrame.snapshot.tick, token: activeFrame.snapshot.runToken});
  const gateDiagnostic = await page.evaluate(() => window.__MAZE_3D__);
  expect(gateDiagnostic.closedGatesInFrame, 'The disclosed sealed gate must actually appear in the camera').toBeGreaterThan(0);
  expect(gateDiagnostic.nearbySealedGate, 'A nearby publicly observed gate should be camera-framed').toBeTruthy();
  expect(gateDiagnostic.nearbySealedGateProjection?.inFrame).toBe(true);
  expect(gateDiagnostic.explorerInFrame).toBe(true);
  if (gateDiagnostic.keyLockCloseup) {
    expect(gateDiagnostic.carriedKeyGateGesture, 'Only a real matching key may trigger the close-up').toBeGreaterThan(.2);
    expect(gateDiagnostic.cameraHalfHeight, 'The visible key/socket encounter earns a genuinely closer shot').toBeLessThan(4.62);
    expect(gateDiagnostic.cameraHalfHeight).toBeGreaterThan(4.48);
  } else {
    expect(gateDiagnostic.cameraHalfHeight, 'Other sealed gates retain the previous truthful wide shot').toBeLessThan(5.2);
    expect(gateDiagnostic.cameraHalfHeight).toBeGreaterThan(4.95);
  }
  expect(Math.abs(gateDiagnostic.nearbySealedGateProjection.x), 'The gate must retain horizontal edge breathing room').toBeLessThan(.8);
  expect(Math.abs(gateDiagnostic.explorerProjection.x), 'Pip must not be pushed toward the horizontal edge').toBeLessThan(.8);
  const gateImage = path.join(dir, 'sealed-gate.png');
  await page.screenshot({path: gateImage, fullPage: true});
  fs.writeFileSync(path.join(dir, 'sealed-gate.json'), JSON.stringify({
    capturedAt: new Date().toISOString(), seed: sealed.seed,
    source: 'Unaltered production MazeRuntime public frame and actual WebGL gate mesh',
    tick: activeFrame.snapshot.tick, disclosedClosedGateIds: sealed.doors.map(door => door.id),
    imageSha256: hash(gateImage),
    sourceSha256: Object.fromEntries(['app.js', 'map-view.mjs', 'scene.js', 'world.js'].map(name => [name, hash(path.join(sourceDir, name))])),
    diagnostic: {closedGatesInFrame: gateDiagnostic.closedGatesInFrame,
      cameraHalfHeight: gateDiagnostic.cameraHalfHeight,
      keyLockCloseup: gateDiagnostic.keyLockCloseup,
      carriedKeyGateGesture: gateDiagnostic.carriedKeyGateGesture,
      nearbySealedGate: gateDiagnostic.nearbySealedGate,
      nearbySealedGateProjection: gateDiagnostic.nearbySealedGateProjection,
      explorerProjection: gateDiagnostic.explorerProjection,
      quality: gateDiagnostic.quality, frameP50Ms: gateDiagnostic.frameP50Ms},
    caveat: 'Closed gate is an observed obstruction, not a hint of a hidden passage; hardware FPS and independent visual quality remain unverified.',
  }, null, 2));

  // A single additional portrait capture uses the same actually disclosed
  // gate and actor positions. This is visual evidence, not a passing A/B.
  await page.setViewportSize({width: 390, height: 844});
  await page.waitForFunction(() => window.__MAZE_3D__?.frames > 4);
  const gatePortraitDiagnostic = await page.evaluate(() => window.__MAZE_3D__);
  expect(gatePortraitDiagnostic.closedGatesInFrame).toBeGreaterThan(0);
  expect(gatePortraitDiagnostic.nearbySealedGateProjection?.inFrame).toBe(true);
  expect(gatePortraitDiagnostic.explorerInFrame).toBe(true);
  if (gatePortraitDiagnostic.keyLockCloseup) {
    expect(gatePortraitDiagnostic.carriedKeyGateGesture, 'The portrait close-up must have a real carried key').toBeGreaterThan(.2);
    expect(gatePortraitDiagnostic.cameraHalfHeight, 'A true key/lock interaction is now larger at 390px').toBeLessThan(4.76);
    expect(gatePortraitDiagnostic.cameraHalfHeight).toBeGreaterThan(4.64);
  } else {
    expect(gatePortraitDiagnostic.cameraHalfHeight, 'A gate without a matched key retains its known environment').toBeLessThan(5.57);
    expect(gatePortraitDiagnostic.cameraHalfHeight).toBeGreaterThan(5.37);
  }
  expect(Math.abs(gatePortraitDiagnostic.nearbySealedGateProjection.x), 'Portrait gate must keep a margin').toBeLessThan(.8);
  expect(Math.abs(gatePortraitDiagnostic.explorerProjection.x), 'Portrait Pip must keep a margin').toBeLessThan(.8);
  const portraitGateImage = path.join(dir, 'sealed-gate-portrait.png');
  await page.screenshot({path: portraitGateImage, fullPage: true});
  fs.writeFileSync(path.join(dir, 'sealed-gate-portrait.json'), JSON.stringify({
    capturedAt: new Date().toISOString(), seed: sealed.seed, tick: sealed.frame.snapshot.tick,
    source: 'Same public sealed gate and running Chromium page as desktop evidence, not invented state',
    viewport: {width: 390, height: 844}, imageSha256: hash(portraitGateImage),
    sourceSha256: Object.fromEntries(['app.js', 'map-view.mjs', 'scene.js', 'world.js'].map(name => [name, hash(path.join(sourceDir, name))])),
    diagnostic: {closedGatesInFrame: gatePortraitDiagnostic.closedGatesInFrame,
      cameraHalfHeight: gatePortraitDiagnostic.cameraHalfHeight,
      keyLockCloseup: gatePortraitDiagnostic.keyLockCloseup,
      carriedKeyGateGesture: gatePortraitDiagnostic.carriedKeyGateGesture,
      nearbySealedGate: gatePortraitDiagnostic.nearbySealedGate,
      nearbySealedGateProjection: gatePortraitDiagnostic.nearbySealedGateProjection,
      explorerProjection: gatePortraitDiagnostic.explorerProjection,
      quality: gatePortraitDiagnostic.quality},
    caveat: 'An actually closed gate; camera framing is not a safe-route promise or independent quality win.',
  }, null, 2));
});
