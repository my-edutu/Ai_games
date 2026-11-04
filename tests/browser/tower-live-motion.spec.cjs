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
  test('normal-speed Tower motion ' + viewport.name, async ({ browser }, testInfo) => {
  test.setTimeout(240000);
  // Playwright forbids a describe-scoped video override because it changes
  // worker isolation. Create a dedicated context per viewport instead, with
  // recorder dimensions declared BEFORE the first page exists. This same
  // source-independent test runs against the frozen baseline and candidate.
  const nativeVideoDir = testInfo.outputPath('native-video');
  fs.mkdirSync(nativeVideoDir, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    recordVideo: { dir: nativeVideoDir, size: { width: viewport.width, height: viewport.height } },
  });
  const page = await context.newPage();
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
      // The frozen gameplay source exposes the real result for only one 50ms
      // tick, but its genuine intermission still renders the source result card.
      // A missed 50ms sample is not missing actual outcome footage. Witness
      // the real visible DOM using layout, style and topmost hit-testing; the
      // separate unedited WebM remains mandatory for human video inspection.
      const resultCard = document.getElementById('result-card');
      const rect = resultCard?.getBoundingClientRect();
      const style = resultCard ? getComputedStyle(resultCard) : null;
      const middleX = rect ? rect.left + rect.width / 2 : -1;
      const middleY = rect ? rect.top + rect.height / 2 : -1;
      const topmost = rect && middleX >= 0 && middleY >= 0
        ? document.elementFromPoint(middleX, middleY) : null;
      const resultCardVisible = !!rect && !resultCard.hidden &&
        style.display !== 'none' && style.visibility === 'visible' &&
        Number(style.opacity) > 0 && rect.width > 80 && rect.height > 45 &&
        rect.left >= 0 && rect.top >= 0 &&
        rect.right <= innerWidth && rect.bottom <= innerHeight &&
        !!topmost && (topmost === resultCard || resultCard.contains(topmost));
      return { atMs: Date.now(), tick: s?.tick, runToken: s?.runToken, checksum: s?.publicChecksum,
        floor: s?.floor, scene: s?.lifecycle, state: s?.player?.state, dangerPermille: s?.dangerPermille,
        sourceResult: s?.result || null, sourceFloorsCleared: s?.progress?.floorsCleared ?? null,
        observedResultCard: {
          visible: resultCardVisible, runToken: s?.runToken ?? null,
          title: document.getElementById('result-title')?.textContent?.trim() || '',
          height: document.getElementById('result-height')?.textContent?.trim() || '',
          note: 'Source-matched, topmost DOM-visible authentic result. Unedited video must still be independently watched.',
        },
        observedFinale: d?.finale || null, observedTerminalCamera: d?.terminalCamera || null,
        guardianActive: (s?.enemies || []).some(e => e.active && e.kind === 'guardian'),
        guardianHealth: (s?.enemies || []).filter(e => e.kind === 'guardian').map(e => ({ active: e.active, health: e.health, maxHealth: e.maxHealth })),
        observedGate: d.world?.guardianGates || [],
        // Real AI platform intent rendered as depth-tested 3D stones; source
        // snapshot remains the only authority for route/collision decisions.
        observedRouteIntent: d.routeIntent || null,
        observedGuardianCircuit: d.guardianCircuit || null,
        observedAtmosphere: d.atmosphere || null,
        // In the real generated source, moving platforms occur at floor
        // 1, 4, 7, 10... (p3). The matched supplementary floor-7 video
        // makes the actual autonomous ride and cosmetic carriage inspectable.
        // This is observational metadata, NOT a substitute for live WebM.
        sourceMovingDecks: (s?.platforms || []).filter(p => p.kind === 'moving')
          .map(p => ({ id:p.id, x:p.x, y:p.y, width:p.width, height:p.height })),
        observedMovingSuspension: d.movingDeckSuspension || null,
        observedMovingCarriage: d?.world ? {
          cranks: d.world.observedMovingDeckCranks ?? null,
          driveStages: d.world.observedMovingDeckDriveStages ?? null,
          lastDriveTick: d.world.observedMovingDeckDriveLastTick ?? null,
          positions: (d.world.platformTransforms || [])
            .filter(p => (s?.platforms || []).some(source =>
              source.kind === 'moving' && source.id === p.id))
            .map(p => ({ id:p.id, x:p.x, y:p.y })),
        } : null,
        // Exact presented-camera world projection at the time of a genuine
        // source HP observation. Unlike a source-only geometry fixture, this
        // records whether the guardian and gate are actually inside the
        // continuous desktop/portrait video camera crop.
        observedCamera: d.encounterCamera || null,
        observedActor: d.actorCamera || null,
        // Captured alongside genuine source tick/HP and camera crop; telemetry
        // is not a substitute for watching the unmodified full-motion video.
        observedMotionEcho: d.observedMotionEcho || null,
        observedStageLight: d.observedStageLight || null,
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
  const cadenceMs = ['outcome', 'danger', 'moving'].includes(scenario) ? 1000 : 2000;
  const intervals = 68000 / cadenceMs;
  for (let i = 1; i <= intervals; i++) {
    await page.waitForTimeout(cadenceMs);
    await sample(i);
  }
  const assessment = assessTowerMotion(observations, {
    minDurationMs: 60000, requireOutcomeRestart: scenario === 'outcome',
  });
  // The shared CI host can now witness every REAL fixed simulation tick,
  // including the frozen baseline's 50ms result. This trace is comparison
  // context and source provenance, NOT proof the image was actually rendered
  // or captured in the unedited normal-speed WebM.
  const traceResponse = await page.request.get('/tower/capture-trace',
    { timeout: 5000 }).catch(() => null);
  const trace = traceResponse?.ok() ? await traceResponse.json() : null;
  if (trace) fs.writeFileSync(path.join(dir, 'source-trace.json'),
    JSON.stringify(trace, null, 2));
  const sourceTicks = Array.isArray(trace?.ticks) ? trace.ticks : [];
  const sourceMovingSamples = observations.filter(o => o.sourceMovingDecks?.length);
  const observedMovingPositions = sourceMovingSamples.flatMap(o =>
    o.sourceMovingDecks.map(platform =>
      String(o.runToken) + ':' + platform.id + ':' + platform.x + ':' + platform.y));
  const sourceMovingSummary = {
    sourceFramesWithMovingDeck: sourceMovingSamples.length,
    real3dSuspensionVisibleSamples: observations.filter(o => o.observedMovingSuspension?.visible).length,
    real3dSuspensionContactSamples: observations.filter(o =>
      Number.isSafeInteger(o.observedMovingSuspension?.authenticContactTick) &&
      o.observedMovingSuspension.authenticContactTick >= 0).length,
    real3dSuspensionPieces: observations.find(o => o.observedMovingSuspension?.visible)?.observedMovingSuspension?.pieces || 0,
    distinctSourcePositions: new Set(observedMovingPositions).size,
    physicallyDrivenSceneSamples: observations.filter(o =>
      (o.observedMovingCarriage?.driveStages ?? 0) > 0 &&
      Number.isSafeInteger(o.observedMovingCarriage?.lastDriveTick) &&
      o.observedMovingCarriage.lastDriveTick >= 0).length,
    note: 'Read-only source/scene samples only. A zero captured spring sample is not proof the event never occurred: the 1000ms video sampling may miss its 12-tick stroke. Judging visual contact, mechanics and comparative motion still requires untouched native WebM; no device FPS or blind score.',
  };
  const sourcePhaseSummary = {
    available: !!trace, method: trace?.method || null,
    resultTicks: sourceTicks.filter(t => t.lifecycle === 'result').length,
    intermissionTicks: sourceTicks.filter(t => t.lifecycle === 'intermission').length,
    sourceRunTransitions: sourceTicks.reduce((count, item, index) =>
      count + (index && sourceTicks[index - 1].runToken !== item.runToken ? 1 : 0), 0),
    sampledVisualResult: observations.some(item => item.scene === 'result'),
    sampledVisualIntermission: observations.some(item => item.scene === 'intermission'),
    genuineDomResultSamples: observations.filter(item =>
      item.observedResultCard?.visible && item.sourceResult &&
      item.observedResultCard.runToken === item.runToken).length,
    note: 'The source 50ms result may fall between samples while its authentic result card remains visible in intermission. DOM hit-testing does not certify WebM pixels; inspect original footage.',
  };
  fs.writeFileSync(path.join(dir, 'motion.json'), JSON.stringify({
    method: 'Real live unmodified host at nominal 20 authoritative ticks/s; browser video and distinct WebGL canvas captures; CI software renderer, not intended device',
    sourceSha: process.env.TOWER_CAPTURE_SOURCE_SHA || process.env.GITHUB_SHA || null,
    seed: process.env.TOWER_SEED || 'tower-stream-reference',
    scenario, launchFloor: process.env.TOWER_LAUNCH_FLOOR || '0',
    viewport, graphicsTier: 'low', reducedMotion: false, soundEnabled: false,
    videoGeometry: { width: viewport.width, height: viewport.height,
      fixture: 'playwright-context-created-with-native-viewport-and-recording-size' },
    actualWallSeconds: assessment.wallMs / 1000, minimumRequiredSeconds: 60,
    outcomeCapture: scenario === 'outcome' ? {
      maxTicks: 900, noProgressTicks: 850, intermissionTicks: 100,
      note: 'Identical public scenario settings applied through neutral capture server; source game host not modified.',
    } : null,
    sampledActorOffscreen: observations.filter(item => item.observedActor?.inPicture === false).length,
    sampledActorUnsafe: observations.filter(item => item.observedActor?.inSafeFrame === false).length,
    capturedAt: new Date().toISOString(), observations, assessment,
    sourcePhaseSummary, sourceMovingSummary, errors,
    independentReview: false,
    gates: { captureIntegrity: assessment.scopedPass ? 'PASS' : 'FAIL',
      completeMotion: 'OPEN: manually review unedited normal-speed video for climbing, guardian danger, true result and restart',
      sustainedDeviceFps: 'OPEN: no real device or presented-frame measurement',
      jusantAstroComparison: 'OPEN: requires fresh independent side-by-side evaluation' },
  }, null, 2));
  const video = page.video();
  await page.close();
  await context.close();
  if (video) await video.saveAs(path.join(dir, 'live.webm'));
  expect(errors, 'real browser and WebGL errors must remain visible').toEqual([]);
  expect(assessment.blockers, 'capture integrity: ' + JSON.stringify(assessment)).toEqual([]);
  expect(assessment.scopedPass).toBe(true);
  });
}
