'use strict';
// Reproducible captures of the production renderer using actual production runs.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { chromium } = require('@playwright/test');
const { MazeRuntime } = require('../dist/games/ai-maze-escape/src/runtime/run.js');
const { buildMazeRenderSnapshot } = require('../dist/games/ai-maze-escape/src/presentation/snapshot.js');
const { MazePresentationController } = require('../dist/games/ai-maze-escape/src/presentation/controller.js');
const base = process.argv.find(arg => arg.startsWith('--base='))?.slice(7) || 'http://127.0.0.1:4185';
const only = process.argv.find(arg => arg.startsWith('--only='))?.slice(7).split(',');
const directory = path.resolve(__dirname, '../evidence/maze-3d/captures');
const config = { width: 17, height: 11, profile: 'chambers', level: 4, intermissionTicks: 12, maxTicks: 18000, visibilityRadius: 3, loopChancePermille: 170, keyCount: 2, trapCount: 5, threatCount: 1, memoryTtl: 400, noProgressTicks: 3000, repairAttempts: 3 };

function scenarios() {
  let exploration, danger, result, encounter, score = -Infinity;
  let encounterDistanceCells = Infinity;
  const sequences = [];
  for (const attempt of [3,13,5,0,1,2]) {
    const seed = `maze-visual-reference-${attempt}`;
    const runtime = MazeRuntime.create(config, seed, { policy: 'partial-observation' });
    const controller = new MazePresentationController({ replayCapacity: 360, maxEntities: 2048 });
    let cursor = 0;
    const sequence = [];
    for (let step = 0; step < 1400; step++) {
      const snapshot = buildMazeRenderSnapshot(runtime.state);
      controller.accept(snapshot, runtime.events.slice(cursor)); cursor = runtime.events.length;
      const frame = { ...controller.frame(1600, 1000), stepDurationMs: 360 };
      const sample = { seed, frame };
      sequence.push(sample);
      const col = snapshot.currentCell % snapshot.width, row = Math.floor(snapshot.currentCell / snapshot.width);
      const centered = Math.min(col, snapshot.width - col - 1, row, snapshot.height - row - 1);
      const candidateScore = centered * 12 + Math.min(snapshot.cells.length, 105) * .1 + snapshot.keys.filter(k => !k.collected).length * 3;
      if (snapshot.lifecycle === 'running' && snapshot.cells.length > 30 && snapshot.threats.length === 0 && candidateScore > score) { score = candidateScore; exploration = sample; }
      if (!danger && snapshot.lifecycle === 'running' && snapshot.threats.length) danger = sample;
      // Only public, already-disclosed warden cells count. Prefer a genuine
      // adjacent-but-distinct actor pair over a far-away warning or collision.
      if (snapshot.lifecycle === 'running' && snapshot.threats.length) {
        const distanceCells = Math.min(...snapshot.threats.map(threat =>
          Math.hypot((threat.cell % snapshot.width) - col,
            Math.floor(threat.cell / snapshot.width) - row)));
        if (distanceCells >= 1 && distanceCells <= 2.25 && distanceCells < encounterDistanceCells) {
          encounterDistanceCells = distanceCells;
          encounter = { ...sample, distanceCells };
        }
      }
      if (snapshot.result) { if (!result || snapshot.result.reason === 'escape') result = sample; break; }
      runtime.step();
    }
    sequences.push(sequence);
    if (exploration && danger && encounter && result?.frame.snapshot.result?.reason === 'escape') break;
  }
  return { exploration, danger, result, encounter, encounterDistanceCells: encounter ? encounterDistanceCells : null, sequences };
}

module.exports = { scenarios, config };

if (require.main === module) (async () => {
  fs.mkdirSync(directory, { recursive: true });
  const samples = scenarios();
  if (!samples.exploration) throw new Error('No production exploration frame found');
  const browser = await chromium.launch({ args: ['--no-sandbox', '--enable-unsafe-swiftshader', ...(process.env.MAZE_SOFTWARE_COMPOSITOR === '1' ? ['--enable-gpu', '--use-angle=swiftshader'] : [])] });
  const reports = [];
  const manifestFile = path.join(directory, 'manifest.json');
  const prior = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')).reports : [];
  const sourceFiles = Object.fromEntries(['index.html','app.js','scene.js','world.js','gate-moment.mjs','characters.js','map-view.mjs','styles.css','ux-v2.css'].map(name => [name, createHash('sha256').update(fs.readFileSync(path.resolve(__dirname, '../public/ai-maze-escape', name))).digest('hex')]));
  function record(report) {
    reports.push({...report, sourceFiles});
    const latest = new Map(prior.map(item => [item.name, item]));
    for (const item of reports) latest.set(item.name, item);
    fs.writeFileSync(`${manifestFile}.tmp`, JSON.stringify({ source: 'Production MazeRuntime and MazePresentationController; fixed real public frames rendered by the actual application', config, reports: [...latest.values()] }, null, 2));
    fs.renameSync(`${manifestFile}.tmp`, manifestFile);
  }
  try {
    const cases = [
      ['desktop', 1600, 1000, samples.exploration, ''],
      ['full-quality', 1280, 900, samples.exploration, '?quality=high'],
      ['character-detail', 1280, 900, samples.exploration, '?camera=detail'],
      ['mobile-portrait', 390, 844, samples.exploration, ''],
      ['mobile-landscape', 844, 390, samples.exploration, ''],
      ['overview', 1280, 900, samples.exploration, '?camera=overview'],
      ['danger', 1280, 900, samples.danger, '?camera=detail'],
      ['encounter', 1280, 900, samples.encounter, '?camera=detail&reducedMotion=1'],
      ['result', 1280, 900, samples.result, ''],
    ];
    for (const [name, width, height, sample, query] of cases) {
      if (only && !only.includes(name)) continue;
      if (!sample) { record({ name, captured: false, attemptedAt: new Date().toISOString(), reason: 'No matching production event in reference runs' }); continue; }
      const page = await browser.newPage({ viewport: { width, height } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      try {
        await page.route('**/maze/state*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(sample.frame) }));
        await page.goto(`${base}/maze${query}`);
        await page.waitForFunction(() => window.__MAZE_3D__?.frames >= 5, null, { timeout: 45000 });
        const diagnostic = await page.evaluate(() => ({ render: window.__MAZE_3D__, overlay: !document.getElementById('scene-card').hidden, scrollWidth: document.documentElement.scrollWidth, viewport: innerWidth }));
        await page.screenshot({ path: path.join(directory, `${name}.png`) });
        record({ name, captured: true, capturedAt: new Date().toISOString(), seed: sample.seed, tick: sample.frame.snapshot.tick, publicThreatDistanceCells: sample.distanceCells ?? null, result: sample.frame.snapshot.result, errors, diagnostic });
        if (name === 'full-quality') await page.locator('#maze').screenshot({path: path.join(directory, 'full-quality-scene.png')});
      } catch (error) {
        if (!reports.some(item => item.name === name && item.captured)) record({ name, captured: false, attemptedAt: new Date().toISOString(), seed: sample.seed, tick: sample.frame.snapshot.tick, reason: error.message, errors });
        throw error;
      } finally { await page.close(); }
    }
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(`${base}/maze/progress`); await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(directory, 'progress.png'), fullPage: true });
    await page.close();
    process.stdout.write(JSON.stringify(reports.map(({ name, captured, tick, errors, diagnostic }) => ({ name, captured, tick, errors, quality: diagnostic?.render.quality, frameP50Ms: diagnostic?.render.frameP50Ms, triangles: diagnostic?.render.triangles }))) + '\n');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
