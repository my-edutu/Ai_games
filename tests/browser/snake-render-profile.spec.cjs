'use strict';

// Diagnostics only. None of these altered-source conditions can satisfy the
// production 17 FPS / 250 ms gate in snake-stream.spec.cjs.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { test, expect } = require('@playwright/test');
test.use({ trace: 'off', video: 'off', launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } });

const repo = path.resolve(__dirname, '../..');
const fixturePath = 'docs/reviews/snake-gauntlet/round-4-public-frame.json';
const artifactPath = path.join(repo, 'artifacts/phase3/renderer-profile.json');

function replaceOnce(source, before, after) {
  if (source.split(before).length !== 2) throw new Error(`Diagnostic source anchor changed: ${before.slice(0, 90)}`);
  return source.replace(before, after);
}

// Serialized into the browser module; contains no Node dependencies.
function installProfiler(canvas, renderer) {
  const gl = canvas.getContext('webgl2');
  const timer = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  const pending = [];
  let active = null, lastArgs = null, submissionMs = 0;
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
    lastArgs = args;
    pollQueries();
    const owner = active;
    let query = null;
    if (owner && timer && !gl.getParameter(timer.GPU_DISJOINT_EXT) && pending.length < 8 && owner.queriesIssued < 12) {
      query = gl.createQuery(); gl.beginQuery(timer.TIME_ELAPSED_EXT, query); owner.queriesIssued++;
    }
    submissionMs = 0;
    const started = performance.now();
    try { return renderer.draw(...args); }
    finally {
      const elapsed = performance.now() - started;
      if (query) { gl.endQuery(timer.TIME_ELAPSED_EXT); pending.push({ query, owner }); }
      if (owner) {
        owner.drawWallMs.push(elapsed);
        owner.renderSubmissionMs.push(submissionMs);
        owner.updateAndOrchestrationMs.push(Math.max(0, elapsed - submissionMs));
      }
    }
  }
  async function measure(durationMs) {
    // Drain previous work before measuring. No gl.finish occurs inside the RAF
    // cadence sample; a completion boundary and optional sync probes follow it.
    const preflushStarted = performance.now(); gl.finish();
    const preflushMs = performance.now() - preflushStarted;
    const initial = renderer.stats();
    const owner = { drawWallMs: [], renderSubmissionMs: [], updateAndOrchestrationMs: [], gpuMs: [], queriesIssued: 0, disjointQueries: 0 };
    active = owner;
    const started = performance.now(), times = [];
    const ended = await new Promise(resolve => {
      function step(time) {
        times.push(time);
        if (time - started >= durationMs) resolve(time);
        else requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
    active = null;
    const final = renderer.stats();
    const finishStarted = performance.now(); gl.finish();
    const completed = performance.now();
    // WebGL query availability is allowed to update on a later browser task.
    await new Promise(resolve => setTimeout(resolve, 0));
    pollQueries();
    const sync = [];
    if (!owner.gpuMs.length && lastArgs) {
      // This fallback reports completed CPU+GPU wall time, not GPU-only time.
      // It is separate from presented cadence and still submits real 3D draws.
      for (let index = 0; index < 3; index++) {
        gl.finish(); submissionMs = 0;
        const begin = performance.now();
        const args = [...lastArgs]; args[3] = performance.now();
        renderer.draw(...args);
        const submitted = performance.now(); gl.finish(); const finished = performance.now();
        sync.push({ drawWallMs: submitted - begin, renderSubmissionMs: submissionMs, gpuDrainWaitMs: finished - submitted, completedWallMs: finished - begin });
      }
    }
    const outstandingQueries = pending.filter(item => item.owner === owner).length;
    for (let index = pending.length - 1; index >= 0; index--) {
      if (pending[index].owner === owner) { gl.deleteQuery(pending[index].query); pending.splice(index, 1); }
    }
    const gaps = times.slice(1).map((value, index) => value - times[index]);
    const actualDraws = final.frameCount - initial.frameCount;
    return {
      cadence: { callbacks: times.length, actualDraws, elapsedMs: ended - started, averageFps: actualDraws / ((ended - started) / 1000), gapsMs: summarize(gaps),
        completedElapsedMs: completed - started, completedDrawFps: actualDraws / ((completed - started) / 1000), preflushMs, finalGpuDrainMs: completed - finishStarted },
      cpu: { drawWallMs: summarize(owner.drawWallMs), threeRenderSubmissionMs: summarize(owner.renderSubmissionMs), updateAndOrchestrationMs: summarize(owner.updateAndOrchestrationMs) },
      gpu: { method: owner.gpuMs.length ? 'non-disjoint-time-elapsed-query' : 'gl.finish-completed-wall-boundary', timerExtension: !!timer,
        elapsedMs: summarize(owner.gpuMs), queriesIssued: owner.queriesIssued, disjointQueries: owner.disjointQueries, outstandingQueries, completionProbes: sync },
      initial, final, glError: gl.getError(), contextAttributes: gl.getContextAttributes(),
      stableCacheDuringSample: initial.staticCache.builds === final.staticCache.builds,
    };
  }
  const profiler = { measure, recordSubmission(milliseconds) { submissionMs += milliseconds; } };
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

function buildDiagnosticSource(original, nativeAntialias = true) {
  let source = replaceOnce(original, 'export function createSceneRenderer(', 'function createSceneRendererUnprofiled(');
  source = replaceOnce(source, 'renderer.setPixelRatio(pixelRatio);', 'renderer.setPixelRatio(0.4);');
  if (!nativeAntialias) source = replaceOnce(source, 'antialias: true', 'antialias: false');
  source = replaceOnce(source, 'renderer.info.autoReset = false;', `renderer.info.autoReset = false;
  const submitRender = renderer.render.bind(renderer);
  renderer.render = (...args) => {
    const started = performance.now();
    try { return submitRender(...args); }
    finally { window.__snakeRenderProfiler?.recordSubmission(performance.now() - started); }
  };`);
  source = replaceOnce(source, '  const cacheScene = new THREE.Scene();', `  // Diagnostic-only material: identical color/depth sampling and discard, but
  // no fragment depth output or depth writes. Dynamic geometry is omitted too.
  const cacheColorOnlyMaterial = cacheMaterial.clone();
  cacheColorOnlyMaterial.uniforms = cacheMaterial.uniforms;
  cacheColorOnlyMaterial.fragmentShader = cacheMaterial.fragmentShader.replace('gl_FragDepth = depth;', '');
  cacheColorOnlyMaterial.depthTest = false;
  cacheColorOnlyMaterial.depthWrite = false;
  const cacheScene = new THREE.Scene();`);
  source = replaceOnce(source, 'if (!cacheSupported || !staticMeshCount', "if (window.__snakeProfileDrawMode === 'direct' || !cacheSupported || !staticMeshCount");
  source = replaceOnce(source, '      renderer.setRenderTarget(null);\n      renderer.autoClear = true;\n      renderer.render(cacheScene, cacheCamera);', `      renderer.setRenderTarget(null);
      renderer.autoClear = true;
      cacheQuad.material = window.__snakeProfileDrawMode === 'cache-color-only' ? cacheColorOnlyMaterial : cacheMaterial;
      renderer.render(cacheScene, cacheCamera);`);
  source = replaceOnce(source, '      camera.layers.set(DYNAMIC_LAYER);\n      renderer.render(scene, camera);', `      camera.layers.set(DYNAMIC_LAYER);
      if (window.__snakeProfileDrawMode !== 'cache-depth-only' && window.__snakeProfileDrawMode !== 'cache-color-only') renderer.render(scene, camera);`);
  source = replaceOnce(source, '    cacheMaterial.dispose();', '    cacheMaterial.dispose();\n    cacheColorOnlyMaterial.dispose();');
  return `${source}\n${installProfiler.toString()}\nexport function createSceneRenderer(canvas, options) { return installProfiler(canvas, createSceneRendererUnprofiled(canvas, options)); }\n`;
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
  const frameText = fs.readFileSync(path.join(repo, fixturePath), 'utf8');
  const frame = JSON.parse(frameText);
  const source = fs.readFileSync(path.join(repo, 'public/snake-stream/renderer.mjs'), 'utf8');
  const report = {
    diagnosticOnly: true, productionGateUnchanged: true, viewport: { width: 1920, height: 1080 }, fixedPixelRatio: 0.4,
    fixture: { path: fixturePath, tick: frame.tick, scene: frame.scene, length: frame.snapshot.length, sha256: crypto.createHash('sha256').update(frameText).digest('hex') },
    rendererSha256: crypto.createHash('sha256').update(source).digest('hex'),
    assumptions: [
      'Same saved public snapshot, real model updates and RAF draws in every condition; no simulation changes.',
      'Full app and minimal page share CSS canvas dimensions, viewport, DPR, camera, native antialiasing and renderer source.',
      'Public draw wall time includes updates and submission; Three render wall time can include driver backpressure.',
      'Non-disjoint timer queries measure WebGL work, excluding browser UI compositing; gl.finish fallback is completed CPU+GPU wall time.',
      'Cadence is measured separately from synchronous completion probes. Partial-cache ablations are not full-scene performance passes.',
      'Conditions run sequentially; cache rebuilds and warmup limits are reported, not silently excluded.',
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
  async function openPage({ minimal = false, canvas, nativeAntialias = true, mode = 'full' } = {}) {
    if (remaining() < 5000) throw new Error('Diagnostic work budget exhausted');
    const context = await browser.newContext({ baseURL, viewport: report.viewport, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
    contexts.add(context);
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.addInitScript(mode => { window.__snakeProfileDrawMode = mode; }, mode);
    await page.route('**/snapshot', route => route.fulfill({ json: frame }));
    await page.route('**/renderer.mjs', route => route.fulfill({ contentType: 'text/javascript', body: buildDiagnosticSource(source, nativeAntialias) }));
    if (minimal) await page.route('**/__snake-render-profile*', route => route.fulfill({ contentType: 'text/html', body: minimalHtml(frame, canvas) }));
    await page.goto(minimal ? '/__snake-render-profile?quality=low' : '/?quality=low', { waitUntil: 'domcontentloaded', timeout: limit(10000) });
    await page.waitForFunction(() => window.__snakeRenderProfiler && window.__snakePresentation?.stats().frameCount >= 16, null, { timeout: limit(14000), polling: 100 });
    return { page, context, errors };
  }
  async function close({ context }) { await context.close(); contexts.delete(context); }
  async function measure(subject, name, mode = 'full') {
    if (remaining() < 3500) { report.results.push({ name, diagnosticOnly: true, status: 'skipped-budget' }); save(); return; }
    await subject.page.evaluate(mode => { window.__snakeProfileDrawMode = mode; }, mode);
    const frameCount = await subject.page.evaluate(() => window.__snakePresentation.stats().frameCount);
    await subject.page.waitForFunction(initial => window.__snakePresentation.stats().frameCount >= initial + 3, frameCount, { timeout: limit(7000), polling: 100 });
    const data = await subject.page.evaluate(() => window.__snakeRenderProfiler.measure(1300));
    const result = { name, diagnosticOnly: true, mode, status: 'measured', ...data, errors: [...subject.errors] };
    report.results.push(result); save();
    console.log('SNAKE_RENDER_PROFILE', JSON.stringify({ name, diagnosticOnly: true, mode, cadence: data.cadence, cpu: data.cpu, gpu: data.gpu,
      renderer: { pixelRatio: data.final.pixelRatio, drawingBuffer: data.final.drawingBuffer, drawCalls: data.final.drawCalls, triangles: data.final.triangles, staticCache: data.final.staticCache },
      stableCacheDuringSample: data.stableCacheDuringSample, nativeAntialias: data.contextAttributes.antialias, glError: data.glError, errors: subject.errors }));
  }
  try {
    const full = await openPage();
    report.canvas = await full.page.locator('#game').evaluate(canvas => { const rect = canvas.getBoundingClientRect(); return { x: rect.x, y: rect.y, width: canvas.clientWidth, height: canvas.clientHeight }; });
    await measure(full, 'full-app-cached-real-3d');
    await close(full);
    const minimal = await openPage({ minimal: true, canvas: report.canvas });
    await measure(minimal, 'minimal-cached-real-3d');
    await measure(minimal, 'minimal-cache-color-and-depth-only', 'cache-depth-only');
    await measure(minimal, 'minimal-cache-color-only-no-depth-output', 'cache-color-only');
    await measure(minimal, 'minimal-direct-real-3d-no-cache', 'direct');
    await close(minimal);
    if (remaining() >= 16000) {
      const noAa = await openPage({ minimal: true, canvas: report.canvas, nativeAntialias: false, mode: 'cache-depth-only' });
      await measure(noAa, 'minimal-cache-color-and-depth-only-native-aa-off', 'cache-depth-only');
      await close(noAa);
    } else { report.results.push({ name: 'minimal-cache-color-and-depth-only-native-aa-off', diagnosticOnly: true, status: 'skipped-budget' }); }
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
  expect(measured.some(result => result.name === 'full-app-cached-real-3d')).toBe(true);
  expect(measured.some(result => result.name === 'minimal-cached-real-3d')).toBe(true);
  expect(report.ownedContextsClosed).toBe(true);
  for (const result of measured) {
    expect(result.cadence.actualDraws).toBeGreaterThan(0);
    expect(result.cpu.drawWallMs.count).toBe(result.cadence.actualDraws);
    expect(result.final.drawCalls).toBeGreaterThan(0);
    expect(result.glError).toBe(0);
    expect(result.errors).toEqual([]);
    expect(result.final.pixelRatio).toBe(0.4);
    expect(result.final.drawingBuffer).toEqual({ width: Math.floor(report.canvas.width * 0.4), height: Math.floor(report.canvas.height * 0.4) });
    expect(result.contextAttributes.antialias).toBe(!result.name.endsWith('native-aa-off'));
    if (result.mode === 'cache-depth-only' || result.mode === 'cache-color-only') {
      expect(result.final.drawCalls).toBe(1);
      expect(result.final.triangles).toBe(1);
      expect(result.final.staticCache.active).toBe(true);
    } else {
      expect(result.final.triangles).toBeGreaterThan(2000);
      expect(result.final.staticCache.active).toBe(result.mode !== 'direct');
    }
  }
});

// Pure helpers are exported for a Node-only source/syntax check; no browser run
// or WebGL context is required to verify the diagnostic substitutions.
module.exports = { buildDiagnosticSource, installProfiler, minimalHtml };
