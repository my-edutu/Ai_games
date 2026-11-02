'use strict';

// Diagnostics only. None of these altered-source conditions can satisfy the
// production 17 FPS / 250 ms gate in snake-stream.spec.cjs.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { test, expect } = require('@playwright/test');
test.use({ trace: 'off', video: 'off', launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } });

const repo = path.resolve(__dirname, '../..');
const artifactPath = path.join(repo, 'artifacts/phase3/renderer-profile.json');
const frameArtifactPath = path.join(repo, 'artifacts/phase3/renderer-profile-frozen-frame.json');

function replaceOnce(source, before, after) {
  if (source.split(before).length !== 2) throw new Error(`Diagnostic source anchor changed: ${before.slice(0, 90)}`);
  return source.replace(before, after);
}

// Chromium's WebGL finish() is only a flush. This asynchronous fence is the
// actual completion boundary; its wall latency is not a GPU-only duration.
async function waitForGpuFence(gl, timeoutMs = 5000, pollMs = 4) {
  if (gl.isContextLost()) throw new Error('WebGL context lost before completion fence');
  const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
  if (!sync) throw new Error('WebGL completion fence could not be created');
  const started = performance.now();
  let polls = 0;
  try {
    gl.flush();
    for (;;) {
      if (gl.isContextLost()) throw new Error('WebGL context lost during completion fence');
      const status = gl.clientWaitSync(sync, 0, 0); polls++;
      if (status === gl.ALREADY_SIGNALED || status === gl.CONDITION_SATISFIED) return { completed: true, wallMs: performance.now() - started, polls };
      if (status === gl.WAIT_FAILED) throw new Error('WebGL completion fence wait failed');
      if (performance.now() - started >= timeoutMs) throw new Error(`WebGL completion fence timed out after ${timeoutMs} ms`);
      await new Promise(resolve => setTimeout(resolve, pollMs));
    }
  } finally { gl.deleteSync(sync); }
}

// Serialized into the browser module; contains no Node dependencies.
function installProfiler(canvas, renderer) {
  const gl = canvas.getContext('webgl2');
  const timer = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  const pending = [];
  let active = null, lastArgs = null, submissionMs = 0, paused = false;
  const summarize = values => {
    const sorted = [...values].sort((a, b) => a - b);
    const p = fraction => sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))] : null;
    return { count: sorted.length, mean: sorted.length ? sorted.reduce((a, b) => a + b, 0) / sorted.length : null, p50: p(0.5), p95: p(0.95), max: p(1) };
  };
  function pollQueries() {
    if (!timer || !pending.length) return;
    const disjoint = gl.getParameter(timer.GPU_DISJOINT_EXT);
    for (let index = pending.length - 1; index >= 0; index--) {
      const item = pending[index];
      if (disjoint) item.owner.disjointQueries++;
      else if (!gl.getQueryParameter(item.query, gl.QUERY_RESULT_AVAILABLE)) continue;
      else {
        const value = gl.getQueryParameter(item.query, gl.QUERY_RESULT) / 1e6;
        if (Number.isFinite(value) && value >= 0) item.owner.gpuMs.push(value);
      }
      gl.deleteQuery(item.query); pending.splice(index, 1);
    }
  }
  function draw(...args) {
    // Pausing is restricted to boundaries outside measured cadence. The app's
    // RAF may continue, but no such callbacks are included in a reported sample.
    if (paused) return;
    pollQueries();
    const owner = active;
    let query = null;
    if (owner && timer && !gl.getParameter(timer.GPU_DISJOINT_EXT) && pending.length < 8 && owner.queriesIssued < 8) {
      query = gl.createQuery(); gl.beginQuery(timer.TIME_ELAPSED_EXT, query); owner.queriesIssued++;
    }
    submissionMs = 0;
    const started = performance.now();
    let didDraw = false;
    try {
      const result = renderer.draw(...args);
      didDraw = result !== false;
      if (didDraw) lastArgs = args;
      return result;
    } finally {
      const elapsed = performance.now() - started;
      if (query) {
        gl.endQuery(timer.TIME_ELAPSED_EXT);
        if (didDraw) pending.push({ query, owner });
        else { gl.deleteQuery(query); owner.queriesIssued--; }
      }
      if (owner && didDraw) {
        owner.drawWallMs.push(elapsed);
        owner.renderSubmissionMs.push(submissionMs);
        owner.updateAndOrchestrationMs.push(Math.max(0, elapsed - submissionMs));
      }
    }
  }
  async function measure({ durationMs = 1300, drainBefore = true } = {}) {
    const owner = { drawWallMs: [], renderSubmissionMs: [], updateAndOrchestrationMs: [], gpuMs: [], queriesIssued: 0, disjointQueries: 0 };
    try {
      paused = true;
      const beforeFence = drainBefore ? await waitForGpuFence(gl) : null;
      const initial = renderer.stats();
      const initialRevision = lastArgs?.[0]?.snapshot?.revision;
      if (drainBefore) renderer.resetTiming?.();
      active = owner; paused = false;
      const started = performance.now(), times = [];
      const ended = await new Promise(resolve => {
        function step(time) {
          times.push(time);
          if (time - started >= durationMs) resolve(time);
          else requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
      active = null; paused = true;
      const final = renderer.stats();
      const finalRevision = lastArgs?.[0]?.snapshot?.revision;
      const afterFence = await waitForGpuFence(gl);
      // A fence establishes command completion, but query availability may need
      // more browser tasks. Collect every issued result or mark it incomplete.
      const queryStarted = performance.now();
      while (pending.some(item => item.owner === owner) && performance.now() - queryStarted < 1500) {
        await new Promise(resolve => setTimeout(resolve, 4)); pollQueries();
      }
      const queryCollectionWallMs = performance.now() - queryStarted;
      const outstandingQueries = pending.filter(item => item.owner === owner).length;
      const querySetComplete = outstandingQueries === 0 && owner.gpuMs.length + owner.disjointQueries === owner.queriesIssued;
      const querySetUsable = querySetComplete && owner.disjointQueries === 0 && owner.gpuMs.length > 0;
      const probes = [];
      if (!querySetUsable && lastArgs) {
        // Separate, real draws with a true completion fence. These wall times
        // include CPU work, driver work and async polling, not just GPU time.
        for (let index = 0; index < 3; index++) {
          submissionMs = 0;
          const begin = performance.now();
          const args = [...lastArgs]; args[3] = performance.now();
          if (renderer.draw(...args) === false) throw new Error('Diagnostic completion probe did not submit a frame');
          lastArgs = args;
          const submitted = performance.now();
          const fence = await waitForGpuFence(gl);
          probes.push({ drawWallMs: submitted - begin, renderSubmissionMs: submissionMs, completionFence: fence, completedWallMs: performance.now() - begin });
        }
      }
      const gaps = times.slice(1).map((value, index) => value - times[index]);
      const actualDraws = final.frameCount - initial.frameCount;
      return {
        cadence: { callbacks: times.length, actualDraws, elapsedMs: ended - started, averageFps: actualDraws / ((ended - started) / 1000), gapsMs: summarize(gaps) },
        boundaries: { drainBefore, beforeFence, afterFence, queryCollectionWallMs },
        cpu: { drawWallMs: summarize(owner.drawWallMs), threeRenderSubmissionMs: summarize(owner.renderSubmissionMs), updateAndOrchestrationMs: summarize(owner.updateAndOrchestrationMs) },
        gpu: { method: querySetUsable ? 'complete-non-disjoint-time-elapsed-queries' : 'fence-completed-wall-probes', timerExtension: !!timer,
          status: querySetUsable ? 'complete' : !timer ? 'no-timer-extension' : outstandingQueries ? 'incomplete-query-results' : owner.disjointQueries ? 'disjoint-query-results' : 'no-query-samples',
          querySetComplete, querySetUsable, elapsedMs: summarize(owner.gpuMs), queriesIssued: owner.queriesIssued, disjointQueries: owner.disjointQueries, outstandingQueries, completionProbes: probes },
        initial, final, initialRevision, finalRevision, glError: gl.getError(), contextAttributes: gl.getContextAttributes(),
        stableCacheDuringSample: initial.staticCache.builds === final.staticCache.builds,
      };
    } finally {
      active = null;
      for (let index = pending.length - 1; index >= 0; index--) {
        if (pending[index].owner === owner) { gl.deleteQuery(pending[index].query); pending.splice(index, 1); }
      }
      paused = false;
    }
  }
  const profiler = { measure, snapshot: () => lastArgs?.[0], recordSubmission(milliseconds) { submissionMs += milliseconds; } };
  window.__snakeRenderProfiler = profiler;
  return {
    ...renderer, draw,
    dispose() {
      for (const item of pending) gl.deleteQuery(item.query);
      pending.length = 0; active = null; renderer.dispose();
      if (window.__snakeRenderProfiler === profiler) delete window.__snakeRenderProfiler;
    },
  };
}

function buildDiagnosticSource(original, { lockScale = true } = {}) {
  let source = replaceOnce(original, 'export function createSceneRenderer(', 'function createSceneRendererUnprofiled(');
  source = replaceOnce(source, 'renderer.setPixelRatio(pixelRatio);', 'renderer.setPixelRatio(0.4);');
  if (lockScale) source = replaceOnce(source, 'let scaleAdjusted = false;', 'let scaleAdjusted = true;');
  source = replaceOnce(source, 'renderer.info.autoReset = false;', `renderer.info.autoReset = false;
  const submitRender = renderer.render.bind(renderer);
  renderer.render = (...args) => {
    const started = performance.now();
    try { return submitRender(...args); }
    finally { window.__snakeRenderProfiler?.recordSubmission(performance.now() - started); }
  };`);
  source = replaceOnce(source, '      camera.layers.set(DYNAMIC_LAYER);\n      liveCacheQuad.visible = true;\n      renderer.render(scene, camera);', `      camera.layers.set(DYNAMIC_LAYER);
      // Diagnostic only: keep original R46 cached quad and depth intact.
      liveCacheQuad.visible = true;
      const water = world.group.getObjectByName('Flowing water');
      if (window.__snakeProfileDrawMode === 'omit-water' && !water?.isMesh) throw new Error('Diagnostic Flowing water mesh was not found');
      const oldWater = water?.visible, oldSerpent = serpent.group.visible, oldContacts = contacts.visible;
      try {
        if (window.__snakeProfileDrawMode === 'omit-water' && water) water.visible = false;
        if (window.__snakeProfileDrawMode === 'omit-serpent-and-contacts') { serpent.group.visible = false; contacts.visible = false; }
        renderer.render(scene, camera);
      } finally {
        if (water) water.visible = oldWater;
        serpent.group.visible = oldSerpent; contacts.visible = oldContacts;
      }`);
  return `${source}\n${waitForGpuFence.toString()}\n${installProfiler.toString()}\nexport function createSceneRenderer(canvas, options) { return installProfiler(canvas, createSceneRendererUnprofiled(canvas, options)); }\n`;
}

function minimalHtml(frame, canvas) {
  return `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#101c17}#game{display:block;position:absolute;left:${canvas.x}px;top:${canvas.y}px;width:${canvas.width}px;height:${canvas.height}px}</style><canvas id="game"></canvas><script type="module">
    import { createSceneRenderer } from '/renderer.mjs';
    const frame = ${JSON.stringify(frame).replaceAll('<', '\\u003c')};
    const renderer = createSceneRenderer(document.getElementById('game'));
    window.__snakePresentation = { stats: () => renderer.stats() };
    let stopped = false, animation;
    function draw(time) { if (stopped) return; renderer.draw(frame, frame, 1, time, { reducedMotion: false, cameraMode: 'overview' }); animation = requestAnimationFrame(draw); }
    animation = requestAnimationFrame(draw);
    addEventListener('pagehide', () => { stopped = true; cancelAnimationFrame(animation); renderer.dispose(); });
  </script>`;
}

test('diagnostic only: split real renderer submission, GPU work and presentation', async ({ browser, baseURL }) => {
  test.setTimeout(90000);
  const started = Date.now(), deadline = started + 80000;
  const source = fs.readFileSync(path.join(repo, 'public/snake-stream/renderer.mjs'), 'utf8');
  const report = {
    diagnosticOnly: true, productionGateUnchanged: true, viewport: { width: 1920, height: 1080 }, fixedPixelRatio: 0.4,
    version: 2,
    rendererSha256: crypto.createHash('sha256').update(source).digest('hex'),
    assumptions: [
      'First two phases use real live snapshots. The last actually drawn public frame is then saved and reused by every frozen phase; no simulation changes.',
      'Default startup retains native initial resolution and adaptation timing, with the eventual low ratio fixed to0.4. Initial-low controls lock adaptation from construction.',
      'Full app and minimal frozen page share canvas dimensions, viewport, DPR, camera, native antialiasing and renderer source.',
      'Public draw wall time includes updates and submission; Three render wall time can include driver backpressure.',
      'Chromium WebGL finish is not a completion boundary. WebGL2 fenceSync/flush/clientWaitSync establishes completion while actual draws are paused outside cadence.',
      'Only complete non-disjoint timer-query sets represent GPU timing; fallback fence-probe wall times include CPU and async polling latency.',
      'The startup cadence alone has no predrain, matching the production warmup point. Every other cadence follows a true fenced drain.',
      'Water/serpent omissions affect drawing only; real model updates and cached scenery remain. Partial scenes never satisfy the production gate.',
      'Sequential startup/live comparisons are not randomized; query completeness and cache stability are reported explicitly.',
    ], results: [],
  };
  const contexts = new Set();
  const save = () => { fs.mkdirSync(path.dirname(artifactPath), { recursive: true }); fs.writeFileSync(artifactPath, `${JSON.stringify(report, null, 2)}\n`); };
  const remaining = () => Math.max(0, deadline - Date.now());
  const limit = milliseconds => Math.max(1, Math.min(milliseconds, remaining()));
  const deadlineTimer = setTimeout(() => {
    report.budgetExceeded = true; save();
    for (const context of contexts) context.close().catch(() => {});
  }, 80000);
  async function openPage({ minimal = false, canvas, frame = null, initialLow = true } = {}) {
    if (remaining() < 5000) throw new Error('Diagnostic work budget exhausted');
    const context = await browser.newContext({ baseURL, viewport: report.viewport, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
    contexts.add(context);
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.addInitScript(() => { window.__snakeProfileDrawMode = 'full'; });
    if (frame) await page.route('**/snapshot', route => route.fulfill({ json: frame }));
    await page.route('**/renderer.mjs', route => route.fulfill({ contentType: 'text/javascript', body: buildDiagnosticSource(source, { lockScale: initialLow }) }));
    if (minimal) await page.route('**/__snake-render-profile*', route => route.fulfill({ contentType: 'text/html', body: minimalHtml(frame, canvas) }));
    await page.goto(minimal ? '/__snake-render-profile?quality=low' : initialLow ? '/?quality=low' : '/', { waitUntil: 'domcontentloaded', timeout: limit(10000) });
    await page.waitForFunction(() => window.__snakeRenderProfiler && window.__snakePresentation?.stats().frameCount >= 20, null, { timeout: limit(18000), polling: 100 });
    return { page, context, errors };
  }
  async function close({ context }) { await context.close(); contexts.delete(context); }
  async function measure(subject, name, { mode = 'full', drainBefore = true, startup = false } = {}) {
    if (remaining() < 7000) { report.results.push({ name, diagnosticOnly: true, status: 'skipped-budget' }); save(); return; }
    await subject.page.evaluate(mode => { window.__snakeProfileDrawMode = mode; }, mode);
    if (!startup) {
      const frameCount = await subject.page.evaluate(() => window.__snakePresentation.stats().frameCount);
      await subject.page.waitForFunction(initial => window.__snakePresentation.stats().frameCount >= initial + 3, frameCount, { timeout: limit(7000), polling: 100 });
    }
    const data = await subject.page.evaluate(drainBefore => window.__snakeRenderProfiler.measure({ durationMs: 1300, drainBefore }), drainBefore);
    const result = { name, diagnosticOnly: true, mode, startup, status: 'measured', ...data, errors: [...subject.errors] };
    report.results.push(result); save();
    console.log('SNAKE_RENDER_PROFILE', JSON.stringify({ name, diagnosticOnly: true, mode, startup, cadence: data.cadence, boundaries: data.boundaries, cpu: data.cpu, gpu: data.gpu,
      initialRenderer: { frameCount: data.initial.frameCount, pixelRatio: data.initial.pixelRatio, renderScale: data.initial.renderScale, staticCache: data.initial.staticCache },
      renderer: { pixelRatio: data.final.pixelRatio, drawingBuffer: data.final.drawingBuffer, drawCalls: data.final.drawCalls, triangles: data.final.triangles, staticCache: data.final.staticCache, renderScale: data.final.renderScale },
      initialRevision: data.initialRevision, finalRevision: data.finalRevision,
      stableCacheDuringSample: data.stableCacheDuringSample, nativeAntialias: data.contextAttributes.antialias, glError: data.glError, errors: subject.errors }));
  }
  try {
    const live = await openPage({ initialLow: false });
    report.canvas = await live.page.locator('#game').evaluate(canvas => { const rect = canvas.getBoundingClientRect(); return { x: rect.x, y: rect.y, width: canvas.clientWidth, height: canvas.clientHeight }; });
    await measure(live, 'full-app-live-default-startup-undrained', { drainBefore: false, startup: true });
    await live.page.waitForFunction(() => window.__snakePresentation.stats().renderScale.adjusted && window.__snakePresentation.stats().pixelRatio === 0.4, null, { timeout: limit(10000), polling: 100 });
    await measure(live, 'full-app-live-default-after-fence');
    const frame = await live.page.evaluate(() => window.__snakeRenderProfiler.snapshot());
    const frameText = JSON.stringify(frame);
    fs.writeFileSync(frameArtifactPath, frameText);
    report.fixture = { path: path.relative(repo, frameArtifactPath), tick: frame.tick, revision: frame.snapshot.revision, scene: frame.scene, length: frame.snapshot.length, sha256: crypto.createHash('sha256').update(frameText).digest('hex') };
    console.log('SNAKE_RENDER_PROFILE_FRAME', JSON.stringify(report.fixture)); save();
    let frozenResponseServed = false;
    await live.page.route('**/snapshot', async route => { await route.fulfill({ json: frame }); frozenResponseServed = true; });
    await expect.poll(() => frozenResponseServed, { timeout: limit(5000) }).toBe(true);
    await live.page.waitForFunction(expected => {
      const current = window.__snakeRenderProfiler.snapshot()?.snapshot;
      return current?.runToken === expected.runToken && current?.revision === expected.revision;
    }, frame.snapshot, { timeout: limit(5000), polling: 100 });
    await measure(live, 'full-app-frozen-default-context-after-fence');
    await close(live);
    const frozen = await openPage({ frame });
    await measure(frozen, 'full-app-frozen-initial-low');
    await close(frozen);
    const minimal = await openPage({ minimal: true, canvas: report.canvas, frame });
    await measure(minimal, 'minimal-frozen-initial-low');
    await measure(minimal, 'minimal-frozen-omit-water', { mode: 'omit-water' });
    await measure(minimal, 'minimal-frozen-omit-serpent-and-contacts', { mode: 'omit-serpent-and-contacts' });
    await close(minimal);
  } catch (error) {
    report.failure = error.message;
    console.log('SNAKE_RENDER_PROFILE_ERROR', JSON.stringify({ diagnosticOnly: true, error: error.message, elapsedMs: Date.now() - started }));
  } finally {
    clearTimeout(deadlineTimer);
    await Promise.allSettled([...contexts].map(context => context.close()));
    report.ownedContextsClosed = [...contexts].every(context => context.pages().length === 0);
    contexts.clear(); report.elapsedMs = Date.now() - started; save();
    console.log('SNAKE_RENDER_PROFILE_COMPLETE', JSON.stringify({ diagnosticOnly: true, elapsedMs: report.elapsedMs, ownedContextsClosed: report.ownedContextsClosed, measured: report.results.filter(item => item.status === 'measured').length, failure: report.failure || null }));
  }
  // These check diagnostic integrity, never the production performance target.
  const measured = report.results.filter(result => result.status === 'measured');
  expect(report.failure).toBeUndefined();
  expect(measured.some(result => result.name === 'full-app-live-default-startup-undrained')).toBe(true);
  expect(measured.some(result => result.name === 'minimal-frozen-initial-low')).toBe(true);
  expect(report.ownedContextsClosed).toBe(true);
  for (const result of measured) {
    expect(result.cadence.actualDraws).toBeGreaterThan(0);
    expect(result.cpu.drawWallMs.count).toBe(result.cadence.actualDraws);
    expect(result.final.drawCalls).toBeGreaterThan(0);
    expect(result.glError).toBe(0);
    expect(result.errors).toEqual([]);
    expect(result.contextAttributes.antialias).toBe(true);
    expect(result.boundaries.afterFence.completed).toBe(true);
    if (!result.startup) {
      expect(result.final.pixelRatio).toBe(0.4);
      expect(result.final.drawingBuffer).toEqual({ width: Math.floor(report.canvas.width * 0.4), height: Math.floor(report.canvas.height * 0.4) });
      expect(result.boundaries.beforeFence.completed).toBe(true);
      expect(result.stableCacheDuringSample).toBe(true);
    }
    expect(result.final.staticCache.active).toBe(true);
    if (result.mode === 'full') expect(result.final.triangles).toBeGreaterThan(2000);
    if (result.name.includes('frozen')) {
      expect(result.initialRevision).toBe(report.fixture.revision);
      expect(result.finalRevision).toBe(report.fixture.revision);
    }
  }
});

// Pure helpers are exported for a Node-only source/syntax check; no browser run
// or WebGL context is required to verify the diagnostic substitutions.
module.exports = { buildDiagnosticSource, installProfiler, minimalHtml, waitForGpuFence };
